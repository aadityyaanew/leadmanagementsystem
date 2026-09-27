"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(({ title, description, type = "info", duration = 4000 }) => {
    const id = Date.now().toString() + Math.random().toString().slice(2, 6);
    const newToast = { id, title, description, type, duration };
    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      {/* Toast Notification Container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      addToast: () => {},
      removeToast: () => {},
    };
  }
  return context;
}

function ToastItem({ toast, onClose }) {
  const icons = {
    success: <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />,
    error: <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />,
    warning: <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />,
    info: <Info className="h-5 w-5 text-[#8B1E1E] shrink-0" />,
  };

  const borderAccents = {
    success: "border-l-4 border-l-emerald-600",
    error: "border-l-4 border-l-rose-600",
    warning: "border-l-4 border-l-amber-500",
    info: "border-l-4 border-l-[#8B1E1E]",
  };

  return (
    <div
      className={cn(
        "pointer-events-auto flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-lg shadow-slate-900/5 transition-all animate-toast-in",
        borderAccents[toast.type] || borderAccents.info
      )}
    >
      <div className="mt-0.5">{icons[toast.type] || icons.info}</div>
      <div className="flex-1 min-w-0">
        {toast.title && (
          <h4 className="text-sm font-semibold text-slate-900 leading-tight">
            {toast.title}
          </h4>
        )}
        {toast.description && (
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            {toast.description}
          </p>
        )}
      </div>
      <button
        onClick={onClose}
        className="text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors"
        aria-label="Dismiss toast"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
