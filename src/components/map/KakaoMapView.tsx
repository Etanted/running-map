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
  const shoeColor = REGION_COLOR[event.region] ?? '#E2E8F0';
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
      <!-- 러닝화 SVG (iStock 스타일 - 선명한 측면 실루엣) -->
      <svg width="36" height="30" viewBox="0 0 26 22" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
        <!-- 아웃솔 (고무 밑창) -->
        <path d="M1.5 15.5 Q1.5 18 4 18 L21.5 18 Q24.5 18 24.5 16 Q24.5 15 22 15 L2 15 Z"
              fill="rgba(0,0,0,0.55)"/>
        <!-- 미드솔 (쿠션층) -->
        <rect x="2" y="13.5" width="21.5" height="2" rx="0.8" fill="rgba(0,0,0,0.18)"/>
        <!-- 어퍼 메인 (지역 색상) -->
        <path d="M3 13.5
                 C2.2 13.5 1.2 13 1.5 11.5
                 C1.8 10 3.5 9 5 9.5
                 C6 9.8 7.8 11.2 9.5 12.2
                 C11.5 13.2 15.5 13.5 22.5 13.5
                 C23.5 13.5 23.5 12.5 23 11.5
                 C22.2 10 20.5 9 18.5 9
                 L16.5 9
                 C15.7 9 15.2 9.5 14.7 10.3
                 C13 8.2 10.8 7.1 8.2 7.4
                 C5.8 7.7 3.8 8.6 3 10 Z"
              fill="${shoeColor}"/>
        <!-- 어퍼 테두리 -->
        <path d="M3 13.5
                 C2.2 13.5 1.2 13 1.5 11.5
                 C1.8 10 3.5 9 5 9.5
                 C6 9.8 7.8 11.2 9.5 12.2
                 C11.5 13.2 15.5 13.5 22.5 13.5
                 C23.5 13.5 23.5 12.5 23 11.5
                 C22.2 10 20.5 9 18.5 9
                 L16.5 9
                 C15.7 9 15.2 9.5 14.7 10.3
                 C13 8.2 10.8 7.1 8.2 7.4
                 C5.8 7.7 3.8 8.6 3 10 Z"
              fill="none" stroke="rgba(0,0,0,0.35)" stroke-width="0.5"/>
        <!-- 토캡 (앞코 강조) -->
        <path d="M3 13.5 C2.2 13.5 1.2 13 1.5 11.5 C1.8 10 3.5 9 5 9.5 L5.3 10.3 L3.5 13.5 Z"
              fill="rgba(0,0,0,0.18)"/>
        <!-- 힐 카운터 (뒤꿈치 보강) -->
        <path d="M20.5 9 L22 9.5 Q24 11 23.5 13 L22.5 13.5 L19.5 13.5 L20.5 11.5 Z"
              fill="rgba(0,0,0,0.12)"/>
        <!-- 사이드 스트라이프 (스우시 스타일) -->
        <path d="M7.5 11.8 C10 9.6 13.5 10.2 15 12.8"
              stroke="rgba(255,255,255,0.9)" stroke-width="1.8" stroke-linecap="round" fill="none"/>
        <!-- 레이스 (신발끈) -->
        <line x1="11" y1="9.3" x2="14.5" y2="10.3" stroke="rgba(255,255,255,0.75)" stroke-width="0.95" stroke-linecap="round"/>
        <line x1="10.5" y1="10.9" x2="14" y2="11.9" stroke="rgba(255,255,255,0.55)" stroke-width="0.95" stroke-linecap="round"/>
        <!-- 상태 도트 -->
        <circle cx="22" cy="4.5" r="3" fill="${borderColor}" stroke="white" stroke-width="1.3"/>
      </svg>
      <!-- 핀 꼬리 -->
      <div style="
        width: 2px;
        height: 5px;
        background: ${borderColor};
        border-radius: 0 0 2px 2px;
      "></div>
      <!-- 대회명 라벨 -->
      <div style="
        margin-top: 2px;
        background: rgba(255,255,255,0.97);
        border: 1px solid #E9ECEF;
        border-radius: 6px;
        padding: 2px 7px;
        font-size: 11px;
        font-weight: 700;
        color: #111827;
        white-space: nowrap;
        max-width: 130px;
        overflow: hidden;
        text-overflow: ellipsis;
        box-shadow: 0 1px 4px rgba(0,0,0,0.13);
        letter-spacing: -0.2px;
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
