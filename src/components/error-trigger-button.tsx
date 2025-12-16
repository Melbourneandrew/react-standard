"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={variant}
          onClick={onTrigger}
          className={cn(
            "border-destructive text-destructive hover:bg-destructive/10",
            className,
          )}
          {...buttonProps}
        >
          Error
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{tooltip}</TooltipContent>
    </Tooltip>
  );
}
