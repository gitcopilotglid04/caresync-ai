import { CheckSquare } from 'lucide-react'
import { Panel, PanelHeader } from '../ui'
import type { CarePlan } from '../../api/types'

interface Props {
  data: CarePlan
}

export default function CarePlanPanel({ data }: Props) {
  return (
    <Panel>
      <PanelHeader
        icon={<CheckSquare className="w-[15px] h-[15px]" />}
        title="Care plan"
        agent="Agent 1"
      />
      <KV label="Medications" value={data.medications} />
      <KV label="Follow-up" value={data.follow_up} />
      <KV label="Complexity" value={`${data.complexity} / 10`} numeric />
    </Panel>
  )
}

function KV({ label, value, numeric }: { label: string; value: string; numeric?: boolean }) {
  return (
    <div className="flex justify-between gap-[10px] py-[7px] border-b-[0.5px] border-line text-[13px] last:border-b-0">
      <span className="text-ink-2">{label}</span>
      <span className={`text-right font-medium ${numeric ? 'num' : ''}`}>{value}</span>
    </div>
  )
}
