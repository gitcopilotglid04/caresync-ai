# CareSync AI — Implementation Plan (Build + AWS Deploy → Jul 3 Demo)

**Project:** Post-Discharge Care Coordination Agent (CareSync AI)
**Event:** PwC Industry Innovation Hackathon 2026 — Round 2 (Build)
**Owner:** Sumeet Mishra · **Author:** Solution Architect
**Date:** 2026-06-18

---

## How to read this document

- **Section A — The Plan to Jul 3.** Everything we build *and deploy* for the demo: the four agents, the React dashboard, **a live AWS-hosted app**. This is the priority.
- **Section B — Post-Demo Hardening.** Auth, multi-tenant, FHIR/EHR, fine-tuning — pitch-only, built after the event.

> ⚠️ **The deadline math.** Build + deploy must be **done by Wed Jul 1**. That leaves **Jul 2–3 for testing, video recording, and the deck**. Today is Jun 18 → **10 working days**. This is an aggressive scope; it works because we use **DevOps-light AWS services the app teams can drive themselves** (§9) and **deploy on Day 1 to prove the path** (§3), with the fallback in §12 held in reserve.

> 👥 **Team shape — 3 developers, no dedicated DevOps:**
> - **BE** — 1 backend developer (agents, orchestration, DB).
> - **FS1** — full-stack developer (Agent 4 → backend App Runner deploy → React).
> - **FS2** — full-stack developer (React dashboard owner → Amplify deploy).
>
> The two full-stack devs split the deployment work using AWS's **console-driven auto-deploy** (App Runner from a container image + Amplify GitHub connection), so **no DevOps specialist is required** — we deliberately avoid the services that need one (Secrets Manager/IAM policies/ECS task definitions/hand-rolled pipelines → Section B).

> ⚠️ **Cloud-agnostic, deployed to AWS.** We build portable — **Docker containers + 12-factor env config + a provider-agnostic model boundary** — so the exact same image runs on Azure App Service / GCP Cloud Run unchanged. For the Jul 3 demo we deploy that portable artifact to **AWS**. Portability is a design property, not extra work.

---

## 1. Executive Summary

**What it is.** CareSync AI turns a hospital discharge summary into a coordinated, risk-ranked, human-supervised 30-day care plan, using a **4-agent pipeline** where each agent has one job and one schema-validated output.

**What's already built (do not rebuild):**
- **Agent 1 — Care Planner:** discharge summary → `CarePlan`. ✅
- **Agent 2 — Risk Assessor:** `CarePlan` → `RiskAssessment`. ✅
- **Platform:** FastAPI backend (`{status, agent, data}` envelope, 400/422/503/500 errors), Pydantic schema enforcement, a model-swappable LLM client (`llama3.2` via Ollama today), prompt library, per-agent logging, `API_CONTRACT.md`, and a Streamlit demo UI.

**What this plan delivers, live on AWS, by Jul 3:**
1. **Agent 3 (Communication Drafter)** and **Agent 4 (Escalation Agent + code safety floor)**.
2. **`POST /api/coordinate`** — one call runs all four agents end-to-end.
3. **A React dashboard (single-patient view)** — the demo UI judges will see (replaces Streamlit for the demo).
4. **A paid hosted model** (Claude Sonnet / OpenAI) behind the existing client boundary — no more local Ollama for the live demo.
5. **AWS deployment (DevOps-light):** containerized API on **AWS App Runner**, React on **AWS Amplify Hosting**, secrets as **App Runner env vars**, **SQLite audit trail in the container** — reachable at a public HTTPS URL. The app teams deploy from the AWS console, no DevOps specialist (see §9).

**Out of scope for Jul 3 (→ Section B):** rebuilding Agents 1 & 2 · real outbound messaging (Agent 3 drafts only) · FHIR/EHR integration · real PHI · multi-tenant auth · fine-tuning.

> 🎯 **What's realistic for 3 devs new to AWS in 10 days — read this.** The list above is the **Committed core** (will ship by Jul 1). Everything else is **Stretch** (only if the core finishes early). The biggest realism call: **the live demo uses a simple SQLite audit trail, not managed Amazon RDS PostgreSQL.** Standing up + wiring a managed DB is the riskiest task for a team with no DevOps background, and it adds nothing the judges can see. We *show* managed PostgreSQL in the architecture/pitch as the production target; we *run* SQLite for the demo. See §0 for the full tier list.

