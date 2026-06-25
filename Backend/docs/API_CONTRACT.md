# Care Coordination Agent API Contract

Base URL (local):

`http://127.0.0.1:8000`

Content type for all POST endpoints:

`Content-Type: application/json`

---

## 1) Health and Root

### GET `/`

Purpose: basic service info.

`curl`:

```bash
curl -s http://127.0.0.1:8000/
```

Success response (`200`):

```json
{
  "message": "Care Coordination Agent API is running",
  "docs": "Visit /docs to test the API"
}
```

### GET `/health`

Purpose: readiness/health check.

`curl`:

```bash
curl -s http://127.0.0.1:8000/health
```

Success response (`200`):

```json
{
  "status": "ok"
}
```

---

## 2) Agent 1: carePlannerAgent

### POST `/api/carePlannerAgent`

Purpose: generate a structured 30-day care plan from a discharge summary.

Response behavior:

- Top-level response contract is stable: `status`, `agent`, `data`.
- `data` content is model-generated and will vary based on `discharge_summary`.

Request body:

```json
{
  "discharge_summary": "Patient Rajesh Kumar, 68/M, admitted with chest pain and diagnosed with NSTEMI; stabilized and discharged today.Discharge meds: Aspirin 75 mg OD, Clopidogrel 75 mg OD, Atorvastatin 40 mg HS, Metformin 500 mg BD.Follow-up: Cardiology OPD in 1 week with repeat ECG; advised low-salt diabetic diet and no heavy exertion for 4 weeks.Social note: patient lives alone, daughter out of city, home nurse visit recommended for medication adherence check."
}
```

`curl`:

```bash
curl -s -X POST "http://127.0.0.1:8000/api/carePlannerAgent" \
  -H "Content-Type: application/json" \
  -d '{
    "discharge_summary": "Patient Rajesh Kumar, 68/M, admitted with chest pain and diagnosed with NSTEMI; stabilized and discharged today.Discharge meds: Aspirin 75 mg OD, Clopidogrel 75 mg OD, Atorvastatin 40 mg HS, Metformin 500 mg BD.Follow-up: Cardiology OPD in 1 week with repeat ECG; advised low-salt diabetic diet and no heavy exertion for 4 weeks.Social note: patient lives alone, daughter out of city, home nurse visit recommended for medication adherence check."
  }'
```

Success response (`200`):

```json
{
  "status": "success",
  "agent": "carePlannerAgent",
  "data": {
    "patient_name": "Rajesh Kumar",
    "diagnosis": "NSTEMI",
    "medications": [
      "Aspirin 75mg once daily",
      "Clopidogrel 75mg once daily",
      "Atorvastatin 40mg nightly"
    ],
    "follow_up_appointments": [
      "Cardiology OPD in 2 weeks",
      "ECG in 1 week"
    ],
    "checkpoints": [
      {
        "day": 1,
        "action": "Medication reconciliation and symptom check",
        "responsible_party": "nurse"
      },
      {
        "day": 7,
        "action": "ECG and blood pressure review",
        "responsible_party": "doctor"
      },
      {
        "day": 14,
        "action": "Cardiology follow-up",
        "responsible_party": "doctor"
      },
      {
        "day": 30,
        "action": "Recovery and adherence review",
        "responsible_party": "patient"
      }
    ],
    "complexity_score": 7,
    "complexity_reason": "Cardiac diagnosis with multiple medications and limited home support."
  }
}
```



Common error responses:

- `400` (empty summary):

```json
{
  "detail": "discharge_summary cannot be empty"
}
```

- `422` (request validation by FastAPI/Pydantic, e.g. missing field):

```json
{
  "detail": [
    {
      "type": "missing",
      "loc": ["body", "discharge_summary"],
      "msg": "Field required"
    }
  ]
}
```

- `422` (model output validation failure wrapped by app):

```json
{
  "detail": "carePlannerAgent output failed validation: ..."
}
```

- `503` (Ollama unavailable):

```json
{
  "detail": "Cannot connect to Ollama. Make sure Ollama is running: open a terminal and run 'ollama serve'"
}
```

- `500` (unexpected server failure):

```json
{
  "detail": "carePlannerAgent failed unexpectedly: ..."
}
```

---

## 3) Agent 2: riskAssessorAgent

### POST `/api/riskAssessorAgent`

Purpose: assess readmission risk from Agent 1 structured care plan.

Response behavior:

- Top-level response contract is stable: `status`, `agent`, `data`.
- `data` content is model-generated and will vary based on the input `care_plan`.

Request body:

