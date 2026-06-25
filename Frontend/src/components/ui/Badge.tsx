import type { ReactNode } from 'react'

interface BadgeProps {
  children: ReactNode
  variant?: 'risk-high' | 'warn' | 'ok' | 'info' | 'neutral'
  className?: string
}

const variantClasses: Record<NonNullable<BadgeProps['variant']>, string> = {
  'risk-high': 'bg-risk-high-bg text-risk-high border-risk-high-line',
  warn: 'bg-warn-bg text-warn border-warn-line',
  ok: 'bg-ok-bg text-ok border-ok-line',
  info: 'bg-info-bg text-info border-info-line',
  neutral: 'bg-surface-2 text-ink-2 border-transparent',
}

export default function Badge({ children, variant = 'neutral', className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-[5px] text-[12.5px] font-semibold px-[11px] py-[5px] rounded-pill border-[0.5px] whitespace-nowrap ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  )
}
