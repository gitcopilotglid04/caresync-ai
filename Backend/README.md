# CareSync AI — Post-Discharge Care Coordination Agent

A multi-agent AI pipeline that turns a hospital **discharge summary** into a structured,
coordinated **30-day post-discharge plan**. Built for the PwC Industry Innovation
Hackathon 2026.

The system is a **FastAPI** backend (the agents) plus a **Streamlit** UI (the demo
dashboard). All LLM calls go through a local [Ollama](https://ollama.com) model
(`llama3.2` by default), so nothing leaves your machine.

```
Discharge summary ──▶ Agent 1: Care Planner ──▶ Agent 2: Risk Assessor ──▶ ...
                      (carePlannerAgent)         (riskAssessorAgent)
```

> **Status:** Agents 1 & 2 are live. Agents 3 (Communication Drafter) and 4
> (Escalation) are on the Round 2 roadmap — see [REQUIREMENTS.md](docs/REQUIREMENTS.md).

---

## Prerequisites

| Requirement | Notes |
|---|---|
| **Python 3.10+** | A virtualenv is recommended (the repo includes a `.venv/`). |
| **Ollama** | Install from [ollama.com](https://ollama.com), then pull the model. |

Pull the default model once:

```bash
ollama pull llama3.2
```

---

## Setup

From the `care-coordination-agent/Backend/` directory (the frontend lives in
`care-coordination-agent/Frontend/`):

```bash
# 1. Create and activate a virtual environment
python3 -m venv .venv
source .venv/bin/activate          # macOS/Linux
# .venv\Scripts\activate           # Windows (PowerShell)

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment
cp .env.example .env               # then edit if needed
```

`.env` settings:

```ini
OLLAMA_BASE_URL=http://localhost:11434   # where Ollama is listening
OLLAMA_MODEL=llama3.2                     # any model you've pulled
API_BASE_URL=http://127.0.0.1:8000        # where the Streamlit UI finds the API
```

---

## Running the app

You need **three** processes running together. Use three terminals (all with the
virtualenv activated for terminals 2 and 3).

### 1. Start Ollama

```bash
ollama serve
```

(If Ollama is already running as a background service, you can skip this.)

### 2. Start the FastAPI backend

```bash
source .venv/bin/activate
python -m uvicorn app.main:app --reload
```

> On macOS the `python` command often doesn't exist — only `python3`. Either
> **activate the virtualenv first** (`source .venv/bin/activate`, which makes
> `python` available) or substitute `python3` in the commands below.

- API root: <http://127.0.0.1:8000>
- Interactive API docs (Swagger): <http://127.0.0.1:8000/docs>
- Health check: <http://127.0.0.1:8000/health>

### 3. Start the Streamlit UI

```bash
source .venv/bin/activate
streamlit run streamlit_app.py
```

Streamlit opens at <http://localhost:8501>. Paste (or load the sample) discharge
summary, click **Run Agent 1 (care planner)**, then **Run Agent 2 (risk assessor)**.
Use the sidebar **Check API health** button to confirm the UI can reach the backend.

---

## API reference

The Streamlit app talks to the backend over HTTP. You can also call it directly.

| Method | Endpoint | Body | Returns |
|---|---|---|---|
| `GET`  | `/` | — | Liveness message |
| `GET`  | `/health` | — | `{"status": "ok"}` |
| `POST` | `/api/carePlannerAgent` | `{"discharge_summary": "..."}` | Structured `CarePlan` |
| `POST` | `/api/riskAssessorAgent` | `{"care_plan": {...}}` | `RiskAssessment` |

All agent responses use the envelope `{ "status", "agent", "data" }`. See
[API_CONTRACT.md](docs/API_CONTRACT.md) for full payload and error details.

Example:

```bash
curl -X POST http://127.0.0.1:8000/api/carePlannerAgent \
  -H "Content-Type: application/json" \
  -d '{"discharge_summary": "Patient Rajesh Kumar, 68/M, NSTEMI, discharged today..."}'
```

**Error codes:** `400` empty input · `422` model returned invalid/unparseable JSON ·
`503` Ollama unreachable · `500` unexpected error.

---

## Project structure

```
care-coordination-agent/
├── Backend/                    # Python / FastAPI service (this folder)
│   ├── app/
│   │   ├── main.py             # FastAPI app + endpoints
│   │   ├── config.py           # Central config (LLM settings, env)
│   │   ├── models.py           # Pydantic schemas
│   │   ├── prompts.py          # System + user prompts per agent
│   │   ├── agents/             # Agent 1–4 implementations
│   │   └── llm/                # LLM boundary (Claude + Ollama clients)
│   ├── streamlit_app.py        # Demo UI (calls the API over HTTP)
│   ├── requirements.txt        # Pinned dependencies
│   ├── .env.example            # Config template
│   ├── README.md               # This file
│   └── docs/                   # Project documentation
│       ├── API_CONTRACT.md
│       ├── REQUIREMENTS.md
│       ├── REQUIREMENTS.docx
│       └── IMPLEMENTATION_PLAN.md
└── Frontend/                   # Vite + TypeScript demo UI
```

---

## Troubleshooting

- **"Cannot connect to Ollama"** — run `ollama serve` and confirm `OLLAMA_BASE_URL`.
- **"model not found"** — run `ollama pull llama3.2` (or set `OLLAMA_MODEL` to a model
  you have; `ollama list` shows installed models).
- **UI can't reach the API** — make sure uvicorn is running and the sidebar **API base
  URL** matches its host/port.
- **Slow first response** — the first model call loads weights into memory; retry once.

---

*No real patient data is used — all inputs are synthetic demo data.*
