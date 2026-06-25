import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Check, AlertTriangle } from 'lucide-react'
import { coordinate, ApiError } from '../api/client'
import { Button } from './ui'

const SAMPLE_SUMMARY =
  'Patient Rajesh Kumar, 68/M, admitted with chest pain and diagnosed with NSTEMI; stabilized and discharged today. Discharge meds: Aspirin 75 mg OD, Clopidogrel 75 mg OD, Atorvastatin 40 mg HS, Metformin 500 mg BD. Follow-up: Cardiology OPD in 1 week with repeat ECG; advised low-salt diabetic diet and no heavy exertion for 4 weeks. Social note: patient lives alone, daughter out of city, home nurse visit recommended.'

interface Agent {
  name: string
  label: string
  state: 'queued' | 'running' | 'done'
}

const INITIAL_AGENTS: Agent[] = [
  { name: 'Care planner', label: 'Agent 1', state: 'queued' },
  { name: 'Risk assessor', label: 'Agent 2', state: 'queued' },
  { name: 'Communication drafter', label: 'Agent 3', state: 'queued' },
  { name: 'Escalation + safety floor', label: 'Agent 4', state: 'queued' },
]

type ModalState = 'input' | 'running' | 'done' | 'error'

interface Props {
  open: boolean
  onClose: () => void
}

