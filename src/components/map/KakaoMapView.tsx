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
      <!-- 신발 아이콘 원형 배지 -->
      <div style="
        width: 34px;
        height: 34px;
        background: ${shoeColor};
        border: 2.5px solid ${borderColor};
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 6px rgba(0,0,0,0.22);
      ">
        <!-- 러닝화 SVG -->
        <svg width="22" height="18" viewBox="0 0 22 18" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- 신발 밑창 -->
          <path d="M1 13.5 C1 13.5 3 16 8.5 16 C14 16 20 15 21 14 C21 12.5 19 11.5 16 12 L13 12.5 L10.5 11 L7 9.5 L4 10 L2 11 Z"
            fill="rgba(0,0,0,0.18)" />
          <!-- 신발 몸통 -->
          <path d="M2 11.5 C2 11.5 4 8 7 8.5 C8.5 8.7 10.5 10.5 13 11.5 C15.5 12.5 18.5 11.5 20 10.5 C20.5 13 18 14.5 13 14.5 C8 14.5 2 13.5 2 13.5 Z"
            fill="rgba(60,60,60,0.85)" />
          <!-- 신발 앞코 -->
          <path d="M2 11.5 C1 11.5 1 13.5 2 13.5 C2 13.5 3.5 13.8 4.5 13.5 C3.5 12.5 2.5 12 2 11.5 Z"
            fill="rgba(40,40,40,0.9)" />
          <!-- 신발 상단(어퍼) -->
          <path d="M7 8.5 C6.5 5.5 8.5 3.5 10 3 C11.5 2.5 14 3 14.5 4.5 C15 6 14 8 13 8.5 C11 7.5 9 7.5 7 8.5 Z"
            fill="rgba(80,80,80,0.85)" />
          <!-- 레이싱/줄 장식 -->
          <path d="M8.5 6.5 L12 5.5 M8 8 L12.5 7" stroke="rgba(255,255,255,0.75)" stroke-width="0.9" stroke-linecap="round"/>
          <!-- 상태 도트 -->
          <circle cx="18" cy="5" r="3" fill="${borderColor}" stroke="white" stroke-width="1.2"/>
        </svg>
      </div>
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
