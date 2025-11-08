import React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { clsx } from 'clsx'

const Button = React.forwardRef(({ 
  className, 
  variant = "primary", 
  size = "md", 
  asChild = false, 
  ...props 
}, ref) => {
  const Comp = asChild ? Slot : "button"
  
  return (
    <Comp
      className={clsx(
        "btn",
        {
          "btn-primary": variant === "primary",
          "btn-destructive": variant === "destructive",
          "btn-sm": size === "sm",
          "btn-md": size === "md",
          "btn-lg": size === "lg",
        },
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Button.displayName = "Button"

export { Button }