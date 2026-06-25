import { Users, Plus } from 'lucide-react'
import { Button } from './ui'

interface Props {
  onAddPatient: () => void
}

export default function EmptyQueue({ onAddPatient }: Props) {
  return (
    <div className="bg-surface border-[0.5px] border-line rounded-DEFAULT shadow p-[48px_24px] text-center">
      <div className="w-[48px] h-[48px] rounded-full bg-surface-2 grid place-items-center mx-auto mb-[14px]">
        <Users className="w-[22px] h-[22px] text-ink-3" />
      </div>
      <h2 className="text-[16px] font-semibold text-ink m-0 mb-[4px]">No patients yet</h2>
      <p className="text-[13px] text-ink-2 m-0 mb-[16px]">
        Add a discharged patient to start building their care plan.
      </p>
      <Button variant="primary" onClick={onAddPatient}>
        <Plus className="w-[14px] h-[14px]" strokeWidth={2.4} />
        New patient
      </Button>
    </div>
  )
}
