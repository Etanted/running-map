'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useAppStore } from '@/stores/appStore';
import { MOCK_EVENTS } from '@/data/mockEvents';
import EventDetailModal from '@/components/modal/EventDetailModal';
import EventListPanel from '@/components/layout/EventListPanel';
import { MapPin, List } from 'lucide-react';
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
  // 모바일: 'map' | 'list'
  const [mobileView, setMobileView] = useState<'map' | 'list'>('map');

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
    <>
      {/* ── 데스크탑: 사이드바이사이드 ── */}
      <div className="hidden md:flex" style={{ height: 'calc(100vh - 56px)' }}>
        <div className="w-1/3 min-w-[260px] max-w-[360px] shrink-0 overflow-hidden">
          <EventListPanel events={filteredEvents} totalCount={MOCK_EVENTS.length} />
        </div>
        <div className="flex-1 relative overflow-hidden">
          <KakaoMapView filteredEvents={filteredEvents} />
        </div>
      </div>

      {/* ── 모바일: 지도 or 목록 풀스크린 ── */}
      <div className="md:hidden" style={{ height: 'calc(100svh - 56px - 64px)' }}>
        {/* 지도/목록 토글 단추 */}
        <div className="absolute top-[70px] left-1/2 -translate-x-1/2 z-[1000] flex bg-white rounded-full shadow-lg border border-gray-200 p-0.5">
          <button
            onClick={() => setMobileView('map')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              mobileView === 'map' ? 'bg-[#FF5A5F] text-white shadow' : 'text-gray-500'
            }`}
          >
            <MapPin size={13} /> 지도
          </button>
          <button
            onClick={() => setMobileView('list')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              mobileView === 'list' ? 'bg-[#FF5A5F] text-white shadow' : 'text-gray-500'
            }`}
          >
            <List size={13} /> 목록 ({filteredEvents.length})
          </button>
        </div>

        {/* 지도 영역 */}
        <div className={`w-full h-full ${mobileView === 'map' ? 'block' : 'hidden'}`}>
          <KakaoMapView filteredEvents={filteredEvents} />
        </div>

        {/* 목록 영역 */}
        <div className={`w-full h-full overflow-y-auto ${mobileView === 'list' ? 'block' : 'hidden'}`}>
          <EventListPanel events={filteredEvents} totalCount={MOCK_EVENTS.length} />
        </div>
      </div>

      {selectedEvent && <EventDetailModal />}
    </>
  );
}
