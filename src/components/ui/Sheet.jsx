import React, { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Sheet({ open, onOpenChange, children, side = "right" }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && open) {
        onOpenChange?.(false);
      }
    };
    if (open) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300"
        onClick={() => onOpenChange?.(false)}
      />
      {/* Drawer Panel */}
      <div className="relative z-10 w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-drawer-in overflow-hidden">
        {children}
      </div>
    </div>
  );
}

export function SheetHeader({ className, children, onClose, ...props }) {
  return (
    <div
      className={cn(
        "flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70",
        className
      )}
      {...props}
    >
      <div className="flex-1 min-w-0 pr-4">{children}</div>
      {onClose && (
        <button
          onClick={onClose}
          type="button"
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition-colors"
          aria-label="Close panel"
        >
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}

export function SheetTitle({ className, ...props }) {
  return (
    <h2
      className={cn("text-lg font-semibold text-slate-900 leading-tight", className)}
      {...props}
    />
  );
}

export function SheetDescription({ className, ...props }) {
  return (
    <p
      className={cn("text-xs text-slate-500 mt-0.5", className)}
      {...props}
    />
  );
}

export function SheetContent({ className, ...props }) {
  return (
    <div
      className={cn("flex-1 overflow-y-auto px-6 py-5 text-slate-900 bg-white", className)}
      {...props}
    />
  );
}

export function SheetFooter({ className, ...props }) {
  return (
    <div
      className={cn(
        "flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/70",
        className
      )}
      {...props}
    />
  );
}
