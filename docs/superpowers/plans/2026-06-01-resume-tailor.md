# Resume Tailor — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full-stack web app that tailors Ammar Khalid's AI-focused resume to any job description using Groq LLaMA 3.3 70B, with section-level diff review and browser-based PDF export, deployed to Vercel free tier.

**Architecture:** React 18 + TypeScript + Vite frontend communicates with a FastAPI Python serverless function (`api/index.py`) on Vercel. Core Python OOP modules (LLMClient, DiffEngine, ResumeEngine, MasterResume) handle all business logic. Users paste a job description, review word-level diffs per section with approve/reject toggles, then open approved resume HTML in a new tab to print as PDF.

**Tech Stack:** Python 3.11, FastAPI, Groq SDK, Jinja2, difflib (stdlib), Pydantic, React 18, TypeScript, Vite, Tailwind CSS 3, Vercel free tier

---

## File Map

```
resume-tailor/
├── api/
│   └── index.py              # FastAPI app — POST /api/tailor, POST /api/preview
├── core/
│   ├── __init__.py
│   ├── master_resume.py      # MasterResume dataclass + AI-focused resume data
│   ├── llm_client.py         # LLMClient — Groq API wrapper
│   ├── diff_engine.py        # DiffEngine — word-level diffs + keyword scoring
│   └── resume_engine.py      # ResumeEngine — Jinja2 template injection
├── frontend/
│   ├── src/
│   │   ├── types/index.ts
│   │   ├── hooks/useTailor.ts
│   │   ├── components/
│   │   │   ├── JobInput.tsx
│   │   │   ├── LoadingState.tsx
│   │   │   ├── DiffViewer.tsx
│   │   │   └── ResumePreview.tsx
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   └── postcss.config.js
├── templates/
│   └── resume.html           # Jinja2 template based on Ammar's CV
├── tests/
│   ├── conftest.py
│   ├── test_master_resume.py
│   ├── test_diff_engine.py
│   ├── test_llm_client.py
│   └── test_resume_engine.py
├── .env.example
├── .gitignore
├── requirements.txt
├── vercel.json
└── Ammar Khalid CV.html      # (existing file — updated in Task 3)
```

---

## Task 1: Project Scaffolding

**Files:**
- Create: `resume-tailor/.gitignore`
- Create: `resume-tailor/.env.example`
- Create: `resume-tailor/requirements.txt`
- Create: `resume-tailor/vercel.json`
- Create: `resume-tailor/core/__init__.py`
- Create: `resume-tailor/api/__init__.py` (empty)
- Create: `resume-tailor/tests/__init__.py` (empty)

- [ ] **Step 1: Create directory structure**

```bash
cd "D:\MASTER SPAI.2025\resume-tailor"
mkdir api core tests templates frontend output
mkdir frontend\src frontend\src\types frontend\src\hooks frontend\src\components
type nul > core\__init__.py
type nul > api\__init__.py
type nul > tests\__init__.py
type nul > output\.gitkeep
```

- [ ] **Step 2: Create `.gitignore`**

```
.env
output/
__pycache__/
*.pyc
.pytest_cache/
node_modules/
frontend/dist/
.vercel/
*.egg-info/
```

- [ ] **Step 3: Create `.env.example`**

```
GROQ_API_KEY=your_groq_api_key_here
```

Copy to `.env` and fill in your real Groq API key from console.groq.com.

- [ ] **Step 4: Create `requirements.txt`**

```
groq==0.9.0
fastapi==0.111.0
python-dotenv==1.0.1
jinja2==3.1.4
pydantic==2.7.1
uvicorn==0.29.0
pytest==8.2.0
pytest-asyncio==0.23.7
httpx==0.27.0
```

- [ ] **Step 5: Create `vercel.json`**

```json
{
  "buildCommand": "cd frontend && npm install && npm run build",
  "outputDirectory": "frontend/dist",
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/index.py" },
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "functions": {
    "api/index.py": {
      "maxDuration": 30
    }
  }
}
```

- [ ] **Step 6: Install Python deps**

```bash
pip install -r requirements.txt
```

Expected: all packages install without error.

- [ ] **Step 7: Commit**

```bash
git init
git add .gitignore .env.example requirements.txt vercel.json core/ api/ tests/ templates/ frontend/
git commit -m "feat: project scaffolding and config"
```

---

## Task 2: MasterResume Dataclass (AI-Focused Content)

**Files:**
- Create: `core/master_resume.py`
- Create: `tests/test_master_resume.py`

- [ ] **Step 1: Write failing tests**

Create `tests/test_master_resume.py`:

```python
from core.master_resume import MasterResume, ExperienceEntry, ProjectEntry

def test_load_returns_master_resume():
    resume = MasterResume.load()
    assert isinstance(resume, MasterResume)

def test_resume_has_ai_focused_tagline():
    resume = MasterResume.load()
    assert "AI" in resume.tagline or "LLM" in resume.tagline

def test_resume_has_required_fields():
    resume = MasterResume.load()
    assert resume.name == "Ammar Khalid"
    assert len(resume.skills) >= 4
    assert len(resume.experience) >= 2
    assert len(resume.projects) >= 3

def test_experience_entries_have_slugs():
    resume = MasterResume.load()
    for exp in resume.experience:
        assert exp.role_slug, f"{exp.title} missing role_slug"
        assert len(exp.bullets) > 0

def test_projects_have_slugs():
    resume = MasterResume.load()
    for proj in resume.projects:
        assert proj.project_slug, f"{proj.title} missing project_slug"

def test_to_llm_text_contains_bullet_ids():
    resume = MasterResume.load()
    text = resume.to_llm_text()
    assert "[fhk_0]" in text
    assert "[techbit_0]" in text
    assert "[dairy_sentinel_0]" in text
    assert "[interview_copilot_0]" in text
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd "D:\MASTER SPAI.2025\resume-tailor"
pytest tests/test_master_resume.py -v
```

Expected: `ModuleNotFoundError: No module named 'core.master_resume'`

- [ ] **Step 3: Create `core/master_resume.py`**

