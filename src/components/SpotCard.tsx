import React from "react";
import { PlaceSpot } from "../types";
import { CATEGORY_COLORS } from "../utils/formatters";
import {
  Utensils,
  Coffee,
  Camera,
  ShoppingBag,
  Hotel,
  Train,
  Sparkles,
  Clock,
  MapPin,
  Flame,
  ArrowDown,
  RefreshCw,
  ExternalLink,
  Info,
  DollarSign,
} from "lucide-react";

interface SpotCardProps {
  spot: PlaceSpot;
  stepNumber: number;
  dayNumber: number;
  dayColor: string;
  isSelected: boolean;
  onSelect: () => void;
  onSwapSpot: (spot: PlaceSpot) => void;
}

export const SpotCard: React.FC<SpotCardProps> = ({
  spot,
  stepNumber,
  dayNumber,
  dayColor,
  isSelected,
  onSelect,
  onSwapSpot,
}) => {
  const catStyle = CATEGORY_COLORS[spot.category] || CATEGORY_COLORS.attraction;

  const getCategoryIcon = () => {
    switch (spot.category) {
      case "restaurant":
        return <Utensils className="w-3.5 h-3.5" />;
      case "cafe":
        return <Coffee className="w-3.5 h-3.5" />;
      case "attraction":
        return <Camera className="w-3.5 h-3.5" />;
      case "shopping":
        return <ShoppingBag className="w-3.5 h-3.5" />;
      case "lodging":
        return <Hotel className="w-3.5 h-3.5" />;
      case "transport":
        return <Train className="w-3.5 h-3.5" />;
      case "night":
        return <Sparkles className="w-3.5 h-3.5" />;
      default:
        return <MapPin className="w-3.5 h-3.5" />;
    }
  };

  const getTransportIcon = (mode?: string) => {
    switch (mode) {
      case "subway":
      case "train":
        return "🚇 지하철/열차";
      case "bus":
        return "🚌 버스";
      case "taxi":
        return "🚕 택시";
      case "car":
        return "🚗 차량/렌터카";
      default:
        return "🚶 도보";
    }
  };

  return (
    <div className="relative group">
      {/* Main Spot Card */}
      <div
        onClick={onSelect}
        className={`p-5 sm:p-6 rounded-[28px] bg-white border transition-all duration-200 cursor-pointer ${
          isSelected
            ? "border-indigo-600 ring-2 ring-indigo-300/40 shadow-lg bg-indigo-50/10"
            : "border-slate-200/90 hover:border-slate-300 hover:shadow-md"
        }`}
      >
        {/* Header Row */}
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Step Number Badge */}
            <span
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-xs flex-shrink-0"
              style={{ backgroundColor: dayColor }}
            >
              {stepNumber}
            </span>

            {/* Time Slot Badge */}
            <div className="flex items-center gap-1 text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full border border-slate-200/60">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>{spot.timeSlot}</span>
            </div>

            {/* Category Badge */}
            <span
              className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}
            >
              {getCategoryIcon()}
              <span>{spot.categoryName}</span>
            </span>

            {spot.reservationRequired && (
              <span className="text-[11px] font-bold px-2.5 py-0.5 bg-rose-50 text-rose-600 border border-rose-200 rounded-full">
                예약 권장 🔖
              </span>
            )}
          </div>

          {/* Cost Preview */}
          <div className="text-right flex-shrink-0">
            <span className="text-[11px] text-slate-400 block font-semibold uppercase tracking-wider">예상 비용</span>
            <span className="text-sm font-bold text-slate-800">
              {spot.estimatedCost ? `₩${spot.estimatedCost.toLocaleString()}` : "무료"}
            </span>
          </div>
        </div>

        {/* Title & Local Name */}
        <div className="mb-2">
          <div className="flex items-baseline gap-2 flex-wrap">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
              {spot.name}
            </h3>
            {spot.localName && (
              <span className="text-xs font-medium text-slate-400">({spot.localName})</span>
            )}
          </div>
          {spot.address && (
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 flex-shrink-0 text-slate-400" />
              <span className="truncate">{spot.address}</span>
            </p>
          )}
        </div>

        {/* Description */}
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-3">{spot.description}</p>

        {/* Recommended Menu / Signature Items (especially for food theme) */}
        {spot.recommendedMenu && spot.recommendedMenu.length > 0 && (
          <div className="mb-3 p-3.5 bg-orange-50/60 border border-orange-200/70 rounded-2xl">
            <div className="flex items-center gap-1.5 text-xs font-bold text-orange-950 mb-1.5">
              <Utensils className="w-3.5 h-3.5 text-orange-600" />
              <span>추천 대표 메뉴 & 시그니처</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {spot.recommendedMenu.map((menu, i) => (
                <span
                  key={i}
                  className="text-xs bg-white text-orange-950 font-semibold px-2.5 py-1 rounded-lg border border-orange-200 shadow-2xs"
                >
                  {menu}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Highlights Tags */}
        {spot.highlights && spot.highlights.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {spot.highlights.map((hl, i) => (
              <span
                key={i}
                className="text-[11px] font-semibold bg-slate-50 text-slate-600 border border-slate-200 px-2.5 py-1 rounded-lg"
              >
                ✓ {hl}
              </span>
            ))}
          </div>
        )}

        {/* Tips & Notice */}
        {spot.tips && (
          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs text-slate-600 flex items-start gap-2 mb-3">
            <Info className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0 mt-0.5" />
            <span className="leading-relaxed">
              <strong className="text-slate-800">현지 꿀팁:</strong> {spot.tips}
            </span>
          </div>
        )}

        {/* Card Actions Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2">
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                spot.name + " " + (spot.address || "")
              )}`}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 font-bold text-indigo-600 hover:text-indigo-800 hover:underline px-2.5 py-1 rounded-full hover:bg-indigo-50 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              <span>Google 지도</span>
            </a>
            <span className="text-slate-400 font-medium">체류: {spot.estimatedDuration}</span>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSwapSpot(spot);
            }}
            className="inline-flex items-center gap-1 px-3 py-1 text-slate-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-full border border-slate-200 hover:border-indigo-300 font-bold transition-colors cursor-pointer"
            title="다른 맛집이나 장소로 변경"
          >
            <RefreshCw className="w-3 h-3 text-indigo-500" />
            <span>장소 대체</span>
          </button>
        </div>
      </div>

      {/* Transit connector between spots */}
      {spot.nextTransport && (
        <div className="my-2.5 ml-6 sm:ml-8 pl-4 border-l-2 border-dashed border-slate-300 relative py-1">
          <div className="bg-white border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs text-slate-700 flex items-center justify-between gap-2 shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                {getTransportIcon(spot.nextTransport.mode)}
              </span>
              <span className="text-slate-700 font-medium">{spot.nextTransport.description}</span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 font-semibold text-slate-500">
              <span>{spot.nextTransport.durationMinutes}분 소요</span>
              {spot.nextTransport.estimatedCost > 0 && (
                <span className="text-emerald-700">
                  (₩{spot.nextTransport.estimatedCost.toLocaleString()})
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
