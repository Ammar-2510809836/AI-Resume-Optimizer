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
                "stack: prompt engineering, retrieval pipelines, LLM orchestration, and clod-native deployment."
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
                    "ATSAMD21 (Arduino MKR NB 1500)", "ESP32/Arduino/ARM", "Embedded C/C++",
                    "Battery Management Systems (BMS)", "State Machines", "Modbus RTU",
                    "InfluxDB", "Impedance Spectroscopy", "Fault-Tolerant Edge Computing",
                    "PCB Design", "MQTT", "NB-IoT/LTE-M",
                ],
                "Protocols & APIs": [
                    "REST APIs", "WebSocket", "HTTP/HTTPS", "I2C", "SPI", "Modbus RTU",
                    "Telegram Bot API", "Google Drive/Sheets API",
                ],
                "Tools & Observability": [
                    "Linux/Ubuntu", "Git/GitHub", "Grafana", "Prometheus", "InfluxDB",
                    "ELK Stack", "NGINX", "MATLAB Simulink",
                ],
            },
            experience=[
                ExperienceEntry(
                    title="Research Assistant – Smart Products & IoT (Alpine Weatherstation Sisu)",
                    company="FH Kufstein Tirol University of Applied Sciences",
                    date="Mar 2026 – Present",
                    location="Kufstein, Austria",
                    role_slug="fhk",
                    bullets=[
                        "<strong>Project Overview & Deployment:</strong> Developed and deployed <i>SISU</i>, an autonomous, cold-climate alpine weather station and snow-monitoring IoT platform on ATSAMD21 using C/C++, achieving continuous autonomous operation in sub-zero alpine environments and increasing station uptime by <strong>90%</strong>.",
                        "<strong>Deterministic Embedded System Architecture:</strong> Architected a cooperative non-blocking state machine in C/C++ on ATSAMD21 (Arduino MKR NB 1500) featuring zero dynamic memory allocation (malloc/heap-free hot paths) and hardware watchdog integration (WDT) for <strong>99.9%+ autonomous uptime</strong>.",
                        "<strong>Fault-Tolerant OTA & Anti-Bricking Architecture:</strong> Engineered a remote Over-The-Air (OTA) firmware update system over NB-IoT with 16 KB chunked HTTP downloads, post-download CRC32 verification, and an autonomous 3-strike rollback mechanism to golden.bin on boot failure. Added battery voltage gating (>=12.0V) and SMS-authorized trigger commands.",
                        "<strong>Telemetry & Cloud Pipeline:</strong> Designed a secure zero-loss MQTT/Modbus telemetry pipeline and interactive Grafana/InfluxDB monitoring dashboards, increasing overall telemetry transmission reliability to <strong>99.8%</strong> across harsh sub-zero alpine environments.",
                    ],
                ),
                ExperienceEntry(
                    title="AWS DevOps Engineer",
                    company="TechBit Systems",
                    date="Sep 2023 – Jul 2025",
                    location="Remote / Hybrid",
                    role_slug="techbit",
                    bullets=[
                        "<strong>Cloud Architecture:</strong> Architected resilient AWS infrastructures (EC2, Lambda, S3, ELB, CloudFront) supporting 10,000+ concurrent users with <strong>99.9% uptime</strong>, including AI workload deployment pipelines.",
                        "<strong>Microservices & ML Infrastructure:</strong> Designed scalable microservices on AWS ECS using Docker, improving resource efficiency by <strong>35%</strong>; infrastructure enabled ML model serving across multiple engineering teams.",
                        "<strong>Infrastructure as Code & CI/CD:</strong> Automated large-scale provisioning using Terraform/CloudFormation and engineered CodePipeline/GitHub Actions CI/CD pipelines, reducing deployment times by <strong>62%</strong> (from 2h to 45m).",
                        "<strong>Observability & Incident Response:</strong> Implemented comprehensive monitoring (CloudWatch, Grafana, ELK Stack), reducing critical incident response times by <strong>25%</strong>.",
                    ],
                ),
            ],
            projects=[
                ProjectEntry(
                    title="Alpine Weatherstation Sisu",
                    tech="ATSAMD21, Embedded C/C++, BMS, State Machines, Modbus RTU, NB-IoT/LTE-M, InfluxDB, HTTP, GitHub Actions",
                    date="2026 – Present",
                    project_slug="alpine_sisu",
                    bullets=[
                        "Architected 'SISU', a mission-critical Alpine Weather Station and snow-monitoring IoT platform on ATSAMD21 using C/C++, increasing station autonomous uptime by <strong>90%</strong> in sub-zero alpine environments.",
                        "Architected a cooperative non-blocking state machine in C/C++ on ATSAMD21 (Arduino MKR NB 1500) featuring zero dynamic memory allocation (malloc/heap-free hot paths) and hardware watchdog integration (WDT) for <strong>99.9%+ autonomous uptime</strong>.",
                        "Developed a secure, anti-bricking Over-The-Air (OTA) firmware pipeline over cellular (NB-IoT/LTE-M) using HTTP 16 KB range-chunking, IEEE 802.3 CRC32 verification, and SDU bootloader integration on ATSAMD21.",
                        "Implemented an autonomous dual-stage firmware verification engine featuring a 30-minute TRIAL_RUN state, brownout voltage gating (>=12.0V), and automated 3-strike rollback to 'golden.bin', boosting telemetry transmission reliability to <strong>99.8%</strong>.",
                        "Integrated an out-of-band SMS-triggered OTA command interface with PIN-based authorization, and automated the end-to-end CI/CD firmware release pipeline via GitHub Actions to compile dual targets (Production -Os / Dev -O0).",
                    ],
                ),
                ProjectEntry(
                    title="Smart Dairy Sentinel (RAG Agentic AI System)",
                    tech="Python, FastAPI, LLaMA 3.3 70B, Groq API, RAG Pipeline, SentenceTransformers, IoT Sensors",
                    date="2025",
                    project_slug="dairy_sentinel",
                    bullets=[
                        "<strong>Overview & Architecture:</strong> Engineered a production RAG pipeline (query ingestion → urgency classification → sensor context injection → vector retrieval → LLM generation → safety layer) using LLaMA 3.3 70B via Groq for automated livestock health monitoring.",
                        "<strong>My Role & Technical Execution:</strong> Built an intelligent query classifier across emergency, health, and reproduction categories, integrating live IoT telemetry with a veterinary knowledge base via SentenceTransformers vector indexing.",
                        "<strong>Measurable Outcome:</strong> Reduced emergency response diagnosis time by <strong>40%</strong> and achieved <strong>98.5% classification accuracy</strong> across simulated livestock health scenarios.",
                    ],
                ),
                ProjectEntry(
                    title="Interview Copilot (Multi-LLM Agentic System)",
                    tech="Python, PyQt6, Groq (LLaMA), Google Gemini, NVIDIA NIM, ChromaDB, Deepgram Nova-2",
                    date="2025",
                    project_slug="interview_copilot",
                    bullets=[
                        "<strong>Overview & Architecture:</strong> Architected a real-time multi-LLM orchestration system with intelligent question routing and multi-provider fallback (Groq → Gemini → NVIDIA NIM) for live technical interview assistance.",
                        "<strong>My Role & Audio Pipeline:</strong> Built dual WASAPI loopback audio capture with real-time Deepgram Nova-2 WebSocket speech-to-text and pause-based turn detection, processing live audio with <strong><500ms latency</strong>.",
                        "<strong>Measurable Outcome:</strong> Ensured <strong>99.9% answer generation availability</strong> and validated system performance through 70+ unit tests with complete mock isolation.",
                    ],
                ),
                ProjectEntry(
                    title="Receipt Automation Bot (Vision AI + Cloud Integration)",
                    tech="Python, Llama 3.2 Vision, Groq API, Telegram Bot API, Google Drive API, Google Sheets API",
                    date="2024",
                    project_slug="receipt_bot",
                    bullets=[
                        "<strong>Overview & Pipeline:</strong> Built an automated expense processing pipeline integrating Llama 3.2 Vision (Groq) with Telegram Bot API, Google Drive, and Google Sheets for zero-touch receipt management.",
                        "<strong>My Role & Integration:</strong> Developed Vision AI structured data extraction (date, vendor, line items, total) with auto-folder organization by Year/Month and a natural language query interface ('Total for January').",
                        "<strong>Measurable Outcome:</strong> Automated <strong>100% of receipt entry workflows</strong>, cutting expense tracking processing time by <strong>85%</strong> while maintaining auto-retry fault tolerance.",
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
                    "location": "",
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
