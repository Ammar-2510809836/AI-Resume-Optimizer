import json
from dataclasses import dataclass
from groq import Groq
from core.master_resume import MasterResume


@dataclass
class TailoredSections:
    summary: str
    tagline: str
    skills: dict[str, list[str]]
    bullets: dict[str, str]
    extracted_keywords: list[str]
    project_relevance: dict[str, dict] = None
    suggested_new_projects: list[dict] = None


_SYSTEM_PROMPT = """You are an expert executive resume writer and career strategist. Tailor a master resume to a specific job description.

RULES:
- Return ONLY valid JSON — no markdown fences, no extra text.
- Never invent job titles, companies, dates, or metrics for existing work experience entries.
- Rewrite the professional tagline to align with the core job title/focus of the job description, keeping it concise and punchy.
- Deeply reframe and rewrite the framing, context, and wording of the summary, projects, and work experience bullets to align perfectly with the target role's core responsibilities and professional language.
- Rephrase bullet points to emphasize relevant skills; preserve all numbers, facts, and metrics exactly.
- Make numbers, percentages, and key performance indicators (KPIs) highly prominent by wrapping them in <strong> tags (e.g., <strong>99.9% uptime</strong> or <strong>40% reduction</strong>).
- Ensure tailored bullets remain outcome-driven, highlighting quantified results and metrics prominently.
- Reorder skill categories and items by relevance to the JD.
- Dynamically extract a list of 5-15 high-fidelity ATS keywords from the job description and return them under "extracted_keywords".

PROJECT EVALUATION & CREATION RULES:
1. "project_relevance": Evaluate each existing project in the Master Resume against the Job Description. Assign a match score (0-100), brief reason for the score, and recommended flag (true if score >= 60).
2. "suggested_new_projects": IF the Job Description emphasizes key skills, frameworks, or domain requirements (e.g., specific AI tools, cloud architectures, or industry domains) that are NOT directly covered by existing projects in the Master Resume, generate 1 to 2 NEW realistic project entries tailored to the JD.
   - Each suggested new project must contain:
     - "title": A professional project title matching JD domain requirements.
     - "tech": Relevant technical stack string highlighting JD technologies.
     - "date": Realistic date (e.g., "2025" or "2024").
     - "project_slug": Unique slug starting with "new_proj_" (e.g., "new_proj_fintech_agent").
     - "bullets": Array of 2-3 detailed, outcome-oriented bullet points with <strong> metrics.
   - If existing projects already cover the JD requirements well, return an empty array `[]` for "suggested_new_projects".

JSON SCHEMA (return exactly this structure):
{
  "extracted_keywords": ["keyword1", "keyword2"],
  "tagline": "rewritten professional tagline",
  "summary": "rewritten summary paragraph",
  "skills": {"Category Name": ["skill1", "skill2"]},
  "bullets": {"bullet_id": "rewritten bullet text"},
  "project_relevance": {
    "dairy_sentinel": {"score": 90, "reason": "High relevance to RAG & LLMs", "recommended": true},
    "interview_copilot": {"score": 85, "reason": "Demonstrates multi-LLM orchestration", "recommended": true}
  },
  "suggested_new_projects": [
    {
      "title": "Project Title",
      "tech": "Python, Docker, FastAPI",
      "date": "2025",
      "project_slug": "new_proj_1",
      "bullets": [
        "Architected... achieving <strong>98% accuracy</strong>.",
        "Built... reducing latency by <strong>30%</strong>."
      ]
    }
  ]
}

bullet_id examples: "fhk_0", "techbit_2", "dairy_sentinel_1"
Use the IDs shown in [brackets] in the resume."""


FALLBACK_MODELS = [
    "llama-3.3-70b-versatile",
    "llama-3.3-70b-specdec",
    "llama-3.1-70b-versatile",
    "llama3-70b-8192",
    "qwen-2.5-72b-instruct",
    "mixtral-8x7b-32768",
]


class LLMClient:
    def __init__(self, api_key: str, model: str = "llama-3.3-70b-versatile"):
        self._client = Groq(api_key=api_key)
        self._model = model

    def tailor(self, jd: str, resume: MasterResume, user_instructions: str | None = None) -> TailoredSections:
        prompt = self._build_prompt(jd, resume, user_instructions)
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

    def _build_prompt(self, jd: str, resume: MasterResume, user_instructions: str | None = None) -> str:
        prompt = f"JOB DESCRIPTION:\n{jd}\n\nMASTER RESUME:\n{resume.to_llm_text()}"
        if user_instructions:
            prompt += f"\n\nADDITIONAL INSTRUCTIONS:\n{user_instructions}"
        return prompt

    def _call_groq(self, user_prompt: str) -> str:
        models_to_try = [self._model] + [m for m in FALLBACK_MODELS if m != self._model]
        last_error = None
        for m in models_to_try:
            try:
                response = self._client.chat.completions.create(
                    model=m,
                    messages=[
                        {"role": "system", "content": _SYSTEM_PROMPT},
                        {"role": "user", "content": user_prompt},
                    ],
                    temperature=0.5,
                    max_tokens=4096,
                )
                return response.choices[0].message.content
            except Exception as e:
                err_str = str(e)
                if "model_not_found" in err_str or "404" in err_str or "does not exist" in err_str:
                    last_error = e
                    continue
                raise e
        if last_error:
            raise last_error

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
            tagline=data.get("tagline", ""),
            skills=data["skills"],
            bullets=data["bullets"],
            extracted_keywords=data.get("extracted_keywords", []),
            project_relevance=data.get("project_relevance", {}),
            suggested_new_projects=data.get("suggested_new_projects", []),
        )
