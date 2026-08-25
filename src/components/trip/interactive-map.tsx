import React, { useEffect, useRef } from "react";
import L from "leaflet";
import { TripPlan, PlaceSpot } from "@/types";
import { DAY_MARKER_COLORS, CATEGORY_COLORS } from "@/lib/formatters";
import { MapPin, Navigation, ExternalLink, Utensils, Coffee, Camera, ShoppingBag, Eye } from "lucide-react";

interface InteractiveMapProps {
  trip: TripPlan;
  activeDay: number | "all";
  selectedSpotId: string | null;
  onSelectSpot: (spot: PlaceSpot) => void;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  trip,
  activeDay,
  selectedSpotId,
  onSelectSpot,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});
  const polylineLayerRef = useRef<L.LayerGroup | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const initialLat = trip.centerCoordinates?.lat || 34.6937;
      const initialLng = trip.centerCoordinates?.lng || 135.5023;
      const initialZoom = trip.centerCoordinates?.zoom || 13;

      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: initialZoom,
        zoomControl: true,
      });

      // CartoDB Voyager Clean Tiles
      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 19,
      }).addTo(map);

      polylineLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    return () => {
      // Map cleanup on unmount if needed
    };
  }, []);

  // Update Markers and Routes when trip, activeDay, or selection changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear previous markers
    Object.values(markersRef.current).forEach((marker) => {
      if (marker && typeof marker.remove === "function") {
        marker.remove();
      }
    });
    markersRef.current = {};

    if (polylineLayerRef.current) {
      polylineLayerRef.current.clearLayers();
    }

    const spotsToDisplay: { spot: PlaceSpot; dayNumber: number; stepNumber: number }[] = [];

    trip.days.forEach((day) => {
      if (activeDay === "all" || activeDay === day.dayNumber) {
        day.spots.forEach((spot, idx) => {
          if (spot.lat && spot.lng) {
            spotsToDisplay.push({ spot, dayNumber: day.dayNumber, stepNumber: idx + 1 });
          }
        });
      }
    });

    if (spotsToDisplay.length === 0) return;

    const bounds = L.latLngBounds([]);

    // Draw route polylines grouped by day
    const dayGroups: { [key: number]: [number, number][] } = {};

    spotsToDisplay.forEach(({ spot, dayNumber, stepNumber }) => {
      const latLng: [number, number] = [spot.lat, spot.lng];
      bounds.extend(latLng);

      if (!dayGroups[dayNumber]) {
        dayGroups[dayNumber] = [];
      }
      dayGroups[dayNumber].push(latLng);

      const dayColor = DAY_MARKER_COLORS[(dayNumber - 1) % DAY_MARKER_COLORS.length];
      const isSelected = spot.id === selectedSpotId;

      // Category icon emoji
      let categoryEmoji = "📍";
      if (spot.category === "restaurant") categoryEmoji = "🍜";
      else if (spot.category === "cafe") categoryEmoji = "☕";
      else if (spot.category === "shopping") categoryEmoji = "🛍️";
      else if (spot.category === "attraction") categoryEmoji = "📸";
      else if (spot.category === "night") categoryEmoji = "🍸";
      else if (spot.category === "transport") categoryEmoji = "🚆";

      const markerHtml = `
        <div class="relative group cursor-pointer transition-transform duration-200 ${
          isSelected ? "scale-125 z-50" : "hover:scale-110"
        }">
          <div class="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold shadow-lg border-2 border-white"
               style="background-color: ${dayColor}; ${
                 isSelected ? "box-shadow: 0 0 0 4px #fbbf24, 0 8px 16px rgba(0,0,0,0.3);" : ""
               }">
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

      // Construct rich popup
      const recommendedText = spot.recommendedMenu && spot.recommendedMenu.length > 0
        ? `<div class="mt-1.5 p-1.5 bg-amber-50 rounded text-amber-900 text-xs">
            <span class="font-bold">추천 메뉴:</span> ${spot.recommendedMenu.slice(0, 2).join(", ")}
           </div>`
        : "";

      const popupContent = `
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
          <div class="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
            <span class="text-xs font-bold text-emerald-700">
              ${spot.estimatedCost ? `₩${spot.estimatedCost.toLocaleString()}` : "무료/기본"}
            </span>
            <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              spot.name + " " + (spot.address || "")
            )}" target="_blank" rel="noreferrer" class="text-xs text-blue-600 font-semibold hover:underline inline-flex items-center gap-0.5">
              Google 지도 <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
            </a>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, { maxWidth: 280 });
      marker.on("click", () => {
        onSelectSpot(spot);
      });

      markersRef.current[spot.id] = marker;
    });

    // Draw route lines
    if (polylineLayerRef.current) {
      Object.entries(dayGroups).forEach(([dayStr, coords]) => {
        const dayNum = parseInt(dayStr, 10);
        const dayColor = DAY_MARKER_COLORS[(dayNum - 1) % DAY_MARKER_COLORS.length];

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

    // Auto fit bounds
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }

    const resizeTimer = window.setTimeout(() => {
      map.invalidateSize();
    }, 150);

    return () => window.clearTimeout(resizeTimer);
  }, [trip, activeDay]);

  // Center on selected spot
  useEffect(() => {
    if (!selectedSpotId || !mapInstanceRef.current) return;
    const marker = markersRef.current[selectedSpotId];
    if (marker) {
      const latLng = marker.getLatLng();
      mapInstanceRef.current.setView(latLng, 15, { animate: true });
      marker.openPopup();
    }
  }, [selectedSpotId]);

  return (
    <div className="relative w-full h-full min-h-[420px] rounded-2xl overflow-hidden shadow-inner border border-slate-200/80 bg-slate-100">
      <div ref={mapContainerRef} className="w-full h-full min-h-[420px] z-10" />

      {/* Map Legend Floating Tag */}
      <div className="absolute top-3 right-3 z-[400] bg-white/95 backdrop-blur-sm px-3 py-2 rounded-xl shadow-md border border-slate-200 text-xs flex items-center gap-3">
        <span className="font-semibold text-slate-700">일차별 동선:</span>
        <div className="flex items-center gap-2">
          {trip.days.map((day, idx) => {
            const color = DAY_MARKER_COLORS[idx % DAY_MARKER_COLORS.length];
            const isVisible = activeDay === "all" || activeDay === day.dayNumber;
            return (
              <div
                key={day.dayNumber}
                className={`flex items-center gap-1 transition-opacity ${
                  isVisible ? "opacity-100" : "opacity-30"
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block"
                  style={{ backgroundColor: color }}
                />
                <span className="text-slate-600 font-medium">{day.dayNumber}일차</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
