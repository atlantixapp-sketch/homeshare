import React from 'react'
import { clsx } from 'clsx'

const Badge = React.forwardRef(({ className, variant = "default", ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={clsx(
        "badge",
        {
          "badge-default": variant === "default",
          "badge-success": variant === "success",
          "badge-destructive": variant === "destructive",
        },
        className
      )}
      {...props}
    />
  )
})
Badge.displayName = "Badge"

export { Badge }