export default function IntakeModal({ open, onClose }: Props) {
  const navigate = useNavigate()
  const [modalState, setModalState] = useState<ModalState>('input')
  const [summary, setSummary] = useState('')
  const [language, setLanguage] = useState('English')
  const [channel, setChannel] = useState('WhatsApp')
  const [caregiver, setCaregiver] = useState(false)
  const [agents, setAgents] = useState<Agent[]>(INITIAL_AGENTS)
  const [patientId, setPatientId] = useState<string | null>(null)
  const [pipelineError, setPipelineError] = useState<string | null>(null)
  const runningRef = useRef(false)

  if (!open) return null

  function handleClose() {
    if (modalState === 'running') return
    resetState()
    onClose()
  }

  function resetState() {
    setModalState('input')
    setSummary('')
    setLanguage('English')
    setChannel('WhatsApp')
    setCaregiver(false)
    setAgents(INITIAL_AGENTS)
    setPatientId(null)
    setPipelineError(null)
  }

  async function handleRun() {
    if (runningRef.current) return
    runningRef.current = true
    setModalState('running')
    setAgents(INITIAL_AGENTS)

    for (let i = 0; i < 4; i++) {
      setAgents((prev) =>
        prev.map((a, idx) =>
          idx === i ? { ...a, state: 'running' } : idx < i ? { ...a, state: 'done' } : a
        )
      )
      await new Promise((r) => setTimeout(r, 780))
    }

    setAgents((prev) => prev.map((a) => ({ ...a, state: 'done' })))

    try {
      const res = await coordinate({
        discharge_summary: summary,
        patient_context: { language, channel, caregiver_available: caregiver },
      })
      setPatientId(res.patient.id)
      setModalState('done')
    } catch (err) {
      const msg = err instanceof ApiError
        ? err.message
        : 'Pipeline failed unexpectedly. Please try again.'
      setPipelineError(msg)
      setModalState('error')
    }

    runningRef.current = false
  }

  function handleViewPatient() {
    const id = patientId ?? 'rajesh-kumar'
    resetState()
    onClose()
    navigate(`/patient/${id}`)
  }

  return (
    <div
      className="fixed inset-0 bg-[rgba(24,34,47,0.45)] flex items-center justify-center p-[20px] z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="intake-title"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
    >
      <div className="w-full max-w-[560px] bg-surface rounded-DEFAULT shadow-modal overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between gap-[12px] p-[16px_20px] border-b-[0.5px] border-line">
          <div id="intake-title">
            <div className="text-[16px] font-semibold tracking-[-0.01em]">New patient</div>
            <div className="text-[12.5px] font-normal text-ink-2 mt-[2px]">
              Paste a discharge summary to run the care pipeline.
            </div>
          </div>
          <button
            onClick={handleClose}
            className="border-none bg-none cursor-pointer text-ink-3 p-[4px] rounded-[6px] leading-[0] hover:bg-surface-2 hover:text-ink"
            aria-label="Close"
          >
            <X className="w-[18px] h-[18px]" />
          </button>
        </div>

        {/* Body */}
        {modalState === 'input' && (
          <div className="p-[18px_20px]">
            <div className="flex items-center justify-between text-[12.5px] font-semibold text-ink-2 mb-[6px]">
              <label htmlFor="discharge-summary">Discharge summary</label>
              <button
                type="button"
                onClick={() => setSummary(SAMPLE_SUMMARY)}
                className="text-[12.5px] font-medium text-brand bg-none border-none cursor-pointer p-0 hover:text-brand-ink hover:underline"
              >
                Load sample
              </button>
            </div>
            <textarea
              id="discharge-summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Paste the patient's discharge summary here — diagnosis, medications, follow-up, and any social notes."
              className="w-full min-h-[128px] resize-y p-[11px_12px] font-[inherit] text-[13px] text-ink bg-surface border-[0.5px] border-line-2 rounded-sm leading-[1.5] placeholder:text-ink-3 focus:outline-none focus:border-brand focus:shadow-[0_0_0_3px_var(--brand-bg)]"
            />
            <div className="grid grid-cols-2 gap-[12px] mt-[14px] max-[520px]:grid-cols-1">
              <div>
                <div className="text-[12.5px] font-semibold text-ink-2 mb-[6px]">Preferred language</div>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full p-[9px_11px] font-[inherit] text-[13px] text-ink bg-surface border-[0.5px] border-line-2 rounded-sm cursor-pointer focus:outline-none focus:border-brand focus:shadow-[0_0_0_3px_var(--brand-bg)]"
                >
                  <option>English</option>
                  <option>Hindi</option>
                  <option>Tamil</option>
                  <option>Kannada</option>
                </select>
              </div>
              <div>
                <div className="text-[12.5px] font-semibold text-ink-2 mb-[6px]">Message channel</div>
                <select
                  value={channel}
                  onChange={(e) => setChannel(e.target.value)}
                  className="w-full p-[9px_11px] font-[inherit] text-[13px] text-ink bg-surface border-[0.5px] border-line-2 rounded-sm cursor-pointer focus:outline-none focus:border-brand focus:shadow-[0_0_0_3px_var(--brand-bg)]"
                >
                  <option>WhatsApp</option>
                  <option>SMS</option>
                  <option>Email</option>
                </select>
              </div>
              <div className="col-span-full">
                <label className="flex items-center gap-[9px] text-[13px] text-ink cursor-pointer select-none pt-[6px]">
                  <input
                    type="checkbox"
                    checked={caregiver}
                    onChange={(e) => setCaregiver(e.target.checked)}
                    className="absolute opacity-0 w-0 h-0 peer"
                  />
                  <span className="w-[36px] h-[20px] rounded-pill bg-line-2 relative transition-colors duration-[180ms] flex-none peer-checked:bg-brand after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:w-[16px] after:h-[16px] after:rounded-full after:bg-white after:transition-transform after:duration-[180ms] peer-checked:after:translate-x-[16px]" />
                  Caregiver available at home
                </label>
              </div>
            </div>
          </div>
        )}

        {(modalState === 'running' || modalState === 'done' || modalState === 'error') && (
          <div className="p-[24px_20px]">
            {agents.map((agent) => (
              <div
                key={agent.name}
                className={`flex items-center gap-[12px] p-[11px_4px] border-b-[0.5px] border-line last:border-b-0 ${
                  agent.state === 'queued' ? '' : ''
                }`}
              >
                <span className="w-[22px] h-[22px] flex-none grid place-items-center">
                  {agent.state === 'queued' && (
                    <span className="w-[9px] h-[9px] rounded-full bg-line-2" />
                  )}
                  {agent.state === 'running' && (
                    <span className="w-[16px] h-[16px] border-2 border-brand-bg border-t-brand rounded-full animate-spin" />
                  )}
                  {agent.state === 'done' && (
                    <Check className="w-[16px] h-[16px] text-ok" strokeWidth={2.4} />
                  )}
                </span>
                <span className={`text-[13.5px] font-medium ${agent.state === 'queued' ? 'text-ink-3' : 'text-ink'}`}>
                  {agent.name}
                  <span className="text-[12px] text-ink-3 font-normal ml-[6px]">{agent.label}</span>
                </span>
                <span className="ml-auto text-[12px] text-ink-3 num">
                  {agent.state}
                </span>
              </div>
            ))}

            {modalState === 'done' && (
              <div className="mt-[14px] p-[13px_15px] rounded-sm bg-ok-bg border-[0.5px] border-ok-line flex items-start gap-[10px]">
                <Check className="w-[18px] h-[18px] text-ok flex-none mt-[1px]" strokeWidth={2.2} />
                <div>
                  <div className="font-semibold text-ok text-[13.5px]">Care plan ready</div>
                  <div className="text-[12.5px] text-ink-2 mt-[2px]">
                    Risk: high · human review required · 4 agents passed
                  </div>
                </div>
              </div>
            )}

            {modalState === 'error' && (
              <div className="mt-[14px] p-[13px_15px] rounded-sm bg-risk-high-bg border-[0.5px] border-risk-high-line flex items-start gap-[10px]">
                <AlertTriangle className="w-[18px] h-[18px] text-risk-high flex-none mt-[1px]" strokeWidth={2.2} />
                <div>
                  <div className="font-semibold text-risk-high text-[13.5px]">Pipeline failed</div>
                  <div className="text-[12.5px] text-ink-2 mt-[2px]">{pipelineError}</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        {modalState === 'input' && (
          <div className="flex justify-end gap-[9px] p-[14px_20px] border-t-[0.5px] border-line bg-surface">
            <Button onClick={handleClose}>Cancel</Button>
            <Button variant="primary" onClick={handleRun} disabled={!summary.trim()}>
              Run pipeline
            </Button>
          </div>
        )}

        {modalState === 'done' && (
          <div className="flex justify-end gap-[9px] p-[14px_20px] border-t-[0.5px] border-line bg-surface">
            <Button variant="primary" onClick={handleViewPatient}>
              View patient
            </Button>
          </div>
        )}

        {modalState === 'error' && (
          <div className="flex justify-end gap-[9px] p-[14px_20px] border-t-[0.5px] border-line bg-surface">
            <Button onClick={handleClose}>Close</Button>
            <Button variant="primary" onClick={() => { resetState(); }}>
              Try again
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
