import subprocess
import tempfile
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, Response
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
    user_instructions: str | None = None


class PreviewRequest(BaseModel):
    approved_sections: dict
    template_id: str | None = "modern"


@app.get("/api/resume")
async def get_master_resume():
    from dataclasses import asdict
    return asdict(_master)


@app.post("/api/tailor")
async def tailor_resume(body: TailorRequest):
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY not configured")

    try:
        client = LLMClient(api_key=api_key)
        tailored = client.tailor(body.job_description, _master, body.user_instructions)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    jd_keywords = {k.lower() for k in tailored.extracted_keywords}

    pairs: list[tuple[str, str, str]] = [
        ("tagline", _master.tagline, tailored.tagline),
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

    # Also add diff pairs for suggested new projects if any
    suggested_projects = tailored.suggested_new_projects or []
    for sproj in suggested_projects:
        p_slug = sproj.get("project_slug", "new_proj")
        for i, bullet in enumerate(sproj.get("bullets", [])):
            bid = f"{p_slug}_{i}"
            pairs.append((bid, "[New JD Project Bullet]", bullet))

    diffs = _diff_engine.compute_bulk(pairs, jd_keywords=jd_keywords)

    return {
        "tailored_skills": tailored.skills,
        "extracted_keywords": tailored.extracted_keywords,
        "project_relevance": tailored.project_relevance or {},
        "suggested_new_projects": suggested_projects,
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
    html = _resume_engine.inject(body.approved_sections, template_id=body.template_id or "modern")
    return HTMLResponse(content=html)


@app.post("/api/export-pdf")
async def export_pdf(body: PreviewRequest):
    html = _resume_engine.inject(body.approved_sections, template_id=body.template_id or "modern")

    with tempfile.NamedTemporaryFile("w", delete=False, suffix=".html", encoding="utf-8") as f:
        f.write(html)
        html_path = f.name

    pdf_path = html_path.replace(".html", ".pdf")
    edge_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
    if not os.path.exists(edge_path):
        import shutil
        edge_path = shutil.which("msedge") or shutil.which("chrome") or "msedge"

    cmd = [
        edge_path,
        "--headless",
        "--disable-gpu",
        "--no-pdf-header-footer",
        f"--print-to-pdf={pdf_path}",
        html_path
    ]

    try:
        res = subprocess.run(cmd, capture_output=True, text=True, timeout=15)
        if res.returncode != 0 or not os.path.exists(pdf_path):
            raise HTTPException(status_code=500, detail=f"PDF generation error: {res.stderr}")

        with open(pdf_path, "rb") as pf:
            pdf_bytes = pf.read()

        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": 'attachment; filename="Ammar_Khalid_Tailored_Resume.pdf"'}
        )
    except Exception as err:
        raise HTTPException(status_code=500, detail=f"PDF export failed: {str(err)}")
    finally:
        if os.path.exists(html_path):
            try:
                os.remove(html_path)
            except OSError:
                pass
        if os.path.exists(pdf_path):
            try:
                os.remove(pdf_path)
            except OSError:
                pass