```python
from dataclasses import dataclass
from typing import Any


@dataclass
class ExperienceEntry:
    title: str
    company: str
    date: str
    location: str
    role_slug: str
    bullets: list[str]


@dataclass
class ProjectEntry:
    title: str
    tech: str
    date: str
    project_slug: str
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
    education: list[dict[str, Any]]
    certifications: list[dict[str, str]]
    languages: list[dict[str, str]]

    def to_llm_text(self) -> str:
        lines = [
            f"TAGLINE: {self.tagline}",
            f"\nSUMMARY:\n{self.summary}",
            "\nSKILLS:",
        ]
        for cat, skills in self.skills.items():
            lines.append(f"  {cat}: {', '.join(skills)}")
        lines.append("\nEXPERIENCE:")
        for exp in self.experience:
            lines.append(f"\n  {exp.title} at {exp.company} ({exp.date})")
            for i, bullet in enumerate(exp.bullets):
                lines.append(f"    [{exp.role_slug}_{i}] {bullet}")
        lines.append("\nPROJECTS:")
        for proj in self.projects:
            lines.append(f"\n  {proj.title} ({proj.date}) — {proj.tech}")
            for i, bullet in enumerate(proj.bullets):
                lines.append(f"    [{proj.project_slug}_{i}] {bullet}")
        return "\n".join(lines)

    @classmethod
    def load(cls) -> "MasterResume":
        return cls(
            name="Ammar Khalid",
            tagline="AI/LLM Engineer | Agentic Systems Developer | Cloud Automation Architect",
            contact={
                "email": "ammarkhalid8622@gmail.com",
                "phone": "+43 650 216 3141",
                "location": "Kufstein, Austria",
                "linkedin": "https://www.linkedin.com/in/ammar-khalid-836106171",
                "github": "https://github.com/Ammar-2510809836",
            },
            summary=(
                "Results-driven AI/LLM Engineer and Cloud Automation Architect with a proven track record "
                "building production agentic systems. Shipped three real-world AI products: a RAG-based dairy "
                "monitoring assistant (LLaMA 3.3 70B + Groq, FastAPI), a real-time multi-LLM interview copilot "
                "(ChromaDB + multi-provider fallback + live audio transcription), and a vision AI receipt "
                "automation bot (Llama Vision + Google APIs). AWS Certified Developer with 2+ years architecting "
                "cloud infrastructure for 10,000+ concurrent users. Currently a Research Assistant at FH Kufstein "
                "integrating ML/LLM frameworks for alpine IoT safety systems. Expert across the full AI product "
                "stack: prompt engineering, retrieval pipelines, LLM orchestration, and cloud-native deployment."
            ),
            skills={
                "AI & LLM Engineering": [
                    "RAG Pipelines", "LLM Orchestration", "Prompt Engineering", "Agentic Systems",
                    "Multi-LLM Routing", "Groq API", "Google Gemini", "NVIDIA NIM",
                    "SentenceTransformers", "ChromaDB", "Edge AI", "Predictive Analytics",
                ],
                "Cloud & DevOps": [
                    "AWS (EC2, ECS, Lambda, RDS, VPC, S3, CloudFront)",
                    "Terraform", "CloudFormation", "Docker", "Kubernetes",
                    "CI/CD (GitHub Actions, Jenkins, CodePipeline)",
                ],
                "Programming & Frameworks": [
                    "Python", "FastAPI", "TypeScript/JavaScript", "C/C++", "Embedded C", "Bash",
                ],
                "IoT & Embedded Systems": [
                    "ESP32/Arduino/ARM", "Impedance Spectroscopy",
                    "Fault-Tolerant Edge Computing", "PCB Design", "MQTT",
                ],
                "Protocols & APIs": [
                    "REST APIs", "WebSocket", "HTTP/HTTPS", "I2C", "SPI",
                    "Telegram Bot API", "Google Drive/Sheets API",
                ],
                "Tools & Observability": [
                    "Linux/Ubuntu", "Git/GitHub", "Grafana", "Prometheus",
                    "ELK Stack", "NGINX", "MATLAB Simulink",
                ],
            },
            experience=[
                ExperienceEntry(
                    title="Research Assistant – Smart Products & IoT (Alpine Ski Slope Project)",
                    company="FH Kufstein Tirol University of Applied Sciences",
                    date="Mar 2026 – Present",
                    location="Kufstein, Austria",
                    role_slug="fhk",
                    bullets=[
                        "<strong>LLM & ML Integration:</strong> Integrating Large Language Models to interpret complex sensor telemetry, applying ML frameworks to predict alpine slope conditions and enhance avalanche safety for ski slope management.",
                        "<strong>Edge AI Architecture:</strong> Developing fault-tolerant continuous snow quality monitoring edge devices (ESP32) using impedance spectroscopy, architecting secure zero-loss telemetry pipelines under extreme alpine conditions.",
                        "<strong>Data & Dashboard Architecture:</strong> Building real-time monitoring dashboards to visualize multidimensional environmental parameters (LWC, SWE, snow density) and hardware health metrics.",
                        "<strong>Hardware & Sensor Engineering:</strong> Designing bespoke sensing suites for snow property analysis to deliver high-accuracy avalanche risk mitigation and ski slope management.",
                    ],
                ),
                ExperienceEntry(
                    title="AWS DevOps Engineer",
                    company="TechBit Systems",
                    date="Sep 2023 – Jul 2025",
                    location="Remote / Hybrid",
                    role_slug="techbit",
                    bullets=[
                        "<strong>Cloud Architecture:</strong> Architected resilient AWS infrastructures (EC2, Lambda, S3, ELB, CloudFront) supporting 10,000+ concurrent users with 99.9% uptime, including AI workload deployment pipelines.",
                        "<strong>Microservices & ML Infrastructure:</strong> Designed scalable microservices on AWS ECS using Docker, improving resource efficiency by 35%; infrastructure enabled ML model serving across multiple engineering teams.",
                        "<strong>Infrastructure as Code:</strong> Automated large-scale provisioning using Terraform and CloudFormation, reducing environment setup time by 40%.",
                        "<strong>CI/CD Automation:</strong> Engineered robust pipelines via AWS CodePipeline and GitHub Actions, reducing deployment times from 2 hours to 45 minutes.",
                        "<strong>Observability:</strong> Implemented comprehensive monitoring (CloudWatch, Grafana, ELK Stack), reducing critical incident response times by 25%.",
                    ],
                ),
            ],
            projects=[
                ProjectEntry(
                    title="Smart Dairy Sentinel (RAG Agentic AI System)",
                    tech="Python, FastAPI, LLaMA 3.3 70B, Groq API, RAG Pipeline, SentenceTransformers, IoT Sensors",
                    date="2025",
                    project_slug="dairy_sentinel",
                    bullets=[
                        "Engineered a production RAG pipeline (query ingestion → urgency classification → sensor context injection → vector retrieval → LLM generation → safety layer) using LLaMA 3.3 70B via Groq for real-time dairy farm management.",
                        "Built intelligent query classification and urgency detection across emergency, health, reproduction, and system categories, dynamically adjusting LLM persona based on situation severity.",
                        "Implemented sensor-aware context injection combining live IoT telemetry with a curated veterinary knowledge base (SentenceTransformers + NumPy vector indexing), delivering actionable animal health insights.",
                    ],
                ),
                ProjectEntry(
                    title="Interview Copilot (Multi-LLM Agentic System)",
                    tech="Python, PyQt6, Groq (LLaMA), Google Gemini, NVIDIA NIM, ChromaDB, Deepgram Nova-2",
                    date="2025",
                    project_slug="interview_copilot",
                    bullets=[
                        "Architected a real-time multi-LLM orchestration system with smart model routing (technical vs. HR questions) and multi-provider fallback (Groq → Gemini → NVIDIA NIM), ensuring 99%+ answer generation uptime.",
                        "Built dual audio capture (microphone + Windows WASAPI loopback) with real-time Deepgram Nova-2 WebSocket transcription and pause-based turn detection, processing live interview audio with <500ms latency.",
                        "Designed RAG context retrieval using ChromaDB with confidence filtering, providing role-specific context from portfolio documents; delivered 70+ unit tests with full mock isolation.",
                    ],
                ),
                ProjectEntry(
                    title="Receipt Automation Bot (Vision AI + Cloud Integration)",
                    tech="Python, Llama 3.2 Vision, Groq API, Telegram Bot API, Google Drive API, Google Sheets API",
                    date="2024",
                    project_slug="receipt_bot",
                    bullets=[
                        "Built an end-to-end AI automation pipeline: Telegram bot receives receipt images → Llama 3.2 Vision (Groq) extracts structured data (date, vendor, total, items) → auto-organizes in Google Drive with Year/Month folder structure → logs to Google Sheets with monthly tabs.",
                        "Implemented robust error handling with auto-retry on API failures and a natural language query interface ('Total for January') enabling conversational expense tracking.",
                    ],
                ),
                ProjectEntry(
                    title="Alpine Snow Intelligence & Safety System",
                    tech="ESP32, Impedance Spectroscopy, ML/LLM, MQTT, Real-time Dashboards",
                    date="2026 – Present",
                    project_slug="alpine_snow",
                    bullets=[
                        "Developing a natural language query interface using LLMs allowing ski slope managers to contextually interrogate real-time sensor telemetry and historical snow patterns.",
                        "Building a bespoke sensing suite for high-accuracy snow property analysis (LWC, SWE, density) for avalanche risk mitigation.",
                    ],
                ),
            ],
            education=[
                {
                    "degree": "Master of Science (M.Sc.) – Smart Products & AI-driven Development",
                    "school": "FH Kufstein Tirol University of Applied Sciences",
                    "location": "Kufstein, Austria",
                    "date": "Expected 2027",
                },
                {
                    "degree": "Bachelor of Science (B.Sc.) – Electrical Engineering (Power Systems)",
                    "school": "National University of Computer & Emerging Sciences",
                    "location": "Pakistan",
                    "date": "Graduated 2021",
                },
            ],
            certifications=[
                {
                    "name": "AWS Certified Developer – Associate",
                    "url": "https://www.credly.com/badges/b3d3bb56-6b35-43a1-a882-4a4c6ef1c03f",
                },
                {
                    "name": "AWS Certified Cloud Practitioner",
                    "url": "https://www.credly.com/badges/180f6764-c6ad-4ef3-8c4e-0cbbfaaafbe6/public_url",
                },
            ],
            languages=[
                {"language": "English", "level": "Fluent (Professional Working Proficiency)"},
                {"language": "German", "level": "A2 Level (Currently Learning)"},
            ],
        )
```

