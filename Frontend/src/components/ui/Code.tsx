import type { ReactNode } from 'react'

interface CodeProps {
  children: ReactNode
}

export default function Code({ children }: CodeProps) {
  return (
    <span className="font-mono text-[11.5px] px-[7px] py-[2px] rounded-[5px] bg-surface-2 text-ink-2 inline-block">
      {children}
    </span>
  )
}
