import { AlertTriangle, RefreshCw, X } from 'lucide-react'
import { useState } from 'react'

interface ErrorToastProps {
  message: string
  onRetry?: () => void
  onDismiss?: () => void
}

export default function ErrorToast({ message, onRetry, onDismiss }: ErrorToastProps) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  function handleDismiss() {
    setDismissed(true)
    onDismiss?.()
  }

  return (
    <div
      role="alert"
      className="fixed bottom-[20px] right-[20px] z-50 max-w-[420px] bg-surface border-[0.5px] border-risk-high-line rounded-DEFAULT shadow-modal p-[14px_16px] flex items-start gap-[10px]"
    >
      <AlertTriangle className="w-[18px] h-[18px] text-risk-high flex-none mt-[1px]" />
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold text-risk-high">Something went wrong</div>
        <div className="text-[12.5px] text-ink-2 mt-[2px] leading-[1.45]">{message}</div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-[8px] inline-flex items-center gap-[5px] text-[12.5px] font-medium text-brand bg-none border-none cursor-pointer p-0 hover:text-brand-ink hover:underline"
          >
            <RefreshCw className="w-[12px] h-[12px]" />
            Retry
          </button>
        )}
      </div>
      <button
        onClick={handleDismiss}
        className="border-none bg-none cursor-pointer text-ink-3 p-[2px] rounded-[4px] leading-[0] hover:bg-surface-2 hover:text-ink"
        aria-label="Dismiss"
      >
        <X className="w-[14px] h-[14px]" />
      </button>
    </div>
  )
}
