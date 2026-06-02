# AI-Resume-Optimizer

AI-Resume-Optimizer is a lightweight, web-based tool designed to automate the painful process of customizing CVs for different job applications. By evaluating the target job description against your master resume, the tool uses LLM intelligence to build an optimized, high-impact version of your qualifications.

## Key Features

* 🎯 **Dynamic Taglines & Summaries**: Automatically rewrites your profile tagline and summary to align with the core focus of the job posting.
* 🛠️ **Project Selection Dashboard**: Select or drop specific portfolio projects on-the-fly to keep the resume concise and relevant.
* ⚡ **Natural Language AI Refinement**: Provide direct instructions to the LLM (e.g., "highlight Kubernetes experience" or "remove the AWS certification from the layout") to iterate on the results.
* 🔍 **Interactive Diff Viewer**: A clean visual split-view to review, compare, and approve/reject every modification before generating the final copy.
* 📄 **Multi-Template PDF Generator**: Instantly export print-ready PDFs using tailored design stylesheets (Modern Blue, Minimalist Serif, or Tech Bold).

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