```json
{
  "care_plan": {
    "patient_name": "Rajesh Kumar",
    "diagnosis": "NSTEMI",
    "medications": [
      "Aspirin 75mg once daily",
      "Clopidogrel 75mg once daily",
      "Atorvastatin 40mg nightly"
    ],
    "follow_up_appointments": [
      "Cardiology OPD in 2 weeks",
      "ECG in 1 week"
    ],
    "checkpoints": [
      {
        "day": 1,
        "action": "Medication reconciliation and symptom check",
        "responsible_party": "nurse"
      },
      {
        "day": 7,
        "action": "ECG and blood pressure review",
        "responsible_party": "doctor"
      },
      {
        "day": 14,
        "action": "Cardiology follow-up",
        "responsible_party": "doctor"
      },
      {
        "day": 30,
        "action": "Recovery and adherence review",
        "responsible_party": "patient"
      }
    ],
    "complexity_score": 7,
    "complexity_reason": "Cardiac diagnosis with multiple medications and limited home support."
  }
}
```

`curl`:

```bash
curl -s -X POST "http://127.0.0.1:8000/api/riskAssessorAgent" \
  -H "Content-Type: application/json" \
  -d '{
    "care_plan": {
      "patient_name": "Rajesh Kumar",
      "diagnosis": "NSTEMI",
      "medications": ["Aspirin 75mg once daily", "Clopidogrel 75mg once daily", "Atorvastatin 40mg nightly"],
      "follow_up_appointments": ["Cardiology OPD in 2 weeks", "ECG in 1 week"],
      "checkpoints": [
        {"day": 1, "action": "Medication reconciliation and symptom check", "responsible_party": "nurse"},
        {"day": 7, "action": "ECG and blood pressure review", "responsible_party": "doctor"},
        {"day": 14, "action": "Cardiology follow-up", "responsible_party": "doctor"},
        {"day": 30, "action": "Recovery and adherence review", "responsible_party": "patient"}
      ],
      "complexity_score": 7,
      "complexity_reason": "Cardiac diagnosis with multiple medications and limited home support."
    }
  }'
```

Success response (`200`):

```json
{
  "status": "success",
  "agent": "riskAssessorAgent",
  "data": {
    "risk_level": "High",
    "risk_factors": [
      "Recent cardiac event",
      "Polypharmacy",
      "Lives alone"
    ],
    "readmission_probability_percent": 38.5,
    "checkpoint_priorities": [
      {
        "day": 1,
        "priority_rank": 1,
        "rationale": "Highest early instability risk after discharge."
      },
      {
        "day": 7,
        "priority_rank": 2,
        "rationale": "Critical for medication and symptom reassessment."
      },
      {
        "day": 14,
        "priority_rank": 3,
        "rationale": "Follow-up helps adjust treatment."
      },
      {
        "day": 30,
        "priority_rank": 4,
        "rationale": "Lower short-term urgency than earlier checkpoints."
      }
    ]
  }
}
```

Common error responses:

- `422` (request validation by FastAPI/Pydantic, e.g. missing `care_plan` or invalid nested fields):

```json
{
  "detail": [
    {
      "type": "missing",
      "loc": ["body", "care_plan"],
      "msg": "Field required"
    }
  ]
}
```

- `422` (model output validation failure wrapped by app):

```json
{
  "detail": "riskAssessorAgent output failed validation: ..."
}
```

- `503` (Ollama unavailable):

```json
{
  "detail": "Cannot connect to Ollama. Make sure Ollama is running: open a terminal and run 'ollama serve'"
}
```

- `500` (unexpected server failure):

```json
{
  "detail": "riskAssessorAgent failed unexpectedly: ..."
}
```

---

## 4) Agent 4: escalationAgent

### POST `/api/escalationAgent`

Purpose: decide what a human coordinator must own versus what the AI can safely automate, from the Agent 1 care plan and the Agent 2 risk assessment.

Response behavior:

- Top-level response contract is stable: `status`, `agent`, `data`.
- `data` content is model-generated and will vary based on the inputs.
- **Deterministic safety floor:** if `risk_assessment.risk_level` is `High` or `Critical`, `data.human_review_required` is **always** `true`, regardless of model output. When the floor overrides the model, `data.model_overridden` is set to `true`.

Request body (care plan from Agent 1 + risk assessment from Agent 2):

```json
{
  "care_plan": {
    "patient_name": "Rajesh Kumar",
    "diagnosis": "NSTEMI",
    "medications": ["Aspirin 75mg once daily", "Clopidogrel 75mg once daily", "Atorvastatin 40mg nightly"],
    "follow_up_appointments": ["Cardiology OPD in 2 weeks", "ECG in 1 week"],
    "checkpoints": [
      {"day": 1, "action": "Medication reconciliation and symptom check", "responsible_party": "nurse"},
      {"day": 7, "action": "ECG and blood pressure review", "responsible_party": "doctor"},
      {"day": 14, "action": "Cardiology follow-up", "responsible_party": "doctor"},
      {"day": 30, "action": "Recovery and adherence review", "responsible_party": "patient"}
    ],
    "complexity_score": 7,
    "complexity_reason": "Cardiac diagnosis with multiple medications and limited home support."
  },
  "risk_assessment": {
    "risk_level": "High",
    "risk_factors": ["Recent cardiac event", "Polypharmacy", "Lives alone"],
    "readmission_probability_percent": 38.5,
    "checkpoint_priorities": [
      {"day": 1, "priority_rank": 1, "rationale": "Highest early instability risk after discharge."},
      {"day": 7, "priority_rank": 2, "rationale": "Critical for medication and symptom reassessment."},
      {"day": 14, "priority_rank": 3, "rationale": "Follow-up helps adjust treatment."},
      {"day": 30, "priority_rank": 4, "rationale": "Lower short-term urgency than earlier checkpoints."}
    ]
  }
}
```

