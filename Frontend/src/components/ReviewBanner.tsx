import { useEffect, useRef } from 'react'
import { ShieldCheck } from 'lucide-react'

interface Props {
  reason: string
  flash?: boolean
}

export default function ReviewBanner({ reason, flash }: Props) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    if (flash && ref.current) {
      ref.current.classList.remove('animate-banner-flash')
      void ref.current.offsetWidth
      ref.current.classList.add('animate-banner-flash')
    }
  }, [flash, reason])

  return (
    <section
      ref={ref}
      className="flex items-start gap-[12px] mt-[12px] bg-risk-high-bg border-[0.5px] border-risk-high-line border-l-[3px] border-l-risk-high rounded-DEFAULT p-[13px_16px]"
      role="status"
      aria-label="Human review status"
    >
      <ShieldCheck className="w-[19px] h-[19px] text-risk-high flex-none mt-[1px]" />
      <div>
        <div className="font-semibold text-risk-high text-[14px]">Needs human review</div>
        <div className="text-risk-high text-[13px] mt-[3px] leading-[1.45]">{reason}</div>
      </div>
    </section>
  )
}
