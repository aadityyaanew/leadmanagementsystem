"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";

export function Tooltip({ content, children, side = "top", className }) {
  const [visible, setVisible] = useState(false);

  const sidePositions = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  return (
    <div
      className="relative inline-flex items-center"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible && content && (
        <div
          role="tooltip"
          className={cn(
            "pointer-events-none absolute z-50 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[11px] font-medium text-white shadow-md transition-opacity animate-in fade-in zoom-in-95 duration-100",
            sidePositions[side],
            className
          )}
        >
          {content}
        </div>
      )}
    </div>
  );
}
