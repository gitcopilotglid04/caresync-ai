import {
  Badge,
  Chip,
  Panel,
  PanelHeader,
  Button,
  Code,
  RiskBadge,
  UrgencyPill,
  OwnerChip,
  QueueRankChip,
} from '../components/ui'
import { Activity, CheckSquare, FileText } from 'lucide-react'

export default function PreviewPage() {
  return (
    <div className="max-w-[var(--maxw)] mx-auto p-[22px]">
      <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-ink mb-[6px]">
        Primitives showcase
      </h1>
      <p className="text-[13.5px] text-ink-2 mb-[22px]">
        All CareSync UI primitives in every variant. Matches reference HTML.
      </p>

      {/* RiskBadge */}
      <Section title="RiskBadge">
        <RiskBadge level="low" />
        <RiskBadge level="medium" />
        <RiskBadge level="high" />
      </Section>

      {/* UrgencyPill */}
      <Section title="UrgencyPill">
        <UrgencyPill level="routine" />
        <UrgencyPill level="soon" />
        <UrgencyPill level="urgent" />
        <UrgencyPill level="immediate" />
      </Section>

      {/* OwnerChip */}
      <Section title="OwnerChip">
        <OwnerChip owner="ai" />
        <OwnerChip owner="human" />
        <OwnerChip owner="nurse" />
        <OwnerChip owner="doctor" />
        <OwnerChip owner="patient" />
      </Section>

      {/* QueueRankChip */}
      <Section title="QueueRankChip">
        <QueueRankChip rank={1} />
        <QueueRankChip rank={2} />
        <QueueRankChip rank={3} />
        <QueueRankChip rank={5} />
      </Section>

      {/* Generic Badge */}
      <Section title="Badge (generic)">
        <Badge variant="risk-high">Risk-high</Badge>
        <Badge variant="warn">Warn</Badge>
        <Badge variant="ok">Ok</Badge>
        <Badge variant="info">Info</Badge>
        <Badge variant="neutral">Neutral</Badge>
      </Section>

      {/* Generic Chip */}
      <Section title="Chip (generic)">
        <Chip variant="default">default</Chip>
        <Chip variant="ai">AI · routine</Chip>
        <Chip variant="human">human · urgent</Chip>
        <Chip variant="approve">needs approval</Chip>
      </Section>

      {/* Code (mono rule-code) */}
      <Section title="Code (monospace rule)">
        <Code>HIGH_RISK</Code>
        <Code>LIVES_ALONE</Code>
        <Code>CARDIAC_SYMPTOM_AFTER_CARDIAC_EVENT</Code>
        <Code>MISSED_CRITICAL_MEDICATION</Code>
      </Section>

      {/* Button */}
      <Section title="Button">
        <Button>Cancel</Button>
        <Button variant="primary">Run pipeline</Button>
        <Button variant="primary" disabled>
          Disabled
        </Button>
      </Section>

      {/* Panel */}
      <Section title="Panel">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(296px,1fr))] gap-[13px] w-full">
          <Panel>
            <PanelHeader
              icon={<CheckSquare className="w-[15px] h-[15px]" />}
              title="Care plan"
              agent="Agent 1"
            />
            <div className="text-[13px] text-ink-2">Panel content goes here.</div>
          </Panel>
          <Panel>
            <PanelHeader
              icon={<Activity className="w-[15px] h-[15px]" />}
              title="Risk & evidence"
              agent="Agent 2"
            />
            <div className="text-[13px] text-ink-2">Panel content goes here.</div>
          </Panel>
          <Panel>
            <PanelHeader
              icon={<FileText className="w-[15px] h-[15px]" />}
              title="Audit & explainability"
            />
            <div className="font-mono text-[12px] text-ink-2">
              claude-sonnet-4-6 · 4,200 ms · 4/4
            </div>
          </Panel>
        </div>
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-[24px]">
      <h2 className="text-[12.5px] font-semibold text-ink-3 tracking-[0.02em] uppercase mb-[10px]">
        {title}
      </h2>
      <div className="flex flex-wrap items-center gap-[10px]">{children}</div>
    </div>
  )
}
