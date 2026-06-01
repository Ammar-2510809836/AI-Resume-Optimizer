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
                    # Experience bullets use <strong>Label:</strong> format — rendered as HTML in resume template
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
                    # Experience bullets use <strong>Label:</strong> format — rendered as HTML in resume template
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