---

## 0. Scope Tiers — What We Commit To vs. Stretch

> Built for honesty about a 3-dev team (1 backend + 2 full-stack), no DevOps experience, ~9 build days before the Jul 1 freeze. **Do the Committed tier in order. Only start Stretch when Committed is done and deployed.**

| Tier | Item | Why this tier |
|---|---|---|
| ✅ **Committed** (ship by Jul 1) | Agents 3 & 4 + safety floor | The pipeline is incomplete without them. |
| ✅ **Committed** | `/api/coordinate` orchestrator | The demo centrepiece. |
| ✅ **Committed** | Paid hosted model behind `call_llm()` | Low effort, makes the live demo reliable. |
| ✅ **Committed** | React **single-patient** dashboard | The visual the judges score. |
| ✅ **Committed** | **SQLite** audit trail | Real persistence + audit story, zero infra. |
| ✅ **Committed** | Deploy to AWS: App Runner (API) + Amplify (React) | Public URL — meets the "hosted by Jul 3" goal. |
| ✅ **Committed** | 2–3 curated demo patients + cached fallback | Makes the live demo safe. |
| 🟡 **Stretch** (only if ahead) | React **multi-patient risk queue** | Strong "one coordinator scales" visual, but additive. |
| 🟡 **Stretch** | **Managed Amazon RDS (PostgreSQL)** (swap from SQLite) | Nice production-truth, but the riskiest task for a no-DevOps team. |
| 🟡 **Stretch** | CI/CD polish, custom domain, CloudWatch dashboards | Convenience, not demo-visible. |
| 🔵 **Section B** (after Jul 3) | Auth, FHIR/EHR, Secrets Manager, multi-tenant, RAG | Pitch-only roadmap. |

> ⚠️ **The trap to avoid:** sinking days into managed RDS or a custom CI/CD pipeline and arriving Jul 1 with no working dashboard. **Visible, working, deployed beats architecturally pure.** SQLite on App Runner *is* a real, persistent, demonstrable system.

---

## 2. Current State — Done vs. To Build

| Component | Status |
|---|---|
| FastAPI backend, error mapping, response envelope | ✅ Done |
| Agent 1 / Agent 2 + their schemas | ✅ Done |
| LLM client (model-swappable), JSON extraction | ✅ Done (Ollama only) |
| Streamlit UI | ✅ Done → becomes dev/fallback tool |
| **Agent 3 — Communication Drafter** | 🔲 Build |
| **Agent 4 — Escalation Agent + code safety floor** | ✅ Done |
| **`/api/coordinate` orchestrator** | 🔲 Build |
| **Provider-agnostic model client (Ollama / Anthropic / OpenAI)** | 🔲 Build |
| **Audit trail (SQLite — committed; RDS PostgreSQL = stretch)** | 🔲 Build |
| **React dashboard (single-patient committed; queue = stretch)** | 🔲 Build |
| **Docker container + CORS** | 🔲 Build |
| **AWS deploy (App Runner + Amplify)** | 🔲 Build |
| **Auto-deploy (App Runner / Amplify) + public hosted URL** | 🔲 Build |

**Baseline gaps to fix first (Phase 0):** `CarePlan` lacks a checkpoint-day validator · no retry/repair on bad LLM output · duplicate virtualenvs committed.

---

# SECTION A — The Plan to Jul 3

## 3. Master Timeline (3 developers in parallel)

The three developers run in parallel and converge for end-to-end testing on Jun 29–30. **Committed work targets Jun 26 done; Jun 29–30 is slack + stretch.**
- 🟦 **BE** (backend dev) — agents, model client, orchestration, SQLite audit trail, AWS foundation.
- 🟨 **FS1** (full-stack) — Agent 4 first, then the **App Runner backend deploy**, then helps on React.
- 🟩 **FS2** (full-stack) — owns the **React dashboard** + the **Amplify deploy**.

> ⚠️ **The Day-1 deploy spike (Jun 18) is the most important de-risking step.** FS1 pushes a throwaway "hello world" FastAPI container to App Runner (via ECR) *before* the real app exists. Prove the deploy path while failure is cheap; every later deploy is just a re-push.