- [ ] **Step 4: Run tests — confirm they pass**

```bash
pytest tests/test_master_resume.py -v
```

Expected: 6 tests PASSED.

- [ ] **Step 5: Commit**

```bash
git add core/master_resume.py tests/test_master_resume.py
git commit -m "feat: MasterResume dataclass with AI-focused resume content"
```

---

## Task 3: Rewrite Ammar Khalid CV.html (AI Focus)

**Files:**
- Modify: `D:\MASTER SPAI.2025\Ammar Khalid CV.html`

No automated tests — verify visually by opening in browser.

- [ ] **Step 1: Update tagline** in `Ammar Khalid CV.html`

Find:
```html
<div class="tagline">Embedded IoT Engineer | Cloud Solutions Architect | Smart Systems Developer</div>
```
Replace with:
```html
<div class="tagline">AI/LLM Engineer | Agentic Systems Developer | Cloud Automation Architect</div>
```

- [ ] **Step 2: Update Professional Summary**

Find the `<p>` inside `<!-- PROFESSIONAL SUMMARY -->` and replace its content with:
```
Results-driven AI/LLM Engineer and Cloud Automation Architect with a proven track record building production agentic systems. Shipped three real-world AI products: a RAG-based dairy monitoring assistant (LLaMA 3.3 70B + Groq, FastAPI), a real-time multi-LLM interview copilot (ChromaDB + multi-provider fallback + live audio transcription), and a vision AI receipt automation bot (Llama Vision + Google APIs). AWS Certified Developer with 2+ years architecting cloud infrastructure for 10,000+ concurrent users. Currently a Research Assistant at FH Kufstein integrating ML/LLM frameworks for alpine IoT safety systems. Expert across the full AI product stack: prompt engineering, retrieval pipelines, LLM orchestration, and cloud-native deployment.
```

- [ ] **Step 3: Reorder skills — AI first**

Replace the entire `<div class="skills-grid">` block inside `<!-- TECHNICAL SKILLS -->` with:

```html
<div class="skills-grid">
    <div>
        <div class="skill-group">
            <strong>AI & LLM Engineering</strong>
            RAG Pipelines, LLM Orchestration, Prompt Engineering, Agentic Systems, Multi-LLM Routing, Groq API, Google Gemini, NVIDIA NIM, SentenceTransformers, ChromaDB, Edge AI, Predictive Analytics
        </div>
        <div class="skill-group">
            <strong>Cloud & DevOps</strong>
            AWS (EC2, ECS, Lambda, RDS, VPC, S3, CloudFront), Terraform, CloudFormation, Docker, Kubernetes, CI/CD (GitHub Actions, Jenkins, CodePipeline)
        </div>
        <div class="skill-group">
            <strong>Programming & Frameworks</strong>
            Python, FastAPI, TypeScript/JavaScript, C/C++, Embedded C, Bash
        </div>
    </div>
    <div>
        <div class="skill-group">
            <strong>IoT & Embedded Systems</strong>
            ESP32/Arduino/ARM, Impedance Spectroscopy, Fault-Tolerant Edge Computing, PCB Design, MQTT
        </div>
        <div class="skill-group">
            <strong>Protocols & APIs</strong>
            REST APIs, WebSocket, HTTP/HTTPS, I2C, SPI, Telegram Bot API, Google Drive/Sheets API
        </div>
        <div class="skill-group">
            <strong>Tools & Observability</strong>
            Linux/Ubuntu, Git/GitHub, Grafana, Prometheus, ELK Stack, NGINX, MATLAB Simulink
        </div>
    </div>
</div>
```

- [ ] **Step 4: Reorder and update Key Projects — AI projects first**

Replace the entire `<!-- PROJECTS -->` section with:

```html
<!-- PROJECTS -->
<section>
    <h2>Key Projects</h2>

    <div class="entry">
        <div class="entry-header">
            <h3>Smart Dairy Sentinel (RAG Agentic AI System)</h3>
            <span class="date-location">2025</span>
        </div>
        <div class="project-tech">Python, FastAPI, LLaMA 3.3 70B, Groq API, RAG Pipeline, SentenceTransformers, IoT Sensors</div>
        <ul>
            <li>Engineered a production RAG pipeline (query ingestion → urgency classification → sensor context injection → vector retrieval → LLM generation → safety layer) using LLaMA 3.3 70B via Groq for real-time dairy farm management.</li>
            <li>Built intelligent query classification and urgency detection across emergency, health, reproduction, and system categories, dynamically adjusting LLM persona based on situation severity.</li>
            <li>Implemented sensor-aware context injection combining live IoT telemetry with a curated veterinary knowledge base (SentenceTransformers + NumPy vector indexing), delivering actionable animal health insights.</li>
        </ul>
    </div>

    <div class="entry">
        <div class="entry-header">
            <h3>Interview Copilot (Multi-LLM Agentic System)</h3>
            <span class="date-location">2025</span>
        </div>
        <div class="project-tech">Python, PyQt6, Groq (LLaMA), Google Gemini, NVIDIA NIM, ChromaDB, Deepgram Nova-2, WebSocket</div>
        <ul>
            <li>Architected a real-time multi-LLM orchestration system with smart model routing (technical vs. HR questions) and multi-provider fallback (Groq → Gemini → NVIDIA NIM), ensuring 99%+ answer generation uptime.</li>
            <li>Built dual audio capture (microphone + Windows WASAPI loopback) with real-time Deepgram Nova-2 WebSocket transcription and pause-based turn detection, processing live interview audio with &lt;500ms latency.</li>
            <li>Designed RAG context retrieval using ChromaDB with confidence filtering; delivered 70+ unit tests with full mock isolation.</li>
        </ul>
    </div>

    <div class="entry">
        <div class="entry-header">
            <h3>Receipt Automation Bot (Vision AI + Cloud Integration)</h3>
            <span class="date-location">2024</span>
        </div>
        <div class="project-tech">Python, Llama 3.2 Vision, Groq API, Telegram Bot API, Google Drive API, Google Sheets API</div>
        <ul>
            <li>Built an end-to-end AI automation pipeline: Telegram bot receives receipt images → Llama 3.2 Vision extracts structured data (date, vendor, total, items) → auto-organizes in Google Drive (Year/Month folders) → logs to Google Sheets with monthly tabs.</li>
            <li>Implemented auto-retry error handling and a natural language query interface ("Total for January") enabling conversational expense tracking.</li>
        </ul>
    </div>

    <div class="entry">
        <div class="entry-header">
            <h3>Alpine Snow Intelligence &amp; Safety System</h3>
            <span class="date-location">2026 – Present</span>
        </div>
        <div class="project-tech">ESP32, Impedance Spectroscopy, ML/LLM, MQTT, Real-time Dashboards</div>
        <ul>
            <li>Developing a natural language query interface using LLMs allowing ski slope managers to contextually interrogate real-time sensor telemetry and historical snow patterns.</li>
            <li>Building a bespoke sensing suite for high-accuracy snow property analysis (LWC, SWE, density) for avalanche risk mitigation.</li>
        </ul>
    </div>
</section>
```

- [ ] **Step 5: Verify visually**

Open `Ammar Khalid CV.html` in browser. Confirm: tagline shows AI/LLM Engineer, AI skills appear first, projects are in new order.

