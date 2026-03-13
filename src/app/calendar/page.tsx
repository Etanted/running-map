'use client';

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, MapPin, Calendar as CalendarIcon } from 'lucide-react';
import { MOCK_EVENTS } from '@/data/mockEvents';
import { useAppStore } from '@/stores/appStore';
import { StatusBadge } from '@/components/common/Badge';
import EventDetailModal from '@/components/modal/EventDetailModal';
import type { Event, RegistrationStatus } from '@/types';

const STATUS_DOT: Record<RegistrationStatus, string> = {
  open: 'bg-green-500',
  upcoming: 'bg-yellow-400',
  closed: 'bg-red-400',
  unknown: 'bg-gray-400',
};

const DAYS_OF_WEEK = ['일', '월', '화', '수', '목', '금', '토'];

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function firstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function CalendarPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0-indexed
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const { filter, setSelectedEvent, selectedEvent } = useAppStore();

  const filtered = useMemo<Event[]>(() => {
    return MOCK_EVENTS.filter((e) => {
      if (filter.region !== 'all' && e.region !== filter.region) return false;
      if (filter.status !== 'all' && e.registrationStatus !== filter.status) return false;
      if (filter.courseType !== 'all') {
        if (!e.courses.some((c) => c.type === filter.courseType)) return false;
      }
      return true;
    });
  }, [filter]);

  // 날짜별 이벤트 맵
  const eventsByDate = useMemo<Map<string, Event[]>>(() => {
    const map = new Map<string, Event[]>();
    for (const evt of filtered) {
      const key = evt.date;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(evt);
    }
    return map;
  }, [filtered]);

  const totalDays = daysInMonth(year, month);
  const firstDay = firstDayOfMonth(year, month);

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
    setSelectedDate(null);
  };
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
    setSelectedDate(null);
  };

  const selectedEvents = selectedDate ? (eventsByDate.get(selectedDate) ?? []) : [];

  const monthLabel = `${year}년 ${month + 1}월`;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={prevMonth}
          className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-600 transition-colors"
          aria-label="이전 달"
        >
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-lg font-bold text-gray-900">{monthLabel}</h2>
        <button
          onClick={nextMonth}
          className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-600 transition-colors"
          aria-label="다음 달"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 mb-2">
        {DAYS_OF_WEEK.map((d, i) => (
          <div
            key={d}
            className={`text-center text-xs font-semibold py-1 ${
              i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-500'
            }`}
          >
            {d}
          </div>
        ))}
      </div>

      {/* 달력 그리드 */}
      <div className="grid grid-cols-7 gap-px bg-gray-100 rounded-2xl overflow-hidden shadow-sm">
        {/* 앞 공백 */}
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`blank-${i}`} className="bg-white h-14 sm:h-16" />
        ))}

        {/* 날짜 셀 */}
        {Array.from({ length: totalDays }).map((_, i) => {
          const day = i + 1;
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const dayEvents = eventsByDate.get(dateStr) ?? [];
          const isToday =
            today.getFullYear() === year &&
            today.getMonth() === month &&
            today.getDate() === day;
          const isSelected = selectedDate === dateStr;
          const dow = (firstDay + i) % 7;

          return (
            <button
              key={dateStr}
              onClick={() => setSelectedDate(isSelected ? null : dateStr)}
              className={`bg-white h-14 sm:h-16 flex flex-col items-center pt-1.5 sm:pt-2 gap-0.5 sm:gap-1 transition-colors relative
                ${isSelected ? 'bg-red-50' : 'hover:bg-gray-50'}
                ${dow === 0 ? 'text-red-500' : dow === 6 ? 'text-blue-500' : 'text-gray-800'}`}
            >
              <span
                className={`text-xs sm:text-sm font-semibold w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full
                  ${isToday ? 'bg-[#FF5A5F] text-white' : ''}`}
              >
                {day}
              </span>
              {dayEvents.length > 0 && (
                <div className="flex items-center gap-0.5 flex-wrap justify-center px-0.5">
                  {dayEvents.slice(0, 2).map((evt) => (
                    <span
                      key={evt.id}
                      className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[evt.registrationStatus]}`}
                    />
                  ))}
                  {dayEvents.length > 2 && (
                    <span className="text-[8px] sm:text-[9px] text-gray-400 font-bold">+{dayEvents.length - 2}</span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* 선택된 날짜 이벤트 목록 */}
      {selectedDate && (
        <div className="mt-6">
          <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
            <CalendarIcon size={15} className="text-[#FF5A5F]" />
            {selectedDate} 대회
            <span className="ml-auto text-xs font-normal text-gray-400">{selectedEvents.length}건</span>
          </h3>
          {selectedEvents.length === 0 ? (
            <p className="text-center py-8 text-sm text-gray-400">이 날 대회가 없습니다</p>
          ) : (
            <div className="space-y-2">
              {selectedEvents.map((evt) => (
                <button
                  key={evt.id}
                  onClick={() => setSelectedEvent(evt)}
                  className="w-full text-left bg-white rounded-xl border border-gray-100 px-4 py-3 shadow-sm hover:shadow hover:border-gray-200 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900 line-clamp-1">{evt.name}</p>
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500">
                        <MapPin size={11} className="text-gray-400" />
                        {evt.venue} · {evt.region}
                      </div>
                    </div>
                    <StatusBadge status={evt.registrationStatus} />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedEvent && <EventDetailModal />}
    </div>
  );
}
