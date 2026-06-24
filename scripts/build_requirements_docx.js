/*
 * Generates REQUIREMENTS.docx from the Round 2 MVP requirements.
 * Run:  NODE_PATH=$(npm root -g) node scripts/build_requirements_docx.js
 */
const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, LevelFormat, HeadingLevel, BorderStyle, WidthType,
  ShadingType, TableOfContents, PageBreak, PageNumber, Header, Footer,
  TabStopType, TabStopPosition,
} = require("docx");

// ---- PwC-ish palette ----
const ORANGE = "D04A02";
const DARK = "2D2D2D";
const GREY = "6E6E6E";
const LIGHT = "F4E9E2";
const HEADBG = "2D2D2D";
const CODEBG = "F2F2F2";

const CONTENT_W = 9360; // US Letter, 1" margins

// ---- helpers ----
const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const cellBorders = { top: border, bottom: border, left: border, right: border };
const cellMargins = { top: 80, bottom: 80, left: 120, right: 120 };

function cell(text, { widthDxa, fill, bold = false, color, align } = {}) {
  const runs = (Array.isArray(text) ? text : [text]).map(
    (t) => new TextRun({ text: String(t), bold, color: color || DARK, size: 20 })
  );
  return new TableCell({
    borders: cellBorders,
    margins: cellMargins,
    width: { size: widthDxa, type: WidthType.DXA },
    shading: fill ? { fill, type: ShadingType.CLEAR } : undefined,
    children: [new Paragraph({ alignment: align, children: runs })],
  });
}

function table(headers, rows, widths) {
  const headRow = new TableRow({
    tableHeader: true,
    children: headers.map((h, i) =>
      cell(h, { widthDxa: widths[i], fill: HEADBG, bold: true, color: "FFFFFF" })
    ),
  });
  const bodyRows = rows.map(
    (r) =>
      new TableRow({
        children: r.map((c, i) => {
          const isObj = c && typeof c === "object" && "text" in c;
          return cell(isObj ? c.text : c, {
            widthDxa: widths[i],
            fill: isObj ? c.fill : undefined,
            bold: isObj ? c.bold : false,
            align: isObj ? c.align : undefined,
          });
        }),
      })
  );
  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: widths,
    rows: [headRow, ...bodyRows],
  });
}

function h1(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(text)] });
}
function h2(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(text)] });
}
function p(text, opts = {}) {
  const runs = Array.isArray(text)
    ? text
    : [new TextRun({ text, size: 22, color: opts.color || DARK, italics: opts.italics })];
  return new Paragraph({ spacing: { after: 120 }, children: runs, ...opts.para });
}
function bullet(text, level = 0) {
  const runs = Array.isArray(text) ? text : [new TextRun({ text, size: 22 })];
  return new Paragraph({ numbering: { reference: "bullets", level }, spacing: { after: 40 }, children: runs });
}
function numbered(text) {
  const runs = Array.isArray(text) ? text : [new TextRun({ text, size: 22 })];
  return new Paragraph({ numbering: { reference: "steps", level: 0 }, spacing: { after: 40 }, children: runs });
}
function reqBullet(id, text) {
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    spacing: { after: 60 },
    children: [
      new TextRun({ text: id + " — ", bold: true, color: ORANGE, size: 22 }),
      new TextRun({ text, size: 22 }),
    ],
  });
}
function code(lines) {
  // each line a separate paragraph; shaded monospace block
  return lines.map(
    (ln, i) =>
      new Paragraph({
        shading: { fill: CODEBG, type: ShadingType.CLEAR },
        spacing: { before: i === 0 ? 60 : 0, after: i === lines.length - 1 ? 120 : 0 },
        children: [new TextRun({ text: ln || " ", font: "Consolas", size: 18, color: "333333" })],
      })
  );
}
function divider() {
  return new Paragraph({
    spacing: { before: 80, after: 80 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: ORANGE, space: 1 } },
    children: [new TextRun("")],
  });
}

// ---- content ----
const children = [];

