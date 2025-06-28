import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface AccessibleBadgeProps {
  children: React.ReactNode
  onRemove?: () => void
  variant?: "default" | "secondary" | "destructive" | "outline"
  className?: string
  ariaLabel?: string
}

export function AccessibleBadge({
  children,
  onRemove,
  variant = "secondary",
  className,
  ariaLabel,
}: AccessibleBadgeProps) {
  return (
    <Badge
      variant={variant}
      className={cn(
        "flex items-center gap-1 focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2",
        "hover:bg-gray-200 dark:hover:bg-gray-700",
        className
      )}
      aria-label={ariaLabel || `${children}`}
    >
      <span className="font-medium">{children}</span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className={cn(
            "h-3 w-3 rounded-sm hover:text-destructive focus:outline-none focus:ring-2 focus:ring-destructive focus:ring-offset-1",
            "transition-colors duration-200"
          )}
          aria-label={`Remove ${children}`}
        >
          <X className="h-3 w-3" aria-hidden="true" />
        </button>
      )}
    </Badge>
  )
}