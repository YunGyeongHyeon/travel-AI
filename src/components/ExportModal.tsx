import { useState } from "react";
import { TripPlan } from "../types";
import { Share2, Copy, Check, Printer, Download, FileText } from "lucide-react";
import { Button, Modal } from "./ui";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: TripPlan;
}

export function ExportModal({ isOpen, onClose, trip }: ExportModalProps) {
  const [copied, setCopied] = useState(false);

  const generateTextSummary = () => {
    let text = `✈️ [AI 여행 플래너] ${trip.tripTitle}\n`;
    text += `📍 여행지: ${trip.destinationName} (${trip.durationSummary})\n`;
    text += `💰 예상 총 경비: ₩${trip.budgetAnalysis?.totalEstimatedCost?.toLocaleString()} (목표: ₩${trip.budgetAnalysis?.targetBudget?.toLocaleString()})\n\n`;

    trip.days.forEach((day) => {
      text += `━━━━━━━━━━━━━━━━━━━━━\n`;
      text += `📅 [Day ${day.dayNumber}] ${day.themeTitle}\n`;
      text += `🗺️ 주요 권역: ${day.areaFocus}\n\n`;

      day.spots.forEach((spot, idx) => {
        text += `${idx + 1}. [${spot.timeSlot}] ${spot.name}\n`;
        text += `   - 분류: ${spot.categoryName}\n`;
        if (spot.recommendedMenu && spot.recommendedMenu.length > 0) {
          text += `   - 추천 메뉴: ${spot.recommendedMenu.join(", ")}\n`;
        }
        if (spot.estimatedCost > 0) {
          text += `   - 예상 비용: ₩${spot.estimatedCost.toLocaleString()}\n`;
        }
        if (spot.tips) {
          text += `   - 팁: ${spot.tips}\n`;
        }
        if (spot.nextTransport) {
          text += `   ⬇️ 이동: ${spot.nextTransport.description} (${spot.nextTransport.durationMinutes}분)\n`;
        }
        text += `\n`;
      });
    });

    if (trip.localTravelTips?.recommendedPasses) {
      text += `━━━━━━━━━━━━━━━━━━━━━\n`;
      text += `🎫 추천 교통 패스:\n`;
      trip.localTravelTips.recommendedPasses.forEach((p) => {
        text += `• ${p}\n`;
      });
    }

    return text;
  };

  const handleCopy = () => {
    const text = generateTextSummary();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJSON = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(trip, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${trip.destinationName}_일정표.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="여행 일정 공유 & 내보내기"
      description="카카오톡, 노션, 메모장 등으로 손쉽게 공유하세요"
      maxWidth="max-w-xl"
      icon={
        <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
          <Share2 className="w-4 h-4" />
        </div>
      }
      footer={
        <Button size="sm" onClick={onClose}>
          닫기
        </Button>
      }
    >
      <div className="grid grid-cols-3 gap-3">
        <button
          type="button"
          onClick={handleCopy}
          className="p-3.5 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 flex flex-col items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          {copied ? (
            <Check className="w-5 h-5 text-emerald-600" />
          ) : (
            <Copy className="w-5 h-5 text-amber-600" />
          )}
          <span className="text-xs font-bold">{copied ? "복사 완료!" : "텍스트 복사"}</span>
        </button>

        <button
          type="button"
          onClick={() => window.print()}
          className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 flex flex-col items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <Printer className="w-5 h-5 text-slate-600" />
          <span className="text-xs font-bold">인쇄 / PDF 저장</span>
        </button>

        <button
          type="button"
          onClick={handleDownloadJSON}
          className="p-3.5 rounded-2xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-900 flex flex-col items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <Download className="w-5 h-5 text-indigo-600" />
          <span className="text-xs font-bold">JSON 데이터</span>
        </button>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-600 flex items-center gap-1">
          <FileText className="w-3.5 h-3.5" />
          <span>텍스트 요약 미리보기</span>
        </label>
        <div className="max-h-56 overflow-y-auto p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-700 font-mono leading-relaxed whitespace-pre-wrap select-all">
          {generateTextSummary()}
        </div>
      </div>
    </Modal>
  );
}
