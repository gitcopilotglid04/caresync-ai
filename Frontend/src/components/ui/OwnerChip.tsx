import Chip from './Chip'

type Owner = 'ai' | 'human' | 'nurse' | 'doctor' | 'patient'

interface OwnerChipProps {
  owner: Owner
  label?: string
}

const config: Record<Owner, { variant: 'ai' | 'human' | 'default'; label: string }> = {
  ai: { variant: 'ai', label: 'AI' },
  human: { variant: 'human', label: 'human' },
  nurse: { variant: 'default', label: 'nurse' },
  doctor: { variant: 'default', label: 'doctor' },
  patient: { variant: 'default', label: 'patient' },
}

export default function OwnerChip({ owner, label }: OwnerChipProps) {
  const { variant, label: defaultLabel } = config[owner]
  return <Chip variant={variant}>{label ?? defaultLabel}</Chip>
}
