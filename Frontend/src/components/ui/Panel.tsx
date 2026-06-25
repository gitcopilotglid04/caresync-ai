import type { ReactNode } from 'react'

interface PanelProps {
  children: ReactNode
  className?: string
}

export default function Panel({ children, className = '' }: PanelProps) {
  return (
    <section
      className={`bg-surface border-[0.5px] border-line rounded-DEFAULT p-[15px_17px] shadow ${className}`}
    >
      {children}
    </section>
  )
}

interface PanelHeaderProps {
  icon?: ReactNode
  title: string
  agent?: string
}

export function PanelHeader({ icon, title, agent }: PanelHeaderProps) {
  return (
    <h3 className="m-0 mb-[11px] text-[12.5px] font-semibold text-ink-2 tracking-[0.02em] flex items-center gap-[7px]">
      {icon && <span className="w-[15px] h-[15px] text-ink-3">{icon}</span>}
      {title}
      {agent && <span className="ml-auto text-[11px] font-medium text-ink-3">{agent}</span>}
    </h3>
  )
}
