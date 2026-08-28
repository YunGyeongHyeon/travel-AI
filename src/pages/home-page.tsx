import { Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { TripInputForm } from "@/components/trip/trip-input-form";
import { useTripPlannerContext } from "@/hooks/trip-planner-context";
import type { TravelRequest } from "@/types";
import { getTestData, loginUser, registerUser } from "@/lib/api";

export function HomePage() {
  const { isLoading, generateItinerary } = useTripPlannerContext();
  const navigate = useNavigate();

  const handleGenerate = async (request: TravelRequest) => {
    const plan = await generateItinerary(request);
    if (plan) {
      navigate("/plan");
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center max-w-2xl mx-auto mb-6 space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-900 rounded-full text-xs font-bold">
          <Sparkles className="size-3.5 text-amber-600" />
          <span>시간 • 비용 • 테마 맞춤 동선 최적화</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          나만의 완벽한 여행 일정을 만들어보세요
        </h2>
        <button onClick={() => getTestData()}>Get Test Data</button>
        <button
          onClick={() =>
            // registerUser({ email: "y300513@naver.com", password: "test123" })
            loginUser({ email: "y300513@naver.com", password: "test123" })
          }
        >
          Register User
        </button>
        <p className="text-xs sm:text-sm text-slate-600">
          원하는 여행지와 시간, 예산, 식도락/힐링 테마를 입력하면 최적의 맛집과
          이동 동선을 지도와 함께 상세히 구성해 드립니다.
        </p>
      </div>

      <TripInputForm
        isLoading={isLoading}
        onSubmit={(request) => {
          void handleGenerate(request);
        }}
        onSelectPreset={(preset) => {
          void handleGenerate(preset.request);
        }}
      />
    </div>
  );
}
