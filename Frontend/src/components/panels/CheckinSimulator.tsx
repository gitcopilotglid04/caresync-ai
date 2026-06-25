import { useState } from 'react'
import { Activity } from 'lucide-react'
import { Code } from '../ui'
import { checkin } from '../../api/client'
import type { CheckinResponse, UrgencyLevel } from '../../api/types'

interface CheckinScenario {
  key: string
  day: number
  label: string
}

const scenarios: CheckinScenario[] = [
  { key: 'good', day: 1, label: 'Medicines confirmed' },
  { key: 'miss', day: 7, label: 'Missed ECG appointment' },
  { key: 'symptom', day: 10, label: 'Chest tightness + missed doses' },
]

interface Props {
  runId: string
  onReassess: (result: {
    urgency: UrgencyLevel
    queue_rank: number
    human_review_required: boolean
    review_reason?: string
  }) => void
  onError?: (err: unknown) => void
}

export default function CheckinSimulator({ runId, onReassess, onError }: Props) {
  const [result, setResult] = useState<CheckinResponse | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleCheckin(scenario: CheckinScenario) {
    setLoading(true)
    try {
      const res = await checkin({
        run_id: runId,
        day: scenario.day,
        patient_message: scenario.key,
      })
      setResult(res)
      onReassess({
        urgency: res.updated_priority,
        queue_rank: res.updated_queue_rank,
        human_review_required: res.human_review_required,
        review_reason: res.review_reason,
      })
    } catch (err) {
      onError?.(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section
      className="mt-[13px] bg-surface border-[0.5px] border-line-2 rounded-DEFAULT p-[17px_19px] shadow"
      aria-label="Check-in simulator"
    >
      <h3 className="m-0 mb-[4px] text-[14px] font-semibold flex items-center gap-[8px]">
        <Activity className="w-[17px] h-[17px] text-brand" />
        Check-in simulator
      </h3>
      <p className="text-ink-3 text-[12.5px] m-0 mb-[13px]">
        Simulate a patient check-in during the recovery window. The signal extractor and red-flag
        rules run, then risk and escalation re-assess.
      </p>

      <div className="flex gap-[9px] flex-wrap">
        {scenarios.map((s) => (
          <button
            key={s.key}
            type="button"
            disabled={loading}
            onClick={() => handleCheckin(s)}
            className="flex flex-col items-start gap-[2px] p-[10px_14px] border-[0.5px] border-line-2 rounded-sm bg-surface cursor-pointer transition-[border-color,background] duration-150 text-left hover:bg-surface-2 hover:border-brand active:scale-[0.985] disabled:opacity-50 disabled:cursor-default"
          >
            <span className="font-semibold text-[13px] num">Day {s.day}</span>
            <span className="text-[12px] text-ink-2">{s.label}</span>
          </button>
        ))}
      </div>

      <div
        className="mt-[14px] p-[14px_16px] rounded-sm bg-surface-2 border-[0.5px] border-line text-[13px] text-ink-2 leading-[1.55]"
        role="status"
        aria-live="polite"
      >
        {!result && 'Select a check-in to run the re-assessment.'}
        {result && (
          <>
            {result.red_flags.length > 0 && (
              <div className="mb-[6px] flex flex-wrap gap-[5px]">
                {result.red_flags.map((flag) => (
                  <Code key={flag}>{flag}</Code>
                ))}
              </div>
            )}
            {result.signals_detected.length === 0 && (
              <p className="m-0">
                <strong className="font-semibold text-ink">No new signals.</strong> Medication
                confirmed and logged to the audit trail. No escalation; queue rank unchanged.
              </p>
            )}
            {result.signals_detected.length > 0 && result.red_flags.length === 0 && (
              <p className="m-0">
                Signal: missed ECG appointment. A coordinator task was created. Urgency held at{' '}
                <strong className="font-semibold text-ink">{result.updated_priority}</strong>; queue
                rank →{' '}
                <strong className="font-semibold text-ink">#{result.updated_queue_rank}</strong>.
              </p>
            )}
            {result.red_flags.length > 0 && (
              <p className="m-0">
                Signals: new cardiac symptom + missed doses. Risk stays{' '}
                <strong className="font-semibold text-ink">high</strong>; urgency →{' '}
                <strong className="font-semibold text-ink">{result.updated_priority}</strong>. Human
                review forced by the safety floor. Queue rank →{' '}
                <strong className="font-semibold text-ink">#{result.updated_queue_rank}</strong>.
              </p>
            )}
          </>
        )}
      </div>
    </section>
  )
}
