'use client';

import { useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Event } from '@/types';
import { useAppStore } from '@/stores/appStore';

const REGION_COLOR: Record<string, string> = {
  서울: '#FFB3BA',   // 연분홍
  경기: '#FFCBA4',   // 연살구
  인천: '#FFF0A0',   // 연노랑
  강원: '#B5EAD7',   // 민트그린
  충북: '#C7E9B0',   // 연두
  충남: '#A8D8EA',   // 하늘
  대전: '#F4C2C2',   // 핑크
  세종: '#FFD7B5',   // 복숭아
  전북: '#D5AAFF',   // 연보라
  전남: '#C9B2F5',   // 라벤더
  광주: '#B9D9FF',   // 연파랑
  경북: '#FFE4B5',   // 연황색
  경남: '#D4F1C7',   // 연초록
  대구: '#FFC8A2',   // 연주황
  부산: '#A0D2EB',   // 파스텔블루
  울산: '#C2F0C2',   // 연녹색
  제주: '#FFDAC1',   // 피치
};

const STATUS_BORDER: Record<string, string> = {
  open: '#22c55e',
  upcoming: '#eab308',
  closed: '#ef4444',
  unknown: '#9ca3af',
};

function createMarkerHTML(event: Event): string {
  const fillColor = REGION_COLOR[event.region] ?? '#E2E8F0';
  const borderColor = STATUS_BORDER[event.registrationStatus] ?? '#9ca3af';
  const coreName = event.name.replace(/^(제\d+회\s*|20\d\d\s+)/, '');
  const shortName = coreName.length > 10 ? coreName.slice(0, 10) + '…' : coreName;

  return `
    <div style="
      position: relative;
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      cursor: pointer;
      user-select: none;
    ">
      <!-- 원형 마커 -->
      <div style="
        width: 36px;
        height: 36px;
        background: ${fillColor};
        border: 2.5px solid ${borderColor};
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 10px rgba(0,0,0,0.22), inset 0 1px 2px rgba(255,255,255,0.55);
        position: relative;
      ">
        <!-- 러닝 픽토그램 SVG -->
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- 머리 -->
          <circle cx="15" cy="3.5" r="2" fill="rgba(0,0,0,0.65)"/>
          <!-- 몸통 + 팔 + 다리 (달리는 자세) -->
          <path d="M12.5 6.5 L10 12 L6.5 15.5" stroke="rgba(0,0,0,0.65)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          <path d="M12.5 6.5 L14.5 11.5 L18 13.5" stroke="rgba(0,0,0,0.65)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          <path d="M10 12 L11.5 16.5 L9 20.5" stroke="rgba(0,0,0,0.65)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          <path d="M14.5 11.5 L13 16 L15.5 19.5" stroke="rgba(0,0,0,0.65)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        </svg>
        <!-- 상태 도트 (우상단) -->
        <div style="
          position: absolute;
          top: -3px;
          right: -3px;
          width: 10px;
          height: 10px;
          background: ${borderColor};
          border: 1.5px solid white;
          border-radius: 50%;
          box-shadow: 0 1px 3px rgba(0,0,0,0.25);
        "></div>
      </div>
      <!-- 핀 꼬리 -->
      <div style="
        width: 2px;
        height: 6px;
        background: linear-gradient(to bottom, ${borderColor}, rgba(0,0,0,0.15));
        border-radius: 0 0 2px 2px;
      "></div>
      <!-- 대회명 라벨 -->
      <div style="
        margin-top: 2px;
        background: rgba(255,255,255,0.97);
        border: 1px solid rgba(0,0,0,0.08);
        border-radius: 20px;
        padding: 2px 8px;
        font-size: 10.5px;
        font-weight: 700;
        color: #1a1a2e;
        white-space: nowrap;
        max-width: 120px;
        overflow: hidden;
        text-overflow: ellipsis;
        box-shadow: 0 1px 5px rgba(0,0,0,0.12);
        letter-spacing: -0.3px;
      ">
        ${shortName}
      </div>
    </div>
  `;
}

interface KakaoMapViewProps {
  filteredEvents: Event[];
}

export default function KakaoMapView({ filteredEvents }: KakaoMapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const { setSelectedEvent, selectedEvent } = useAppStore();

  const clearMarkers = useCallback(() => {
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
  }, []);

  const renderMarkers = useCallback(
    (map: L.Map, events: Event[]) => {
      clearMarkers();
      events.forEach((event) => {
        const icon = L.divIcon({
          html: createMarkerHTML(event),
          className: 'leaflet-custom-marker',
          iconSize: [140, 62],
          iconAnchor: [70, 57],
        });
        const marker = L.marker([event.lat, event.lng], { icon, interactive: true });
        marker.addTo(map);
        // Leaflet의 합성 이벤트 대신 DOM 직접 리스너 사용 (React+Next.js 환경에서 신뢰성 보장)
        const el = marker.getElement();
        if (el) {
          el.style.cursor = 'pointer';
          el.addEventListener('click', (e) => {
            e.stopPropagation();
            setSelectedEvent(event);
          });
        }
        markersRef.current.push(marker);
      });
    },
    [clearMarkers, setSelectedEvent]
  );

  // 지도 초기화 (마운트 시 1회)
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: [36.5, 127.8],
      zoom: 7,
      zoomControl: true,
      attributionControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;
    renderMarkers(map, filteredEvents);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 필터 변경 시 마커 갱신
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    renderMarkers(mapInstanceRef.current, filteredEvents);
  }, [filteredEvents, renderMarkers]);

  // 선택된 이벤트로 지도 이동
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedEvent) return;
    mapInstanceRef.current.panTo([selectedEvent.lat, selectedEvent.lng]);
  }, [selectedEvent]);

  return (
    <div ref={mapRef} className="w-full h-full" aria-label="러닝 이벤트 지도" />
  );
}
