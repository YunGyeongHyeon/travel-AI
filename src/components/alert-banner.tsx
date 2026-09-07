import { AlertCircle, RotateCcw, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

type AlertBannerProps = {
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
};

export function AlertBanner({ message, onRetry, onDismiss }: AlertBannerProps) {
  return (
    <Alert
      variant="destructive"
      className="flex items-start gap-3 rounded-2xl border-rose-200 bg-rose-50 px-4 py-3 text-rose-800"
    >
      <AlertCircle className="size-4 mt-0.5" />
      <AlertDescription className="flex-1 text-rose-800">
        {message}
      </AlertDescription>
      <div className="flex items-center gap-1">
        {onRetry && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRetry}
            className="text-rose-800 hover:bg-rose-100"
          >
            <RotateCcw />
            다시 시도
          </Button>
        )}
        {onDismiss && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onDismiss}
            aria-label="닫기"
            className="text-rose-500 hover:bg-rose-100"
          >
            <X />
          </Button>
        )}
      </div>
    </Alert>
  );
}
