import { RiskBadge, UrgencyPill, QueueRankChip, Badge } from './ui'
import type { PatientSummary, UrgencyLevel } from '../api/types'

interface Props {
  patient: PatientSummary
  urgencyOverride?: UrgencyLevel
  rankOverride?: number
}

export default function PatientHeader({ patient, urgencyOverride, rankOverride }: Props) {
  const urgency = urgencyOverride ?? patient.urgency
  const rank = rankOverride ?? patient.queue_rank
  const avatarHighRisk = patient.risk_level === 'high'

  return (
    <section
      className="sticky top-[56px] z-20 flex items-center gap-[16px] flex-wrap bg-surface border-[0.5px] border-line rounded-DEFAULT p-[14px_18px] shadow-sticky"
      aria-label="Patient summary"
    >
      <div
        className={`w-[46px] h-[46px] rounded-[13px] flex-none grid place-items-center font-bold text-[15px] ${
          avatarHighRisk ? 'bg-risk-high-bg text-risk-high' : 'bg-surface-2 text-ink-2'
        }`}
        aria-hidden="true"
      >
        {patient.initials}
      </div>
      <div className="min-w-[170px]">
        <div className="text-[21px] font-semibold tracking-[-0.02em] leading-[1.15]">
          {patient.name}
        </div>
        <div className="text-ink-2 text-[13px] mt-[2px]">
          {patient.age} / {patient.sex} · {patient.diagnosis} · {patient.discharged_label}
        </div>
      </div>
      <div className="ml-auto flex items-center gap-[8px] flex-wrap max-sm:ml-0 max-sm:w-full">
        <RiskBadge level={patient.risk_level} />
        <Badge variant="neutral" className="num">
          Readmission {patient.readmission_pct}%
        </Badge>
        <UrgencyPill level={urgency} />
        <QueueRankChip rank={rank} />
        <span className="text-[11.5px] font-medium px-[9px] py-[3px] rounded-sm bg-surface-2 text-ink-2 whitespace-nowrap">
          Owner: {patient.owner_label}
        </span>
      </div>
    </section>
  )
}
