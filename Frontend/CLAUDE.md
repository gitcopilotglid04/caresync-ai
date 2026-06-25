# CLAUDE.md — CareSync UI

## What this is
React front end for CareSync AI, a post-discharge care-coordination copilot. It turns a discharge summary into a risk-ranked, human-supervised 30-day care plan, then keeps watching: patient check-ins re-assess risk and escalate to a human coordinator. UI only; the FastAPI backend (4 agents) is separate.
Demo thesis: the AI never decides, it surfaces. A human always has the final call, and the system can show why.

## Reference is the source of truth
/reference contains three hand-designed HTML files. Open and read all three before writing any component. They define exact layout, spacing, color, type, and interactions. Match them; do not invent a new style. When ambiguous, the HTML wins.
- caresync-patient-detail.html (composed patient dashboard, main screen)
- caresync-coordinator-queue.html (risk-sorted patient queue, home)
- caresync-intake-modal.html (discharge input + live 4-agent run sequence)

## Stack (locked)
React 18+, Vite, TypeScript strict, Tailwind CSS, TanStack Query, React Router, lucide-react. No component library, no CSS-in-JS, no extra state manager.

## Design system, ONE token source
The reference files repeat an identical :root token block. Extract it once into src/theme/tokens.css and map those vars into the Tailwind theme. Every color, radius, shadow comes from tokens. Never hardcode a hex in a component.

## Build order (stop for review after step 2)
1. Scaffold + Tailwind + wire tokens.css. Router: / queue, /patient/:id detail, intake modal as overlay.
2. Primitives first in components/ui/: RiskBadge (low/medium/high), UrgencyPill (routine/soon/urgent/immediate), OwnerChip (ai/human/nurse/doctor/patient), QueueRankChip, plus Badge, Chip, Panel, Button. STOP and show all variants before building pages.
3. API layer: api/types.ts, api/mocks.ts (Rajesh + the 5 queue patients from the HTML), api/client.ts (mock vs real via VITE_USE_MOCKS).
4. PatientDetailPage: compose components/panels/ to match caresync-patient-detail.html. Sticky header; each panel takes its slice of the run as a prop.
5. QueuePage: match caresync-coordinator-queue.html. Reuse primitives in rows. Metric strip + filter chips (All / Needs review / High risk). Rows link to /patient/:id.
6. IntakeModal: match caresync-intake-modal.html. Form + 4-agent run sequence, then View patient.
7. States: loading skeletons, error toast (422/503/500), empty queue. States of the 3 screens, not new screens.
8. Wire real API behind VITE_USE_MOCKS=false. Responsive + a11y pass.

## Interactions to API
- Intake Run pipeline calls POST /api/coordinate with { discharge_summary, patient_context } and returns { run_id, care_plan, risk_assessment, communication_plan, escalation_decision, safety, audit }.
- Check-in simulator calls POST /api/checkin with { run_id, day, patient_message, structured_inputs } and returns { signals_detected, red_flags, previous_priority, updated_priority, human_review_required, created_tasks, patient_reply_draft }. On response, lift the new priority to page state so the patient header urgency pill, queue rank, and review banner all re-render. Do not fake it per-component.
- Queue filter is client-side over GET /api/queue. Detail load is GET /api/runs/:run_id.
Contract not frozen: build against api/mocks.ts shapes, keep client.ts interface stable.

## Quality floor (live demo)
Match the reference visually. Status color encodes clinical meaning only (red high/immediate, amber urgent, green low/routine/AI); teal is chrome only. Visible focus; aria-live on the check-in result; responsive to mobile; respect prefers-reduced-motion. Round numbers; tabular numerals on clinical figures.

## Out of scope (do NOT build)
No auth, no RBAC, no separate doctor or patient portal, no FHIR, no real messaging, no settings, no fourth screen. Role differences are shown via OwnerChip tags and data, not extra pages. The patient view is simulated inside the check-in panel. If a task pushes toward any of these, stop and flag it as scope creep.

## Definition of done
The three screens match their reference HTML, are navigable (queue to detail to back; intake to view patient), all interactions work on mock data, the real API swaps in via one env flag, and the UI is responsive and keyboard-accessible.
