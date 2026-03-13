'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Course, LatLng } from '@/types';
import { parseGPX } from '@/lib/gpxParser';
import { Navigation } from 'lucide-react';

interface CourseMapMiniProps {
  course: Course;
}

export default function CourseMapMini({ course }: CourseMapMiniProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [parsed, setParsed] = useState<LatLng[] | null>(null);
  const [error, setError] = useState(false);

  // GPX 파싱 (클라이언트에서만)
  useEffect(() => {
    setError(false);
    setParsed(null);
    if (!course.gpxData) {
      setError(true);
      return;
    }
    const result = parseGPX(course.gpxData);
    if (!result || result.coordinates.length === 0) {
      setError(true);
    } else {
      setParsed(result.coordinates);
    }
  }, [course.gpxData]);

  // Leaflet 미니맵
  useEffect(() => {
    if (!parsed || !mapRef.current) return;
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const positions: [number, number][] = parsed.map((pt) => [pt.lat, pt.lng]);

    const map = L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false,
      dragging: true,
      scrollWheelZoom: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    // 코스 Polyline
    L.polyline(positions, {
      color: '#FF5A5F',
      weight: 4,
      opacity: 0.9,
    }).addTo(map);

    // 출발점 마커 (S)
    L.marker(positions[0], {
      icon: L.divIcon({
        html: `<div style="width:22px;height:22px;border-radius:50%;background:#22c55e;color:#fff;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.25);">S</div>`,
        className: '',
        iconSize: [22, 22],
        iconAnchor: [11, 22],
      }),
    }).addTo(map);

    // 도착점 마커 (F)
    const last = positions[positions.length - 1];
    L.marker(last, {
      icon: L.divIcon({
        html: `<div style="width:22px;height:22px;border-radius:50%;background:#4285F4;color:#fff;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.25);">F</div>`,
        className: '',
        iconSize: [22, 22],
        iconAnchor: [11, 22],
      }),
    }).addTo(map);

    // 경계 맞춤
    const bounds = L.latLngBounds(positions);
    map.fitBounds(bounds, { padding: [20, 20] });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [parsed]);

  if (error || !course.gpxData) {
    return (
      <div className="w-full h-48 rounded-xl bg-gray-50 border border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 text-gray-400">
        <Navigation size={28} strokeWidth={1.5} />
        <p className="text-sm">코스 경로 데이터 없음</p>
        <p className="text-xs">GPX 파일 연동 시 표시됩니다</p>
      </div>
    );
  }

  if (!parsed) {
    return (
      <div className="w-full h-48 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#FF5A5F] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative w-full h-48 rounded-xl overflow-hidden border border-gray-200 shadow-sm">
      <div ref={mapRef} className="w-full h-full" />
      {/* 범례 */}
      <div className="absolute bottom-2 left-2 flex items-center gap-3 bg-white/90 rounded-lg px-2.5 py-1.5 text-xs text-gray-600 shadow-sm z-[400]">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-[#22c55e] inline-block" /> 출발
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-[#4285F4] inline-block" /> 도착
        </span>
        <span className="flex items-center gap-1">
          <span className="w-6 h-0.5 bg-[#FF5A5F] inline-block" /> 코스
        </span>
      </div>
    </div>
  );
}
