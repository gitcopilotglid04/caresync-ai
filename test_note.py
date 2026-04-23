# test_note.py
# Run this directly to test carePlannerAgent without starting the server
# Usage: python test_note.py

from app.care_planner_agent import run_care_planner_agent
import json

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
    print("Running carePlannerAgent — Care Planner...\n")
    print("=" * 60)

    result = run_care_planner_agent(SAMPLE_DISCHARGE_SUMMARY)

    print("\nCARE PLAN OUTPUT:")
    print("=" * 60)
    print(json.dumps(result.model_dump(), indent=2))
    print("=" * 60)
    print(f"\nComplexity Score: {result.complexity_score}/10")
    print(f"Reason: {result.complexity_reason}")
    print(f"\nMedications ({len(result.medications)}):")
    for med in result.medications:
        print(f"  - {med}")
    print(f"\nCheckpoints ({len(result.checkpoints)}):")
    for cp in result.checkpoints:
        print(f"  Day {cp.day}: {cp.action} [{cp.responsible_party}]")