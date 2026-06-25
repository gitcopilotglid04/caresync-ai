import { Calendar } from 'lucide-react'
import { Panel, PanelHeader, OwnerChip } from '../ui'
import type { TimelineCheckpoint } from '../../api/types'

interface Props {
  checkpoints: TimelineCheckpoint[]
}

export default function TimelinePanel({ checkpoints }: Props) {
  return (
    <Panel>
      <PanelHeader
        icon={<Calendar className="w-[15px] h-[15px]" />}
        title="30-day timeline"
      />
      {checkpoints.map((cp) => (
        <div
          key={cp.day}
          className="flex items-center gap-[10px] py-[7px] border-b-[0.5px] border-line text-[13px] last:border-b-0"
        >
          <span className="font-semibold text-brand-ink min-w-[46px] num">Day {cp.day}</span>
          <span className="flex-1 text-ink">{cp.action}</span>
          <OwnerChip owner={cp.owner} />
        </div>
      ))}
    </Panel>
  )
}