| Date | Day | 🟦 BE (backend) | 🟨 FS1 (full-stack) | 🟩 FS2 (full-stack) |
|---|---|---|---|---|
| **Jun 18** | Thu | P0 stabilize + CORS · pick AWS region + ECR repo | **Deploy spike** to App Runner (via ECR) · get model API key | Set up Vite project · plan UI |
| **Jun 19** | Fri | Model client (`call_llm`) · Agent 3 start | Agent 4 + safety floor | React scaffold + API client (mock data) |
| Jun 20–21 | Sat–Sun | *(buffer)* | *(buffer)* | *(buffer)* |
| **Jun 22** | Mon | Finish Agent 3 · write `Dockerfile` | Finish Agent 4 | Build static-view components |
| **Jun 23** | Tue | `/api/coordinate` · **freeze API contract** | App Runner/ECR deploy prep (Dockerfile review) | Wire components to mocked contract |
| **Jun 24** | Wed | **SQLite** audit trail + `/api/runs/{id}` | Build image → ECR → App Runner auto-deploy | Single-patient view vs. real backend |
| **Jun 25** | Thu | Seed 2–3 demo patients · cached fallback | Set App Runner env vars (`LLM_API_KEY`, CORS) · smoke-test | Single-patient view complete |
| **Jun 26** | Fri | 🎯 **Committed backend done · live on AWS + paid model** | Verify hosted API · join React | Point React at live backend URL |
| Jun 27–28 | Sat–Sun | *(buffer)* | *(buffer)* | *(buffer)* |
| **Jun 29** | Mon | Help integration · 🟡 *stretch: RDS* | 🟡 *stretch: queue view (with FS2)* | **Deploy React → Amplify (public URL)** |
| **Jun 30** | Tue | **Full E2E test on the live AWS URL** | Spend cap · integration fixes | Polish + E2E on the public URL |
| **Jul 1** | Wed | **🎯 BUILD COMPLETE — live on AWS, feature freeze** | | |
| **Jul 2** | Thu | Regression test · build deck · rehearse | | |
| **Jul 3** | Fri | **Record video · final check · submit** | | |

> ⚠️ **Frozen checkpoints:** API contract frozen **Jun 23** (FS2 builds against a mock until then, so the UI never waits on the backend). All features frozen **Jul 1** — after that, bug fixes only.

---

## 4. Build Phases (Step by Step)

### Phase 0 — Stabilize + model-client groundwork · Jun 18
1. - [ ] Add a `@model_validator` to `CarePlan` enforcing checkpoint days `{1,7,14,30}`.
2. - [ ] Add **repair-retry** in the LLM client: on validation failure, re-prompt once with the error, then fail cleanly.
3. - [ ] Add **CORS middleware** to FastAPI (allow React dev `:5173` + the future prod origin via env).
4. - [ ] Freeze `CarePlan` + `RiskAssessment` schemas; tag the commit.
5. - [ ] Delete the duplicate virtualenv.

### Phase 1 — Agents 3 & 4 + hosted model provider · Jun 19, 22
**Agent 3 — Communication Drafter** (BE)
1. - [ ] `PatientMessage` + `CommunicationPlan` models (validator: message days `{1,7,14,30}`).
2. - [ ] Prompts (plain language ~8th-grade, grounded in the care plan, tone scales with `risk_level`).
3. - [ ] `communication_drafter_agent.py`; expose `POST /api/communicationDrafterAgent`.

**Agent 4 — Escalation Agent** (FS1) ✅ **DONE**
1. - [x] `EscalationItem` + `EscalationDecision` models.
2. - [x] Prompts (classify each concern: owner `AI` / `human_coordinator`, urgency, rationale).
3. - [x] `escalation_agent.py` **+ deterministic code safety floor**: `risk_level ∈ {High, Critical}` forces `human_review_required = True` regardless of model output. **Test written proving a Critical patient can never escape review** (`test_escalation_safety_floor.py`, 5 tests passing).
4. - [x] Expose `POST /api/escalationAgent`.

