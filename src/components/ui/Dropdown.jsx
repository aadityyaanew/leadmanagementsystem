"use client";

import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

export function DropdownMenu({ trigger, children, align = "right", className }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <div onClick={() => setOpen(!open)}>{trigger}</div>

      {open && (
        <div
          className={cn(
            "absolute z-40 mt-1.5 w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl transition-all animate-in fade-in zoom-in-95 duration-100",
            align === "right" ? "right-0" : "left-0",
            className
          )}
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export function DropdownMenuItem({ className, children, onClick, danger = false, disabled = false, ...props }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors text-left disabled:opacity-50 disabled:pointer-events-none",
        danger
          ? "text-rose-600 hover:bg-rose-50"
          : "text-slate-700 hover:bg-slate-100 hover:text-slate-900",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function DropdownMenuSeparator({ className }) {
  return <div className={cn("my-1 h-px bg-slate-100", className)} />;
}

export function DropdownMenuLabel({ className, children }) {
  return (
    <div
      className={cn("px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400", className)}
    >
      {children}
    </div>
  );
}
