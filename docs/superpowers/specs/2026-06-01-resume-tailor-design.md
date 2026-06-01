# Resume Tailor — Design Spec
**Date:** 2026-06-01  
**Status:** Approved  

---

## Overview

A full-stack web application that takes a job description as input and uses Groq LLaMA to intelligently tailor Ammar Khalid's resume to that role. The user reviews section-level diffs with approve/reject toggles, then prints the approved resume as a PDF via the browser. Deployed on Vercel free tier.

The project also includes a one-time rewrite of the master resume to reframe Ammar's experience as an AI/LLM Automation Engineer (anchored on three real GitHub projects: Smart Dairy Sentinel RAG, Interview Copilot, Receipt Bot).

---

## Goals

- Accept a job description and produce a tailored resume HTML in under 15 seconds
- Show word-level diffs per section (summary, skills, bullets) with approve/reject toggles
- Live preview updates as user approves/rejects sections
- Zero-dependency PDF: open in browser tab, Ctrl+P to save
- Deployable on Vercel free tier with GROQ_API_KEY as environment variable
- Clean OOP Python core with full TypeScript React frontend

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Backend | FastAPI (Python 3.11) as Vercel serverless functions |
| LLM | Groq API — LLaMA 3.3 70B |
| Template engine | Jinja2 |
| Styling | Tailwind CSS + custom blue theme (matching CV) |
| Hosting | Vercel free tier |
| Config | `.env` locally, Vercel env vars in production |

---

## Project Structure

```
resume-tailor/
├── api/
│   ├── tailor.py              # POST /api/tailor
│   └── preview.py             # POST /api/preview
├── core/
│   ├── __init__.py
│   ├── llm_client.py          # LLMClient class
│   ├── resume_engine.py       # ResumeEngine class
│   ├── diff_engine.py         # DiffEngine class
│   └── master_resume.py       # MasterResume dataclass + full resume data
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── JobInput.tsx
│   │   │   ├── DiffViewer.tsx
│   │   │   ├── ResumePreview.tsx
│   │   │   └── LoadingState.tsx
│   │   ├── hooks/
│   │   │   └── useTailor.ts
│   │   ├── types/
│   │   │   └── index.ts       # Shared TypeScript interfaces
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── tailwind.config.ts
│   └── vite.config.ts
├── templates/
│   └── resume.html            # Existing CV HTML (Jinja2-ified)
├── output/                    # Local dev only — generated resumes
├── vercel.json
├── requirements.txt
├── package.json
└── .env                       # GROQ_API_KEY (never committed)
```

---

## Data Flow

1. User pastes job description into `JobInput` textarea
2. React sends `POST /api/tailor { job_description: string }`
3. `LLMClient.tailor()` calls Groq with a structured prompt, returns `TailoredSections` JSON
4. `DiffEngine.compute_bulk()` generates word-level diffs for each section
5. React renders `DiffViewer` — each section shows original vs tailored with approve/reject toggle
6. `ResumePreview` updates live as user makes decisions
7. User clicks "Generate PDF" → React sends `POST /api/preview { approved_sections: ApprovedSections }`
8. `ResumeEngine.inject()` fills the Jinja2 template with approved content, returns HTML string
9. React opens returned HTML in a new browser tab → user prints to PDF

---

## OOP Class Design

### `core/llm_client.py`
```python
@dataclass
class TailoredSections:
    summary: SectionDiff
    skills: dict[str, SkillsDiff]
    bullets: list[BulletDiff]

class LLMClient:
    def __init__(self, api_key: str, model: str = "llama-3.3-70b-versatile")
    def tailor(self, jd: str, resume: MasterResume) -> TailoredSections
    def _build_prompt(self, jd: str, resume: MasterResume) -> str
    def _parse_response(self, raw: str) -> TailoredSections
```

**Prompt contract:** LLM is instructed to return strict JSON. Summary and skills sections are always rewritten. Bullet points are rephrased to match JD keywords but facts and numbers are never fabricated.

### `core/resume_engine.py`
```python
class ResumeEngine:
    def __init__(self, template_path: str)
    def inject(self, sections: ApprovedSections) -> str
    def render_preview(self, sections: ApprovedSections) -> str
```

Uses Jinja2 to fill `{{ summary }}`, `{{ skills }}`, `{{ bullets_<role> }}` placeholders in the HTML template.

