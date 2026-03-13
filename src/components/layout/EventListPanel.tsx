'use client';

import { MapPin, Calendar, ChevronRight } from 'lucide-react';
import type { Event } from '@/types';
import { useAppStore } from '@/stores/appStore';
import { StatusBadge, CourseChip } from '@/components/common/Badge';
import { distanceLabel } from '@/lib/gpxParser';

interface Props {
  events: Event[];
  totalCount: number;
}

export default function EventListPanel({ events, totalCount }: Props) {
  const { selectedEvent, setSelectedEvent } = useAppStore();

  return (
    <div className="h-full flex flex-col bg-white border-r border-gray-100">
      {/* 헤더 */}
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 shrink-0">
        <p className="text-sm font-semibold text-gray-700">
          대회 목록{' '}
          <span className="text-[#FF5A5F] font-bold">{events.length}</span>
          <span className="text-gray-400 font-normal text-xs ml-1">/ 전체 {totalCount}</span>
        </p>
      </div>

      {/* 이벤트 목록 */}
      <div className="flex-1 overflow-y-auto">
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2 px-4">
            <MapPin size={32} strokeWidth={1.5} />
            <p className="text-sm text-center">필터 조건에 맞는 대회가 없습니다</p>
          </div>
        ) : (
          events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              isSelected={selectedEvent?.id === event.id}
              onClick={() => setSelectedEvent(event)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function getDday(dateStr: string) {
  const diff = Math.ceil(
    (new Date(dateStr).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) /
      (1000 * 60 * 60 * 24)
  );
  if (diff === 0)
    return (
      <span className="text-[10px] font-bold text-white bg-[#FF5A5F] rounded px-1.5 py-0.5">
        D-Day
      </span>
    );
  if (diff > 0)
    return (
      <span className="text-[10px] font-bold text-[#FF5A5F] bg-red-50 rounded px-1.5 py-0.5">
        D-{diff}
      </span>
    );
  return (
    <span className="text-[10px] font-bold text-gray-400 bg-gray-100 rounded px-1.5 py-0.5">
      종료
    </span>
  );
}

function EventCard({
  event,
  isSelected,
  onClick,
}: {
  event: Event;
  isSelected: boolean;
  onClick: () => void;
}) {
  const courseLabels = [...event.courses]
    .sort((a, b) => b.distanceKm - a.distanceKm)
    .map((c) => distanceLabel(c.distanceKm));

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 border-b border-gray-50 transition-all cursor-pointer ${
        isSelected
          ? 'bg-red-50 border-l-[3px] border-l-[#FF5A5F]'
          : 'hover:bg-gray-50 border-l-[3px] border-l-transparent'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-gray-900 leading-snug flex-1 line-clamp-2">
          {event.name}
        </p>
        <ChevronRight
          size={14}
          className={`shrink-0 mt-0.5 transition-colors ${
            isSelected ? 'text-[#FF5A5F]' : 'text-gray-300'
          }`}
        />
      </div>

      <div className="flex items-center gap-1.5 mt-1.5 text-xs text-gray-500 flex-wrap">
        <Calendar size={11} className="shrink-0" />
        <span>{event.date}</span>
        {getDday(event.date)}
        <StatusBadge status={event.registrationStatus} />
      </div>

      <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
        <MapPin size={11} className="shrink-0" />
        <span className="truncate">{event.venue}</span>
        <span className="text-gray-200 mx-0.5">·</span>
        <span className="text-gray-400">{event.region}</span>
      </div>

      <div className="flex flex-wrap gap-1 mt-1.5">
        {courseLabels.slice(0, 4).map((label) => (
          <CourseChip key={label} label={label} />
        ))}
        {courseLabels.length > 4 && (
          <span className="text-[10px] text-gray-400 self-center">
            +{courseLabels.length - 4}
          </span>
        )}
      </div>
    </button>
  );
}