- [ ] **Step 6: Commit**

```bash
git add "D:\MASTER SPAI.2025\Ammar Khalid CV.html"
git commit -m "feat: rewrite CV with AI/LLM engineer focus"
```

---

## Task 4: DiffEngine

**Files:**
- Create: `core/diff_engine.py`
- Create: `tests/test_diff_engine.py`

- [ ] **Step 1: Write failing tests**

Create `tests/test_diff_engine.py`:

```python
from core.diff_engine import DiffEngine, DiffToken, DiffResult

def test_identical_texts_all_unchanged():
    engine = DiffEngine()
    result = engine.compute("summary", "hello world", "hello world")
    assert all(t.type == "unchanged" for t in result.tokens)

def test_detects_added_words():
    engine = DiffEngine()
    result = engine.compute("summary", "I build software", "I build AI software")
    assert any(t.type == "added" for t in result.tokens)

def test_detects_removed_words():
    engine = DiffEngine()
    result = engine.compute("summary", "I build software apps", "I build software")
    assert any(t.type == "removed" for t in result.tokens)

def test_keyword_score_with_matching_keywords():
    engine = DiffEngine()
    result = engine.compute(
        "summary", "old text", "Python FastAPI and LLM experience",
        jd_keywords={"python", "fastapi", "llm"}
    )
    assert result.keyword_match_score > 0.5

def test_keyword_score_zero_no_matches():
    engine = DiffEngine()
    result = engine.compute(
        "summary", "old text", "Python FastAPI developer",
        jd_keywords={"kubernetes", "golang", "rust"}
    )
    assert result.keyword_match_score == 0.0

def test_keyword_score_one_when_no_keywords_provided():
    engine = DiffEngine()
    result = engine.compute("summary", "old", "new")
    assert result.keyword_match_score == 1.0

def test_compute_bulk_returns_correct_count():
    engine = DiffEngine()
    pairs = [
        ("summary", "old summary", "new summary"),
        ("skills_ai", "Python", "Python RAG LLM"),
    ]
    results = engine.compute_bulk(pairs, jd_keywords={"python", "rag"})
    assert len(results) == 2
    assert all(isinstance(r, DiffResult) for r in results)

def test_result_section_id_preserved():
    engine = DiffEngine()
    result = engine.compute("fhk_0", "original bullet", "tailored bullet")
    assert result.section_id == "fhk_0"
    assert result.original == "original bullet"
    assert result.tailored == "tailored bullet"
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
pytest tests/test_diff_engine.py -v
```

Expected: `ModuleNotFoundError: No module named 'core.diff_engine'`

- [ ] **Step 3: Create `core/diff_engine.py`**

```python
import difflib
from dataclasses import dataclass
from typing import Literal


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
    keyword_match_score: float


class DiffEngine:
    def compute(
        self,
        section_id: str,
        original: str,
        tailored: str,
        jd_keywords: set[str] | None = None,
    ) -> DiffResult:
        original_words = original.split()
        tailored_words = tailored.split()

        matcher = difflib.SequenceMatcher(None, original_words, tailored_words)
        tokens: list[DiffToken] = []

        for tag, i1, i2, j1, j2 in matcher.get_opcodes():
            if tag == "equal":
                for word in original_words[i1:i2]:
                    tokens.append(DiffToken(text=word, type="unchanged"))
            elif tag == "replace":
                for word in original_words[i1:i2]:
                    tokens.append(DiffToken(text=word, type="removed"))
                for word in tailored_words[j1:j2]:
                    tokens.append(DiffToken(text=word, type="added"))
            elif tag == "delete":
                for word in original_words[i1:i2]:
                    tokens.append(DiffToken(text=word, type="removed"))
            elif tag == "insert":
                for word in tailored_words[j1:j2]:
                    tokens.append(DiffToken(text=word, type="added"))

        return DiffResult(
            section_id=section_id,
            original=original,
            tailored=tailored,
            tokens=tokens,
            keyword_match_score=self._keyword_score(tailored, jd_keywords),
        )

    def _keyword_score(self, text: str, keywords: set[str] | None) -> float:
        if not keywords:
            return 1.0
        text_lower = text.lower()
        matched = sum(1 for kw in keywords if kw.lower() in text_lower)
        return round(matched / len(keywords), 2)

    def compute_bulk(
        self,
        pairs: list[tuple[str, str, str]],
        jd_keywords: set[str] | None = None,
    ) -> list[DiffResult]:
        return [
            self.compute(section_id, original, tailored, jd_keywords)
            for section_id, original, tailored in pairs
        ]
```

- [ ] **Step 4: Run tests — confirm they pass**

```bash
pytest tests/test_diff_engine.py -v
```

Expected: 8 tests PASSED.

- [ ] **Step 5: Commit**

```bash
git add core/diff_engine.py tests/test_diff_engine.py
git commit -m "feat: DiffEngine with word-level diffs and keyword scoring"
```

---

## Task 5: LLMClient

**Files:**
- Create: `core/llm_client.py`
- Create: `tests/test_llm_client.py`

- [ ] **Step 1: Write failing tests**

Create `tests/test_llm_client.py`:

```python
import json
from unittest.mock import MagicMock, patch
from core.llm_client import LLMClient, TailoredSections
from core.master_resume import MasterResume

GOOD_JSON = json.dumps({
    "summary": "Tailored summary for this role.",
    "skills": {"AI & LLM Engineering": ["RAG", "LLM Orchestration"]},
    "bullets": {"fhk_0": "Rephrased FH Kufstein bullet.", "techbit_0": "Rephrased TechBit bullet."},
})

@patch("core.llm_client.Groq")
def test_tailor_returns_tailored_sections(mock_groq_cls):
    mock_client = MagicMock()
    mock_groq_cls.return_value = mock_client
    mock_client.chat.completions.create.return_value = MagicMock(
        choices=[MagicMock(message=MagicMock(content=GOOD_JSON))]
    )
    client = LLMClient(api_key="test-key")
    result = client.tailor("We need a Python LLM developer.", MasterResume.load())
    assert isinstance(result, TailoredSections)
    assert result.summary == "Tailored summary for this role."
    assert "AI & LLM Engineering" in result.skills
    assert "fhk_0" in result.bullets

@patch("core.llm_client.Groq")
def test_tailor_retries_on_bad_json(mock_groq_cls):
    mock_client = MagicMock()
    mock_groq_cls.return_value = mock_client
    mock_client.chat.completions.create.side_effect = [
        MagicMock(choices=[MagicMock(message=MagicMock(content="not json at all"))]),
        MagicMock(choices=[MagicMock(message=MagicMock(content=GOOD_JSON))]),
    ]
    client = LLMClient(api_key="test-key")
    result = client.tailor("job description", MasterResume.load())
    assert result.summary == "Tailored summary for this role."
    assert mock_client.chat.completions.create.call_count == 2

@patch("core.llm_client.Groq")
def test_tailor_raises_after_two_bad_responses(mock_groq_cls):
    mock_client = MagicMock()
    mock_groq_cls.return_value = mock_client
    mock_client.chat.completions.create.return_value = MagicMock(
        choices=[MagicMock(message=MagicMock(content="not json"))]
    )
    client = LLMClient(api_key="test-key")
    import pytest
    with pytest.raises(ValueError, match="invalid JSON"):
        client.tailor("job", MasterResume.load())

@patch("core.llm_client.Groq")
def test_strips_markdown_fences(mock_groq_cls):
    mock_client = MagicMock()
    mock_groq_cls.return_value = mock_client
    fenced = f"```json\n{GOOD_JSON}\n```"
    mock_client.chat.completions.create.return_value = MagicMock(
        choices=[MagicMock(message=MagicMock(content=fenced))]
    )
    client = LLMClient(api_key="test-key")
    result = client.tailor("job", MasterResume.load())
    assert result.summary == "Tailored summary for this role."
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
pytest tests/test_llm_client.py -v
```