// Title page
children.push(
  new Paragraph({ spacing: { before: 2400 }, children: [new TextRun({ text: "pwc", bold: true, size: 48, color: ORANGE })] }),
  new Paragraph({
    spacing: { before: 400, after: 0 },
    children: [new TextRun({ text: "CareSync AI", bold: true, size: 64, color: DARK })],
  }),
  new Paragraph({
    spacing: { after: 200 },
    children: [new TextRun({ text: "Requirements Document — Round 2 MVP", size: 36, color: GREY })],
  }),
  new Paragraph({
    shading: { fill: LIGHT, type: ShadingType.CLEAR },
    spacing: { before: 200, after: 200 },
    children: [new TextRun({ text: "  Post-Discharge Care Coordination Agent  ", size: 24, color: DARK, bold: true })],
  }),
);
const metaRows = [
  ["Team", "CareSync AI"],
  ["Event", "PwC Industry Innovation Hackathon 2026 — Round 2 (Build)"],
  ["Document owner", "Sumeet Mishra"],
  ["Date", "15 June 2026"],
  ["Status", "Draft v1.0"],
];
children.push(
  new Paragraph({ spacing: { before: 600 }, children: [] }),
  table(
    ["Field", "Value"],
    metaRows,
    [2600, 6760]
  ),
  new Paragraph({ children: [new PageBreak()] }),
);

// TOC
children.push(
  h1("Table of Contents"),
  new TableOfContents("Table of Contents", { hyperlink: true, headingStyleRange: "1-2" }),
  new Paragraph({ children: [new PageBreak()] }),
);

// 1. Purpose & Scope
children.push(h1("1. Purpose & Scope"));
children.push(
  p("This document defines the requirements for the Round 2 MVP of CareSync AI: a 4-agent AI pipeline that autonomously manages the 30-day post-discharge period. It is the engineering contract for the build phase and the basis for the demo shown to the Expert Panel.")
);
children.push(p([new TextRun({ text: "In scope (Round 2 MVP):", bold: true, size: 22 })]));
children.push(
  numbered("Complete the 4-agent pipeline — Agents 1 & 2 are done; build Agent 3 (Communication Drafter) and Agent 4 (Escalation Agent)."),
  numbered("An end-to-end orchestration endpoint that runs all four agents from a single discharge summary."),
  numbered("A demo UI / dashboard that visualises the full pipeline output."),
  numbered("A structured audit trail — every agent decision logged and retrievable."),
);
children.push(p([new TextRun({ text: "Out of scope for Round 2 (roadmap, mention in pitch only):", bold: true, size: 22 })]));
children.push(
  bullet("FHIR R4 / EHR integration (Month 3)."),
  bullet("Multi-tenant production deployment, auth, real patient PHI."),
  bullet("Real outbound messaging (SMS/WhatsApp/email send). Agent 3 drafts only."),
  bullet("Fine-tuning on institutional data."),
);

// 2. Current State
children.push(h1("2. Current State (Baseline — already built)"));
children.push(
  table(
    ["Component", "Status", "Notes"],
    [
      ["FastAPI backend (app/main.py)", { text: "Done", fill: "E2EFDA", bold: true, align: AlignmentType.CENTER }, "Root, health, two agent endpoints"],
      ["Agent 1 — carePlannerAgent", { text: "Done", fill: "E2EFDA", bold: true, align: AlignmentType.CENTER }, "discharge summary → CarePlan"],
      ["Agent 2 — riskAssessorAgent", { text: "Done", fill: "E2EFDA", bold: true, align: AlignmentType.CENTER }, "CarePlan → RiskAssessment"],
      ["Pydantic schema enforcement", { text: "Done", fill: "E2EFDA", bold: true, align: AlignmentType.CENTER }, "CarePlan, RiskAssessment + validators"],
      ["Ollama client", { text: "Done", fill: "E2EFDA", bold: true, align: AlignmentType.CENTER }, "llama3.2 default, JSON extraction, error handling"],
      ["Prompt library (app/prompts.py)", { text: "Done", fill: "E2EFDA", bold: true, align: AlignmentType.CENTER }, "System + user prompts per agent"],
      ["Streamlit demo UI", { text: "Done", fill: "E2EFDA", bold: true, align: AlignmentType.CENTER }, "Runs Agent 1 → Agent 2 over HTTP"],
      ["Structured logging", { text: "Done", fill: "E2EFDA", bold: true, align: AlignmentType.CENTER }, "Per-agent timing + result logs"],
      ["API contract (API_CONTRACT.md)", { text: "Done", fill: "E2EFDA", bold: true, align: AlignmentType.CENTER }, "Endpoints, payloads, error codes"],
    ],
    [4000, 1360, 4000]
  )
);
children.push(p([new TextRun({ text: "Architectural principles already established (must be preserved):", bold: true, size: 22 })], { para: { spacing: { before: 160, after: 120 } } }));
children.push(
  bullet("Each agent has one job, one input, one validated output."),
  bullet("All agent outputs are schema-enforced JSON (Pydantic), never free text."),
  bullet("The system never makes irreversible clinical decisions autonomously — Human-in-the-Loop is enforced by Agent 4."),
  bullet("Model is swappable (open-source Ollama for dev → Claude / GPT-4o for prod) via the single call_ollama boundary and env config."),
);

