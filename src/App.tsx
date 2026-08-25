import { BrowserRouter, Outlet, Route, Routes, useNavigate } from "react-router-dom";
import { AppShell, FloatingChatButton } from "@/components/layout/app-shell";
import { Navbar } from "@/components/layout/navbar";
import { AlertBanner } from "@/components/alert-banner";
import { TripChatDrawer } from "@/components/trip/trip-chat-drawer";
import { SpotSwapModal } from "@/components/trip/spot-swap-modal";
import { ExportModal } from "@/components/trip/export-modal";
import { SavedTripsModal } from "@/components/trip/saved-trips-modal";
import { TripPlannerProvider, useTripPlannerContext } from "@/hooks/trip-planner-context";
import { HomePage } from "@/pages/home-page";
import { PlanPage } from "@/pages/plan-page";
import { PlanDetailPage } from "@/pages/plan-detail-page";
import { RequireTrip } from "@/pages/require-trip";

function AppLayout() {
  const {
    currentTrip,
    savedTrips,
    error,
    isSavedOpen,
    isExportOpen,
    isChatOpen,
    swapTargetSpot,
    setIsSavedOpen,
    setIsExportOpen,
    setIsChatOpen,
    setSwapTargetSpot,
    clearError,
    retryLastGenerate,
    loadSavedTrip,
    deleteSavedTrip,
    applySpotSwap,
  } = useTripPlannerContext();
  const navigate = useNavigate();

  return (
    <AppShell
      header={
        <Navbar
          savedCount={savedTrips.length}
          onOpenSaved={() => setIsSavedOpen(true)}
          hasActiveTrip={!!currentTrip}
          activeTrip={currentTrip}
        />
      }
      chatAction={
        currentTrip ? (
          <FloatingChatButton onClick={() => setIsChatOpen(true)} />
        ) : null
      }
    >
      {error && (
        <AlertBanner
          message={error}
          onRetry={() => {
            void retryLastGenerate().then((plan) => {
              if (plan) {
                navigate("/plan");
              }
            });
          }}
          onDismiss={clearError}
        />
      )}

      <Outlet />

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
        onLoadTrip={(trip) => {
          loadSavedTrip(trip);
          navigate("/plan");
        }}
        onDeleteTrip={deleteSavedTrip}
      />
    </AppShell>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <TripPlannerProvider>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route element={<RequireTrip />}>
              <Route path="/plan" element={<PlanPage />} />
              <Route path="/plan/detail" element={<PlanDetailPage />} />
            </Route>
          </Route>
        </Routes>
      </TripPlannerProvider>
    </BrowserRouter>
  );
}
