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
        summary = approved.get("summary", self._master.summary)
        tagline = approved.get("tagline", self._master.tagline)
        skills = approved.get("skills", self._master.skills)
        approved_bullets: dict[str, str] = approved.get("bullets", {})
        excluded_projects = approved.get("excluded_projects", [])
        custom_projects = approved.get("custom_projects", [])

        experience = []
        for exp in self._master.experience:
            bullets = []
            for i, b in enumerate(exp.bullets):
                b_key = f"{exp.role_slug}_{i}"
                bullets.append(approved_bullets.get(b_key, b))
            # Include any user-added custom bullets for this role
            c_idx = 0
            while f"{exp.role_slug}_custom_{c_idx}" in approved_bullets:
                bullets.append(approved_bullets[f"{exp.role_slug}_custom_{c_idx}"])
                c_idx += 1
            experience.append({**exp.__dict__, "bullets": bullets})

        projects = []
        for proj in self._master.projects:
            if proj.project_slug in excluded_projects:
                continue
            bullets = []
            for i, b in enumerate(proj.bullets):
                b_key = f"{proj.project_slug}_{i}"
                bullets.append(approved_bullets.get(b_key, b))
            c_idx = 0
            while f"{proj.project_slug}_custom_{c_idx}" in approved_bullets:
                bullets.append(approved_bullets[f"{proj.project_slug}_custom_{c_idx}"])
                c_idx += 1
            projects.append({**proj.__dict__, "bullets": bullets})

        # Append custom / AI-suggested projects if not excluded
        for c_proj in custom_projects:
            p_slug = c_proj.get("project_slug", "")
            if p_slug and p_slug in excluded_projects:
                continue
            p_bullets = []
            for i, b in enumerate(c_proj.get("bullets", [])):
                b_key = f"{p_slug}_{i}"
                p_bullets.append(approved_bullets.get(b_key, b))
            projects.append({
                "title": c_proj.get("title", "New Project"),
                "tech": c_proj.get("tech", ""),
                "date": c_proj.get("date", "2025"),
                "project_slug": p_slug,
                "bullets": p_bullets,
            })

        template_files = {
            "modern": "resume.html",
            "minimalist": "resume_minimalist.html",
            "tech": "resume_tech.html",
        }
        tpl_file = template_files.get(template_id, self._template_file)
        template = self._env.get_template(tpl_file)

        return template.render(
            name=self._master.name,
            tagline=tagline,
            contact=self._master.contact,
            summary=summary,
            skills=skills,
            experience=experience,
            projects=projects,
            education=self._master.education,
            certifications=self._master.certifications,
            languages=self._master.languages,
        )
