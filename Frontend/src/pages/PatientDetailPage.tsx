import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { getRun, ApiError } from '../api/client'
import type { UrgencyLevel } from '../api/types'
import AppBar from '../components/AppBar'
import PatientHeader from '../components/PatientHeader'
import ReviewBanner from '../components/ReviewBanner'
import { DetailHeaderSkeleton, PanelSkeleton, ErrorToast } from '../components/ui'
import {
  CarePlanPanel,
  RiskPanel,
  TimelinePanel,
  MessagesPanel,
  EscalationPanel,
  AuditPanel,
  CheckinSimulator,
} from '../components/panels'

export default function PatientDetailPage() {
  const { data: run, isLoading, error, refetch } = useQuery({
    queryKey: ['run', 'run-rajesh-001'],
    queryFn: () => getRun('run-rajesh-001'),
    retry: false,
  })

  const [urgency, setUrgency] = useState<UrgencyLevel | undefined>()
  const [rank, setRank] = useState<number | undefined>()
  const [reviewReason, setReviewReason] = useState<string | undefined>()
  const [flashBanner, setFlashBanner] = useState(false)
  const [checkinError, setCheckinError] = useState<string | null>(null)

  const errorMessage = error instanceof ApiError
    ? error.message
    : error ? 'Failed to load patient data. Please try again.' : null

  function handleReassess(result: {
    urgency: UrgencyLevel
    queue_rank: number
    human_review_required: boolean
    review_reason?: string
  }) {
    setCheckinError(null)
    setUrgency(result.urgency)
    setRank(result.queue_rank)
    if (result.review_reason) {
      setReviewReason(result.review_reason)
    }
    if (result.urgency === 'immediate') {
      setFlashBanner((v) => !v)
    }
  }

  function handleCheckinError(err: unknown) {
    if (err instanceof ApiError) {
      setCheckinError(err.message)
    } else {
      setCheckinError('Check-in failed. Please try again.')
    }
  }

  return (
    <>
      <AppBar />
      <main className="max-w-[var(--maxw)] mx-auto px-[22px] pt-[18px] pb-[64px]">
        <Link
          to="/"
          className="inline-flex items-center gap-[6px] text-ink-2 text-[13px] font-medium no-underline mt-[4px] mb-[14px] hover:text-ink"
        >
          <ChevronLeft className="w-[15px] h-[15px]" />
          Back to queue
        </Link>

        {/* Loading state */}
        {isLoading && (
          <>
            <DetailHeaderSkeleton />
            <div className="grid grid-cols-[repeat(auto-fit,minmax(296px,1fr))] gap-[13px] mt-[13px]">
              {[1, 2, 3, 4, 5, 6].map((i) => <PanelSkeleton key={i} />)}
            </div>
          </>
        )}

        {/* Loaded state */}
        {run && (
          <>
            <PatientHeader
              patient={run.patient}
              urgencyOverride={urgency}
              rankOverride={rank}
            />

            {run.safety.human_review_required && (
              <ReviewBanner reason={reviewReason ?? run.safety.review_reason} flash={flashBanner} />
            )}

            <div className="grid grid-cols-[repeat(auto-fit,minmax(296px,1fr))] gap-[13px] mt-[13px]">
              <CarePlanPanel data={run.care_plan} />
              <RiskPanel factors={run.risk_assessment.factors} />
              <TimelinePanel checkpoints={run.timeline} />
              <MessagesPanel messages={run.communication_plan.messages} />
              <EscalationPanel items={run.escalation_decision.items} />
              <AuditPanel data={run.audit} />
            </div>

            <CheckinSimulator runId={run.run_id} onReassess={handleReassess} onError={handleCheckinError} />
          </>
        )}
      </main>

      <footer className="max-w-[var(--maxw)] mx-auto mt-[22px] px-[22px] text-ink-3 text-[12px]">
        Synthetic demo data only. Production enforces role-scoped access (HIPAA minimum-necessary · India DPDP). Decision support for clinicians — not autonomous diagnosis.
      </footer>

      {errorMessage && <ErrorToast message={errorMessage} onRetry={() => refetch()} />}
      {checkinError && <ErrorToast message={checkinError} onRetry={() => setCheckinError(null)} />}
    </>
  )
}
