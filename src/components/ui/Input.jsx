import React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef(
  ({ className, type = "text", error, startIcon: StartIcon, endIcon: EndIcon, ...props }, ref) => {
    return (
      <div className="relative w-full">
        {StartIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <StartIcon className="h-4 w-4" />
          </div>
        )}
        <input
          type={type}
          ref={ref}
          className={cn(
            "flex h-9 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 shadow-2xs transition-colors placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B1E1E] focus-visible:border-[#8B1E1E] disabled:cursor-not-allowed disabled:opacity-50",
            StartIcon && "pl-9",
            EndIcon && "pr-9",
            error && "border-rose-500 focus-visible:ring-rose-500",
            className
          )}
          {...props}
        />
        {EndIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
            <EndIcon className="h-4 w-4" />
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