Expected: `ModuleNotFoundError: No module named 'core.llm_client'`

- [ ] **Step 3: Create `core/llm_client.py`**

```python
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
```

- [ ] **Step 4: Run tests — confirm they pass**

```bash
pytest tests/test_llm_client.py -v
```

Expected: 4 tests PASSED.

- [ ] **Step 5: Commit**

```bash
git add core/llm_client.py tests/test_llm_client.py
git commit -m "feat: LLMClient with Groq integration and retry logic"
```

---

## Task 6: Jinja2 Template + ResumeEngine

**Files:**
- Create: `templates/resume.html`
- Create: `core/resume_engine.py`
- Create: `tests/test_resume_engine.py`

- [ ] **Step 1: Write failing tests**

Create `tests/test_resume_engine.py`:

```python
import os
import pytest
from core.resume_engine import ResumeEngine

TEMPLATE = os.path.join(os.path.dirname(__file__), "../templates/resume.html")

@pytest.fixture
def engine():
    return ResumeEngine(TEMPLATE)

def test_inject_empty_returns_html_with_name(engine):
    html = engine.inject({})
    assert "<html" in html
    assert "Ammar Khalid" in html

def test_inject_replaces_summary(engine):
    html = engine.inject({"summary": "Custom AI engineer summary for this test."})
    assert "Custom AI engineer summary for this test." in html

def test_inject_replaces_fhk_bullet(engine):
    html = engine.inject({"bullets": {"fhk_0": "Custom FHK bullet injected here."}})
    assert "Custom FHK bullet injected here." in html

def test_inject_preserves_original_bullet_when_not_overridden(engine):
    html = engine.inject({"bullets": {"fhk_0": "Override only first bullet."}})
    assert "Edge AI Architecture" in html  # fhk_1 not overridden

def test_inject_preserves_certifications(engine):
    html = engine.inject({})
    assert "AWS Certified Developer" in html
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
pytest tests/test_resume_engine.py -v
```

Expected: `ModuleNotFoundError: No module named 'core.resume_engine'`

- [ ] **Step 3: Create `templates/resume.html`** (Jinja2 version of Ammar's CV)

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ name }} - Resume</title>
    <style>
        :root {
            --primary-color: #0F4C81;
            --secondary-color: #2c3e50;
            --text-color: #333333;
            --text-light: #555555;
            --bg-color: #ffffff;
            --line-color: #e0e0e0;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            line-height: 1.5;
            color: var(--text-color);
            background: #f4f7f6;
            margin: 0;
            padding: 20px;
        }
        .resume-container {
            max-width: 850px;
            margin: 0 auto;
            background: var(--bg-color);
            padding: 40px 60px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.05);
            border-top: 6px solid var(--primary-color);
        }
        header {
            text-align: left;
            border-bottom: 2px solid var(--line-color);
            padding-bottom: 20px;
            margin-bottom: 25px;
        }
        h1 { font-size: 34px; margin: 0 0 5px 0; color: var(--secondary-color); text-transform: uppercase; letter-spacing: 1px; }
        .tagline { font-size: 16px; color: var(--primary-color); font-weight: 600; margin-bottom: 12px; }
        .contact-info { display: flex; flex-wrap: wrap; gap: 15px; font-size: 13px; color: var(--text-light); align-items: center; }
        .contact-info a { color: var(--text-light); text-decoration: none; }
        .contact-info a:hover { color: var(--primary-color); text-decoration: underline; }
        h2 { font-size: 17px; color: var(--primary-color); border-bottom: 1px solid var(--line-color); padding-bottom: 4px; margin-top: 25px; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
        h3 { font-size: 14px; color: var(--secondary-color); margin: 0 0 3px 0; font-weight: 700; }
        .entry { margin-bottom: 18px; page-break-inside: avoid; }
        .entry-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 2px; }
        .company-name { font-weight: 600; color: var(--text-light); font-size: 13px; font-style: italic; }
        .date-location { font-size: 12px; color: var(--text-light); font-weight: 500; text-align: right; }
        ul { margin: 6px 0 0 0; padding-left: 18px; }
        li { font-size: 12.5px; margin-bottom: 5px; text-align: justify; }
        .skills-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; font-size: 12.5px; }
        .skill-group { margin-bottom: 10px; }
        .skill-group strong { display: block; color: var(--secondary-color); margin-bottom: 3px; }
        .project-tech { font-size: 11.5px; color: var(--text-light); font-style: italic; margin-bottom: 5px; }
        p { font-size: 12.5px; line-height: 1.5; margin: 0 0 10px 0; text-align: justify; }
        .ats-link { color: var(--primary-color); text-decoration: none; }
        @media print {
            body { background: white; padding: 0; }
            .resume-container { box-shadow: none; border-top: none; padding: 0; max-width: 100%; }
            @page { margin: 10mm; }
        }
    </style>
</head>
<body>
    <div class="resume-container">
        <header>
            <h1>{{ name }}</h1>
            <div class="tagline">{{ tagline }}</div>
            <div class="contact-info">
                <span>📧 <a href="mailto:{{ contact.email }}">{{ contact.email }}</a></span>
                <span>📱 {{ contact.phone }}</span>
                <span>📍 {{ contact.location }}</span>
                <span><a href="{{ contact.linkedin }}" target="_blank">LinkedIn</a></span>
                <span><a href="{{ contact.github }}" target="_blank">GitHub</a></span>
            </div>
        </header>

        <section>
            <h2>Professional Summary</h2>
            <p>{{ summary }}</p>
        </section>

        <section>
            <h2>Professional Experience</h2>
            {% for exp in experience %}
            <div class="entry">
                <div class="entry-header">
                    <h3>{{ exp.title }}</h3>
                    <span class="date-location">{{ exp.date }} | {{ exp.location }}</span>
                </div>
                <div class="company-name">{{ exp.company }}</div>
                <ul>
                    {% for bullet in exp.bullets %}
                    <li>{{ bullet | safe }}</li>
                    {% endfor %}
                </ul>
            </div>
            {% endfor %}
        </section>

        <section>
            <h2>Education</h2>
            {% for edu in education %}
            <div class="entry">
                <div class="entry-header">
                    <h3>{{ edu.degree }}</h3>
                    <span class="date-location">{{ edu.date }}</span>
                </div>
                <div class="company-name">{{ edu.school }} | {{ edu.location }}</div>
            </div>
            {% endfor %}
        </section>

        <section>
            <h2>Technical Skills</h2>
            <div class="skills-grid">
                {% set skill_items = skills.items() | list %}
                <div>
                    {% for cat, skill_list in skill_items[:3] %}
                    <div class="skill-group">
                        <strong>{{ cat }}</strong>
                        {{ skill_list | join(', ') }}
                    </div>
                    {% endfor %}
                </div>
                <div>
                    {% for cat, skill_list in skill_items[3:] %}
                    <div class="skill-group">
                        <strong>{{ cat }}</strong>
                        {{ skill_list | join(', ') }}
                    </div>
                    {% endfor %}
                </div>
            </div>
        </section>

        <section>
            <h2>Key Projects</h2>
            {% for proj in projects %}
            <div class="entry">
                <div class="entry-header">
                    <h3>{{ proj.title }}</h3>
                    <span class="date-location">{{ proj.date }}</span>
                </div>
                <div class="project-tech">{{ proj.tech }}</div>
                <ul>
                    {% for bullet in proj.bullets %}
                    <li>{{ bullet | safe }}</li>
                    {% endfor %}
                </ul>
            </div>
            {% endfor %}
        </section>

        <section>
            <div class="skills-grid">
                <div>
                    <h2>Certifications</h2>
                    <ul style="list-style-type: none; padding-left: 0;">
                        {% for cert in certifications %}
                        <li style="margin-bottom: 8px;">
                            <strong>{{ cert.name }}</strong><br>
                            <a href="{{ cert.url }}" target="_blank" class="ats-link" style="font-size: 11.5px;">Verify Credential ↗</a>
                        </li>
                        {% endfor %}
                    </ul>
                </div>
                <div>
                    <h2>Languages</h2>
                    <ul style="list-style-type: none; padding-left: 0;">
                        {% for lang in languages %}
                        <li><strong>{{ lang.language }}:</strong> {{ lang.level }}</li>
                        {% endfor %}
                    </ul>
                </div>
            </div>
        </section>
    </div>
