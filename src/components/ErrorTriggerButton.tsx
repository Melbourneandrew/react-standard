"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";
import { useId, useState } from "react";

type ErrorTriggerButtonProps = {
  tooltip?: string;
  onTrigger: () => void | Promise<void>;
} & Omit<ComponentProps<typeof Button>, "onClick">;

/**
 * Shared button that triggers a synthetic error with an accessible tooltip.
 * Keeps the error button styling consistent across dialogs.
 */
export function ErrorTriggerButton({
  tooltip = "Trigger example error",
  onTrigger,
  className,
  variant = "outline",
  ...buttonProps
}: ErrorTriggerButtonProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipId = useId();

  const show = () => setShowTooltip(true);
  const hide = () => setShowTooltip(false);

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      <Button
        variant={variant}
        onClick={onTrigger}
        className={cn(
          "border-destructive text-destructive hover:bg-destructive/10",
          className
        )}
        aria-describedby={showTooltip ? tooltipId : undefined}
        {...buttonProps}
      >
        Error
      </Button>
      <span
        id={tooltipId}
        role="tooltip"
        className={cn(
          "pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-destructive px-2 py-1 text-xs text-white shadow transition-opacity duration-150",
          showTooltip ? "opacity-100" : "opacity-0"
        )}
      >
        {tooltip}
      </span>
    </div>
  );
}