// 3. System Overview
children.push(h1("3. System Overview"));
children.push(p("The pipeline runs four specialist agents in sequence. Each consumes the validated structured output of the previous step:"));
children.push(...code([
  "Discharge summary (free text)",
  "        |",
  "        v",
  "  [Agent 1] Care Planner        -> CarePlan            (DONE)",
  "        | CarePlan",
  "        v",
  "  [Agent 2] Risk Assessor       -> RiskAssessment      (DONE)",
  "        | CarePlan + RiskAssessment",
  "        v",
  "  [Agent 3] Comm. Drafter       -> CommunicationPlan   (BUILD)",
  "        | + CommunicationPlan",
  "        v",
  "  [Agent 4] Escalation Agent    -> EscalationDecision  (BUILD)",
  "        |",
  "        v",
  "  Coordinated 30-day plan + audit trail",
]));

// 4. Functional Requirements
children.push(h1("4. Functional Requirements"));
children.push(p([
  new TextRun({ text: "Priority levels: ", size: 22 }),
  new TextRun({ text: "MUST", bold: true, size: 22 }),
  new TextRun({ text: " / ", size: 22 }),
  new TextRun({ text: "SHOULD", bold: true, size: 22 }),
  new TextRun({ text: " / ", size: 22 }),
  new TextRun({ text: "COULD", bold: true, size: 22 }),
  new TextRun({ text: ". IDs group by agent (A3, A4), orchestration (ORCH), UI, and audit (AUD).", size: 22 }),
]));

children.push(h2("4.1 Agent 3 — Communication Drafter (communicationDrafterAgent)"));
children.push(p([new TextRun({ text: "Writes personalised patient-facing messages for Day 1, 7, 14, and 30, informed by the care plan and the risk assessment.", italics: true, size: 22, color: GREY })]));
children.push(
  reqBullet("FR-A3-01 (MUST)", "Input is the structured CarePlan (Agent 1) and the RiskAssessment (Agent 2). It does not re-read the raw discharge summary."),
  reqBullet("FR-A3-02 (MUST)", "Output is a schema-validated CommunicationPlan with exactly four messages, one each for days 1, 7, 14, 30 (mirrors the existing checkpoint-completeness validator)."),
  reqBullet("FR-A3-03 (MUST)", "Each message is patient-friendly: plain language, no clinical jargon, readable at roughly an 8th-grade level."),
  reqBullet("FR-A3-04 (MUST)", "Message content must be grounded in the care plan (medications, appointments, checkpoint actions). It must not invent medications, dates, or instructions not present in the input."),
  reqBullet("FR-A3-05 (SHOULD)", "Tone/urgency should scale with risk_level (a Critical patient gets firmer adherence and warning-sign language than a Low one)."),
  reqBullet("FR-A3-06 (SHOULD)", "Each message includes warning signs (“call your doctor if…”) appropriate to the diagnosis when present in the plan."),
  reqBullet("FR-A3-07 (MUST)", "Output is draft text only. No message is sent anywhere in Round 2 (no SMS/WhatsApp/email integration)."),
  reqBullet("FR-A3-08 (MUST)", "Exposed as POST /api/communicationDrafterAgent, following the same {status, agent, data} response envelope and error mapping (400/422/503/500) as existing endpoints."),
);
children.push(p([new TextRun({ text: "Proposed schema (app/models.py):", bold: true, size: 22 })], { para: { spacing: { before: 120, after: 60 } } }));
children.push(...code([
  "class PatientMessage(BaseModel):",
  "    day: int                       # 1, 7, 14, or 30",
  "    channel: Literal[\"SMS\", \"WhatsApp\", \"Email\", \"Phone call\"]",
  "    subject: str",
  "    body: str                      # patient-friendly message text",
  "    warning_signs: list[str]       # \"seek help if...\" cues; [] if none",
  "    call_to_action: str            # the single key action for the patient",
  "",
  "class CommunicationPlan(BaseModel):",
  "    patient_name: str",
  "    messages: list[PatientMessage] # exactly days {1, 7, 14, 30}",
  "    # @model_validator: message days must equal {1, 7, 14, 30}",
]));