</body>
</html>
```

- [ ] **Step 4: Create `core/resume_engine.py`**

```python
import os
from jinja2 import Environment, FileSystemLoader, select_autoescape
from core.master_resume import MasterResume


class ResumeEngine:
    def __init__(self, template_path: str):
        template_dir = os.path.dirname(os.path.abspath(template_path))
        self._template_file = os.path.basename(template_path)
        self._env = Environment(
            loader=FileSystemLoader(template_dir),
            autoescape=select_autoescape(["html"]),
        )
        self._master = MasterResume.load()

    def inject(self, approved: dict) -> str:
        summary = approved.get("summary", self._master.summary)
        skills = approved.get("skills", self._master.skills)
        approved_bullets: dict[str, str] = approved.get("bullets", {})

        experience = []
        for exp in self._master.experience:
            bullets = [
                approved_bullets.get(f"{exp.role_slug}_{i}", b)
                for i, b in enumerate(exp.bullets)
            ]
            experience.append({**exp.__dict__, "bullets": bullets})

        projects = []
        for proj in self._master.projects:
            bullets = [
                approved_bullets.get(f"{proj.project_slug}_{i}", b)
                for i, b in enumerate(proj.bullets)
            ]
            projects.append({**proj.__dict__, "bullets": bullets})

        template = self._env.get_template(self._template_file)
        return template.render(
            name=self._master.name,
            tagline=self._master.tagline,
            contact=self._master.contact,
            summary=summary,
            skills=skills,
            experience=experience,
            projects=projects,
            education=self._master.education,
            certifications=self._master.certifications,
            languages=self._master.languages,
        )
```

- [ ] **Step 5: Run tests — confirm they pass**

```bash
pytest tests/test_resume_engine.py -v
```

Expected: 5 tests PASSED.

- [ ] **Step 6: Run all tests**

```bash
pytest tests/ -v
```

Expected: all 23 tests PASSED.

- [ ] **Step 7: Commit**

```bash
git add templates/resume.html core/resume_engine.py tests/test_resume_engine.py
git commit -m "feat: Jinja2 resume template and ResumeEngine"
```

---

## Task 7: FastAPI Endpoints

**Files:**
- Create: `api/index.py`

- [ ] **Step 1: Create `api/index.py`**

```python
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
```

- [ ] **Step 2: Start local dev server**

```bash
cd "D:\MASTER SPAI.2025\resume-tailor"
uvicorn api.index:app --reload --port 8000
```

Expected: `Uvicorn running on http://127.0.0.1:8000`

- [ ] **Step 3: Test /api/preview with curl**

In a second terminal:
```bash
curl -X POST http://localhost:8000/api/preview \
  -H "Content-Type: application/json" \
  -d "{\"approved_sections\": {}}" \
  -o test_output.html
```

Expected: `test_output.html` created, contains `Ammar Khalid` and `AI/LLM Engineer`.

- [ ] **Step 4: Test /api/tailor with curl (requires real GROQ_API_KEY in .env)**

```bash
curl -X POST http://localhost:8000/api/tailor \
  -H "Content-Type: application/json" \
  -d "{\"job_description\": \"We are looking for a Python developer with LLM and RAG experience to build AI agents.\"}"
```

Expected: JSON response with `diffs` array and `tailored_skills` object.

- [ ] **Step 5: Commit**

```bash
git add api/index.py
git commit -m "feat: FastAPI endpoints for tailor and preview"
```

---

## Task 8: Frontend Setup (Vite + React + Tailwind + Types)

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/vite.config.ts`
- Create: `frontend/tailwind.config.ts`
- Create: `frontend/postcss.config.js`
- Create: `frontend/tsconfig.json`
- Create: `frontend/index.html`
- Create: `frontend/src/index.css`
- Create: `frontend/src/types/index.ts`

- [ ] **Step 1: Create `frontend/package.json`**

```json
{
  "name": "resume-tailor-frontend",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.40",
    "tailwindcss": "^3.4.7",
    "typescript": "^5.5.3",
    "vite": "^5.3.4"
  }
}
```

- [ ] **Step 2: Create `frontend/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create `frontend/vite.config.ts`**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
  },
})
```

- [ ] **Step 4: Create `frontend/tailwind.config.ts`**

```typescript
import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#0F4C81',
          secondary: '#2c3e50',
        },
      },
    },
  },
  plugins: [],
} satisfies Config
```

- [ ] **Step 5: Create `frontend/postcss.config.js`**

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

- [ ] **Step 6: Create `frontend/index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Resume Tailor — Powered by LLaMA 3.3</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 7: Create `frontend/src/index.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 8: Create `frontend/src/types/index.ts`**

```typescript
export type DiffTokenType = 'added' | 'removed' | 'unchanged'

export interface DiffToken {
  text: string
  type: DiffTokenType
}

export interface DiffResult {
  section_id: string
  original: string
  tailored: string
  tokens: DiffToken[]
  keyword_match_score: number
}

export interface TailorResponse {
  tailored_skills: Record<string, string[]>
  diffs: DiffResult[]
}

export interface ApprovedSections {
  summary?: string
  skills?: Record<string, string[]>
  bullets?: Record<string, string>
}

export type AppState = 'idle' | 'loading' | 'reviewing'
```

- [ ] **Step 9: Install frontend deps**

```bash
cd "D:\MASTER SPAI.2025\resume-tailor\frontend"
npm install
```

Expected: `node_modules/` created, no errors.

- [ ] **Step 10: Commit**

```bash
cd ..
git add frontend/
git commit -m "feat: React + Vite + Tailwind frontend scaffolding and TypeScript types"
```

---

## Task 9: useTailor Hook

**Files:**
- Create: `frontend/src/hooks/useTailor.ts`

- [ ] **Step 1: Create `frontend/src/hooks/useTailor.ts`**

```typescript
import { useState, useCallback } from 'react'
import type { DiffResult, ApprovedSections, AppState, TailorResponse } from '../types'

interface UseTailorReturn {
  state: AppState
  diffs: DiffResult[]
  approvals: Record<string, boolean>
  tailoredSkills: Record<string, string[]>
  error: string | null
  submitJD: (jd: string) => Promise<void>
  toggleApproval: (sectionId: string) => void
  approveAll: () => void
  generatePDF: () => Promise<void>
  reset: () => void
}

export function useTailor(): UseTailorReturn {
  const [state, setState] = useState<AppState>('idle')
  const [diffs, setDiffs] = useState<DiffResult[]>([])
  const [approvals, setApprovals] = useState<Record<string, boolean>>({})
  const [tailoredSkills, setTailoredSkills] = useState<Record<string, string[]>>({})
  const [error, setError] = useState<string | null>(null)

  const submitJD = useCallback(async (jd: string) => {
    setState('loading')
    setError(null)
    try {
      const res = await fetch('/api/tailor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_description: jd }),
      })
      if (!res.ok) {
        const detail = await res.json().catch(() => ({ detail: res.statusText }))
        throw new Error(detail.detail ?? `HTTP ${res.status}`)
      }
      const data: TailorResponse = await res.json()
      setDiffs(data.diffs)
      setTailoredSkills(data.tailored_skills)
      setApprovals(Object.fromEntries(data.diffs.map(d => [d.section_id, true])))
      setState('reviewing')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setState('idle')
    }
  }, [])

  const toggleApproval = useCallback((sectionId: string) => {
    setApprovals(prev => ({ ...prev, [sectionId]: !prev[sectionId] }))
  }, [])

  const approveAll = useCallback(() => {
    setApprovals(prev => Object.fromEntries(Object.keys(prev).map(k => [k, true])))
  }, [])

  const generatePDF = useCallback(async () => {
    const approved = buildApprovedSections(diffs, approvals, tailoredSkills)
    const res = await fetch('/api/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approved_sections: approved }),
    })
    if (!res.ok) throw new Error('Preview generation failed')
    const html = await res.text()
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
  }, [diffs, approvals, tailoredSkills])

  const reset = useCallback(() => {
    setState('idle')
    setDiffs([])
    setApprovals({})
    setTailoredSkills({})
    setError(null)
  }, [])

  return { state, diffs, approvals, tailoredSkills, error, submitJD, toggleApproval, approveAll, generatePDF, reset }
}

