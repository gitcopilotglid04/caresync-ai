import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary'
  children: ReactNode
}

const base = 'inline-flex items-center gap-[6px] text-[13.5px] font-semibold py-[9px] px-[15px] rounded-sm cursor-pointer border-[0.5px]'

const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
  default: 'border-line-2 bg-surface text-ink hover:bg-surface-2',
  primary: 'border-brand bg-brand text-white hover:bg-brand-ink disabled:opacity-55 disabled:cursor-default',
}

export default function Button({ variant = 'default', children, className = '', ...props }: ButtonProps) {
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  )
}