children.push(h2("4.2 Agent 4 — Escalation Agent (escalationAgent)"));
children.push(p([new TextRun({ text: "Decides what the AI can handle autonomously versus what requires immediate human coordinator action. This is the Human-in-the-Loop safety gate.", italics: true, size: 22, color: GREY })]));
children.push(
  reqBullet("FR-A4-01 (MUST)", "Input is CarePlan + RiskAssessment (+ optionally the CommunicationPlan). Output is a schema-validated EscalationDecision."),
  reqBullet("FR-A4-02 (MUST)", "Output classifies each concern with an explicit owner: AI (handled autonomously) or human_coordinator (needs a person)."),
  reqBullet("FR-A4-03 (MUST)", "A top-level boolean human_review_required and an urgency tier (Routine / Within 24h / Immediate) must be present."),
  reqBullet("FR-A4-04 (MUST)", "The agent must escalate to a human whenever risk_level is High or Critical, or when the plan contains safety-critical gaps. Enforced in code as a safety floor, not left to the model alone (see FR-A4-08)."),
  reqBullet("FR-A4-05 (MUST)", "The agent must never authorise an irreversible clinical action (medication change, diagnosis, discharge reversal). It may only recommend, draft, or flag."),
  reqBullet("FR-A4-06 (MUST)", "Every escalation item carries a human-readable rationale so the decision is auditable."),
  reqBullet("FR-A4-07 (MUST)", "Exposed as POST /api/escalationAgent with the same response envelope and error mapping as existing endpoints."),
  reqBullet("FR-A4-08 (SHOULD)", "A deterministic post-processing guard overrides model output to guarantee FR-A4-04 (defence in depth: a Critical patient is always escalated even if the model fails to)."),
);
children.push(p([new TextRun({ text: "Proposed schema (app/models.py):", bold: true, size: 22 })], { para: { spacing: { before: 120, after: 60 } } }));
children.push(...code([
  "class EscalationItem(BaseModel):",
  "    concern: str",
  "    owner: Literal[\"AI\", \"human_coordinator\"]",
  "    urgency: Literal[\"Routine\", \"Within 24h\", \"Immediate\"]",
  "    rationale: str",
  "",
  "class EscalationDecision(BaseModel):",
  "    human_review_required: bool",
  "    overall_urgency: Literal[\"Routine\", \"Within 24h\", \"Immediate\"]",
  "    autonomous_actions: list[str]      # what the AI will handle",
  "    escalations: list[EscalationItem]  # items needing a human",
  "    summary: str                       # one-paragraph coordinator briefing",
]));

children.push(h2("4.3 End-to-End Orchestration"));
children.push(
  reqBullet("FR-ORCH-01 (MUST)", "A single endpoint POST /api/coordinate accepts a raw discharge_summary and runs Agent 1 → 2 → 3 → 4 in sequence, returning all four structured outputs in one response."),
  reqBullet("FR-ORCH-02 (MUST)", "If any agent fails validation or the model is unreachable, the pipeline returns a clear error identifying which agent failed and the partial results so far. It must not return a half-built object as if complete."),
  reqBullet("FR-ORCH-03 (SHOULD)", "The orchestration response includes per-agent timing and the model used, for the audit trail and demo."),
  reqBullet("FR-ORCH-04 (COULD)", "Agents 1–4 remain independently callable; orchestration is a convenience layer, not a replacement."),
);

children.push(h2("4.4 Dashboard / Demo UI"));
children.push(
  reqBullet("FR-UI-01 (MUST)", "Extend the existing Streamlit app to run and display the full 4-agent pipeline for a single patient (currently Agents 1 & 2 only)."),
  reqBullet("FR-UI-02 (MUST)", "Show, per patient: care plan summary, a colour-coded risk badge (Low/Medium/High/Critical), the four drafted messages, and the escalation decision with a clear “needs human” flag."),
  reqBullet("FR-UI-03 (SHOULD)", "A multi-patient view: load several sample summaries and show a queue/table sorted by risk so the highest-risk patients surface first."),
  reqBullet("FR-UI-04 (SHOULD)", "A “load sample” set of 3–5 varied discharge summaries (low-risk day surgery, high-risk cardiac, elderly living alone) for a reproducible demo."),
  reqBullet("FR-UI-05 (COULD)", "Export a single patient's full coordinated plan as JSON / printable summary."),
);

