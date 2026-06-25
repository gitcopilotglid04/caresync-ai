import type { ReactNode } from 'react'

interface ChipProps {
  children: ReactNode
  variant?: 'default' | 'ai' | 'human' | 'approve'
  className?: string
}

const variantClasses: Record<NonNullable<ChipProps['variant']>, string> = {
  default: 'bg-surface-2 text-ink-2',
  ai: 'bg-ok-bg text-ok',
  human: 'bg-risk-high-bg text-risk-high',
  approve: 'bg-info-bg text-info',
}

export default function Chip({ children, variant = 'default', className = '' }: ChipProps) {
  return (
    <span
      className={`text-[11.5px] font-medium px-[9px] py-[3px] rounded-sm whitespace-nowrap ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  )
}