**Provider-agnostic model client** (BE) — *this is the cloud-agnostic AI move*
1. - [ ] Generalize the client to `app/llm_client.py` with `call_llm(system, user)` dispatching on `LLM_PROVIDER` env: `ollama` (local dev) · `anthropic` · `openai`.
2. - [ ] Add the hosted provider: **Claude Sonnet 4.6 (`claude-sonnet-4-6`)** or **OpenAI GPT-4o** via standard HTTPS API. Model + key from env (`LLM_MODEL`, `LLM_API_KEY`).
3. - [ ] Point Agents 1–4 at `call_llm` (one-line import change each — additive, not a rebuild). Keep low temperature + JSON extraction + repair-retry.

> ⚠️ **Decision:** call the provider's API **directly over HTTPS** (Anthropic/OpenAI), not a cloud-specific SDK. This keeps the model boundary portable — on AWS you *may* instead route `LLM_PROVIDER` through **Amazon Bedrock** (which hosts Claude) by env, with zero app rewrite.

### Phase 2 — Orchestration + DB-backed Audit Trail · Jun 23–24
1. - [ ] `POST /api/coordinate`: raw `discharge_summary` → Agent 1→2→3→4 (typed objects) → all four outputs + `meta` (model, per-agent `timings_ms`, `run_id`).
2. - [ ] On any agent failure → clear **which-agent-failed** error + partial results.
3. - [ ] **Freeze + publish the `/api/coordinate` response shape.** *(Jun 23 — React's contract.)*
4. - [ ] Audit trail persisted to **SQLite** via SQLAlchemy, `DATABASE_URL`-driven (§8) — `create_all()` on startup, no Alembic. *(🟡 stretch: swap `DATABASE_URL` to Amazon RDS PostgreSQL.)*
5. - [ ] `GET /api/runs/{run_id}` to retrieve a run.
6. - [ ] Update `API_CONTRACT.md`.

### Phase 3 — React Dashboard · Jun 24–29 *(full detail §6)*
- Jun 24 scaffold + API client; Jun 25–26 **single-patient view (committed)**; 🟡 Jun 29 multi-patient queue + audit view + polish *(stretch)*.

### Phase 4 — AWS Deploy & Integration · runs in parallel, converges Jun 29–30 *(full detail §9)*
- Backend container on AWS App Runner (SQLite) + paid model by Jun 26; React on Amplify by Jun 29; full hosted end-to-end Jun 30.

### Phase 5 — Freeze → Test / Video / Deck · Jul 1–3
- **Jul 1** feature freeze (live on AWS). **Jul 2** regression test all demo patients + build deck + rehearse. **Jul 3** record ≤3-min video, final check, **submit**.

---

## 5. Cloud-Agnostic Design Principles (how AWS stays swappable)

| Principle | How |
|---|---|
| **Containerized** | Backend + React each ship as a Docker image → run on any container host. |
| **12-factor config** | Everything via env vars (`LLM_PROVIDER`, `LLM_API_KEY`, `DATABASE_URL`, `CORS_ORIGINS`) — no hard-coded endpoints. |
| **Provider-agnostic model** | `call_llm()` switches Ollama / Anthropic / OpenAI / Amazon Bedrock by env. |
| **Standard data layer** | PostgreSQL via SQLAlchemy — portable to RDS / Cloud SQL / Azure DB / any managed Postgres. |
| **No proprietary SDK in the hot path** | Cloud services reached via standard protocols; nothing AWS-specific in the app code — config is injected as env vars. |
| **Static frontend** | React build is plain static files — host on Amplify, S3+CloudFront, Vercel, Azure Static Web Apps, etc. |

**Net:** moving off AWS later = re-point env vars + run the same image on the new host. No app rewrite. (We also keep secrets as plain env vars for the demo — Secrets Manager/IAM roles is a Section B hardening, not a portability requirement.)

---

## 6. React Dashboard — Development Plan (Step by Step)

> ⚠️ **Stack:** React 18 · Vite · TypeScript · Tailwind CSS · TanStack Query. Chosen because a dashboard is a client-rendered SPA, Vite builds instantly, and the static output deploys cleanly to **AWS Amplify Hosting** (global CloudFront CDN + managed TLS, connect-the-repo). Streamlit stays as an internal dev/fallback tool only.

**Step 1 — Scaffold & wiring (Jun 24)**
1. - [ ] `npm create vite@latest caresync-ui -- --template react-ts`; add Tailwind + TanStack Query.
2. - [ ] Typed **API client** (`src/api/`): `coordinate(summary)`, `getRun(runId)`, individual agents. Base URL via `VITE_API_BASE_URL`.
3. - [ ] Verify CORS: React `:5173` can call the backend.
4. - [ ] App shell + two routes: **Single Patient**, **Patient Queue**.

**Step 2 — Single-Patient view (Jun 25–26)**
1. - [ ] `DischargeInput` — textarea + "Run Pipeline" + "Load sample".
2. - [ ] `PipelineRunner` — calls `/api/coordinate`, per-agent progress, error toast.
3. - [ ] `CarePlanCard` (Agent 1) — diagnosis, meds, follow-ups, complexity.
4. - [ ] `RiskBadge` (Agent 2) — colour-coded Low/Med/High/Critical + readmission %.
5. - [ ] `CheckpointTimeline` — Day 1/7/14/30 with action, owner, priority rank.
6. - [ ] `MessageTimeline` (Agent 3) — four messages: channel, body, warning signs, CTA.
7. - [ ] `EscalationPanel` (Agent 4) — prominent **"NEEDS HUMAN REVIEW"** banner, urgency, items + rationale.

**Step 3 — Queue + Audit (🟡 stretch, Jun 29)**
1. - [ ] `PatientQueueTable` — run 3–5 demo patients, table **sorted by risk** (name, diagnosis, risk badge, needs-human flag).
2. - [ ] Row click → full Single-Patient view.
3. - [ ] `AuditTrailView` — per-agent timing, model, pass/fail for the current `run_id`.

**Step 4 — Polish (Jun 30)**
- [ ] Loading skeletons, error toasts, responsive layout, consistent risk colours; `npm run build` verified against the hosted backend.

---

## 7. Backend & AI/LLM Integration

**Architecture stays a FastAPI monolith** — Agents 3 & 4 slot into the existing module shape. Endpoints after this build:

| Endpoint | In | Out | Status |
|---|---|---|---|
| `POST /api/carePlannerAgent` | `discharge_summary` | `CarePlan` | ✅ |
| `POST /api/riskAssessorAgent` | `care_plan` | `RiskAssessment` | ✅ |
| `POST /api/communicationDrafterAgent` | `care_plan` + `risk_assessment` | `CommunicationPlan` | 🔲 |
| `POST /api/escalationAgent` | `care_plan` + `risk_assessment` | `EscalationDecision` | ✅ |
| `POST /api/coordinate` | `discharge_summary` | all four + `meta` | 🔲 |
| `GET /api/runs/{run_id}` | `run_id` | audit record | 🔲 |

**AI/LLM:**
- **Live demo model:** paid hosted — **Claude Sonnet 4.6 (`claude-sonnet-4-6`)** or **OpenAI GPT-4o** — behind `call_llm()`. Local dev stays on Ollama by env. A bigger hosted model also reduces the JSON-validity failures we saw on the small local model.
- **Grounding check (Agent 3):** post-validate that every medication/date referenced exists in the input `CarePlan`; flag mismatches in the audit record.
- **Cost & safety on a public URL:** ~4 calls per patient. Cap `max_tokens` per agent; **set a hard monthly spend cap on the API key**; keep the demo URL unlisted and add a simple shared-secret header (`X-Demo-Key`, stored as an App Runner env var) so random traffic can't burn budget. Log tokens per `run_id`.
- **Fallback:** connection/timeout → `503` (handled); validation fail → one repair-retry → `422`; **cached pre-validated outputs** for demo patients if the API misbehaves live.

---

## 8. Database Setup

> ⚠️ **Committed for the demo: SQLite via SQLAlchemy, inside the container.** It's a real, queryable, persistent relational store with **zero infra to stand up** — the right call for a no-DevOps team on a deadline. Use SQLAlchemy from day one with `DATABASE_URL` so the *exact same code* points at PostgreSQL later by changing one env var. **No Alembic for the demo** — call `Base.metadata.create_all()` on startup (simpler; migrations are a Section B concern).
>
> 🟡 **Stretch (only if Committed is done by Jun 26): swap to Amazon RDS for PostgreSQL.** Same ORM, change `DATABASE_URL`. Steps below. If it stalls, you lose nothing — SQLite already works.

**What we persist (synthetic data only — no real PHI):**

| Table | Key columns |
|---|---|
| `runs` | `run_id (PK)`, `created_at`, `model`, `total_latency_ms`, `status` |
| `agent_executions` | `id`, `run_id (FK)`, `agent_name`, `output_json`, `latency_ms`, `passed` |
| `care_plans` | `run_id (FK)`, `patient_name`, `diagnosis`, `complexity_score`, `plan_json` |
| `risk_assessments` | `run_id (FK)`, `risk_level`, `readmission_probability_percent`, `assessment_json` |
| `escalations` | `run_id (FK)`, `human_review_required`, `overall_urgency`, `model_overridden`, `decision_json` |

*(Raw agent output stored as a JSON string column — works identically in SQLite and PostgreSQL. Use Postgres `JSONB` only in the stretch path.)*

**Committed steps (BE):**
1. - [ ] Add SQLAlchemy models for the tables above; `DATABASE_URL=sqlite:///./caresync.db` (env-driven).
2. - [ ] `create_all()` on startup; the audit writer inserts one `runs` + N `agent_executions` rows per `/api/coordinate` call.
3. - [ ] `GET /api/runs/{run_id}` reads it back.

**🟡 Stretch steps — Amazon RDS PostgreSQL (FS1, only if ahead):**
1. - [ ] Create an RDS for PostgreSQL instance (`db.t4g.micro` — smallest/cheapest) with **public accessibility** on.
2. - [ ] Set its security group to allow Postgres (5432) from the App Runner egress / your IP.
3. - [ ] Put the connection string in **App Runner env vars** as `DATABASE_URL` (`postgresql://…`).
4. - [ ] Redeploy → `create_all()` builds the tables in Postgres. Done — no code change.

> ⚠️ **Honest note:** SQLite in the container loses data on restart/redeploy. That is **fine for a scripted demo** (you seed demo patients on startup) and the audit trail is fully visible during the run. Durable storage is the *reason* PostgreSQL is the production target — which is exactly the story for the pitch.

---

## 9. AWS Infrastructure & Deployment (live before Jul 3) — DevOps-light

> ⚠️ **Why App Runner + Amplify.** With limited DevOps expertise, these are the right AWS picks: **App Runner** runs a container straight from an **ECR** image, auto-deploys on every new image push, gives a managed-TLS `*.awsapprunner.com` URL, and takes secrets as plain **environment variables** (the same model the devs use locally). **Amplify Hosting** connects a GitHub repo, auto-builds the Vite app, and serves it on CloudFront with TLS. We deliberately avoid ECS/Fargate task definitions, ALBs, Secrets Manager, and hand-authored pipelines — DevOps work you don't have.

### Services (deliberately minimal)
| Service | Purpose | Who owns |
|---|---|---|
| **Region + tags** (`ap-south-1`, `Project=caresync`) | Keep everything in one region; tag for easy teardown. *(AWS has no "resource group" — tags do the job.)* | BE |
| **Amazon ECR** `caresync-api` | Store the backend container image App Runner pulls. | FS1 |
| **AWS App Runner** `caresync-api` | Host the FastAPI agents; auto-deploy on image push; managed TLS + default `*.awsapprunner.com` URL. | FS1 |
| **AWS Amplify Hosting** `caresync-ui` | Host the React build; connect-the-repo auto-build; CloudFront CDN + managed TLS. | FS2 |
| 🟡 **Amazon RDS for PostgreSQL** `caresync-db` | *Stretch only* — durable audit trail (§8). Committed demo uses SQLite. | FS1 |
| **(Optional) Amazon CloudWatch** | Logs / latency / error metrics. Nice-to-have, not required for Jul 3. | FS1 |

*No ECS/Fargate, no ALB, no Secrets Manager, no IAM-policy authoring beyond the App Runner ↔ ECR access role the console creates for you, no hand-rolled pipeline — all → Section B.*

### Deployment steps (the full-stack devs drive these in the AWS console)
**Backend → App Runner (FS1, `Dockerfile` from BE):**
1. - [ ] BE writes a `Dockerfile` for the FastAPI app (+ `docker-compose.yml` for local parity). *(Jun 22)*
2. - [ ] FS1 creates an **ECR repo**, then `docker build` → `docker push` to ECR (4 CLI commands; scripted once during the Jun 18 spike). *(Jun 24)*
3. - [ ] FS1 creates an **App Runner service** from that ECR image, **auto-deploy ON** (new push → redeploy). Set the port and `GET /health` as the health-check path. *(Jun 24)*
4. - [ ] FS1 adds **environment variables** in the App Runner config: `LLM_PROVIDER`, `LLM_MODEL`, `LLM_API_KEY`, `DATABASE_URL`, `CORS_ORIGINS`, `X_DEMO_KEY`. *(Jun 25)*
5. - [ ] Re-push → confirm the app is live at the `*.awsapprunner.com` URL with the SQLite audit trail + the paid model. *(Jun 26)*

**Frontend → Amplify (FS2):**
6. - [ ] In the Amplify console → **connect the GitHub repo**; it auto-detects Vite, builds, and deploys on every push to `main`. *(Jun 29)*
7. - [ ] Set `VITE_API_BASE_URL` (Amplify environment variable) to the App Runner URL; redeploy → React live at the `*.amplifyapp.com` URL. *(Jun 29)*

**Shared (FS1):**
8. - [ ] Set the API-key spend cap; (optional) map a custom domain (Amplify + App Runner both issue managed certs). *(Jun 30)*

### Health & rollback
- `GET /health` (extend to check DB + model reachability) as the App Runner health-check path.
- **Rollback = re-push the previous image tag** (or revert the commit and let Amplify rebuild). App Runner keeps the running version serving until the new deploy passes its health check.

---

## 10. Integration & End-to-End (test on AWS, Jun 30)

```
React (Amplify / CloudFront) ──HTTPS──► FastAPI (App Runner) ──► Agent 1→2→3→4 (+ safety floor)
        │                                   │                        │
        │                                   ├──► audit writer ──► SQLite  (🟡 stretch: Amazon RDS PostgreSQL)
        │                                   └──► call_llm() ──► Claude Sonnet / OpenAI (HTTPS)
        └────────── all four outputs + run_id ◄──────────────── config ◄── App Runner environment variables
```

**Integration test plan (before Jul 1 freeze):**
- [ ] `/api/coordinate` returns four valid outputs for every demo patient — **against the hosted AWS backend**.
- [ ] High/Critical patient **always** → `human_review_required = true` (safety floor).
- [ ] Agent 3 invents no medication/date absent from the care plan.
- [ ] Each agent forced to fail → clear which-agent-failed error.
- [ ] Model/DB unreachable → `503`; malformed JSON → repair-retry → `422`.
- [ ] React (public URL) renders every section; audit trail retrievable by `run_id`; run is persisted (SQLite).
- [ ] Cold start warmed; no silent hangs; spend cap + `X-Demo-Key` active.

---

## 11. Evaluation Criteria Mapping

| Criterion | Delivered by | Status |
|---|---|---|
| Problem Depth & Industry Relevance | Deck + 30-day readmission framing | ✅ Story |
| Demo Quality — UX | React dashboard | 🔲 |
| Demo Quality — Key Functionality | 4-agent pipeline + `/api/coordinate` | 🔄 |
| Demo Quality — Business Value | Audit trail (+ risk-sorted queue if the stretch lands) | 🔲 |
| Demo Quality — Practical Application | HITL safety floor + schema safety | 🔲 |
| **Commercial Potential / Scalability** | **Live AWS deployment** + a cloud-agnostic, container-based architecture (demonstrable, not just claimed) | 🔲 |
| **Go-to-Market** | Deck + cloud-agnostic, deployable architecture | 🔲 |

> Hosting before Jul 3 directly lifts the **Commercial Potential** and **Scalability** scores — we *show* a deployed, scalable product instead of describing one.

---

## 12. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| AWS + build both slip in 10 days | Medium | High | Scope is tiered (§0) — Committed core targets Jun 26, leaving slack. **Day-1 deploy spike** proves the path early; App Runner/Amplify auto-deploy needs no DevOps specialist; API contract frozen Jun 23. SQLite + default URLs keep infra trivial. |
| Limited DevOps expertise stalls deploy | **Medium** | High | Use only **console auto-deploy** services (App Runner from ECR + Amplify repo connect); both full-stack devs share the work; deploy spike Jun 18 surfaces problems with 9 days to spare. |
| ECR push / IAM access trips up a new AWS user | Medium | Medium | Nail the `docker push` → App Runner flow during the Jun 18 spike; the console creates the ECR-access role automatically. Fallback: App Runner "source code" GitHub connection (managed Python runtime, no ECR). |
| Paid model cost from a public URL | Medium | Medium | Hard spend cap on the key · `X-Demo-Key` header · unlisted URL · `max_tokens` caps. |
| Model returns invalid JSON live | Medium | High | Repair-retry + cached demo outputs; hosted model is more reliable than the local one. |
| Model under-escalates a Critical patient | Medium | **Critical** | Deterministic code safety floor + test. |
| Secret leakage | Low | High | Secrets in App Runner env vars (not in image/repo); `.env` git-ignored. Secrets Manager → Section B. |
| UI deploy waits on backend | Low | Med | Contract frozen Jun 23; FS2 mocks the response until the URL is live. |
| Scope creep (auth, FHIR, multi-tenant) | High | High | Explicitly Section B / pitch-only. |

---

## 13. Team Responsibilities (RACI)

> R = Responsible · A = Accountable · C = Consulted · I = Informed. Three developers, no separate lead — **A sits with whoever owns the work.**

| Task | 🟦 BE | 🟨 FS1 | 🟩 FS2 |
|---|---|---|---|
| Phase 0 stabilization + CORS | R/A | C | I |
| Provider-agnostic model client | R/A | C | I |
| Agent 3 (Comm. Drafter) | R/A | I | I |
| Agent 4 + safety floor | C | R/A | I |
| `/api/coordinate` + contract freeze | R/A | C | C |
| Audit trail (SQLite via SQLAlchemy) | R/A | C | I |
| AWS foundation (region/ECR) · 🟡 RDS (stretch) | C | R/A | I |
| `Dockerfile` + local compose | R/A | C | I |
| App Runner deploy (ECR) + env vars | C | R/A | I |
| React dashboard | I | C | R/A |
| Amplify deploy | I | C | R/A |
| Day-1 deploy spike | C | R/A | I |
| Demo data + cached fallback | R/A | C | C |
| End-to-end test on AWS (Jun 30) | R | R | R |
| Video + deck (Jul 2–3) | C | C | R/A |

> **Single points of failure to watch:** BE carries most backend + DB work (critical path) — keep Agent 4 with FS1 so BE isn't overloaded. FS1 owns deploy alone — the Jun 18 spike + sharing console steps with FS2 is the insurance.

---

## 14. Next Immediate Steps — Today (Jun 18)

1. - [ ] Freeze schemas + add `CarePlan` checkpoint-day validator. *(BE · 0.5d)*
2. - [ ] Add repair-retry + CORS to the backend. *(BE · 0.5d — unblocks the React work)*
3. - [ ] Agree the `/api/coordinate` response shape on paper now, so FS2 can build the UI against a mock. *(BE · 0.5d — one shared contract)*
4. - [ ] **Get the paid model API key** (Anthropic or OpenAI) + set a spend cap. *(FS1 · 0.25d — unblocks the hosted demo)*
5. - [ ] **Day-1 deploy spike:** push a "hello world" FastAPI container to ECR → App Runner. *(FS1 · 0.5d — proves the deploy path)*
6. - [ ] **Create the AWS foundation:** pick a region (`ap-south-1`), create the ECR repo, tag resources `Project=caresync`. *(FS1 · 0.25d)*
7. - [ ] Set up the Vite + React + Tailwind project skeleton. *(FS2 · 0.5d)*

---

# SECTION B — Post-Demo Hardening (pitch-only, after Jul 3)

Built in Month 1–3; mentioned in the pitch as the production path.

- **Auth & multi-tenant:** Amazon Cognito (or API Gateway + authorizer) at the edge; per-hospital tenancy; IAM-scoped roles.
- **Networking lockdown:** run on ECS/Fargate in private subnets behind an ALB; RDS in a private subnet; WAF on the ALB; secrets in AWS Secrets Manager.
- **Clinical integration:** FHIR R4 / EHR ingestion to replace pasted discharge summaries.
- **Model quality:** RAG grounding on clinical guidelines (via Amazon Bedrock Knowledge Bases or similar); fine-tuning; calibrated readmission scoring.
- **Compliance:** PHI handling review (HIPAA/India DPDP), audit retention, data residency — before any real patient data.
- **Scale:** async pipeline via a queue (Amazon SQS); multi-AZ RDS; App Runner autoscaling tuning; per-tenant cost reporting.
