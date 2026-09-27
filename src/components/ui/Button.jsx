import React from "react";
import { cn } from "@/lib/utils";

export const Button = React.forwardRef(
  ({ className, variant = "default", size = "default", disabled = false, loading = false, children, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B1E1E] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none active:scale-[0.98]";

    const variantStyles = {
      default:
        "bg-[#8B1E1E] text-white shadow-sm hover:bg-[#731414] active:bg-[#5C1010] shadow-rose-950/15",
      brandOutline:
        "border border-[#8B1E1E]/30 bg-rose-50/40 text-[#8B1E1E] hover:bg-rose-50 hover:border-[#8B1E1E]",
      secondary:
        "bg-slate-100 text-slate-800 hover:bg-slate-200 active:bg-slate-300",
      outline:
        "border border-slate-200/90 bg-white text-slate-800 shadow-xs hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300",
      ghost:
        "text-slate-700 hover:bg-slate-100 hover:text-slate-900",
      destructive:
        "bg-rose-600 text-white shadow-sm hover:bg-rose-700 active:bg-rose-800",
      success:
        "bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 active:bg-emerald-800",
      link: "text-[#8B1E1E] underline-offset-4 hover:underline p-0 h-auto font-medium",
    };

    const sizeStyles = {
      default: "h-9 px-4 py-2",
      sm: "h-8 rounded-md px-3 text-xs",
      lg: "h-11 rounded-lg px-6 text-base",
      icon: "h-9 w-9 p-0 flex items-center justify-center",
      iconSm: "h-7 w-7 p-0 flex items-center justify-center text-xs",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
