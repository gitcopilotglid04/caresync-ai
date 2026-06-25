import { MessageSquare } from 'lucide-react'
import { Panel, PanelHeader, Chip } from '../ui'
import type { MessageDraft } from '../../api/types'

interface Props {
  messages: MessageDraft[]
}

export default function MessagesPanel({ messages }: Props) {
  return (
    <Panel>
      <PanelHeader
        icon={<MessageSquare className="w-[15px] h-[15px]" />}
        title="Message drafts"
        agent="Agent 3"
      />
      {messages.map((m) => (
        <div
          key={m.day}
          className="flex justify-between gap-[10px] py-[7px] border-b-[0.5px] border-line text-[13px] last:border-b-0"
        >
          <span className="text-ink-2">Day {m.day} · {m.content}</span>
          <Chip variant="approve">needs approval</Chip>
        </div>
      ))}
    </Panel>
  )
}