### `core/diff_engine.py`
```python
@dataclass
class DiffToken:
    text: str
    type: Literal["added", "removed", "unchanged"]

@dataclass  
class DiffResult:
    section_id: str
    original: str
    tailored: str
    tokens: list[DiffToken]
    keyword_match_score: float  # 0.0–1.0, JD keyword overlap in tailored text

class DiffEngine:
    def compute(self, section_id: str, original: str, tailored: str) -> DiffResult
    def compute_bulk(self, sections: TailoredSections) -> list[DiffResult]
```

Uses Python's built-in `difflib.ndiff` — no extra dependencies.

### `core/master_resume.py`
```python
@dataclass
class ExperienceEntry:
    title: str
    company: str
    date: str
    location: str
    bullets: list[str]

@dataclass
class ProjectEntry:
    title: str
    tech: str
    date: str
    bullets: list[str]

@dataclass
class MasterResume:
    name: str
    tagline: str
    contact: dict[str, str]
    summary: str
    skills: dict[str, list[str]]
    experience: list[ExperienceEntry]
    projects: list[ProjectEntry]
    education: list[dict]
    certifications: list[dict]
    languages: list[dict]

    @classmethod
    def load(cls) -> MasterResume
```

---

## API Endpoints

### `POST /api/tailor`
**Request:**
```json
{ "job_description": "string" }
```
**Response:**
```json
{
  "diffs": [
    {
      "section_id": "summary",
      "original": "...",
      "tailored": "...",
      "tokens": [{ "text": "...", "type": "added|removed|unchanged" }]
    }
  ]
}
```

### `POST /api/preview`
**Request:**
```json
{
  "approved_sections": {
    "summary": "...",
    "skills": { "AI & LLM Engineering": ["RAG", "..."] },
    "bullets": { "techbit_1": "...", "fhk_1": "..." }
  }
}
```
**Response:** `text/html` — full resume HTML string

---

## Frontend Components

### `JobInput.tsx`
- Large textarea with paste detection (auto-submits on paste after 500ms debounce)
- Character count, "Analysing..." loading state
- Keyboard shortcut: `Ctrl+Enter` to submit

### `DiffViewer.tsx`
- One card per section (Summary, Skills, Experience bullets, Project bullets)
- Each card: original text (left/top) vs tailored text (right/bottom)
- Word-level highlighting: green = added, red = removed
- Approve ✅ / Reject ❌ toggle per card — defaults to approved
- Section header shows match score (e.g., "87% keyword match")

### `ResumePreview.tsx`
- Right panel: iframe showing live HTML preview, updates on every approve/reject toggle
- "Generate PDF" button fetches `/api/preview`, receives HTML string, creates a `Blob` URL via `URL.createObjectURL()`, opens it in a new tab
- Print instructions tooltip: "Press Ctrl+P, select 'Save as PDF'"

### `LoadingState.tsx`
- Skeleton cards matching DiffViewer layout
- Animated pulse, shows "Analysing job description with LLaMA 3.3..."

---

## Resume Rewrite (Part 1 — One-time)

The `master_resume.py` content will be rewritten to position Ammar as an AI/LLM Automation Engineer:

- **New tagline:** `AI/LLM Engineer | Cloud Automation Architect | Agentic Systems Developer`
- **Summary:** Leads with RAG pipelines, multi-LLM routing, agentic systems, AWS. IoT/embedded as supporting context.
- **Skills reordered:** AI & LLM Engineering first, then Cloud/DevOps, then IoT/Embedded
- **Projects reordered:** Smart Dairy Sentinel (RAG) first, Interview Copilot second, Receipt Bot third
- **Experience bullets:** AWS DevOps role bullets updated to emphasize automation and AI-readiness of infrastructure

The existing `Ammar Khalid CV.html` is updated to match and saved as the new baseline.

---

## Vercel Configuration

```json
// vercel.json
{
  "builds": [
    { "src": "frontend/package.json", "use": "@vercel/static-build", "config": { "distDir": "dist" } },
    { "src": "api/*.py", "use": "@vercel/python" }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "/api/$1" },
    { "src": "/(.*)", "dest": "/frontend/dist/$1" }
  ]
}
```

---

## Constraints & Edge Cases

- **Groq timeout:** Free tier is fast (~2–4s for LLaMA 3.3 70B). Vercel serverless timeout is 10s on free tier — sufficient.
- **LLM JSON parsing:** Response is validated with Pydantic. If malformed, retry once before returning 500.
- **No fabrication guard:** Prompt explicitly instructs the LLM not to invent metrics or job titles. Facts and numbers from the original are preserved verbatim.
- **No auth:** Single-user tool, no login needed.
- **`.env` never committed:** `.gitignore` includes `.env` and `output/`.

---

## Out of Scope

- Multiple resume profiles / user accounts
- Resume storage / history
- Email or share functionality
- ATS scoring
