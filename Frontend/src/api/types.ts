/* ============================================================
   API response shapes — derived from the reference HTML data.
   Contract not frozen; pages code against these types.
   ============================================================ */

export type RiskLevel = 'low' | 'medium' | 'high'
export type UrgencyLevel = 'routine' | 'soon' | 'urgent' | 'immediate'
export type Owner = 'ai' | 'human' | 'nurse' | 'doctor' | 'patient'

/* ─── Coordinate (intake pipeline) ─── */

export interface CarePlan {
  medications: string
  follow_up: string
  complexity: number
}

export interface RiskFactor {
  name: string
  evidence: string
}

export interface RiskAssessment {
  level: RiskLevel
  readmission_pct: number
  factors: RiskFactor[]
}

export interface TimelineCheckpoint {
  day: number
  action: string
  owner: Owner
}

export interface CommunicationPlan {
  messages: MessageDraft[]
}

export interface MessageDraft {
  day: number
  content: string
  status: 'needs_approval' | 'approved' | 'sent'
}

export interface EscalationItem {
  concern: string
  reason: string
  owner: Owner
  urgency: UrgencyLevel
}

export interface EscalationDecision {
  items: EscalationItem[]
}

export interface Safety {
  human_review_required: boolean
  review_reason: string
  rules_fired: string[]
}

export interface Audit {
  model: string
  latency_ms: number
  agents_passed: number
  agents_total: number
  claims_blocked: number
  rules_fired: string[]
}

export interface CoordinateResponse {
  run_id: string
  patient: PatientSummary
  care_plan: CarePlan
  risk_assessment: RiskAssessment
  timeline: TimelineCheckpoint[]
  communication_plan: CommunicationPlan
  escalation_decision: EscalationDecision
  safety: Safety
  audit: Audit
}

/* ─── Patient summary (shared between queue + detail) ─── */

export interface PatientSummary {
  id: string
  name: string
  initials: string
  age: number
  sex: 'M' | 'F'
  diagnosis: string
  discharged_label: string
  risk_level: RiskLevel
  urgency: UrgencyLevel
  readmission_pct: number
  queue_rank: number
  owner: Owner
  owner_label: string
  needs_review: boolean
  last_signal: string
  last_signal_new: boolean
}

/* ─── Check-in (re-assessment loop) ─── */

export interface CheckinRequest {
  run_id: string
  day: number
  patient_message: string
  structured_inputs?: Record<string, unknown>
}

export interface CheckinResponse {
  signals_detected: string[]
  red_flags: string[]
  previous_priority: UrgencyLevel
  updated_priority: UrgencyLevel
  human_review_required: boolean
  created_tasks: string[]
  patient_reply_draft: string
  updated_queue_rank: number
  review_reason?: string
}

/* ─── Queue ─── */

export interface QueueResponse {
  patients: PatientSummary[]
  stats: QueueStats
}

export interface QueueStats {
  active_patients: number
  needs_review: number
  immediate: number
  new_signals_today: number
}
