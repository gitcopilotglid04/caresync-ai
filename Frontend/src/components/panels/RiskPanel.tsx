import { Activity } from 'lucide-react'
import { Panel, PanelHeader } from '../ui'
import type { RiskFactor } from '../../api/types'

interface Props {
  factors: RiskFactor[]
}

export default function RiskPanel({ factors }: Props) {
  return (
    <Panel>
      <PanelHeader
        icon={<Activity className="w-[15px] h-[15px]" />}
        title="Risk & evidence"
        agent="Agent 2"
      />
      {factors.map((f) => (
        <div key={f.name} className="py-[8px] border-b-[0.5px] border-line last:border-b-0">
          <div className="text-[13px] font-medium">{f.name}</div>
          <div className="text-[12px] text-ink-3 mt-[2px] italic">{f.evidence}</div>
        </div>
      ))}
    </Panel>
  )
}
