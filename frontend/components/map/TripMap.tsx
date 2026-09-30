"use client";
import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Place {
  id: number;
  name: string;
  lat: number;
  lon: number;
  category?: string | null;
}

interface ItineraryItem {
  id: number;
  day_number: number;
  order: number;
  place: Place;
}

interface TripMapProps {
  items: ItineraryItem[];
}

// Fix default Leaflet icon paths
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const getDayColor = (day: number) => {
  const colors = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6"];
  return colors[(day - 1) % colors.length];
};

const createMarkerIcon = (day: number, order: number) => {
  const color = getDayColor(day);
  return L.divIcon({
    className: "",
    html: `<div style="
      width:24px;height:24px;border-radius:50%;
      background:${color};border:2px solid white;
      box-shadow:0 2px 6px rgba(0,0,0,0.3);
      display:flex;align-items:center;justify-content:center;
      color:white;font-weight:bold;font-size:12px;
    ">${order + 1}</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

export default function TripMap({ items }: TripMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layersRef = useRef<L.LayerGroup | null>(null);

  // Init map
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;

    const map = L.map(containerRef.current, {
      center: [20, 0],
      zoom: 2,
    });

    L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}", {
      attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
      maxZoom: 16,
    }).addTo(map);

    layersRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Sync markers and polylines
  useEffect(() => {
    if (!layersRef.current || !mapRef.current) return;
    layersRef.current.clearLayers();

    if (items.length === 0) return;

    // Group items by day
    const byDay = items.reduce((acc, item) => {
      if (!acc[item.day_number]) acc[item.day_number] = [];
      acc[item.day_number].push(item);
      return acc;
    }, {} as Record<number, ItineraryItem[]>);

    const allLatLngs: [number, number][] = [];

    Object.entries(byDay).forEach(([dayStr, dayItems]) => {
      const day = parseInt(dayStr);
      const sorted = [...dayItems].sort((a, b) => a.order - b.order);
      const latlngs: [number, number][] = sorted.map((i) => [i.place.lat, i.place.lon]);
      
      allLatLngs.push(...latlngs);

      // Draw route line
      if (latlngs.length > 1) {
        L.polyline(latlngs, {
          color: getDayColor(day),
          weight: 3,
          opacity: 0.7,
          dashArray: "10, 10",
        }).addTo(layersRef.current!);
      }

      // Draw markers
      sorted.forEach((item, index) => {
        const marker = L.marker([item.place.lat, item.place.lon], {
          icon: createMarkerIcon(day, index),
        });
        marker.bindPopup(`<strong>Day ${day}</strong><br/>${item.place.name}`);
        marker.addTo(layersRef.current!);
      });
    });

    if (allLatLngs.length > 0) {
      mapRef.current.fitBounds(L.latLngBounds(allLatLngs), { padding: [40, 40], maxZoom: 13 });
    }
  }, [items]);

  return <div ref={containerRef} className="w-full h-full rounded-2xl border border-gray-800" />;
}
