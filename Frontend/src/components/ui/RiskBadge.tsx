import { AlertTriangle } from 'lucide-react'
import Badge from './Badge'

type RiskLevel = 'low' | 'medium' | 'high'

interface RiskBadgeProps {
  level: RiskLevel
}

const config: Record<RiskLevel, { variant: 'ok' | 'warn' | 'risk-high'; label: string }> = {
  low: { variant: 'ok', label: 'Low' },
  medium: { variant: 'warn', label: 'Medium' },
  high: { variant: 'risk-high', label: 'High' },
}

export default function RiskBadge({ level }: RiskBadgeProps) {
  const { variant, label } = config[level]
  return (
    <Badge variant={variant}>
      {level === 'high' && <AlertTriangle className="w-[13px] h-[13px]" />}
      Risk: {label.toLowerCase()}
    </Badge>
  )
}
