import type {
  CoordinateResponse,
  CheckinResponse,
  QueueResponse,
  PatientSummary,
} from './types'

/* ============================================================
   Mock fixtures — data matches the reference HTML exactly.
   ============================================================ */

/* ─── Queue patients (from caresync-coordinator-queue.html) ─── */

const rajesh: PatientSummary = {
  id: 'rajesh-kumar',
  name: 'Rajesh Kumar',
  initials: 'RK',
  age: 68,
  sex: 'M',
  diagnosis: 'NSTEMI',
  discharged_label: 'discharged today',
  risk_level: 'high',
  urgency: 'urgent',
  readmission_pct: 38.5,
  queue_rank: 1,
  owner: 'human',
  owner_label: 'coordinator',
  needs_review: true,
  last_signal: 'Chest tightness · missed doses',
  last_signal_new: true,
}

const meera: PatientSummary = {
  id: 'meera-pillai',
  name: 'Meera Pillai',
  initials: 'MP',
  age: 76,
  sex: 'F',
  diagnosis: 'Hip surgery',
  discharged_label: 'discharged 2 days ago',
  risk_level: 'high',
  urgency: 'urgent',
  readmission_pct: 31.0,
  queue_rank: 2,
  owner: 'human',
  owner_label: 'coordinator',
  needs_review: true,
  last_signal: 'Lives alone · fall risk',
  last_signal_new: false,
}

const anita: PatientSummary = {
  id: 'anita-sharma',
  name: 'Anita Sharma',
  initials: 'AS',
  age: 55,
  sex: 'F',
  diagnosis: 'Type 2 diabetes',
  discharged_label: 'discharged 5 days ago',
  risk_level: 'medium',
  urgency: 'soon',
  readmission_pct: 18.0,
  queue_rank: 3,
  owner: 'ai',
  owner_label: 'AI reminder',
  needs_review: false,
  last_signal: 'Missed glucose log',
  last_signal_new: false,
}

const david: PatientSummary = {
  id: 'david-lobo',
  name: 'David Lobo',
  initials: 'DL',
  age: 61,
  sex: 'M',
  diagnosis: 'COPD',
  discharged_label: 'discharged 8 days ago',
  risk_level: 'medium',
  urgency: 'soon',
  readmission_pct: 15.5,
  queue_rank: 4,
  owner: 'ai',
  owner_label: 'AI reminder',
  needs_review: false,
  last_signal: 'Stable, on track',
  last_signal_new: false,
}

const sunita: PatientSummary = {
  id: 'sunita-rao',
  name: 'Sunita Rao',
  initials: 'SR',
  age: 49,
  sex: 'F',
  diagnosis: 'Cholecystectomy',
  discharged_label: 'discharged 12 days ago',
  risk_level: 'low',
  urgency: 'routine',
  readmission_pct: 7.0,
  queue_rank: 5,
  owner: 'patient',
  owner_label: 'patient',
  needs_review: false,
  last_signal: 'Recovering well',
  last_signal_new: false,
}

/* ─── Queue response ─── */

export const mockQueue: QueueResponse = {
  patients: [rajesh, meera, anita, david, sunita],
  stats: {
    active_patients: 5,
    needs_review: 2,
    immediate: 1,
    new_signals_today: 1,
  },
}

/* ─── Rajesh full detail (from caresync-patient-detail.html) ─── */

export const mockRun: CoordinateResponse = {
  run_id: 'run-rajesh-001',
  patient: rajesh,
  care_plan: {
    medications: 'Aspirin 75 · Clopidogrel 75 · Atorvastatin 40',
    follow_up: 'Cardiology OPD 2 wks · ECG 1 wk',
    complexity: 7,
  },
  risk_assessment: {
    level: 'high',
    readmission_pct: 38.5,
    factors: [
      { name: 'Recent cardiac event', evidence: '"Diagnosed with NSTEMI; discharged today"' },
      { name: 'Polypharmacy', evidence: '"Aspirin, Clopidogrel, Atorvastatin, Metformin"' },
      { name: 'Lives alone', evidence: '"Social note: lives alone, daughter out of city"' },
    ],
  },
  timeline: [
    { day: 1, action: 'Medication reconciliation', owner: 'nurse' },
    { day: 7, action: 'ECG & BP review', owner: 'doctor' },
    { day: 14, action: 'Cardiology follow-up', owner: 'doctor' },
    { day: 30, action: 'Recovery review', owner: 'patient' },
  ],
  communication_plan: {
    messages: [
      { day: 1, content: 'confirm medicines taken', status: 'needs_approval' },
      { day: 7, content: 'ECG appointment reminder', status: 'needs_approval' },
      { day: 14, content: 'bring meds list to follow-up', status: 'needs_approval' },
      { day: 30, content: 'recovery check-in', status: 'needs_approval' },
    ],
  },
  escalation_decision: {
    items: [
      {
        concern: 'Lives alone, no home support',
        reason: 'Arrange home support before Day 1.',
        owner: 'human',
        urgency: 'urgent',
      },
      {
        concern: 'Day 1 medication reminder',
        reason: 'Automated reminder — no human needed.',
        owner: 'ai',
        urgency: 'routine',
      },
    ],
  },
  safety: {
    human_review_required: true,
    review_reason:
      'High-risk cardiac patient living alone — a coordinator must arrange home support before Day 1. Forced by the safety floor, independent of the model.',
    rules_fired: ['HIGH_RISK', 'LIVES_ALONE'],
  },
  audit: {
    model: 'claude-sonnet-4-6',
    latency_ms: 4200,
    agents_passed: 4,
    agents_total: 4,
    claims_blocked: 0,
    rules_fired: ['HIGH_RISK', 'LIVES_ALONE'],
  },
}

/* ─── Check-in responses (match the reference script behavior) ─── */

export const mockCheckins: Record<string, CheckinResponse> = {
  good: {
    signals_detected: [],
    red_flags: [],
    previous_priority: 'urgent',
    updated_priority: 'urgent',
    human_review_required: true,
    created_tasks: [],
    patient_reply_draft: 'Thank you for confirming. Keep taking your medications as prescribed.',
    updated_queue_rank: 3,
    review_reason:
      'High-risk cardiac patient living alone — a coordinator must arrange home support before Day 1. Forced by the safety floor, independent of the model.',
  },
  miss: {
    signals_detected: ['MISSED_FOLLOWUP_HIGH_RISK'],
    red_flags: [],
    previous_priority: 'urgent',
    updated_priority: 'urgent',
    human_review_required: true,
    created_tasks: ['Coordinator task: reschedule ECG'],
    patient_reply_draft: 'We noticed you missed your ECG appointment. A coordinator will reach out to reschedule.',
    updated_queue_rank: 2,
    review_reason:
      'High-risk cardiac patient living alone — a coordinator must arrange home support before Day 1. Forced by the safety floor, independent of the model.',
  },
  symptom: {
    signals_detected: ['CARDIAC_SYMPTOM_AFTER_CARDIAC_EVENT', 'MISSED_CRITICAL_MEDICATION'],
    red_flags: ['CARDIAC_SYMPTOM_AFTER_CARDIAC_EVENT', 'MISSED_CRITICAL_MEDICATION'],
    previous_priority: 'urgent',
    updated_priority: 'immediate',
    human_review_required: true,
    created_tasks: ['Immediate coordinator escalation', 'Notify on-call physician'],
    patient_reply_draft: 'We are concerned about your symptoms. A care coordinator will contact you shortly.',
    updated_queue_rank: 1,
    review_reason:
      'A new deterioration signal in an already-high-risk patient — escalated from routine monitoring to immediate coordinator action.',
  },
}
