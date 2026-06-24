# CareSync AI — Requirements Document (Round 2 MVP)

**Project:** Post-Discharge Care Coordination Agent (CareSync AI)
**Team:** CareSync AI
**Event:** PwC Industry Innovation Hackathon 2026 — Round 2 (Build)
**Document owner:** Sumeet Mishra
**Date:** 2026-06-15
**Status:** Draft v1.0

---

## 1. Purpose & Scope

This document defines the requirements for the **Round 2 MVP** of CareSync AI: a
4-agent AI pipeline that autonomously manages the 30-day post-discharge period.
It is the engineering contract for the build phase and the basis for the demo
shown to the Expert Panel.

**In scope (Round 2 MVP):**

1. Complete the 4-agent pipeline — Agents 1 & 2 are **done**; build **Agent 3
   (Communication Drafter)** and **Agent 4 (Escalation Agent)**.
2. An **end-to-end orchestration endpoint** that runs all four agents from a
   single discharge summary.
3. A **demo UI / dashboard** that visualises the full pipeline output.
4. A **structured audit trail** — every agent decision logged and retrievable.

**Out of scope for Round 2 (roadmap, mention in pitch only):**

- FHIR R4 / EHR integration (Month 3).
- Multi-tenant production deployment, auth, real patient PHI.
- Real outbound messaging (SMS/WhatsApp/email send). Agent 3 **drafts** only.
- Fine-tuning on institutional data.

---

## 2. Current State (Baseline — already built)

| Component | Status | Notes |
|---|---|---|
| FastAPI backend (`app/main.py`) | ✅ Done | `/`, `/health`, two agent endpoints |
| Agent 1 — `carePlannerAgent` | ✅ Done | discharge summary → `CarePlan` |
| Agent 2 — `riskAssessorAgent` | ✅ Done | `CarePlan` → `RiskAssessment` |
| Pydantic schema enforcement (`app/models.py`) | ✅ Done | `CarePlan`, `RiskAssessment` + validators |
| Ollama client (`app/ollama_client.py`) | ✅ Done | `llama3.2` default, JSON extraction, error handling |
| Prompt library (`app/prompts.py`) | ✅ Done | System + user prompts per agent |
| Streamlit demo UI (`streamlit_app.py`) | ✅ Done | Runs Agent 1 → Agent 2 over HTTP |
| Structured logging | ✅ Done | Per-agent timing + result logs |
| API contract (`API_CONTRACT.md`) | ✅ Done | Endpoints, payloads, error codes |

**Architectural principles already established (must be preserved):**

- Each agent has **one job, one input, one validated output**.
- All agent outputs are **schema-enforced JSON** (Pydantic), never free text.
- The system **never makes irreversible clinical decisions autonomously** —
  Human-in-the-Loop is enforced by Agent 4.
- Model is **swappable** (open-source Ollama for dev → Claude / GPT-4o for prod)
  via the single `call_ollama` boundary and env config.

---

## 3. System Overview

```
Discharge summary (free text)
        │
        ▼
┌──────────────────┐
│ Agent 1          │  carePlannerAgent      → CarePlan
│ Care Planner     │  (DONE)
└──────────────────┘
        │ CarePlan
        ▼
┌──────────────────┐
│ Agent 2          │  riskAssessorAgent     → RiskAssessment
│ Risk Assessor    │  (DONE)
└──────────────────┘
        │ CarePlan + RiskAssessment
        ▼
┌──────────────────┐
│ Agent 3          │  communicationDrafterAgent → CommunicationPlan
│ Comm. Drafter    │  (BUILD)
└──────────────────┘
        │ CarePlan + RiskAssessment + CommunicationPlan
        ▼
┌──────────────────┐
│ Agent 4          │  escalationAgent       → EscalationDecision
│ Escalation Agent │  (BUILD)
└──────────────────┘
        │
        ▼
  Coordinated 30-day plan + audit trail
```

---

## 4. Functional Requirements

IDs: `FR-A3-*` (Agent 3), `FR-A4-*` (Agent 4), `FR-ORCH-*` (orchestration),
`FR-UI-*` (dashboard), `FR-AUD-*` (audit trail). Priority: **MUST** / **SHOULD**
/ **COULD**.

