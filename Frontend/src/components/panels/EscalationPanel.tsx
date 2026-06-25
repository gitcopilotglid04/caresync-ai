import { ArrowUpRight } from 'lucide-react'
import { Panel, PanelHeader, Chip } from '../ui'
import type { EscalationItem } from '../../api/types'

interface Props {
  items: EscalationItem[]
}

export default function EscalationPanel({ items }: Props) {
  return (
    <Panel>
      <PanelHeader
        icon={<ArrowUpRight className="w-[15px] h-[15px]" />}
        title="Escalation"
        agent="Agent 4"
      />
      {items.map((item) => (
        <div key={item.concern} className="py-[8px] border-b-[0.5px] border-line last:border-b-0">
          <div className="flex justify-between gap-[10px] items-center">
            <span className="text-[13px]">{item.concern}</span>
            <Chip variant={item.owner === 'human' ? 'human' : 'ai'}>
              {item.owner === 'human' ? 'human' : 'AI'} · {item.urgency}
            </Chip>
          </div>
          <div className="text-[12px] text-ink-3 mt-[3px]">{item.reason}</div>
        </div>
      ))}
    </Panel>
  )
}
