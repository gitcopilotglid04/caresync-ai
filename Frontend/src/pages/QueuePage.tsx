import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { getQueue, ApiError } from '../api/client'
import { RiskBadge, UrgencyPill, OwnerChip, Button, QueueRowSkeleton, ErrorToast } from '../components/ui'
import AppBar from '../components/AppBar'
import IntakeModal from '../components/IntakeModal'
import EmptyQueue from '../components/EmptyQueue'
import type { PatientSummary } from '../api/types'

type Filter = 'all' | 'review' | 'high'

export default function QueuePage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['queue'],
    queryFn: getQueue,
    retry: false,
  })
  const [filter, setFilter] = useState<Filter>('all')
  const [intakeOpen, setIntakeOpen] = useState(false)
  const navigate = useNavigate()

  const errorMessage = error instanceof ApiError
    ? error.message
    : error ? 'Failed to load queue. Please try again.' : null

  const filtered = data?.patients.filter((p) => {
    if (filter === 'review') return p.needs_review
    if (filter === 'high') return p.risk_level === 'high'
    return true
  }) ?? []

  const isEmpty = data && data.patients.length === 0

  return (
    <>
      <AppBar />
      <main className="max-w-[var(--maxw)] mx-auto p-[22px]">
        <div className="flex items-end justify-between gap-[12px] flex-wrap">
          <div>
            <h1 className="text-[22px] font-semibold tracking-[-0.02em] m-0">Coordinator queue</h1>
            <p className="text-ink-2 text-[13.5px] mt-[3px] m-0">
              Discharged patients, sorted by who needs attention now. Updated as check-ins arrive.
            </p>
          </div>
          <Button variant="primary" onClick={() => setIntakeOpen(true)}>
            <Plus className="w-[14px] h-[14px]" strokeWidth={2.4} />
            New patient
          </Button>
        </div>

        {/* Metric strip */}
        {data && (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-[11px] my-[18px]">
            <Metric label="Active patients" value={data.stats.active_patients} />
            <Metric label="Need human review" value={data.stats.needs_review} alert />
            <Metric label="Immediate" value={data.stats.immediate} alert />
            <Metric label="New signals today" value={data.stats.new_signals_today} />
          </div>
        )}

        {/* Empty state */}
        {isEmpty && <EmptyQueue onAddPatient={() => setIntakeOpen(true)} />}

        {/* Loading state */}
        {isLoading && (
          <>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-[11px] my-[18px]">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-surface border-[0.5px] border-line rounded-DEFAULT p-[13px_15px]">
                  <div className="bg-surface-2 rounded-sm animate-pulse w-[80px] h-[12px] mb-[6px]" />
                  <div className="bg-surface-2 rounded-sm animate-pulse w-[40px] h-[24px]" />
                </div>
              ))}
            </div>
            <div className="bg-surface border-[0.5px] border-line rounded-DEFAULT shadow overflow-hidden">
              <table className="w-full border-collapse">
                <tbody>
                  {[1, 2, 3, 4, 5].map((i) => <QueueRowSkeleton key={i} />)}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Loaded — has patients */}
        {data && !isEmpty && (
          <>
            {/* Filter chips */}
            <div className="flex gap-[7px] mb-[12px] flex-wrap" role="tablist" aria-label="Filter queue">
              <FilterChip label="All" active={filter === 'all'} onClick={() => setFilter('all')} />
              <FilterChip label="Needs review" active={filter === 'review'} onClick={() => setFilter('review')} />
              <FilterChip label="High risk" active={filter === 'high'} onClick={() => setFilter('high')} />
            </div>

            {/* Table */}
            <div className="bg-surface border-[0.5px] border-line rounded-DEFAULT shadow overflow-hidden">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="text-left text-[11.5px] font-semibold text-ink-3 tracking-[0.03em] p-[11px_14px] border-b-[0.5px] border-line whitespace-nowrap">Patient</th>
                    <th className="text-left text-[11.5px] font-semibold text-ink-3 tracking-[0.03em] p-[11px_14px] border-b-[0.5px] border-line whitespace-nowrap hidden md:table-cell">Diagnosis</th>
                    <th className="text-left text-[11.5px] font-semibold text-ink-3 tracking-[0.03em] p-[11px_14px] border-b-[0.5px] border-line whitespace-nowrap">Risk</th>
                    <th className="text-left text-[11.5px] font-semibold text-ink-3 tracking-[0.03em] p-[11px_14px] border-b-[0.5px] border-line whitespace-nowrap">Urgency</th>
                    <th className="text-right text-[11.5px] font-semibold text-ink-3 tracking-[0.03em] p-[11px_14px] border-b-[0.5px] border-line whitespace-nowrap hidden md:table-cell">Readmission</th>
                    <th className="text-left text-[11.5px] font-semibold text-ink-3 tracking-[0.03em] p-[11px_14px] border-b-[0.5px] border-line whitespace-nowrap">Last signal</th>
                    <th className="text-left text-[11.5px] font-semibold text-ink-3 tracking-[0.03em] p-[11px_14px] border-b-[0.5px] border-line whitespace-nowrap hidden md:table-cell">Owner</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <QueueRow key={p.id} patient={p} onClick={() => navigate(`/patient/${p.id}`)} />
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>

      <footer className="max-w-[var(--maxw)] mx-auto mt-[18px] px-[22px] text-ink-3 text-[12px]">
        Synthetic demo data only. One coordinator, five patients — the system surfaces the two that need a human today.
      </footer>

      <IntakeModal open={intakeOpen} onClose={() => setIntakeOpen(false)} />

      {errorMessage && <ErrorToast message={errorMessage} onRetry={() => refetch()} />}
    </>
  )
}

