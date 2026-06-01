# Resume Tailor

> Paste a job description → LLaMA 3.3 70B rewrites your resume → review diffs section-by-section → print to PDF.

## What It Does

- **AI tailoring** — Groq LLaMA 3.3 70B rewrites your summary, skills, and bullet points to match the job
- **Diff review** — approve or reject each section change before generating
- **Zero-dependency PDF** — opens tailored resume in a new tab → Ctrl+P → Save as PDF
- **Vercel hosted** — free tier deployment

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS |
| Backend | FastAPI (Vercel serverless) |
| LLM | Groq API — LLaMA 3.3 70B |
| Template | Jinja2 |

## Project Structure

```
resume-tailor/
├── api/index.py          # FastAPI — POST /api/tailor, POST /api/preview
├── core/
│   ├── master_resume.py  # Resume data (edit this to update your info)
│   ├── llm_client.py     # Groq API wrapper
│   ├── diff_engine.py    # Word-level diff + keyword scoring
│   └── resume_engine.py  # Jinja2 HTML injection
├── templates/resume.html # Resume HTML template (Jinja2)
├── frontend/src/         # React app
└── tests/                # 24 passing tests
```

## Local Development

**Backend**
```bash
pip install -r requirements.txt
cp .env.example .env      # add your GROQ_API_KEY from console.groq.com
uvicorn api.index:app --reload --port 8000
```

**Frontend** (separate terminal)
```bash
cd frontend
npm install
npm run dev               # opens http://localhost:5173
```

## Deploy to Vercel

```bash
npm i -g vercel
vercel                    # first deploy — follow prompts
vercel env add GROQ_API_KEY production
vercel --prod
```

## Customising Your Resume

Edit `core/master_resume.py` — the `MasterResume.load()` method contains all resume content as Python dataclasses. Change bullets, skills, projects there and the whole app updates automatically.
