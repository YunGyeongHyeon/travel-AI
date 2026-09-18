import React, { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import { TripPlan, PlaceSpot } from "@/types";
import { DAY_MARKER_COLORS } from "@/lib/formatters";
import { AlertTriangle, Map as MapIcon, RefreshCw, ListOrdered } from "lucide-react";
import { Button } from "@/components/ui/button";

type MapUiState = "loading" | "unavailable" | "error" | "ready";

interface InteractiveMapProps {
  trip: TripPlan;
  activeDay: number | "all";
  selectedSpotId: string | null;
  onSelectSpot: (spot: PlaceSpot) => void;
  onSelectDay?: (dayNumber: number) => void;
}

type ListedSpot = {
  spot: PlaceSpot;
  dayNumber: number;
  stepNumber: number;
};

const COPY = {
  loadingChip: "지도를 불러오는 중",
  unavailableTitle: "지도를 잠시 준비 중이에요",
  unavailableBody:
    "지도 타일을 바로 보여드리기 어려워 아래 번호 순서로 동선을 확인하세요.",
  errorTitle: "지도를 불러오지 못했어요",
  errorBody: "네트워크 또는 지도 서비스 문제로 타일을 표시할 수 없습니다.",
  retry: "다시 시도",
  fallback: "번호 목록으로 보기",
  listTitle: "오늘의 동선 (번호 순)",
};

function circled(n: number) {
  const base = ["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨", "⑩"];
  return base[n - 1] ?? `${n}.`;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  trip,
  activeDay,
  selectedSpotId,
  onSelectSpot,
  onSelectDay,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});
  const polylineLayerRef = useRef<L.LayerGroup | null>(null);
  const onSelectSpotRef = useRef(onSelectSpot);

  const [uiState, setUiState] = useState<MapUiState>("loading");
  const [showFallback, setShowFallback] = useState(false);
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    onSelectSpotRef.current = onSelectSpot;
  }, [onSelectSpot]);

  const listedSpots: ListedSpot[] = useMemo(() => {
    const rows: ListedSpot[] = [];
    trip.days.forEach((day) => {
      if (activeDay === "all" || activeDay === day.dayNumber) {
        day.spots.forEach((spot, idx) => {
          rows.push({ spot, dayNumber: day.dayNumber, stepNumber: idx + 1 });
        });
      }
    });
    return rows;
  }, [trip, activeDay]);

  const mappableSpots = useMemo(
    () => listedSpots.filter(({ spot }) => spot.lat && spot.lng),
    [listedSpots],
  );

  // Init / re-init map (retryToken remounts tiles)
  useEffect(() => {
    if (!mapContainerRef.current) return;

    setUiState("loading");
    setShowFallback(false);

    // Tear down previous instance on retry
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
      tileLayerRef.current = null;
      markersRef.current = {};
      polylineLayerRef.current = null;
    }

    const initialLat = trip.centerCoordinates?.lat || 34.6937;
    const initialLng = trip.centerCoordinates?.lng || 135.5023;
    const initialZoom = trip.centerCoordinates?.zoom || 13;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: initialZoom,
      zoomControl: true,
    });

    let gotTile = false;
    let errorCount = 0;
    const tileLayer = L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 19,
      },
    );

    tileLayer.on("tileload", () => {
      if (!gotTile) {
        gotTile = true;
        setUiState("ready");
      }
    });
    tileLayer.on("tileerror", () => {
      errorCount += 1;
      // Several tile failures → treat as error (no API KEY watermark; friendly UI only)
      if (errorCount >= 3 && !gotTile) {
        setUiState("error");
        setShowFallback(true);
      }
    });

    tileLayer.addTo(map);
    tileLayerRef.current = tileLayer;
    polylineLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    // If no coords to show, go unavailable after brief load
    const unavailableTimer = window.setTimeout(() => {
      if (mappableSpots.length === 0) {
        setUiState("unavailable");
        setShowFallback(true);
      } else if (!gotTile) {
        // Still loading tiles — keep loading; escalate later
      }
    }, 400);

    return () => {
      window.clearTimeout(unavailableTimer);
      map.remove();
      mapInstanceRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retryToken]);

  // Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || uiState === "loading") return;
    if (uiState === "error" || uiState === "unavailable") return;

    Object.values(markersRef.current).forEach((marker) => {
      if (marker && typeof marker.remove === "function") marker.remove();
    });
    markersRef.current = {};
    polylineLayerRef.current?.clearLayers();

    if (mappableSpots.length === 0) {
      setUiState("unavailable");
      setShowFallback(true);
      return;
    }

    const bounds = L.latLngBounds([]);
    const dayGroups: { [key: number]: [number, number][] } = {};

    mappableSpots.forEach(({ spot, dayNumber, stepNumber }) => {
      const latLng: [number, number] = [spot.lat, spot.lng];
      bounds.extend(latLng);
      if (!dayGroups[dayNumber]) dayGroups[dayNumber] = [];
      dayGroups[dayNumber].push(latLng);

      const dayColor =
        DAY_MARKER_COLORS[(dayNumber - 1) % DAY_MARKER_COLORS.length];

      let categoryEmoji = "📍";
      if (spot.category === "restaurant") categoryEmoji = "🍜";
      else if (spot.category === "cafe") categoryEmoji = "☕";
      else if (spot.category === "shopping") categoryEmoji = "🛍️";
      else if (spot.category === "attraction") categoryEmoji = "📸";
      else if (spot.category === "night") categoryEmoji = "🍸";
      else if (spot.category === "transport") categoryEmoji = "🚆";

      const markerHtml = `
        <div class="pin-root relative group cursor-pointer transition-transform duration-200 hover:scale-110">
          <div class="pin-body w-9 h-9 rounded-full flex items-center justify-center text-white font-bold shadow-lg border-2 border-white"
               style="background-color: ${dayColor};">
            <span class="text-xs">${stepNumber}</span>
          </div>
          <div class="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 text-[10px] shadow border border-slate-200">
            ${categoryEmoji}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: markerHtml,
        className: "custom-leaflet-pin",
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36],
      });

      const marker = L.marker(latLng, { icon: customIcon }).addTo(map);
      const recommendedText =
        spot.recommendedMenu && spot.recommendedMenu.length > 0
          ? `<div class="mt-1.5 p-1.5 bg-amber-50 rounded text-amber-900 text-xs">
            <span class="font-bold">추천 메뉴:</span> ${spot.recommendedMenu.slice(0, 2).join(", ")}
           </div>`
          : "";

      marker.bindPopup(
        `
        <div class="p-3.5 max-w-[260px] text-slate-800 font-sans">
          <div class="flex items-center justify-between gap-2 mb-1.5">
            <span class="px-2 py-0.5 rounded text-[11px] font-bold text-white" style="background-color: ${dayColor}">
              Day ${dayNumber} • #${stepNumber}
            </span>
            <span class="text-xs font-semibold text-slate-500">${spot.timeSlot}</span>
          </div>
          <h4 class="font-bold text-sm text-slate-900 leading-tight mb-0.5">${spot.name}</h4>
          ${spot.localName ? `<p class="text-xs text-slate-500 mb-1.5">${spot.localName}</p>` : ""}
          <p class="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-2">${spot.description}</p>
          ${recommendedText}
        </div>
      `,
        { maxWidth: 280 },
      );
      marker.on("click", () => onSelectSpotRef.current(spot));
      markersRef.current[spot.id] = marker;
    });

    if (polylineLayerRef.current) {
      Object.entries(dayGroups).forEach(([dayStr, coords]) => {
        const dayNum = parseInt(dayStr, 10);
        const dayColor =
          DAY_MARKER_COLORS[(dayNum - 1) % DAY_MARKER_COLORS.length];
        if (coords.length > 1) {
          L.polyline(coords, {
            color: dayColor,
            weight: 3.5,
            opacity: 0.8,
            dashArray: "6, 6",
            lineJoin: "round",
          }).addTo(polylineLayerRef.current!);
        }
      });
    }

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }
    const resizeTimer = window.setTimeout(() => map.invalidateSize(), 150);
    return () => window.clearTimeout(resizeTimer);
  }, [trip, activeDay, uiState, mappableSpots]);

  useEffect(() => {
    Object.entries(markersRef.current).forEach(([spotId, marker]) => {
      marker
        .getElement()
        ?.classList.toggle("spot-pin-selected", spotId === selectedSpotId);
    });
    if (!selectedSpotId || !mapInstanceRef.current) return;
    const marker = markersRef.current[selectedSpotId];
    if (marker) {
      mapInstanceRef.current.setView(marker.getLatLng(), 15, { animate: true });
      marker.openPopup();
    }
  }, [selectedSpotId, activeDay, trip]);

  const showOverlay =
    uiState === "loading" ||
    uiState === "unavailable" ||
    uiState === "error" ||
    showFallback;

  return (
    <div className="relative isolate w-full h-full min-h-[420px] rounded-2xl overflow-hidden shadow-inner border border-slate-200/80 bg-slate-100">
      <div
        ref={mapContainerRef}
        className={`w-full h-full min-h-[420px] z-10 ${
          uiState === "ready" && !showFallback ? "" : "opacity-40"
        }`}
        aria-hidden={uiState !== "ready"}
      />

      {/* Day legend — keep visible */}
      <div className="absolute top-3 right-3 z-[400] bg-white/95 backdrop-blur-sm px-3 py-2 rounded-xl shadow-md border border-slate-200 text-xs flex items-center gap-3">
        <span className="font-semibold text-slate-700">일차별 동선:</span>
        <div className="flex items-center gap-1.5 flex-wrap">
          {trip.days.map((day, idx) => {
            const color = DAY_MARKER_COLORS[idx % DAY_MARKER_COLORS.length];
            const isVisible = activeDay === "all" || activeDay === day.dayNumber;
            const inner = (
              <>
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className="text-slate-600 font-medium whitespace-nowrap">
                  {day.dayNumber}일차
                </span>
              </>
            );
            if (!onSelectDay) {
              return (
                <div
                  key={day.dayNumber}
                  className={`flex items-center gap-1 ${isVisible ? "opacity-100" : "opacity-30"}`}
                >
                  {inner}
                </div>
              );
            }
            return (
              <button
                key={day.dayNumber}
                type="button"
                onClick={() => onSelectDay(day.dayNumber)}
                aria-pressed={activeDay === day.dayNumber}
                className={`flex items-center gap-1 rounded-full px-1.5 py-0.5 transition-all cursor-pointer hover:bg-slate-100 ${
                  isVisible ? "opacity-100" : "opacity-40"
                } ${activeDay === day.dayNumber ? "bg-slate-100 ring-1 ring-slate-300" : ""}`}
              >
                {inner}
              </button>
            );
          })}
        </div>
      </div>

      {uiState === "loading" && (
        <div className="absolute inset-0 z-[450] flex items-center justify-center pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-violet-50 to-slate-100 animate-pulse" />
          <span className="relative px-4 py-2 rounded-full bg-white/95 border border-[#6B4EFF]/30 text-xs font-bold text-[#6B4EFF] shadow-md">
            {COPY.loadingChip}
          </span>
        </div>
      )}

      {(uiState === "unavailable" || (uiState === "error" && showFallback) || (showFallback && uiState !== "ready")) &&
        uiState !== "loading" && (
          <div className="absolute inset-0 z-[450] overflow-y-auto bg-[#F8F7FC]/95 backdrop-blur-sm p-5">
            <div className="max-w-md mx-auto">
              {uiState === "error" ? (
                <div className="mb-4 rounded-2xl border border-rose-100 bg-[#FFF1F0] p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-rose-500 shadow-sm">
                      <AlertTriangle className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900">
                        {COPY.errorTitle}
                      </p>
                      <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                        {COPY.errorBody}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          className="rounded-full bg-[#6B4EFF] hover:bg-[#5a3ee6]"
                          onClick={() => {
                            setRetryToken((n) => n + 1);
                            setShowFallback(false);
                          }}
                        >
                          <RefreshCw className="size-3.5" />
                          {COPY.retry}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          className="rounded-full"
                          onClick={() => setShowFallback(true)}
                        >
                          <ListOrdered className="size-3.5" />
                          {COPY.fallback}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mb-4 flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#6B4EFF]/10 text-[#6B4EFF]">
                    <MapIcon className="size-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      {COPY.unavailableTitle}
                    </p>
                    <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                      {COPY.unavailableBody}
                    </p>
                  </div>
                </div>
              )}

              <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {COPY.listTitle}
              </p>
              <ul className="space-y-2">
                {listedSpots.map(({ spot, dayNumber, stepNumber }) => (
                  <li key={`${spot.id}-${stepNumber}`}>
                    <button
                      type="button"
                      onClick={() => onSelectSpot(spot)}
                      className="w-full flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left hover:border-[#6B4EFF]/40 hover:bg-violet-50/40 transition-colors"
                    >
                      <span className="flex size-[22px] shrink-0 items-center justify-center rounded-full bg-[#6B4EFF] text-[10px] font-black text-white">
                        {circled(stepNumber)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs font-bold text-slate-900 truncate">
                          {spot.name}
                        </span>
                        <span className="block text-[10px] text-slate-500">
                          {spot.timeSlot} · Day {dayNumber}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
    </div>
  );
};
