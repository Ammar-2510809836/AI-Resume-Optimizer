import json
from dataclasses import dataclass
from groq import Groq
from core.master_resume import MasterResume


@dataclass
class TailoredSections:
    summary: str
    skills: dict[str, list[str]]
    bullets: dict[str, str]


_SYSTEM_PROMPT = """You are a professional resume writer. Tailor a resume to a job description.

RULES:
- Return ONLY valid JSON — no markdown fences, no explanation, just the JSON object.
- Never invent job titles, companies, dates, or metrics not present in the original.
- Rephrase bullet points to emphasize relevant skills; preserve all numbers and facts exactly.
- Preserve any HTML tags like <strong> that appear in the original bullets.
- Rewrite the summary to open with the most relevant experience for this role.
- Reorder skill categories and items by relevance to the JD.

JSON SCHEMA (return exactly this structure):
{
  "summary": "rewritten summary paragraph",
  "skills": {"Category Name": ["skill1", "skill2"]},
  "bullets": {"bullet_id": "rewritten bullet text"}
}

bullet_id examples: "fhk_0", "techbit_2", "dairy_sentinel_1"
Use the IDs shown in [brackets] in the resume."""


class LLMClient:
    def __init__(self, api_key: str, model: str = "llama-3.3-70b-versatile"):
        self._client = Groq(api_key=api_key)
        self._model = model

    def tailor(self, jd: str, resume: MasterResume) -> TailoredSections:
        prompt = self._build_prompt(jd, resume)
        for attempt in range(2):
            raw = self._call_groq(prompt)
            try:
                return self._parse_response(raw)
            except (json.JSONDecodeError, KeyError, TypeError):
                if attempt == 1:
                    raise ValueError(
                        f"LLM returned invalid JSON after 2 attempts. Last response: {raw[:300]}"
                    )
        raise RuntimeError("Unreachable")

    def _build_prompt(self, jd: str, resume: MasterResume) -> str:
        return f"JOB DESCRIPTION:\n{jd}\n\nMASTER RESUME:\n{resume.to_llm_text()}"

    def _call_groq(self, user_prompt: str) -> str:
        response = self._client.chat.completions.create(
            model=self._model,
            messages=[
                {"role": "system", "content": _SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.3,
            max_tokens=4096,
        )
        return response.choices[0].message.content

    def _parse_response(self, raw: str) -> TailoredSections:
        content = raw.strip()
        if content.startswith("```"):
            parts = content.split("```")
            content = parts[1]
            if content.startswith("json"):
                content = content[4:]
        data = json.loads(content.strip())
        return TailoredSections(
            summary=data["summary"],
            skills=data["skills"],
            bullets=data["bullets"],
        )
