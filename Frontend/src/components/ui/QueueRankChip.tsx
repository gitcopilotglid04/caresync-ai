import Badge from './Badge'

interface QueueRankChipProps {
  rank: number
}

export default function QueueRankChip({ rank }: QueueRankChipProps) {
  return (
    <Badge variant="neutral" className="num">
      Queue #{rank}
    </Badge>
  )
}