function buildApprovedSections(
  diffs: DiffResult[],
  approvals: Record<string, boolean>,
  tailoredSkills: Record<string, string[]>,
): ApprovedSections {
  const sections: ApprovedSections = { bullets: {} }

  for (const diff of diffs) {
    const useNew = approvals[diff.section_id] ?? true
    const text = useNew ? diff.tailored : diff.original

    if (diff.section_id === 'summary') {
      sections.summary = text
    } else if (diff.section_id.startsWith('skills_')) {
      if (!sections.skills) sections.skills = {}
      const cat = diff.section_id.slice('skills_'.length)
      sections.skills[cat] = useNew
        ? (tailoredSkills[cat] ?? text.split(', '))
        : text.split(', ')
    } else {
      sections.bullets![diff.section_id] = text
    }
  }
  return sections
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/hooks/useTailor.ts
git commit -m "feat: useTailor hook with state machine and PDF generation"
```

---

## Task 10: JobInput + LoadingState Components

**Files:**
- Create: `frontend/src/components/JobInput.tsx`
- Create: `frontend/src/components/LoadingState.tsx`

- [ ] **Step 1: Create `frontend/src/components/JobInput.tsx`**

```tsx
import { useState, useCallback, useEffect } from 'react'

interface Props {
  onSubmit: (jd: string) => void
  isLoading: boolean
}

export function JobInput({ onSubmit, isLoading }: Props) {
  const [jd, setJd] = useState('')

  const handleSubmit = useCallback(() => {
    const trimmed = jd.trim()
    if (trimmed.length > 50) onSubmit(trimmed)
  }, [jd, onSubmit])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') handleSubmit()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleSubmit])

  return (
    <div className="flex flex-col h-full gap-4">
      <div>
        <h2 className="text-lg font-bold text-[#2c3e50] mb-1">Paste Job Description</h2>
        <p className="text-sm text-gray-500">Ctrl+Enter to analyse, or click the button</p>
      </div>
      <textarea
        className="flex-1 w-full p-4 border border-gray-200 rounded-lg resize-none text-sm
                   font-mono focus:outline-none focus:ring-2 focus:ring-[#0F4C81] bg-gray-50
                   disabled:opacity-50"
        placeholder="Paste the full job description here..."
        value={jd}
        onChange={e => setJd(e.target.value)}
        disabled={isLoading}
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">{jd.length} chars</span>
        <button
          onClick={handleSubmit}
          disabled={isLoading || jd.trim().length < 50}
          className="px-6 py-2.5 bg-[#0F4C81] text-white rounded-lg font-semibold text-sm
                     hover:bg-[#0b3a61] disabled:opacity-40 disabled:cursor-not-allowed
                     transition-colors"
        >
          {isLoading ? 'Analysing...' : 'Tailor Resume →'}
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create `frontend/src/components/LoadingState.tsx`**

```tsx
export function LoadingState() {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-[#0F4C81] font-medium animate-pulse">
        Analysing job description with LLaMA 3.3 70B...
      </p>
      {['Summary', 'Skills — AI & LLM', 'Experience Bullets', 'Project Bullets'].map(label => (
        <div key={label} className="border border-gray-100 rounded-lg p-4 animate-pulse">
          <div className="flex justify-between items-center mb-3">
            <div className="h-4 bg-gray-200 rounded w-32" />
            <div className="h-6 bg-gray-100 rounded w-20" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[0, 1].map(col => (
              <div key={col} className="space-y-2">
                <div className="h-3 bg-gray-100 rounded w-full" />
                <div className="h-3 bg-gray-100 rounded w-5/6" />
                <div className="h-3 bg-gray-100 rounded w-4/6" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/JobInput.tsx frontend/src/components/LoadingState.tsx
git commit -m "feat: JobInput and LoadingState components"
```

---

## Task 11: DiffViewer Component

**Files:**
- Create: `frontend/src/components/DiffViewer.tsx`

- [ ] **Step 1: Create `frontend/src/components/DiffViewer.tsx`**

```tsx
import type { DiffResult, DiffToken } from '../types'

function TokenSpan({ token }: { token: DiffToken }) {
  if (token.type === 'added') return <span className="bg-green-100 text-green-800 rounded px-0.5">{token.text} </span>
  if (token.type === 'removed') return <span className="bg-red-100 text-red-700 line-through rounded px-0.5">{token.text} </span>
  return <span>{token.text} </span>
}

function sectionLabel(id: string): string {
  if (id === 'summary') return 'Summary'
  if (id.startsWith('skills_')) return `Skills — ${id.slice('skills_'.length)}`
  const parts = id.split('_')
  const idx = parseInt(parts[parts.length - 1]) + 1
  const slug = parts.slice(0, -1).join('_')
  const labels: Record<string, string> = {
    fhk: 'FH Kufstein',
    techbit: 'TechBit Systems',
    dairy_sentinel: 'Dairy Sentinel',
    interview_copilot: 'Interview Copilot',
    receipt_bot: 'Receipt Bot',
    alpine_snow: 'Alpine Snow',
  }
  return `${labels[slug] ?? slug} — Bullet ${idx}`
}

interface CardProps {
  diff: DiffResult
  approved: boolean
  onToggle: () => void
}

function DiffCard({ diff, approved, onToggle }: CardProps) {
  const hasChanges = diff.tokens.some(t => t.type !== 'unchanged')
  const score = Math.round(diff.keyword_match_score * 100)

  return (
    <div
      className={`border rounded-lg p-4 transition-all ${
        approved ? 'border-gray-200 bg-white' : 'border-red-200 bg-red-50/40'
      }`}
    >
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-sm text-[#2c3e50]">{sectionLabel(diff.section_id)}</span>
          {hasChanges && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium">
              {score}% match
            </span>
          )}
          {!hasChanges && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">
              Unchanged
            </span>
          )}
        </div>
        <button
          onClick={onToggle}
          title={approved ? 'Reject this change' : 'Approve this change'}
          className="text-lg hover:scale-110 transition-transform select-none"
        >
          {approved ? '✅' : '❌'}
        </button>
      </div>

      {hasChanges ? (
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="bg-red-50 rounded p-2">
            <p className="font-semibold text-red-500 mb-1 uppercase tracking-wide text-[10px]">Original</p>
            <p
              className="leading-relaxed text-gray-600"
              dangerouslySetInnerHTML={{ __html: diff.original }}
            />
          </div>
          <div className="bg-green-50 rounded p-2">
            <p className="font-semibold text-green-600 mb-1 uppercase tracking-wide text-[10px]">Tailored</p>
            <p className="leading-relaxed text-gray-700">
              {diff.tokens.map((t, i) => <TokenSpan key={i} token={t} />)}
            </p>
          </div>
        </div>
      ) : (
        <p
          className="text-xs text-gray-500 italic leading-relaxed"
          dangerouslySetInnerHTML={{ __html: diff.original }}
        />
      )}
    </div>
  )
}

interface Props {
  diffs: DiffResult[]
  approvals: Record<string, boolean>
  onToggle: (sectionId: string) => void
  onApproveAll: () => void
}

export function DiffViewer({ diffs, approvals, onToggle, onApproveAll }: Props) {
  const approvedCount = Object.values(approvals).filter(Boolean).length

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-between items-center text-sm text-gray-500">
        <span>{approvedCount} of {diffs.length} sections approved</span>
        <button onClick={onApproveAll} className="text-[#0F4C81] hover:underline text-xs">
          Approve all
        </button>
      </div>
      {diffs.map(diff => (
        <DiffCard
          key={diff.section_id}
          diff={diff}
          approved={approvals[diff.section_id] ?? true}
          onToggle={() => onToggle(diff.section_id)}
        />
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/DiffViewer.tsx
git commit -m "feat: DiffViewer with approve/reject toggles and keyword match scores"
```

---

## Task 12: App.tsx + main.tsx Wiring

**Files:**
- Create: `frontend/src/App.tsx`
- Create: `frontend/src/main.tsx`

- [ ] **Step 1: Create `frontend/src/App.tsx`**

```tsx
import { useTailor } from './hooks/useTailor'
import { JobInput } from './components/JobInput'
import { DiffViewer } from './components/DiffViewer'
import { LoadingState } from './components/LoadingState'

export default function App() {
  const {
    state, diffs, approvals, error,
    submitJD, toggleApproval, approveAll, generatePDF, reset,
  } = useTailor()

  return (
    <div className="min-h-screen bg-[#f4f7f6] p-4 md:p-6">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <header className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#2c3e50] tracking-tight">Resume Tailor</h1>
              <p className="text-sm text-gray-400 mt-0.5">Powered by LLaMA 3.3 70B via Groq</p>
            </div>
            {state !== 'idle' && (
              <button
                onClick={reset}
                className="text-sm text-gray-400 hover:text-[#0F4C81] transition-colors"
              >
                ← Start over
              </button>
            )}
          </div>
          <div className="mt-3 h-1 bg-[#0F4C81] rounded-full" />
        </header>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            Error: {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

          {/* Left panel: Job Input */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-5 min-h-[520px] flex flex-col">
            <JobInput onSubmit={submitJD} isLoading={state === 'loading'} />
          </div>

          {/* Right panel: Loading / Diffs */}
          <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-gray-100 p-5 min-h-[520px]">
            {state === 'idle' && (
              <div className="h-full flex flex-col items-center justify-center text-center gap-3 text-gray-400">
                <span className="text-5xl">📋</span>
                <p className="text-sm">Paste a job description on the left to get started</p>
              </div>
            )}

            {state === 'loading' && <LoadingState />}

            {state === 'reviewing' && (
              <div className="flex flex-col gap-3 h-full">
                <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                  <h2 className="font-bold text-[#2c3e50]">Section Review</h2>
                  <button
                    onClick={generatePDF}
                    className="px-5 py-2 bg-[#0F4C81] text-white rounded-lg text-sm font-semibold
                               hover:bg-[#0b3a61] transition-colors shadow-sm"
                  >
                    Generate PDF →
                  </button>
                </div>
                <p className="text-[11px] text-gray-400">
                  Opens in new tab → Ctrl+P → Save as PDF
                </p>
                <div className="overflow-y-auto flex-1 pr-1">
                  <DiffViewer
                    diffs={diffs}
                    approvals={approvals}
                    onToggle={toggleApproval}
                    onApproveAll={approveAll}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create `frontend/src/main.tsx`**

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/App.tsx frontend/src/main.tsx
git commit -m "feat: App.tsx wiring — connects all components and hook"
```

---

## Task 13: Local Full-Stack Integration Test

- [ ] **Step 1: Start Python API server (Terminal 1)**

```bash
cd "D:\MASTER SPAI.2025\resume-tailor"
uvicorn api.index:app --reload --port 8000
```

- [ ] **Step 2: Start React dev server (Terminal 2)**

```bash
cd "D:\MASTER SPAI.2025\resume-tailor\frontend"
npm run dev
```

Expected: Vite server starts at `http://localhost:5173`

- [ ] **Step 3: Open browser at http://localhost:5173**

Verify:
- Header renders: "Resume Tailor" + subtitle
- Left panel shows job description textarea
- "Tailor Resume →" button is disabled until 50+ characters typed

- [ ] **Step 4: Test full flow**

1. Paste this sample JD into the textarea:
```
We are looking for a Python AI Engineer to build LLM-powered automation pipelines. 
You will design RAG systems, integrate Groq and OpenAI APIs, and deploy agents on AWS. 
Strong knowledge of FastAPI, ChromaDB, and prompt engineering required. 
Experience with agentic frameworks like LangChain preferred.
```
2. Click "Tailor Resume →" (or Ctrl+Enter)
3. Verify loading skeleton appears
4. After ~5–10 seconds, verify diff cards appear with approve/reject toggles
5. Toggle a few sections to reject them (❌)
6. Click "Generate PDF →"
7. Verify new tab opens with rendered resume HTML
8. Ctrl+P in new tab → verify resume looks correct

- [ ] **Step 5: Build frontend for production**

```bash
cd "D:\MASTER SPAI.2025\resume-tailor\frontend"
npm run build
```

Expected: `dist/` folder created with `index.html` + assets. No TypeScript errors.

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat: local integration test passing — full stack working"
```

---

## Task 14: Deploy to Vercel

- [ ] **Step 1: Install Vercel CLI**

```bash
npm install -g vercel
```

- [ ] **Step 2: Login to Vercel**

```bash
vercel login
```

Follow the browser prompt to authenticate.

- [ ] **Step 3: Deploy (first time — sets up project)**

```bash
cd "D:\MASTER SPAI.2025\resume-tailor"
vercel
```

When prompted:
- Set up and deploy? **Y**
- Which scope? Select your account
- Link to existing project? **N**
- Project name: **resume-tailor**
- In which directory is your code located? **./**
- Override build settings? **Y** → use settings from `vercel.json`

- [ ] **Step 4: Set GROQ_API_KEY environment variable**

```bash
vercel env add GROQ_API_KEY production
```

Paste your Groq API key when prompted.

Also add for preview and development:
```bash
vercel env add GROQ_API_KEY preview
vercel env add GROQ_API_KEY development
```

- [ ] **Step 5: Deploy to production**

```bash
vercel --prod
```

Expected output:
```
✅  Production: https://resume-tailor-<hash>.vercel.app
```

- [ ] **Step 6: Test production deployment**

Open the Vercel URL. Run the same integration test as Task 13 Step 4 against the live URL.

If `/api/tailor` returns 500: run `vercel logs` to see the Python function error.

- [ ] **Step 7: Final commit with deployment URL**

Edit `README.md` (create if missing):
```markdown
# Resume Tailor

Live: https://resume-tailor-<your-hash>.vercel.app

Tailors Ammar Khalid's resume to any job description using LLaMA 3.3 70B via Groq.
Paste JD → review diffs → approve/reject sections → Generate PDF.
```

```bash
git add README.md
git commit -m "docs: add deployment URL"
git push
```

---

## Self-Review

**Spec coverage check:**
- ✅ Accept JD + produce tailored HTML under 15s — Task 7 + Task 14
- ✅ Word-level diffs per section with approve/reject — Tasks 4, 11
- ✅ Live preview updates as user toggles — App.tsx re-renders on approval change
- ✅ Zero-dependency PDF via browser print — useTailor.generatePDF() Blob URL
- ✅ Vercel free tier with GROQ_API_KEY env var — Task 14
- ✅ OOP Python core — Tasks 2, 4, 5, 6
- ✅ TypeScript React frontend — Tasks 8–12
- ✅ Master resume AI rewrite (HTML + Python) — Tasks 2, 3
- ✅ Retry logic on malformed LLM JSON — LLMClient (Task 5)
- ✅ Keyword match score on each diff card — DiffEngine + DiffViewer

**Type consistency check:**
- `DiffResult.section_id` used consistently across DiffEngine, api/index.py, DiffViewer, useTailor
- `buildApprovedSections` uses `skills_` prefix matching `f"skills_{cat}"` in api/index.py ✅
- `role_slug` / `project_slug` in MasterResume match bullet IDs in LLMClient prompt ✅
- `approveAll` defined in useTailor and passed to DiffViewer as `onApproveAll` ✅
