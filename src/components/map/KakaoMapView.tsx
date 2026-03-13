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
      <!-- 러닝화 SVG (측면 프로파일) -->
      <svg width="52" height="38" viewBox="0 0 60 44" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 2px 5px rgba(0,0,0,0.45));">
        <!-- 아웃솔 -->
        <path d="M3 30 Q2 35.5 6.5 36.5 L52 36.5 Q58.5 36.5 58.5 33 Q58.5 30.5 55 30 L4 30 Z" fill="#1a1a1a"/>
        <!-- 미드솔 -->
        <rect x="3.5" y="27" width="53" height="4" rx="1.5" fill="rgba(30,30,30,0.45)"/>
        <!-- 어퍼 메인 -->
        <path d="M4.5 27
          C3.5 27 2.5 25.5 3 23.5
          C3.5 21.5 6.5 19.5 10 20.5
          C12.5 21.2 15.5 23.5 18.5 25
          C22 26.5 27 27.5 50 27.5
          C53 27.5 54 26 53.5 23.5
          C52.5 21 49 19.5 46 19.5
          L41.5 19.5
          C40 19.5 39.5 20.5 38 23
          C34.5 19.5 29.5 17.5 23.5 18
          C17.5 18.5 10.5 21.5 7.5 25
          C6 26.2 5 27 4.5 27 Z"
          fill="${shoeColor}" stroke="rgba(0,0,0,0.28)" stroke-width="0.7"/>
        <!-- 혀 (Tongue) -->
        <path d="M36 17 L41.5 17 Q43 17 41.5 19.5 L38 23 L34.5 19.5 Z"
          fill="${shoeColor}" stroke="rgba(0,0,0,0.22)" stroke-width="0.5"/>
        <!-- 토캡 -->
        <path d="M3 23.5 C2.5 21.5 5.5 19 9.5 20 L10 22 L5.5 27 C3.5 27 2.5 25.5 3 23.5 Z"
          fill="rgba(0,0,0,0.18)"/>
        <!-- 힐 카운터 -->
        <path d="M46 19.5 L50 21 Q54.5 23.5 54 27 L52 27.5 L47.5 27.5 L48.5 22.5 Z"
          fill="rgba(0,0,0,0.13)"/>
        <!-- 스우시 스트라이프 -->
        <path d="M13 25.5 C21 21 33.5 22 37 27"
          stroke="rgba(255,255,255,0.92)" stroke-width="2.5" stroke-linecap="round" fill="none"/>
        <!-- 신발끈 1 -->
        <line x1="27" y1="18.5" x2="36" y2="20.2" stroke="rgba(255,255,255,0.82)" stroke-width="1.2" stroke-linecap="round"/>
        <!-- 신발끈 2 -->
        <line x1="26.5" y1="21.5" x2="35.5" y2="23.2" stroke="rgba(255,255,255,0.52)" stroke-width="1.2" stroke-linecap="round"/>
        <!-- 상태 도트 -->
        <circle cx="54" cy="7" r="5" fill="${borderColor}" stroke="white" stroke-width="1.7"/>
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
