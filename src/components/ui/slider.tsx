"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center",
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-oklch(0.21 0.006 285.885)/20 dark:bg-oklch(0.92 0.004 286.32)/20">
      <SliderPrimitive.Range className="absolute h-full bg-oklch(0.21 0.006 285.885) dark:bg-oklch(0.92 0.004 286.32)" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="block h-4 w-4 rounded-full border border-oklch(0.92 0.004 286.32) border-oklch(0.21 0.006 285.885)/50 bg-oklch(1 0 0) shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-oklch(0.705 0.015 286.067) disabled:pointer-events-none disabled:opacity-50 dark:border-oklch(1 0 0 / 10%) dark:border-oklch(0.92 0.004 286.32)/50 dark:bg-oklch(0.141 0.005 285.823) dark:focus-visible:ring-oklch(0.552 0.016 285.938)" />
  </SliderPrimitive.Root>
))
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
