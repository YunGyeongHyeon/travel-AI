import React from "react";
import { TripPlan, PlaceSpot } from "@/types";
import { Utensils, Award, Flame, ExternalLink, Sparkles, MapPin, Clock } from "lucide-react";

interface FoodGuideViewProps {
  trip: TripPlan;
  onSelectSpot: (spot: PlaceSpot) => void;
}

export const FoodGuideView: React.FC<FoodGuideViewProps> = ({ trip, onSelectSpot }) => {
  // Collect all restaurant and cafe spots from all days
  const allFoodSpots: { spot: PlaceSpot; dayNumber: number }[] = [];
  trip.days.forEach((day) => {
    day.spots.forEach((spot) => {
      if (spot.category === "restaurant" || spot.category === "cafe" || spot.category === "night") {
        allFoodSpots.push({ spot, dayNumber: day.dayNumber });
      }
    });
  });

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="bg-slate-900 rounded-[32px] p-6 sm:p-8 text-white shadow-sm relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-xs font-bold mb-3">
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-orange-300">{trip.destinationName} Gourmet Guide</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">
            {trip.destinationName} 미식 특화 셀렉션 🍜
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            여행 일정 속 최적 동선에 맞추어 엄선된 현지 대표 미식과 로컬 노포, 시그니처 메뉴 꿀팁을 한눈에 살펴보세요.
          </p>
        </div>
      </div>

      {/* Signature Dish Spotlights Section */}
      {trip.foodSpotlights && trip.foodSpotlights.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-orange-500" />
            <h3 className="text-lg sm:text-xl font-bold text-slate-900">
              꼭 맛봐야 할 현지 대표 명물 요리
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {trip.foodSpotlights.map((item, idx) => (
              <div
                key={item.id || idx}
                className="bg-white rounded-[28px] p-6 border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-bold text-orange-700 bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200">
                      {item.dishType}
                    </span>
                    <h4 className="text-base sm:text-lg font-bold text-slate-900 mt-1.5">
                      {item.name}
                      {item.localName && (
                        <span className="text-xs text-slate-400 font-normal ml-1.5">
                          ({item.localName})
                        </span>
                      )}
                    </h4>
                  </div>
                  <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full flex-shrink-0">
                    {item.priceRange}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {item.tasteDescription}
                </p>

                {/* Eating Tip */}
                {item.eatingTips && (
                  <div className="p-3 bg-orange-50/70 border border-orange-200/70 rounded-2xl text-xs text-orange-950">
                    <strong className="text-orange-900">맛있게 먹는 법:</strong> {item.eatingTips}
                  </div>
                )}

                {/* Recommended Places */}
                {item.recommendedPlaces && item.recommendedPlaces.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 flex-wrap text-xs">
                    <span className="text-slate-400 font-semibold">추천 명가:</span>
                    {item.recommendedPlaces.map((place, pIdx) => (
                      <span
                        key={pIdx}
                        className="bg-slate-50 text-slate-700 px-2.5 py-0.5 rounded-full border border-slate-200 font-medium"
                      >
                        {place}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Itinerary Included Food Spots */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Utensils className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg sm:text-xl font-bold text-slate-900">
              일정에 포함된 맛집 & 카페 전체 리스트 ({allFoodSpots.length}곳)
            </h3>
          </div>
          <span className="text-xs text-slate-400">카드를 누르면 지도로 이동</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allFoodSpots.map(({ spot, dayNumber }, idx) => (
            <div
              key={spot.id || idx}
              onClick={() => onSelectSpot(spot)}
              className="bg-white rounded-[28px] p-5 sm:p-6 border border-slate-200 hover:border-indigo-400 hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-[11px] font-bold rounded-full border border-indigo-100">
                    Day {dayNumber} • {spot.timePeriod === "lunch" ? "점심" : spot.timePeriod === "dinner" ? "저녁" : spot.categoryName}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">{spot.timeSlot}</span>
                </div>

                <h4 className="font-bold text-base text-slate-900 leading-snug mb-1">
                  {spot.name}
                </h4>
                {spot.localName && (
                  <p className="text-xs text-slate-400 mb-2">{spot.localName}</p>
                )}

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-3">
                  {spot.description}
                </p>

                {/* Recommended Menu */}
                {spot.recommendedMenu && spot.recommendedMenu.length > 0 && (
                  <div className="p-2.5 bg-orange-50/70 border border-orange-100 rounded-2xl mb-3">
                    <span className="text-[11px] font-bold text-orange-950 block mb-1">
                      대표 메뉴:
                    </span>
                    <p className="text-xs text-orange-950 font-medium">
                      {spot.recommendedMenu.join(", ")}
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900">
                  {spot.estimatedCost ? `₩${spot.estimatedCost.toLocaleString()}` : "현장 결제"}
                </span>
                <span className="text-indigo-600 font-bold flex items-center gap-0.5 hover:underline">
                  상세 보기 →
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
