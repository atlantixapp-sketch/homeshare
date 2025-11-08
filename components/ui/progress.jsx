'use client'

import React from 'react'
import { clsx } from 'clsx'

const Progress = React.forwardRef(({ className, value = 0, ...props }, ref) => (
  <div
    ref={ref}
    className={clsx("progress", className)}
    {...props}
  >
    <div
      className="progress-fill"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </div>
))
Progress.displayName = "Progress"

export { Progress }