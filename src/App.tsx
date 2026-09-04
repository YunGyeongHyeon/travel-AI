import { BrowserRouter, Outlet, Route, Routes, useNavigate } from "react-router-dom";
import { AppShell, FloatingChatButton } from "@/components/layout/app-shell";
import { Navbar } from "@/components/layout/navbar";
import { AlertBanner } from "@/components/alert-banner";
import { TripChatDrawer } from "@/components/trip/trip-chat-drawer";
import { SpotSwapModal } from "@/components/trip/spot-swap-modal";
import { ExportModal } from "@/components/trip/export-modal";
import { TripLogsModal } from "@/components/trip/trip-logs-modal";
import { AuthProvider, useAuth } from "@/hooks/auth-context";
import { TripPlannerProvider, useTripPlannerContext } from "@/hooks/trip-planner-context";
import { HomePage } from "@/pages/home-page";
import { LoginPage } from "@/pages/login-page";
import { PlanPage } from "@/pages/plan-page";
import { PlanDetailPage } from "@/pages/plan-detail-page";
import { RequireAuth } from "@/pages/require-auth";
import { RequireTrip } from "@/pages/require-trip";

function AppLayout() {
  const {
    currentTrip,
    logs,
    favoriteCount,
    isLogsLoading,
    error,
    canRetryGenerate,
    isLogsOpen,
    isExportOpen,
    isChatOpen,
    swapTargetSpot,
    setIsLogsOpen,
    setIsExportOpen,
    setIsChatOpen,
    setSwapTargetSpot,
    clearError,
    retryLastGenerate,
    openLog,
    toggleFavorite,
    deleteLog,
    applySpotSwap,
  } = useTripPlannerContext();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <AppShell
      header={
        <Navbar
          logCount={logs.length}
          favoriteCount={favoriteCount}
          onOpenLogs={() => setIsLogsOpen(true)}
          hasActiveTrip={!!currentTrip}
          activeTrip={currentTrip}
          userEmail={user?.email ?? null}
          onSignOut={() => {
            void signOut().then(() => navigate("/login", { replace: true }));
          }}
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
          onRetry={
            canRetryGenerate
              ? () => {
                  void retryLastGenerate().then((plan) => {
                    if (plan) {
                      navigate("/plan");
                    }
                  });
                }
              : undefined
          }
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

      {user && (
        <TripLogsModal
          isOpen={isLogsOpen}
          onClose={() => setIsLogsOpen(false)}
          logs={logs}
          isLoading={isLogsLoading}
          onOpenLog={(logId) => {
            void openLog(logId).then((plan) => {
              if (plan) {
                navigate("/plan");
              }
            });
          }}
          onToggleFavorite={(logId) => {
            void toggleFavorite(logId);
          }}
          onDeleteLog={(logId) => {
            void deleteLog(logId);
          }}
        />
      )}
    </AppShell>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <TripPlannerProvider>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/login" element={<LoginPage />} />
              <Route element={<RequireAuth />}>
                <Route path="/" element={<HomePage />} />
                <Route element={<RequireTrip />}>
                  <Route path="/plan" element={<PlanPage />} />
                  <Route path="/plan/detail" element={<PlanDetailPage />} />
                </Route>
              </Route>
            </Route>
          </Routes>
        </TripPlannerProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