children.push(h2("4.5 Audit Trail"));
children.push(
  reqBullet("FR-AUD-01 (MUST)", "Every agent run is persisted as a structured record: run_id, timestamp, agent name, model, input reference, output, latency, pass/fail."),
  reqBullet("FR-AUD-02 (MUST)", "Records are retrievable for a given run_id (file-based JSONL or SQLite is sufficient — no external DB needed)."),
  reqBullet("FR-AUD-03 (SHOULD)", "The dashboard can display the audit trail for the current run to demonstrate traceability to the Expert Panel."),
  reqBullet("FR-AUD-04 (MUST)", "No real patient PHI is stored; only synthetic demo data is used throughout Round 2."),
);

// 5. Non-functional
children.push(h1("5. Non-Functional Requirements"));
const nfr = [
  ["NFR-01 Schema safety (MUST)", "100% of agent outputs surfaced to the user pass Pydantic validation. Invalid output is rejected with 422, never shown as a result."],
  ["NFR-02 Model agnosticism (MUST)", "Swapping OLLAMA_MODEL (or pointing at an enterprise model) requires no code change outside the client/env."],
  ["NFR-03 Determinism (SHOULD)", "Generation uses low temperature (0.1, already set) for consistent structured output across demo runs."],
  ["NFR-04 Latency (SHOULD)", "Full pipeline completes in demo-acceptable time on the dev machine; long calls show a spinner, never a silent hang."],
  ["NFR-05 Resilience (MUST)", "Ollama down → 503; malformed JSON → 422; unexpected error → 500. New agents follow the existing pattern."],
  ["NFR-06 Reproducibility (MUST)", "requirements.txt pinned; documented run steps (Ollama → uvicorn → Streamlit). No proprietary infra."],
  ["NFR-07 Auditability (MUST)", "Every decision logged with rationale; the pipeline can explain why a patient was escalated."],
  ["NFR-08 Safety (MUST)", "No autonomous irreversible clinical action; the Human-in-the-Loop gate cannot be bypassed by model output."],
];
children.push(table(["Requirement", "Description"], nfr, [3200, 6160]));

// 6. Data contracts
children.push(h1("6. Data Contracts Summary"));
children.push(
  table(
    ["Agent", "Endpoint", "Input", "Output", "Status"],
    [
      ["1 Care Planner", "POST /api/carePlannerAgent", "discharge_summary", "CarePlan", { text: "Done", fill: "E2EFDA", align: AlignmentType.CENTER, bold: true }],
      ["2 Risk Assessor", "POST /api/riskAssessorAgent", "care_plan", "RiskAssessment", { text: "Done", fill: "E2EFDA", align: AlignmentType.CENTER, bold: true }],
      ["3 Comm. Drafter", "POST /api/communicationDrafterAgent", "care_plan + risk", "CommunicationPlan", { text: "Build", fill: "FCE4D6", align: AlignmentType.CENTER, bold: true }],
      ["4 Escalation", "POST /api/escalationAgent", "care_plan + risk", "EscalationDecision", { text: "Build", fill: "FCE4D6", align: AlignmentType.CENTER, bold: true }],
      ["Pipeline", "POST /api/coordinate", "discharge_summary", "all four", { text: "Build", fill: "FCE4D6", align: AlignmentType.CENTER, bold: true }],
    ],
    [1700, 3260, 1700, 1700, 1000]
  )
);
children.push(p("API_CONTRACT.md must be extended with the new endpoints (request/response/curl/error examples) to match the existing format.", { para: { spacing: { before: 120 } } }));

