import Badge from './Badge'

type UrgencyLevel = 'routine' | 'soon' | 'urgent' | 'immediate'

interface UrgencyPillProps {
  level: UrgencyLevel
}

const config: Record<UrgencyLevel, { variant: 'ok' | 'info' | 'warn' | 'risk-high'; label: string }> = {
  routine: { variant: 'ok', label: 'Routine' },
  soon: { variant: 'info', label: 'Soon' },
  urgent: { variant: 'warn', label: 'Urgent' },
  immediate: { variant: 'risk-high', label: 'Immediate' },
}

export default function UrgencyPill({ level }: UrgencyPillProps) {
  const { variant, label } = config[level]
  return (
    <Badge variant={variant}>
      Urgency: {label.toLowerCase()}
    </Badge>
  )
}
