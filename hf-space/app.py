"""
MSC Control Center — Dashboard Gradio
Hub central de status dos 28 projetos ativos.

Deploy: Hugging Face Spaces (Finish-him/msc-control-center)
"""

import json
import os
from datetime import datetime, timezone, timedelta
from pathlib import Path

import gradio as gr

# --- Dados ---

DATA_DIR = Path(__file__).parent
PROJECTS_FILE = DATA_DIR / "projects.json"

BRT = timezone(timedelta(hours=-3))


def load_projects() -> dict:
    with open(PROJECTS_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def get_projects_table() -> list[list[str]]:
    """Retorna tabela formatada dos projetos."""
    data = load_projects()
    rows = []
    for p in data["projetos"]:
        github = p["github"]
        if github.startswith("http"):
            github_display = github.split("/")[-1]
            github_link = f"[{github_display}]({github})"
        else:
            github_link = github

        porta = str(p["porta"]) if p["porta"] else "—"

        rows.append([
            p["nome"],
            p["categoria"],
            p["stack"],
            p["status"],
            github_link,
            porta,
        ])
    return rows


def get_stats() -> dict:
    """Calcula metricas dos projetos."""
    data = load_projects()
    projetos = data["projetos"]
    total = len(projetos)

    categorias = {}
    for p in projetos:
        cat = p["categoria"]
        categorias[cat] = categorias.get(cat, 0) + 1

    com_github = sum(1 for p in projetos if p["github"].startswith("http"))
    local_only = total - com_github

    stacks = {}
    for p in projetos:
        for s in p["stack"].split(", "):
            s = s.strip()
            if s:
                stacks[s] = stacks.get(s, 0) + 1

    top_stacks = sorted(stacks.items(), key=lambda x: -x[1])[:10]

    return {
        "total": total,
        "categorias": categorias,
        "com_github": com_github,
        "local_only": local_only,
        "top_stacks": top_stacks,
        "atualizado": data["meta"]["atualizado"],
    }


def format_stats_markdown() -> str:
    """Formata metricas em Markdown."""
    s = get_stats()
    now = datetime.now(BRT).strftime("%Y-%m-%d %H:%M")

    md = f"""## Metricas do Workspace

| Metrica | Valor |
|---------|-------|
| **Total de projetos** | {s['total']} |
| **Com repositorio GitHub** | {s['com_github']} |
| **Local-only** | {s['local_only']} |
| **Categorias** | {len(s['categorias'])} |
| **Dados atualizados em** | {s['atualizado']} |
| **Dashboard acessado em** | {now} (GMT-3) |

### Projetos por Categoria

| Categoria | Quantidade |
|-----------|-----------|
"""
    for cat, count in sorted(s["categorias"].items()):
        md += f"| {cat} | {count} |\n"

    md += """
### Top 10 Tecnologias

| Tecnologia | Projetos |
|-----------|----------|
"""
    for tech, count in s["top_stacks"]:
        md += f"| {tech} | {count} |\n"

    return md


def get_dev_logs_markdown() -> str:
    """Lista dev logs disponiveis."""
    logs_dir = DATA_DIR.parent / "dev-logs"
    if not logs_dir.exists():
        return "_Nenhum dev log encontrado. Execute `bash scripts/new-log.sh` para criar o primeiro._"

    log_files = sorted(logs_dir.rglob("*.md"), reverse=True)
    # Filtrar templates
    log_files = [f for f in log_files if "templates" not in str(f)]

    if not log_files:
        return "_Nenhum dev log encontrado ainda._"

    md = "## Dev Logs Recentes\n\n"

    for log_file in log_files[:10]:
        rel = log_file.relative_to(logs_dir)
        md += f"### {rel.stem}\n\n"
        content = log_file.read_text(encoding="utf-8")
        md += content + "\n\n---\n\n"

    if len(log_files) > 10:
        md += f"\n_... e mais {len(log_files) - 10} logs anteriores._\n"

    return md


def get_links_markdown() -> str:
    """Links rapidos do ecossistema."""
    return """## Links Rapidos

### GitHub
- [Finish-Him (pessoal)](https://github.com/Finish-Him) — 13+ repos
- [Msc-Consultoriarj-org](https://github.com/Msc-Consultoriarj-org) — 8 repos

### Hugging Face
- [Finish-him](https://huggingface.co/Finish-him) — Spaces e modelos

### Projetos Principais
| Projeto | Link |
|---------|------|
| Arquimedes (LMS) | [GitHub](https://github.com/Msc-Consultoriarj-org/arquimedes-v.0.2.0) |
| Claira (Legal OS) | [GitHub](https://github.com/Msc-Consultoriarj-org/claira) |
| MSC (Mono-repo) | [GitHub](https://github.com/Finish-Him/MSC) |
| Prometheus (Dota 2) | [GitHub](https://github.com/Finish-Him/prometheus-v7.1) |
| CLI-Anything | [GitHub](https://github.com/Finish-Him/CLI-Anything) |
| Detran Contratos | [GitHub](https://github.com/Msc-Consultoriarj-org/detran-contratos) |

### Documentacao
- Documentacao completa no vault Obsidian local (7 DOC-*.md)
- Dev logs neste repositorio (`dev-logs/`)

### Contato
- **Autor:** Moises Costa
- **Empresa:** MSC Consultoria
"""


# --- Interface Gradio ---

TITLE = "MSC Control Center"
DESCRIPTION = "Hub central de desenvolvimento — status dos 28 projetos ativos"

THEME = gr.themes.Soft(
    primary_hue="purple",
    secondary_hue="blue",
    neutral_hue="slate",
)

CSS = """
.gradio-container { max-width: 1200px !important; }
h1 { text-align: center; }
"""

with gr.Blocks(title=TITLE) as app:
    gr.Markdown(f"# {TITLE}\n{DESCRIPTION}")

    with gr.Tabs():
        # --- Tab 1: Projetos ---
        with gr.TabItem("Projetos"):
            gr.Markdown("### Catalogo de Projetos (28)")
            projects_table = gr.Dataframe(
                headers=["Nome", "Categoria", "Stack", "Status", "GitHub", "Porta"],
                value=get_projects_table(),
                datatype=["str", "str", "str", "str", "markdown", "str"],
                interactive=False,
                wrap=True,
                column_widths=["12%", "14%", "24%", "12%", "26%", "6%"],
            )
            refresh_btn = gr.Button("Atualizar dados", variant="secondary", size="sm")
            refresh_btn.click(fn=get_projects_table, outputs=projects_table)

        # --- Tab 2: Dev Log ---
        with gr.TabItem("Dev Log"):
            dev_log_md = gr.Markdown(get_dev_logs_markdown())
            refresh_log_btn = gr.Button("Atualizar logs", variant="secondary", size="sm")
            refresh_log_btn.click(fn=get_dev_logs_markdown, outputs=dev_log_md)

        # --- Tab 3: Status ---
        with gr.TabItem("Status"):
            stats_md = gr.Markdown(format_stats_markdown())
            refresh_stats_btn = gr.Button("Atualizar metricas", variant="secondary", size="sm")
            refresh_stats_btn.click(fn=format_stats_markdown, outputs=stats_md)

        # --- Tab 4: Links ---
        with gr.TabItem("Links"):
            gr.Markdown(get_links_markdown())


if __name__ == "__main__":
    app.launch(
        server_name="0.0.0.0",
        server_port=int(os.environ.get("PORT", 7860)),
        theme=THEME,
        css=CSS,
    )