function Metric({ label, value, alert }: { label: string; value: number; alert?: boolean }) {
  return (
    <div className="bg-surface border-[0.5px] border-line rounded-DEFAULT p-[13px_15px]">
      <div className="text-[12px] text-ink-2">{label}</div>
      <div className={`text-[24px] font-semibold mt-[3px] num tracking-[-0.01em] ${alert ? 'text-risk-high' : ''}`}>
        {value}
      </div>
    </div>
  )
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`text-[13px] font-medium py-[6px] px-[13px] rounded-pill border-[0.5px] cursor-pointer ${
        active
          ? 'bg-ink text-white border-ink'
          : 'bg-surface text-ink-2 border-line-2 hover:bg-surface-2'
      }`}
    >
      {label}
    </button>
  )
}

function QueueRow({ patient, onClick }: { patient: PatientSummary; onClick: () => void }) {
  const avatarHighRisk = patient.risk_level === 'high'

  return (
    <tr
      onClick={onClick}
      className={`border-b-[0.5px] border-line last:border-b-0 cursor-pointer transition-colors duration-[120ms] hover:bg-surface-2 ${
        patient.needs_review ? 'shadow-[inset_3px_0_0_var(--risk-high)]' : ''
      }`}
    >
      <td className="p-[12px_14px] align-middle">
        <div className="flex items-center gap-[11px]">
          <span className="font-bold text-ink-3 num w-[26px] inline-block">{patient.queue_rank}</span>
          <span
            className={`w-[34px] h-[34px] rounded-[10px] flex-none grid place-items-center text-[12px] font-semibold ${
              avatarHighRisk ? 'bg-risk-high-bg text-risk-high' : 'bg-surface-2 text-ink-2'
            }`}
          >
            {patient.initials}
          </span>
          <span>
            <span className="font-semibold text-[14px] tracking-[-0.01em]">{patient.name}</span>
            <br />
            <span className="text-[12px] text-ink-3">{patient.age} / {patient.sex}</span>
          </span>
        </div>
      </td>
      <td className="p-[12px_14px] align-middle hidden md:table-cell text-[13px]">{patient.diagnosis}</td>
      <td className="p-[12px_14px] align-middle">
        <RiskBadge level={patient.risk_level} />
      </td>
      <td className="p-[12px_14px] align-middle">
        <UrgencyPill level={patient.urgency} />
      </td>
      <td className="p-[12px_14px] align-middle text-right hidden md:table-cell">
        <span className="font-semibold num">{patient.readmission_pct}%</span>
      </td>
      <td className="p-[12px_14px] align-middle">
        <span className="flex items-center gap-[7px] text-[13px] text-ink-2">
          <span
            className={`w-[7px] h-[7px] rounded-full flex-none ${
              patient.last_signal_new ? 'bg-risk-high' : 'bg-ink-3 opacity-50'
            }`}
          />
          {patient.last_signal}
        </span>
      </td>
      <td className="p-[12px_14px] align-middle hidden md:table-cell">
        <OwnerChip owner={patient.owner} label={patient.owner_label} />
      </td>
    </tr>
  )
}
