import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "../../utils/cn";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  icon?: ReactNode;
  maxWidth?: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  icon,
  maxWidth = "max-w-lg",
  children,
  footer,
}: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className={cn(
          "bg-white rounded-3xl p-6 sm:p-7 w-full shadow-2xl border border-slate-200 space-y-5 animate-scaleUp",
          maxWidth,
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            {icon}
            <div className="min-w-0">
              <h3
                id="modal-title"
                className="font-extrabold text-base text-slate-900"
              >
                {title}
              </h3>
              {description && (
                <p className="text-xs text-slate-500">{description}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0"
            aria-label="닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {children}

        {footer && (
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
