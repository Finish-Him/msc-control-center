# MSC Control Center

Hub central de desenvolvimento — conecta workspace local, GitHub, Hugging Face Space e Google Drive.

## Visao Geral

Dashboard unificado para gerenciar os 28 projetos ativos da MSC Consultoria e projetos pessoais.
Integra monitoramento de infraestrutura (VPS, Docker, GitHub) com rotinas diarias de desenvolvimento.

### 3 Pontos Cloud

| Ponto | Plataforma | Funcao |
|-------|-----------|--------|
| **Codigo + Logs** | [GitHub](https://github.com/Finish-Him/msc-control-center) | Repositorio principal + dev logs diarios |
| **Dashboard** | [HF Space](https://huggingface.co/spaces/Finish-him/msc-control-center) | Painel publico Gradio com status dos projetos |
| **Docs** | Google Drive | Documentos compartilhados com clientes/equipe |

## Stack

**Frontend (completo):**
- React 18 + Vite + Tailwind CSS v4
- Radix UI + Recharts + xterm.js + Framer Motion
- 10 paginas: Dashboard, Terminal, Docker, GitHub, Gradio, Services, Integrations, FileManager, LocalProjects, Login

**Backend (em desenvolvimento):**
- Express + Drizzle ORM + PostgreSQL
- JWT auth + bcrypt + AES-256 encryption
- WebSocket (terminal + project logs)
- Octokit (GitHub API) + SSH2 (VPS)

**HF Space:**
- Gradio (Python) — dashboard publico read-only
- Dados de `projects.json` (estatico, versionado)

## Como Rodar

### Frontend + Backend (local)
```bash
npm install
npm run dev          # Frontend dev + backend watch
npm run dev:full     # + SSH tunnel para VPS
```

### HF Space (local)
```bash
cd hf-space
pip install -r requirements.txt
python app.py
```

## Estrutura

```
msc-control-center/
  client/              # React frontend (10 paginas)
  server/              # Express backend (em desenvolvimento)
  shared/              # Tipos compartilhados
  hf-space/            # Gradio dashboard (HF Space)
    app.py
    projects.json
    requirements.txt
  dev-logs/            # Registros diarios de desenvolvimento
    templates/
      daily-log.md
      weekly-review.md
    2026/
      04/
  scripts/             # Automacao
    new-log.sh         # Cria dev log do dia
  drizzle/             # Schema + migrations
  docker-compose.yml   # PostgreSQL 16
  Dockerfile
```

## Dev Logs

Registro diario do que foi trabalhado, decisoes tomadas, bloqueios e proximos passos.

```bash
# Criar log do dia
bash scripts/new-log.sh

# Ou manualmente
cp dev-logs/templates/daily-log.md dev-logs/2026/04/$(date +%Y-%m-%d).md
```

## Rotina Diaria

1. `bash scripts/new-log.sh` — cria log do dia
2. Durante o dia: anotar tarefas, decisoes, bloqueios
3. Fim do dia: `git add . && git commit -m "log: YYYY-MM-DD" && git push`

## Google Drive

Pasta `MSC Control Center/` no Drive com:
- `Projetos/` — docs por projeto para compartilhar
- `Clientes/` — documentos de clientes
- `Templates/` — templates de log, brief, proposta
- `Documentacao/` — exports dos DOC-*.md
- `Rotinas/` — checklists diarios/semanais

## Variaveis de Ambiente

Copiar `.env.example` para `.env` e preencher:

```
DATABASE_URL, JWT_SECRET, ENCRYPTION_KEY, ADMIN_PASSWORD
VPS_HOST, VPS_PORT, VPS_USER, VPS_PASSWORD
GITHUB_TOKEN, GITHUB_USERNAME
HF_TOKEN
```

## Contas

- **GitHub pessoal:** [Finish-Him](https://github.com/Finish-Him)
- **GitHub org:** [Msc-Consultoriarj-org](https://github.com/Msc-Consultoriarj-org)
- **HF:** [Finish-him](https://huggingface.co/Finish-him)

## Licenca

Privado — MSC Consultoria
