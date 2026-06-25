interface SkeletonProps {
  className?: string
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`bg-surface-2 rounded-sm animate-pulse ${className}`}
      aria-hidden="true"
    />
  )
}

export function QueueRowSkeleton() {
  return (
    <tr className="border-b-[0.5px] border-line last:border-b-0">
      <td className="p-[12px_14px]">
        <div className="flex items-center gap-[11px]">
          <Skeleton className="w-[26px] h-[16px]" />
          <Skeleton className="w-[34px] h-[34px] rounded-[10px]" />
          <div className="flex flex-col gap-[4px]">
            <Skeleton className="w-[120px] h-[14px]" />
            <Skeleton className="w-[50px] h-[12px]" />
          </div>
        </div>
      </td>
      <td className="p-[12px_14px] hidden md:table-cell"><Skeleton className="w-[80px] h-[14px]" /></td>
      <td className="p-[12px_14px]"><Skeleton className="w-[60px] h-[24px] rounded-pill" /></td>
      <td className="p-[12px_14px]"><Skeleton className="w-[80px] h-[24px] rounded-pill" /></td>
      <td className="p-[12px_14px] hidden md:table-cell"><Skeleton className="w-[40px] h-[14px] ml-auto" /></td>
      <td className="p-[12px_14px]"><Skeleton className="w-[140px] h-[14px]" /></td>
      <td className="p-[12px_14px] hidden md:table-cell"><Skeleton className="w-[70px] h-[20px] rounded-sm" /></td>
    </tr>
  )
}

export function PanelSkeleton() {
  return (
    <div className="bg-surface border-[0.5px] border-line rounded-DEFAULT p-[15px_17px] shadow">
      <Skeleton className="w-[120px] h-[13px] mb-[14px]" />
      <div className="flex flex-col gap-[10px]">
        <Skeleton className="w-full h-[13px]" />
        <Skeleton className="w-[80%] h-[13px]" />
        <Skeleton className="w-[60%] h-[13px]" />
      </div>
    </div>
  )
}

export function DetailHeaderSkeleton() {
  return (
    <div className="flex items-center gap-[16px] flex-wrap bg-surface border-[0.5px] border-line rounded-DEFAULT p-[14px_18px] shadow-sticky">
      <Skeleton className="w-[46px] h-[46px] rounded-[13px]" />
      <div className="flex flex-col gap-[4px]">
        <Skeleton className="w-[160px] h-[21px]" />
        <Skeleton className="w-[200px] h-[13px]" />
      </div>
      <div className="ml-auto flex gap-[8px] flex-wrap">
        <Skeleton className="w-[80px] h-[28px] rounded-pill" />
        <Skeleton className="w-[100px] h-[28px] rounded-pill" />
        <Skeleton className="w-[90px] h-[28px] rounded-pill" />
      </div>
    </div>
  )
}