### 4.1 Agent 3 — Communication Drafter (`communicationDrafterAgent`)

> Writes personalised patient-facing messages for Day 1, 7, 14, and 30, informed
> by the care plan and the risk assessment.

- **FR-A3-01 (MUST)** — Input is the structured `CarePlan` (Agent 1) **and** the
  `RiskAssessment` (Agent 2). It does not re-read the raw discharge summary.
- **FR-A3-02 (MUST)** — Output is a schema-validated `CommunicationPlan` with
  exactly four messages, one each for days **1, 7, 14, 30** (mirrors the existing
  `checkpoint_days_are_complete` validator pattern).
- **FR-A3-03 (MUST)** — Each message is **patient-friendly**: plain language, no
  clinical jargon, readable at roughly an 8th-grade level.
- **FR-A3-04 (MUST)** — Message content must be grounded in the care plan
  (medications, appointments, checkpoint actions). It must **not invent**
  medications, dates, or instructions not present in the input.
- **FR-A3-05 (SHOULD)** — Tone/urgency should scale with `risk_level` (a
  Critical patient gets firmer adherence and warning-sign language than a Low one).
- **FR-A3-06 (SHOULD)** — Each message includes **warning signs** ("call your
  doctor if…") appropriate to the diagnosis when present in the plan.
- **FR-A3-07 (MUST)** — Output is **draft text only**. No message is sent
  anywhere in Round 2 (no SMS/WhatsApp/email integration).
- **FR-A3-08 (MUST)** — Exposed as `POST /api/communicationDrafterAgent`,
  following the same `{status, agent, data}` response envelope and error mapping
  (400/422/503/500) as the existing endpoints.

**Proposed schema (`app/models.py`):**

```python
class PatientMessage(BaseModel):
    day: int                       # 1, 7, 14, or 30
    channel: Literal["SMS", "WhatsApp", "Email", "Phone call"]
    subject: str
    body: str                      # patient-friendly message text
    warning_signs: list[str]       # "seek help if..." cues; [] if none
    call_to_action: str            # the single key action for the patient

class CommunicationPlan(BaseModel):
    patient_name: str
    messages: list[PatientMessage] # exactly days {1, 7, 14, 30}
    # @model_validator: message days must equal {1, 7, 14, 30}
```

### 4.2 Agent 4 — Escalation Agent (`escalationAgent`)

> Decides what the AI can handle autonomously versus what requires immediate
> human coordinator action. This is the Human-in-the-Loop safety gate.

- **FR-A4-01 (MUST)** — Input is `CarePlan` + `RiskAssessment` (+ optionally the
  `CommunicationPlan`). Output is a schema-validated `EscalationDecision`.
- **FR-A4-02 (MUST)** — Output classifies each concern with an explicit
  **owner**: `AI` (handled autonomously) or `human_coordinator` (needs a person).
- **FR-A4-03 (MUST)** — A top-level boolean `human_review_required` and an
  `urgency` tier (`Routine` / `Within 24h` / `Immediate`) must be present.
- **FR-A4-04 (MUST)** — The agent must **escalate to a human** whenever
  `risk_level` is `High` or `Critical`, or when the plan contains
  safety-critical gaps (e.g. no support at home + complex medication regimen).
  This rule is enforced in code as a **safety floor**, not left to the model
  alone (see FR-A4-08).
- **FR-A4-05 (MUST)** — The agent must **never** authorise an irreversible
  clinical action (medication change, diagnosis, discharge reversal). It may
  only recommend, draft, or flag.
- **FR-A4-06 (MUST)** — Every escalation item carries a human-readable
  `rationale` so the decision is auditable.
- **FR-A4-07 (MUST)** — Exposed as `POST /api/escalationAgent` with the same
  response envelope and error mapping as existing endpoints.
- **FR-A4-08 (SHOULD)** — A deterministic post-processing guard overrides the
  model output to guarantee FR-A4-04 (defence in depth: if the model fails to
  escalate a Critical patient, code forces `human_review_required = true`).

**Proposed schema (`app/models.py`):**

```python
class EscalationItem(BaseModel):
    concern: str
    owner: Literal["AI", "human_coordinator"]
    urgency: Literal["Routine", "Within 24h", "Immediate"]
    rationale: str

class EscalationDecision(BaseModel):
    human_review_required: bool
    overall_urgency: Literal["Routine", "Within 24h", "Immediate"]
    autonomous_actions: list[str]      # what the AI will handle
    escalations: list[EscalationItem]  # items needing a human
    summary: str                       # one-paragraph coordinator briefing
```

### 4.3 End-to-End Orchestration

- **FR-ORCH-01 (MUST)** — A single endpoint `POST /api/coordinate` accepts a raw
  `discharge_summary` and runs Agent 1 → 2 → 3 → 4 in sequence, returning all
  four structured outputs in one response.
- **FR-ORCH-02 (MUST)** — If any agent fails validation or the model is
  unreachable, the pipeline returns a clear error identifying **which agent
  failed** and the partial results produced so far. It must not return a
  half-built object as if it were complete.
- **FR-ORCH-03 (SHOULD)** — The orchestration response includes per-agent timing
  and the model used, for the audit trail and demo.
- **FR-ORCH-04 (COULD)** — Agents 1–4 are independently callable (already true
  for 1 & 2); orchestration is a convenience layer, not a replacement.

**Proposed response shape:**

```json
{
  "status": "success",
  "pipeline": "coordinate",
  "data": {
    "care_plan": { ... },
    "risk_assessment": { ... },
    "communication_plan": { ... },
    "escalation_decision": { ... }
  },
  "meta": { "model": "llama3.2", "timings_ms": { "agent1": 0, ... }, "run_id": "..." }
}
```

### 4.4 Dashboard / Demo UI

- **FR-UI-01 (MUST)** — Extend the existing Streamlit app to run and display the
  **full 4-agent pipeline** for a single patient (currently Agents 1 & 2 only).
- **FR-UI-02 (MUST)** — Show, per patient: care plan summary, **risk badge**
  (colour-coded Low/Medium/High/Critical), the four drafted messages, and the
  escalation decision with a clear **"needs human" flag**.
- **FR-UI-03 (SHOULD)** — A **multi-patient view**: load several sample discharge
  summaries and show a queue/table sorted by risk so the coordinator sees the
  highest-risk patients first (demonstrates the "one coordinator scales" claim).
- **FR-UI-04 (SHOULD)** — A "load sample" set of 3–5 varied discharge summaries
  (e.g. low-risk day surgery, high-risk cardiac, elderly living alone) to make
  the demo reproducible and show range.
- **FR-UI-05 (COULD)** — Export a single patient's full coordinated plan as
  JSON / printable summary.

### 4.5 Audit Trail

- **FR-AUD-01 (MUST)** — Every agent run is persisted as a structured record:
  `run_id`, timestamp, agent name, model, input hash/reference, output, latency,
  pass/fail. (Extends the logging already in each agent module.)
- **FR-AUD-02 (MUST)** — Records are retrievable for a given `run_id`
  (file-based JSONL or SQLite is sufficient for the MVP — no external DB needed).
- **FR-AUD-03 (SHOULD)** — The dashboard can display the audit trail for the
  current run to demonstrate traceability to the Expert Panel.
- **FR-AUD-04 (MUST)** — No real patient PHI is stored; only synthetic demo data
  is used throughout Round 2.

---

## 5. Non-Functional Requirements

- **NFR-01 Schema safety (MUST)** — 100% of agent outputs surfaced to the user
  pass Pydantic validation. Invalid model output is rejected with a 422, never
  shown as a result.
- **NFR-02 Model agnosticism (MUST)** — Swapping `OLLAMA_MODEL` (or pointing the
  client at an enterprise model) requires no code change outside the client/env.
- **NFR-03 Determinism (SHOULD)** — Generation uses low temperature (`0.1`,
  already set) for consistent structured output across demo runs.
- **NFR-04 Latency (SHOULD)** — Full 4-agent pipeline completes in a
  demo-acceptable time on the dev machine; long calls show a spinner, never a
  silent hang. (No hard SLA in Round 2.)
- **NFR-05 Resilience (MUST)** — Ollama down → 503 with actionable message;
  malformed JSON → 422; unexpected error → 500. Already implemented for Agents
  1 & 2; new agents follow the identical pattern.
- **NFR-06 Reproducibility (MUST)** — `requirements.txt` pinned; app runs with
  documented steps (Ollama → uvicorn → Streamlit). No proprietary infra.
- **NFR-07 Auditability (MUST)** — Every decision is logged with rationale; the
  pipeline can explain *why* a patient was escalated.
- **NFR-08 Safety (MUST)** — No autonomous irreversible clinical action; Human-
  in-the-Loop gate (Agent 4 + code guard) cannot be bypassed by model output.

---

## 6. Data Contracts Summary

| Agent | Endpoint | Input | Output model |
|---|---|---|---|
| 1 Care Planner | `POST /api/carePlannerAgent` | `discharge_summary: str` | `CarePlan` ✅ |
| 2 Risk Assessor | `POST /api/riskAssessorAgent` | `care_plan: CarePlan` | `RiskAssessment` ✅ |
| 3 Comm. Drafter | `POST /api/communicationDrafterAgent` | `care_plan` + `risk_assessment` | `CommunicationPlan` 🔨 |
| 4 Escalation | `POST /api/escalationAgent` | `care_plan` + `risk_assessment` | `EscalationDecision` 🔨 |
| Pipeline | `POST /api/coordinate` | `discharge_summary: str` | all four | 🔨 |

`API_CONTRACT.md` must be extended with the new endpoints (request/response/
curl/error examples) to match the existing format.

---

## 7. Milestones (mapped to the official timeline)

| Date | Event | Target state |
|---|---|---|
| **Jun 15 – Jul 3** | Round 2 Build | Agents 3 & 4 built; `/api/coordinate`; dashboard shows full pipeline; audit trail; `API_CONTRACT.md` updated |
| **mid-July** | Progress showcase | Live end-to-end demo on synthetic patients; multi-patient risk-sorted view |
| **By Jul 17** | Round 3 — expert demos | Polished demo script, 3–5 varied patient scenarios, safety/HITL story rehearsed |
| **Jul 20** | Dry run | Full run-through on demo hardware; failure modes handled gracefully |
| **Jul 22** | Industry Innovation Day (Hilton, Manyata) | Final presentation to Expert Panel |

**Suggested build order within Round 2:**

1. Agent 3 model + prompt + agent module + endpoint (mirrors Agent 2 structure).
2. Agent 4 model + prompt + agent module + endpoint + safety guard.
3. `/api/coordinate` orchestration + per-agent timing/run_id.
4. Audit-trail persistence (JSONL/SQLite).
5. Dashboard: single-patient full pipeline → multi-patient risk queue.
6. Update `API_CONTRACT.md`; assemble demo scenario set; rehearse.

---

## 8. Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Small local model returns invalid/inconsistent JSON | Demo failure | Pydantic validation + JSON extraction (done); low temperature; retry/repair option; pre-validated demo scenarios |
| Model fails to escalate a high-risk patient | Safety/trust | Deterministic code guard (FR-A4-08) forces escalation by risk tier |
| Latency on first model call | Awkward demo pause | Warm-up call before demo; spinners; cache demo outputs as fallback |
| Scope creep (FHIR, real messaging) | Miss build deadline | Explicitly out of scope; roadmap-only in pitch |
| Single contributor bottleneck on agents | Slipped milestone | Agents 3 & 4 are independent — can be built in parallel by two members |

---

## 9. Acceptance Criteria (Round 2 "done")

- [ ] `POST /api/communicationDrafterAgent` returns a valid `CommunicationPlan`
      with messages for days 1, 7, 14, 30 on the standard demo input.
- [ ] `POST /api/escalationAgent` returns a valid `EscalationDecision`;
      High/Critical patients always yield `human_review_required = true`.
- [ ] `POST /api/coordinate` runs all four agents and returns all outputs, or a
      clear which-agent-failed error.
- [ ] Dashboard runs the full pipeline for a patient and shows risk badge,
      drafted messages, and escalation flag; multi-patient view sorts by risk.
- [ ] Audit trail records every agent run with rationale and is retrievable.
- [ ] `API_CONTRACT.md` documents all new endpoints.
- [ ] Demo runs end-to-end on 3–5 varied synthetic patients without manual fixes.
