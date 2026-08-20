import { AlertCircle, RotateCcw, X } from "lucide-react";
import { Button } from "./Button";

type ErrorBannerProps = {
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
};

export function ErrorBanner({ message, onRetry, onDismiss }: ErrorBannerProps) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
    >
      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
      <p className="flex-1 leading-relaxed">{message}</p>
      <div className="flex items-center gap-1 flex-shrink-0">
        {onRetry && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRetry}
            className="text-rose-800 hover:bg-rose-100 px-2 py-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            다시 시도
          </Button>
        )}
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="w-7 h-7 rounded-full hover:bg-rose-100 flex items-center justify-center text-rose-500"
            aria-label="닫기"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
