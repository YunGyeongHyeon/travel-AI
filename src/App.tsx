import { Sparkles, Compass } from "lucide-react";
import { Navbar } from "./components/Navbar";
import { TripInputForm } from "./components/TripInputForm";
import { TripOverview } from "./components/TripOverview";
import { TripChatDrawer } from "./components/TripChatDrawer";
import { SpotSwapModal } from "./components/SpotSwapModal";
import { ExportModal } from "./components/ExportModal";
import { SavedTripsModal } from "./components/SavedTripsModal";
import { ErrorBanner } from "./components/ui";
import { useTripPlanner } from "./hooks/useTripPlanner";

export default function App() {
  const {
    currentTrip,
    savedTrips,
    isLoading,
    showInputForm,
    error,
    isSavedOpen,
    isExportOpen,
    isChatOpen,
    swapTargetSpot,
    isCurrentTripSaved,
    setShowInputForm,
    setIsSavedOpen,
    setIsExportOpen,
    setIsChatOpen,
    setSwapTargetSpot,
    clearError,
    generateItinerary,
    retryLastGenerate,
    saveCurrentTrip,
    deleteSavedTrip,
    loadSavedTrip,
    applySpotSwap,
  } = useTripPlanner();

  return (
    <div className="min-h-screen bg-[#F1F5F9] text-slate-900 flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <Navbar
        savedCount={savedTrips.length}
        onOpenSaved={() => setIsSavedOpen(true)}
        onNewTrip={() => setShowInputForm(true)}
        hasActiveTrip={!!currentTrip}
        activeTrip={currentTrip}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
        {error && (
          <ErrorBanner
            message={error}
            onRetry={retryLastGenerate}
            onDismiss={clearError}
          />
        )}

        {(!currentTrip || showInputForm) && (
          <div className="space-y-4 animate-fadeIn">
            <div className="text-center max-w-2xl mx-auto mb-6 space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-900 rounded-full text-xs font-bold shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>시간 • 비용 • 테마 맞춤 동선 최적화</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                나만의 완벽한 여행 일정을 만들어보세요
              </h2>
              <p className="text-xs sm:text-sm text-slate-600">
                원하는 여행지와 시간, 예산, 식도락/힐링 테마를 입력하면 최적의 맛집과 이동 동선을 지도와 함께 상세히 구성해 드립니다.
              </p>
            </div>

            <TripInputForm
              isLoading={isLoading}
              onSubmit={generateItinerary}
              onSelectPreset={(preset) => {
                void generateItinerary(preset.request);
              }}
            />
          </div>
        )}

        {currentTrip && !showInputForm && (
          <TripOverview
            trip={currentTrip}
            onReset={() => setShowInputForm(true)}
            onSaveTrip={saveCurrentTrip}
            isSaved={isCurrentTripSaved}
            onOpenExport={() => setIsExportOpen(true)}
            onOpenChat={() => setIsChatOpen(true)}
            onSwapSpot={(spot) => setSwapTargetSpot(spot)}
          />
        )}
      </main>

      {currentTrip && (
        <button
          type="button"
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-6 right-6 z-40 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs sm:text-sm px-4 py-3.5 rounded-full shadow-2xl flex items-center gap-2.5 hover:scale-105 transition-all cursor-pointer border border-slate-700/60"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>AI 여행 비서에게 질문하기</span>
        </button>
      )}

      <footer className="border-t border-slate-200/80 bg-white py-8 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-amber-500" />
            <span className="font-bold text-slate-700">AI 여행 일정 & 맛집 동선 플래너</span>
          </div>
          <p>AI 기반 실시간 지도 연동 및 지리적 최적 동선 알고리즘 적용</p>
        </div>
      </footer>

      {currentTrip && (
        <>
          <TripChatDrawer
            isOpen={isChatOpen}
            onClose={() => setIsChatOpen(false)}
            trip={currentTrip}
          />
          <SpotSwapModal
            isOpen={!!swapTargetSpot}
            onClose={() => setSwapTargetSpot(null)}
            spot={swapTargetSpot}
            trip={currentTrip}
            onConfirmSwap={applySpotSwap}
          />
          <ExportModal
            isOpen={isExportOpen}
            onClose={() => setIsExportOpen(false)}
            trip={currentTrip}
          />
        </>
      )}

      <SavedTripsModal
        isOpen={isSavedOpen}
        onClose={() => setIsSavedOpen(false)}
        savedTrips={savedTrips}
        onLoadTrip={loadSavedTrip}
        onDeleteTrip={deleteSavedTrip}
      />
    </div>
  );
}
