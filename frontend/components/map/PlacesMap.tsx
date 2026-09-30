"use client";
/**
 * components/map/PlacesMap.tsx
 * Leaflet map that:
 *  - Shows all saved places as markers
 *  - Highlights a hovered/selected Nominatim result with a distinct marker
 *  - Calls onMapClick(lat, lon) when user clicks on the map
 *
 * This component must only be rendered client-side (SSR will break because
 * Leaflet accesses `window`).  The parent page uses next/dynamic + ssr:false.
 */

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export interface SavedPlace {
  id: number;
  name: string;
  lat: number;
  lon: number;
  category?: string | null;
  notes?: string | null;
}

export interface PreviewMarker {
  lat: number;
  lon: number;
  name: string;
}

interface PlacesMapProps {
  savedPlaces: SavedPlace[];
  previewMarker?: PreviewMarker | null;
  onMapClick?: (lat: number, lon: number) => void;
}

// Fix default Leaflet icon paths broken by webpack
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const previewIcon = L.divIcon({
  className: "",
  html: `<div style="
    width:20px;height:20px;border-radius:50%;
    background:#6366f1;border:3px solid white;
    box-shadow:0 2px 8px rgba(99,102,241,.8);
  "></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const savedIcon = L.divIcon({
  className: "",
  html: `<div style="
    width:16px;height:16px;border-radius:50%;
    background:#10b981;border:2px solid white;
    box-shadow:0 2px 6px rgba(16,185,129,.7);
  "></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

export default function PlacesMap({
  savedPlaces,
  previewMarker,
  onMapClick,
}: PlacesMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const savedLayerRef = useRef<L.LayerGroup | null>(null);
  const previewLayerRef = useRef<L.Marker | null>(null);

  // Initialise map once
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;

    const map = L.map(containerRef.current, {
      center: [20, 0],
      zoom: 2,
      zoomControl: true,
    });

    L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}", {
      attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
      maxZoom: 16,
    }).addTo(map);

    if (onMapClick) {
      map.on("click", (e: L.LeafletMouseEvent) => {
        onMapClick(e.latlng.lat, e.latlng.lng);
      });
    }

    savedLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync saved places markers
  useEffect(() => {
    if (!savedLayerRef.current) return;
    savedLayerRef.current.clearLayers();

    savedPlaces.forEach((place) => {
      const marker = L.marker([place.lat, place.lon], { icon: savedIcon });
      marker.bindPopup(
        `<strong style="color:#111">${place.name}</strong>${place.notes ? `<br/><span style="font-size:12px;color:#555">${place.notes}</span>` : ""}`
      );
      savedLayerRef.current!.addLayer(marker);
    });

    // Fit bounds if we have saved places
    if (savedPlaces.length > 0 && mapRef.current) {
      const bounds = L.latLngBounds(savedPlaces.map((p) => [p.lat, p.lon]));
      mapRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
    }
  }, [savedPlaces]);

  // Sync preview marker
  useEffect(() => {
    if (!mapRef.current) return;

    if (previewLayerRef.current) {
      previewLayerRef.current.remove();
      previewLayerRef.current = null;
    }

    if (previewMarker) {
      const m = L.marker([previewMarker.lat, previewMarker.lon], { icon: previewIcon });
      m.bindPopup(`<strong style="color:#111">${previewMarker.name}</strong>`).openPopup();
      m.addTo(mapRef.current);
      previewLayerRef.current = m;
      mapRef.current.flyTo([previewMarker.lat, previewMarker.lon], 13, { duration: 1 });
    }
  }, [previewMarker]);

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "100%" }}
      id="places-map"
    />
  );
}
