import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

from core.llm_client import LLMClient
from core.diff_engine import DiffEngine
from core.resume_engine import ResumeEngine
from core.master_resume import MasterResume

app = FastAPI(title="Resume Tailor API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST", "GET", "OPTIONS"],
    allow_headers=["*"],
)

_master = MasterResume.load()
_diff_engine = DiffEngine()
_template_path = os.path.join(os.path.dirname(__file__), "../templates/resume.html")
_resume_engine = ResumeEngine(_template_path)


class TailorRequest(BaseModel):
    job_description: str


class PreviewRequest(BaseModel):
    approved_sections: dict


@app.post("/api/tailor")
async def tailor_resume(body: TailorRequest):
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY not configured")

    try:
        client = LLMClient(api_key=api_key)
        tailored = client.tailor(body.job_description, _master)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    jd_keywords = {
        w.lower().strip(".,;:()[]") for w in body.job_description.split()
        if len(w) > 4
    }

    pairs: list[tuple[str, str, str]] = [
        ("summary", _master.summary, tailored.summary)
    ]
    for cat, orig_skills in _master.skills.items():
        tail_skills = tailored.skills.get(cat, orig_skills)
        pairs.append((f"skills_{cat}", ", ".join(orig_skills), ", ".join(tail_skills)))
    for exp in _master.experience:
        for i, orig in enumerate(exp.bullets):
            bid = f"{exp.role_slug}_{i}"
            pairs.append((bid, orig, tailored.bullets.get(bid, orig)))
    for proj in _master.projects:
        for i, orig in enumerate(proj.bullets):
            bid = f"{proj.project_slug}_{i}"
            pairs.append((bid, orig, tailored.bullets.get(bid, orig)))

    diffs = _diff_engine.compute_bulk(pairs, jd_keywords=jd_keywords)

    return {
        "tailored_skills": tailored.skills,
        "diffs": [
            {
                "section_id": d.section_id,
                "original": d.original,
                "tailored": d.tailored,
                "tokens": [{"text": t.text, "type": t.type} for t in d.tokens],
                "keyword_match_score": d.keyword_match_score,
            }
            for d in diffs
        ],
    }


@app.post("/api/preview", response_class=HTMLResponse)
async def preview_resume(body: PreviewRequest):
    html = _resume_engine.inject(body.approved_sections)
    return HTMLResponse(content=html)
