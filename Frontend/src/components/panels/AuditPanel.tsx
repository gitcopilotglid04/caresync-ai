import { FileText } from 'lucide-react'
import { Panel, PanelHeader, Code } from '../ui'
import type { Audit } from '../../api/types'

interface Props {
  data: Audit
}

export default function AuditPanel({ data }: Props) {
  return (
    <Panel>
      <PanelHeader
        icon={<FileText className="w-[15px] h-[15px]" />}
        title="Audit & explainability"
      />
      <KV label="Model" value={data.model} mono />
      <KV
        label="Latency · agents"
        value={`${data.latency_ms.toLocaleString()} ms · ${data.agents_passed}/${data.agents_total}`}
        numeric
      />
      <KV label="Claims blocked" value={String(data.claims_blocked)} numeric />
      <div className="flex justify-between gap-[10px] py-[7px] text-[13px]">
        <span className="text-ink-2">Rules fired</span>
        <div className="flex flex-wrap gap-[5px] justify-end">
          {data.rules_fired.map((rule) => (
            <Code key={rule}>{rule}</Code>
          ))}
        </div>
      </div>
    </Panel>
  )
}

function KV({ label, value, mono, numeric }: { label: string; value: string; mono?: boolean; numeric?: boolean }) {
  return (
    <div className="flex justify-between gap-[10px] py-[7px] border-b-[0.5px] border-line text-[13px] last:border-b-0">
      <span className="text-ink-2">{label}</span>
      <span className={`text-right ${mono ? 'font-mono text-[12px]' : 'font-medium'} ${numeric ? 'num' : ''}`}>
        {value}
      </span>
    </div>
  )
}
