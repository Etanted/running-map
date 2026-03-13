'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useAppStore } from '@/stores/appStore';
import { MOCK_EVENTS } from '@/data/mockEvents';
import EventDetailModal from '@/components/modal/EventDetailModal';
import EventListPanel from '@/components/layout/EventListPanel';
import type { Event } from '@/types';

const KakaoMapView = dynamic(() => import('@/components/map/KakaoMapView'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-gray-500">
        <div className="w-8 h-8 border-[3px] border-[#FF5A5F] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm">지도를 불러오는 중...</p>
      </div>
    </div>
  ),
});

export default function MapPage() {
  const { filter, selectedEvent } = useAppStore();

  const filteredEvents = useMemo<Event[]>(() => {
    return MOCK_EVENTS.filter((e) => {
      if (filter.region !== 'all' && e.region !== filter.region) return false;
      if (filter.status !== 'all' && e.registrationStatus !== filter.status) return false;
      if (filter.courseType !== 'all') {
        if (!e.courses.some((c) => c.type === filter.courseType)) return false;
      }
      return true;
    });
  }, [filter]);

  return (
    <div className="flex" style={{ height: 'calc(100vh - 56px)' }}>
      {/* 좌측 리스트 패널 (1/3) */}
      <div className="w-1/3 min-w-[260px] max-w-[360px] shrink-0 overflow-hidden">
        <EventListPanel events={filteredEvents} totalCount={MOCK_EVENTS.length} />
      </div>

      {/* 우측 지도 영역 (2/3) */}
      <div className="flex-1 relative overflow-hidden">
        <KakaoMapView filteredEvents={filteredEvents} />
      </div>

      {/* 세부 정보 팝업 */}
      {selectedEvent && <EventDetailModal />}
    </div>
  );
}
