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
- Deeply reframe and rewrite the summary, projects, and work experience bullets to align perfectly with the target role.
- FOCUS ON ACHIEVEMENTS, NOT JOB DESCRIPTIONS: State specifically what YOU contributed, engineered, or changed (e.g., "Developed 6 custom components and integrated REST APIs" instead of "Worked on the frontend").
- Explicitly demonstrate relevant skills across programming languages, frameworks, libraries, APIs/integrations, cloud/DevOps, and dev tools.
- Make numbers, percentages, and metrics highly prominent by wrapping them in <strong> tags (e.g., <strong>90% uptime increase</strong> or <strong>35% reduction in data entry</strong>).
- Ensure every project bullet includes: 1) Overview/Context, 2) Tech Stack & APIs, 3) Specific Contribution, and 4) Measurable Result showing what changed because of your work.
- Reorder skill categories and items by relevance to the JD.
- Dynamically extract a list of 5-15 high-fidelity ATS keywords from the job description and return them under "extracted_keywords".

PROJECT EVALUATION & CREATION RULES:
1. "project_relevance": Evaluate each existing project in the Master Resume against the Job Description. Assign a match score (0-100), brief reason for the score, and recommended flag (true if score >= 60).
2. "suggested_new_projects": IF the Job Description emphasizes key skills, frameworks, or domain requirements (e.g., specific AI tools, cloud architectures, or industry domains) that are NOT directly covered by existing projects in the Master Resume, generate 1 to 2 NEW realistic project entries tailored to the JD.
   - Each suggested new project must contain:
     - "title": A professional project title matching JD domain requirements.
     - "tech": Comprehensive tech stack string (languages, frameworks, libraries, cloud/DevOps, APIs).
     - "date": Realistic date (e.g., "2025" or "2024").
     - "project_slug": Unique slug starting with "new_proj_" (e.g., "new_proj_fintech_agent").
     - "bullets": Array of 2-3 detailed, achievement-oriented bullets highlighting specific contributions and <strong> metrics (what changed because of your work).
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
      "tech": "Python, Docker, FastAPI, REST APIs, AWS",
      "date": "2025",
      "project_slug": "new_proj_1",
      "bullets": [
        "Architected... achieving <strong>98% accuracy</strong>.",
        "Built 5 microservice endpoints and integrated REST APIs, reducing manual data entry by <strong>40%</strong>."
      ]
    }
  ]
}

bullet_id examples: "fhk_0", "techbit_2", "dairy_sentinel_1"
Use the IDs shown in [brackets] in the resume."""


class LLMClient:
    def __init__(self, api_key: str, model: str = "llama-3.3-70b-versatile"):
        self._client = Groq(api_key=api_key)
        self._preferred_model = model

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

    def _get_active_models(self) -> list[str]:
        """Dynamically query Groq API (GET /v1/models) to fetch only active non-deprecated models."""
        try:
            res = self._client.models.list()
            active = []
            for m in res.data:
                m_id = m.id
                m_lower = m_id.lower()
                # Skip non-chat, audio, whisper, or guard models
                if any(skip in m_lower for skip in ["whisper", "guard", "embed", "safeguard", "audio", "tts"]):
                    continue
                active.append(m_id)
            if active:
                if self._preferred_model in active:
                    active.remove(self._preferred_model)
                    active.insert(0, self._preferred_model)
                return active
        except Exception:
            pass
        return [self._preferred_model]

    def _call_groq(self, user_prompt: str) -> str:
        models_to_try = self._get_active_models()
        last_error = None
        for m in models_to_try:
            try:
                # Enforce JSON object mode on Groq hardware
                response = self._client.chat.completions.create(
                    model=m,
                    messages=[
                        {"role": "system", "content": _SYSTEM_PROMPT},
                        {"role": "user", "content": user_prompt},
                    ],
                    response_format={"type": "json_object"},
                    temperature=0.4,
                    max_tokens=8192,
                )
                return response.choices[0].message.content
            except Exception as e:
                err_str = str(e).lower()
                # If json_object mode is not supported by a specific model, try without response_format
                if "response_format" in err_str:
                    try:
                        response = self._client.chat.completions.create(
                            model=m,
                            messages=[
                                {"role": "system", "content": _SYSTEM_PROMPT},
                                {"role": "user", "content": user_prompt},
                            ],
                            temperature=0.4,
                            max_tokens=8192,
                        )
                        return response.choices[0].message.content
                    except Exception as inner_e:
                        e = inner_e

                if any(kw in err_str for kw in [
                    "model_not_found", "model_decommissioned", "decommissioned",
                    "not exist", "not supported", "404", "invalid_request_error"
                ]):
                    last_error = e
                    continue
                raise e
        if last_error:
            raise last_error

    def _parse_response(self, raw: str) -> TailoredSections:
        content = raw.strip()
        # Remove markdown code fences if present
        if content.startswith("```"):
            parts = content.split("```")
            if len(parts) > 1:
                content = parts[1]
                if content.startswith("json"):
                    content = content[4:]

        # Extract strictly from first '{' to last '}'
        first_brace = content.find('{')
        last_brace = content.rfind('}')
        if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
            content = content[first_brace:last_brace + 1]

        data = json.loads(content.strip())
        return TailoredSections(
            summary=data.get("summary", ""),
            tagline=data.get("tagline", ""),
            skills=data.get("skills", {}),
            bullets=data.get("bullets", {}),
            extracted_keywords=data.get("extracted_keywords", []),
            project_relevance=data.get("project_relevance", {}),
            suggested_new_projects=data.get("suggested_new_projects", []),
        )