// 7. Milestones
children.push(h1("7. Milestones (mapped to the official timeline)"));
children.push(
  table(
    ["Date", "Event", "Target state"],
    [
      ["Jun 15 – Jul 3", "Round 2 Build", "Agents 3 & 4 built; /api/coordinate; dashboard shows full pipeline; audit trail; API_CONTRACT.md updated"],
      ["mid-July", "Progress showcase", "Live end-to-end demo on synthetic patients; multi-patient risk-sorted view"],
      ["By Jul 17", "Round 3 — expert demos", "Polished demo script; 3–5 varied patient scenarios; safety/HITL story rehearsed"],
      ["Jul 20", "Dry run", "Full run-through on demo hardware; failure modes handled gracefully"],
      ["Jul 22", "Industry Innovation Day (Hilton, Manyata)", "Final presentation to Expert Panel"],
    ],
    [1700, 2600, 5060]
  )
);
children.push(p([new TextRun({ text: "Suggested build order within Round 2:", bold: true, size: 22 })], { para: { spacing: { before: 160, after: 80 } } }));
children.push(
  numbered("Agent 3 model + prompt + agent module + endpoint (mirrors Agent 2 structure)."),
  numbered("Agent 4 model + prompt + agent module + endpoint + safety guard."),
  numbered("/api/coordinate orchestration + per-agent timing/run_id."),
  numbered("Audit-trail persistence (JSONL/SQLite)."),
  numbered("Dashboard: single-patient full pipeline → multi-patient risk queue."),
  numbered("Update API_CONTRACT.md; assemble demo scenario set; rehearse."),
);

// 8. Risks
children.push(h1("8. Risks & Mitigations"));
children.push(
  table(
    ["Risk", "Impact", "Mitigation"],
    [
      ["Small local model returns invalid/inconsistent JSON", "Demo failure", "Pydantic validation + JSON extraction (done); low temperature; retry/repair option; pre-validated demo scenarios"],
      ["Model fails to escalate a high-risk patient", "Safety / trust", "Deterministic code guard (FR-A4-08) forces escalation by risk tier"],
      ["Latency on first model call", "Awkward demo pause", "Warm-up call before demo; spinners; cache demo outputs as fallback"],
      ["Scope creep (FHIR, real messaging)", "Miss build deadline", "Explicitly out of scope; roadmap-only in pitch"],
      ["Single contributor bottleneck on agents", "Slipped milestone", "Agents 3 & 4 are independent — can be built in parallel by two members"],
    ],
    [3200, 1900, 4260]
  )
);

// 9. Acceptance criteria
children.push(h1("9. Acceptance Criteria (Round 2 “done”)"));
[
  "POST /api/communicationDrafterAgent returns a valid CommunicationPlan with messages for days 1, 7, 14, 30 on the standard demo input.",
  "POST /api/escalationAgent returns a valid EscalationDecision; High/Critical patients always yield human_review_required = true.",
  "POST /api/coordinate runs all four agents and returns all outputs, or a clear which-agent-failed error.",
  "Dashboard runs the full pipeline for a patient and shows risk badge, drafted messages, and escalation flag; multi-patient view sorts by risk.",
  "Audit trail records every agent run with rationale and is retrievable.",
  "API_CONTRACT.md documents all new endpoints.",
  "Demo runs end-to-end on 3–5 varied synthetic patients without manual fixes.",
].forEach((t) =>
  children.push(
    new Paragraph({
      spacing: { after: 60 },
      children: [new TextRun({ text: "☐  ", size: 22 }), new TextRun({ text: t, size: 22 })],
    })
  )
);

// ---- document ----
const doc = new Document({
  creator: "CareSync AI",
  title: "CareSync AI — Requirements Document (Round 2 MVP)",
  styles: {
    default: { document: { run: { font: "Arial", size: 22, color: DARK } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 30, bold: true, font: "Arial", color: ORANGE },
        paragraph: { spacing: { before: 320, after: 160 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 25, bold: true, font: "Arial", color: DARK },
        paragraph: { spacing: { before: 220, after: 120 }, outlineLevel: 1 } },
    ],
  },
  numbering: {
    config: [
      { reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 270 } } } }] },
      { reference: "steps", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 270 } } } }] },
    ],
  },
  sections: [
    {
      properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
              border: { top: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC", space: 6 } },
              children: [
                new TextRun({ text: "CareSync AI — Requirements (Round 2 MVP)", size: 16, color: GREY }),
                new TextRun({ text: "\tPage ", size: 16, color: GREY }),
                new TextRun({ children: [PageNumber.CURRENT], size: 16, color: GREY }),
              ],
            }),
          ],
        }),
      },
      children,
    },
  ],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync("docs/REQUIREMENTS.docx", buf);
  console.log("Wrote docs/REQUIREMENTS.docx (" + buf.length + " bytes)");
});
