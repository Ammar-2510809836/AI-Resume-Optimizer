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
