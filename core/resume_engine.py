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

    def inject(self, approved: dict, template_id: str = "modern") -> str:
        resume = MasterResume.from_dict(approved["resume_data"]) if "resume_data" in approved else self._master

        summary = approved.get("summary", resume.summary)
        skills = approved.get("skills", resume.skills)
        approved_bullets: dict[str, str] = approved.get("bullets", {})

        experience = []
        for exp in resume.experience:
            bullets = [
                approved_bullets.get(f"{exp.role_slug}_{i}", b)
                for i, b in enumerate(exp.bullets)
            ]
            experience.append({**exp.__dict__, "bullets": bullets})

        projects = []
        for proj in resume.projects:
            bullets = [
                approved_bullets.get(f"{proj.project_slug}_{i}", b)
                for i, b in enumerate(proj.bullets)
            ]
            projects.append({**proj.__dict__, "bullets": bullets})

        # Dynamically resolve template file based on template_id
        template_files = {
            "modern": "resume.html",
            "minimalist": "resume_minimalist.html",
            "tech": "resume_tech.html",
        }
        tpl_file = template_files.get(template_id, self._template_file)

        template = self._env.get_template(tpl_file)
        return template.render(
            name=resume.name,
            tagline=resume.tagline,
            contact=resume.contact,
            summary=summary,
            skills=skills,
            experience=experience,
            projects=projects,
            education=resume.education,
            certifications=resume.certifications,
            languages=resume.languages,
        )
