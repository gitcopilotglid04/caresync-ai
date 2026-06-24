# test_note.py
# Run this directly to test carePlannerAgent and riskAssessorAgent without the server
# Usage: python test_note.py

import json

from app.agents import run_care_planner_agent, run_risk_assessor_agent

SAMPLE_DISCHARGE_SUMMARY = """
Patient: Rajesh Kumar, 68 years old, Male
Discharge Date: Today
Discharged from: Cardiology Ward, Apollo Hospital

Presenting Complaint:
Patient admitted with acute chest pain and shortness of breath.
Diagnosed with NSTEMI (Non-ST Elevation Myocardial Infarction).

Discharge Diagnosis:
- NSTEMI
- Type 2 Diabetes (pre-existing, diagnosed 2018)
- Hypertension (pre-existing)

Medications on Discharge:
- Aspirin 75mg once daily
- Clopidogrel 75mg once daily
- Atorvastatin 40mg once at night
- Metformin 500mg twice daily (continue existing)
- Lisinopril 5mg once daily (new, for blood pressure)

Follow-up Instructions:
- Cardiology OPD in 2 weeks
- HbA1c blood test in 7 days
- ECG in 1 week
- Avoid heavy physical activity for 4 weeks
- Low salt, low fat diet

Social History:
Patient lives alone. Daughter lives in another city.
No home care support arranged.

Allergies: None documented
"""

if __name__ == "__main__":
    print("Running carePlannerAgent — Care Planner (Agent 1)...\n")
    print("=" * 60)

    care_plan = run_care_planner_agent(SAMPLE_DISCHARGE_SUMMARY)

    print("\nCARE PLAN OUTPUT:")
    print("=" * 60)
    print(json.dumps(care_plan.model_dump(), indent=2))
    print("=" * 60)
    print(f"\nComplexity Score: {care_plan.complexity_score}/10")
    print(f"Reason: {care_plan.complexity_reason}")
    print(f"\nMedications ({len(care_plan.medications)}):")
    for med in care_plan.medications:
        print(f"  - {med}")
    print(f"\nCheckpoints ({len(care_plan.checkpoints)}):")
    for cp in care_plan.checkpoints:
        print(f"  Day {cp.day}: {cp.action} [{cp.responsible_party}]")

    print("\n\nRunning riskAssessorAgent — Risk Assessor (Agent 2)...\n")
    print("=" * 60)

    risk = run_risk_assessor_agent(care_plan)

    print("\nRISK ASSESSMENT OUTPUT:")
    print("=" * 60)
    print(json.dumps(risk.model_dump(), indent=2))
    print("=" * 60)
    print(f"\nRisk level: {risk.risk_level}")
    print(f"Readmission probability: {risk.readmission_probability_percent}%")
    print("\nCheckpoint priorities (rank 1 = highest):")
    ordered = sorted(risk.checkpoint_priorities, key=lambda x: x.priority_rank)
    for cp in ordered:
        print(f"  Rank {cp.priority_rank} — Day {cp.day}: {cp.rationale}")