`curl`:

```bash
curl -s -X POST "http://127.0.0.1:8000/api/escalationAgent" \
  -H "Content-Type: application/json" \
  -d '{
    "care_plan": {
      "patient_name": "Rajesh Kumar",
      "diagnosis": "NSTEMI",
      "medications": ["Aspirin 75mg once daily", "Clopidogrel 75mg once daily", "Atorvastatin 40mg nightly"],
      "follow_up_appointments": ["Cardiology OPD in 2 weeks", "ECG in 1 week"],
      "checkpoints": [
        {"day": 1, "action": "Medication reconciliation and symptom check", "responsible_party": "nurse"},
        {"day": 7, "action": "ECG and blood pressure review", "responsible_party": "doctor"},
        {"day": 14, "action": "Cardiology follow-up", "responsible_party": "doctor"},
        {"day": 30, "action": "Recovery and adherence review", "responsible_party": "patient"}
      ],
      "complexity_score": 7,
      "complexity_reason": "Cardiac diagnosis with multiple medications and limited home support."
    },
    "risk_assessment": {
      "risk_level": "High",
      "risk_factors": ["Recent cardiac event", "Polypharmacy", "Lives alone"],
      "readmission_probability_percent": 38.5,
      "checkpoint_priorities": [
        {"day": 1, "priority_rank": 1, "rationale": "Highest early instability risk after discharge."},
        {"day": 7, "priority_rank": 2, "rationale": "Critical for medication and symptom reassessment."},
        {"day": 14, "priority_rank": 3, "rationale": "Follow-up helps adjust treatment."},
        {"day": 30, "priority_rank": 4, "rationale": "Lower short-term urgency than earlier checkpoints."}
      ]
    }
  }'
```

Success response (`200`):

```json
{
  "status": "success",
  "agent": "escalationAgent",
  "data": {
    "human_review_required": true,
    "overall_urgency": "urgent",
    "escalation_items": [
      {
        "concern": "Patient lives alone after a cardiac event with no home support",
        "owner": "human_coordinator",
        "urgency": "urgent",
        "rationale": "A coordinator must arrange home support before Day 1."
      },
      {
        "concern": "Day 1 medication reminder",
        "owner": "AI",
        "urgency": "soon",
        "rationale": "Routine reminder the system can send automatically."
      }
    ],
    "summary": "High-risk cardiac patient living alone — escalated to a human coordinator for home support; routine reminders automated.",
    "model_overridden": false
  }
}
```

Field notes:

- `human_review_required` (bool): a human coordinator must review before the plan proceeds. **Forced `true` for High/Critical risk by the safety floor.**
- `overall_urgency`: one of `routine`, `soon`, `urgent`, `immediate` — the highest urgency across items.
- `escalation_items[]`: each has `concern`, `owner` (`AI` | `human_coordinator`), `urgency`, `rationale`.
- `model_overridden` (bool): `true` only when the safety floor changed the model's `human_review_required` decision.

Common error responses:

- `422` (request validation by FastAPI/Pydantic, e.g. missing `care_plan` or `risk_assessment`):

```json
{
  "detail": [
    {
      "type": "missing",
      "loc": ["body", "risk_assessment"],
      "msg": "Field required"
    }
  ]
}
```

- `422` (model output validation failure wrapped by app):

```json
{
  "detail": "escalationAgent output failed validation: ..."
}
```

- `503` (Ollama unavailable):

```json
{
  "detail": "Cannot connect to Ollama. Make sure Ollama is running: open a terminal and run 'ollama serve'"
}
```

- `500` (unexpected server failure):

```json
{
  "detail": "escalationAgent failed unexpectedly: ..."
}
```

---

## 5) End-to-End Curl Flow (Agent 1 -> Agent 2 -> Agent 4)

1. Call Agent 1 (`/api/carePlannerAgent`) with a discharge summary.
2. Copy response `data` (the care plan).
3. Paste it under `"care_plan"` and call Agent 2 (`/api/riskAssessorAgent`).
4. Copy that response `data` (the risk assessment).
5. Call Agent 4 (`/api/escalationAgent`) with both `"care_plan"` and `"risk_assessment"`.

Tip: use `http://127.0.0.1:8000/docs` for interactive testing and payload generation.
