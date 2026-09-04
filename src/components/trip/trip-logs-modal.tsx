import { useEffect, useState } from "react";
import { History, Star, Trash2, ArrowRight, Loader2 } from "lucide-react";
import type { TripLogSummary } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface TripLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: TripLogSummary[];
  isLoading: boolean;
  onOpenLog: (logId: string) => void;
  onToggleFavorite: (logId: string) => void;
  onDeleteLog: (logId: string) => void;
}

interface TripLogRowProps {
  log: TripLogSummary;
  isPendingDelete: boolean;
  onRequestDelete: () => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
  onOpenLog: () => void;
  onToggleFavorite: () => void;
}

function TripLogRow({
  log,
  isPendingDelete,
  onRequestDelete,
  onCancelDelete,
  onConfirmDelete,
  onOpenLog,
  onToggleFavorite,
}: TripLogRowProps) {
  return (
    <div className="p-4 rounded-2xl border border-slate-200 hover:border-amber-300 hover:bg-amber-50/20 transition-all flex items-center justify-between gap-3 group">
      <button
        type="button"
        onClick={onOpenLog}
        className="flex-1 text-left cursor-pointer"
      >
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="secondary">{log.destinationName}</Badge>
          <span className="text-xs text-slate-500 font-medium">
            {log.durationSummary}
          </span>
        </div>
        <h4 className="font-extrabold text-sm text-slate-900 line-clamp-1 group-hover:text-amber-700 transition-colors">
          {log.tripTitle}
        </h4>
        <div className="text-[11px] text-slate-400 mt-0.5">
          예산: ₩{log.targetBudget.toLocaleString()} •{" "}
          {new Date(log.createdAt).toLocaleString()}
        </div>
      </button>

      {isPendingDelete ? (
        <div className="flex items-center gap-1">
          <Button
            variant="destructive"
            size="sm"
            onClick={onConfirmDelete}
            title="이 로그를 영구 삭제합니다"
          >
            삭제
          </Button>
          <Button variant="ghost" size="sm" onClick={onCancelDelete}>
            취소
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onToggleFavorite}
            title={log.isFavorite ? "즐겨찾기 해제" : "즐겨찾기에 추가"}
            aria-label={log.isFavorite ? "즐겨찾기 해제" : "즐겨찾기에 추가"}
            aria-pressed={log.isFavorite}
            className={
              log.isFavorite
                ? "text-amber-500"
                : "text-slate-300 hover:text-amber-500"
            }
          >
            <Star className={log.isFavorite ? "fill-amber-400" : ""} />
          </Button>
          <Button
            variant="secondary"
            size="icon-sm"
            onClick={onOpenLog}
            title="일정 열기"
            aria-label="일정 열기"
          >
            <ArrowRight />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onRequestDelete}
            title="삭제"
            aria-label="삭제"
            className="text-slate-400 hover:text-rose-600"
          >
            <Trash2 />
          </Button>
        </div>
      )}
    </div>
  );
}

function EmptyState({ message, hint }: { message: string; hint: string }) {
  return (
    <div className="py-12 text-center text-slate-400 text-xs">
      <History className="w-8 h-8 mx-auto mb-2 opacity-30" />
      <p>{message}</p>
      <p className="mt-0.5">{hint}</p>
    </div>
  );
}

export function TripLogsModal({
  isOpen,
  onClose,
  logs,
  isLoading,
  onOpenLog,
  onToggleFavorite,
  onDeleteLog,
}: TripLogsModalProps) {
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  // 모달을 닫으면 삭제 확인 상태도 초기화한다.
  useEffect(() => {
    if (!isOpen) {
      setPendingDeleteId(null);
    }
  }, [isOpen]);

  const favorites = logs.filter((log) => log.isFavorite);

  const renderList = (items: TripLogSummary[], empty: React.ReactNode) => (
    <ScrollArea className="max-h-80">
      <div className="space-y-3 pr-1">
        {items.length === 0
          ? empty
          : items.map((log) => (
              <TripLogRow
                key={log.id}
                log={log}
                isPendingDelete={pendingDeleteId === log.id}
                onRequestDelete={() => setPendingDeleteId(log.id)}
                onCancelDelete={() => setPendingDeleteId(null)}
                onConfirmDelete={() => {
                  setPendingDeleteId(null);
                  onDeleteLog(log.id);
                }}
                onOpenLog={() => onOpenLog(log.id)}
                onToggleFavorite={() => onToggleFavorite(log.id)}
              />
            ))}
      </div>
    </ScrollArea>
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg rounded-3xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle>내 여행 로그</DialogTitle>
              <DialogDescription>
                생성한 일정은 전부 여기에 남습니다. 별표로 스크랩해 두세요.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin opacity-40" />
            <p>여행 로그를 불러오는 중입니다...</p>
          </div>
        ) : (
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">전체 ({logs.length})</TabsTrigger>
              <TabsTrigger value="favorite">
                즐겨찾기 ({favorites.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              {renderList(
                logs,
                <EmptyState
                  message="아직 생성한 여행 일정이 없습니다."
                  hint="조건을 입력해 첫 일정을 만들어보세요!"
                />,
              )}
            </TabsContent>

            <TabsContent value="favorite">
              {renderList(
                favorites,
                <EmptyState
                  message="즐겨찾기한 일정이 없습니다."
                  hint="마음에 드는 일정의 별표를 눌러보세요!"
                />,
              )}
            </TabsContent>
          </Tabs>
        )}

        <DialogFooter>
          <Button variant="secondary" size="sm" onClick={onClose}>
            닫기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
