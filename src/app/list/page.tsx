'use client';

import { useMemo, useState } from 'react';
import { useAppStore } from '@/stores/appStore';
import { MOCK_EVENTS } from '@/data/mockEvents';
import { StatusBadge, CourseChip } from '@/components/common/Badge';
import EventDetailModal from '@/components/modal/EventDetailModal';
import { MapPin, Calendar, Search, SortAsc } from 'lucide-react';
import { distanceLabel, getLongestCourse } from '@/lib/gpxParser';
import type { Event } from '@/types';

function EventCard({ event, onOpen }: { event: Event; onOpen: () => void }) {
  const courseLabels = event.courses
    .sort((a, b) => b.distanceKm - a.distanceKm)
    .map((c) => distanceLabel(c.distanceKm));

  return (
    <div
      className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all cursor-pointer group"
      onClick={onOpen}
    >
      {/* 상단 – 날짜/상태 */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <h3 className="text-sm font-bold text-gray-900 line-clamp-2 leading-snug group-hover:text-[#FF5A5F] transition-colors">
              {event.name}
            </h3>
          </div>
          <StatusBadge status={event.registrationStatus} />
        </div>

        <div className="mt-2.5 space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Calendar size={12} className="text-gray-400" />
            {event.date}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <MapPin size={12} className="text-gray-400" />
            {event.venue} · {event.region}
          </div>
          <div className="flex flex-wrap gap-1 pt-0.5">
            {courseLabels.map((label) => (
              <CourseChip key={label} label={label} />
            ))}
          </div>
        </div>
      </div>

      {/* 하단 – 접수 기간 */}
      <div className="px-4 pb-3 border-t border-gray-50 pt-2.5 flex items-center justify-between">
        <span className="text-xs text-gray-400">
          접수 ~{event.registrationEnd}
        </span>
        {getLongestCourse(event.courses).gpxData && (
          <span className="text-[10px] bg-blue-50 text-blue-600 rounded-full px-2 py-0.5 font-medium">
            GPX 코스
          </span>
        )}
      </div>
    </div>
  );
}

type SortKey = 'date_asc' | 'date_desc';

export default function ListPage() {
  const { filter, setSelectedEvent, selectedEvent } = useAppStore();
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('date_asc');

  const filtered = useMemo<Event[]>(() => {
    let list = MOCK_EVENTS.filter((e) => {
      if (filter.region !== 'all' && e.region !== filter.region) return false;
      if (filter.status !== 'all' && e.registrationStatus !== filter.status) return false;
      if (filter.courseType !== 'all') {
        if (!e.courses.some((c) => c.type === filter.courseType)) return false;
      }
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        if (!e.name.toLowerCase().includes(q) && !e.venue.toLowerCase().includes(q)) return false;
      }
      return true;
    });

    list = list.sort((a, b) => {
      const diff = a.date.localeCompare(b.date);
      return sort === 'date_asc' ? diff : -diff;
    });

    return list;
  }, [filter, search, sort]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* 검색 + 정렬 */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="대회명·장소 검색"
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5A5F]/30 focus:border-[#FF5A5F]"
          />
        </div>
        <div className="relative">
          <SortAsc size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5A5F]/30 focus:border-[#FF5A5F] cursor-pointer appearance-none"
          >
            <option value="date_asc">날짜 오름차순</option>
            <option value="date_desc">날짜 내림차순</option>
          </select>
        </div>
      </div>

      {/* 카운트 */}
      <p className="text-sm text-gray-500 mb-4 font-medium">
        총 <span className="text-[#FF5A5F] font-bold">{filtered.length}</span>건
      </p>

      {/* 카드 그리드 */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Search size={36} className="mx-auto mb-3 opacity-40" strokeWidth={1.5} />
          <p className="text-sm">검색 조건에 맞는 대회가 없습니다</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onOpen={() => setSelectedEvent(event)}
            />
          ))}
        </div>
      )}

      {selectedEvent && <EventDetailModal />}
    </div>
  );
}
