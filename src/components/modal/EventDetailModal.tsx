'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';
import { X, ExternalLink, MapPin, Calendar, Clock, Users, ChevronRight, Star } from 'lucide-react';
import type { Event, Course } from '@/types';
import { useAppStore } from '@/stores/appStore';
import { StatusBadge, CourseChip } from '@/components/common/Badge';
import { getLongestCourse, distanceLabel, minutesToHM, formatKRW, courseTypeLabel } from '@/lib/gpxParser';

// SSR 방지 (지도·차트는 클라이언트 전용)
const CourseMapMini = dynamic(() => import('./CourseMapMini'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-48 rounded-xl bg-gray-100 animate-pulse" />
  ),
});
const ElevationChart = dynamic(() => import('./ElevationChart'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-36 rounded-xl bg-gray-100 animate-pulse" />
  ),
});

type TabId = 'course' | 'list' | 'info';

// ─── 탭 1: 최장 코스 정보 ─────────────────────────────────────────────────────

function LongestCourseTab({ course, officialUrl, isNaverSearch }: { course: Course; officialUrl: string | null; isNaverSearch: boolean }) {
  return (
    <div className="space-y-4 pb-4">
      {/* 공식 홈페이지 기준 안내 배너 */}
      <div className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-xl px-3 py-2">
        <p className="text-xs text-blue-700 font-medium">공식 홈페이지 기준 코스 정보</p>
      {officialUrl && !isNaverSearch ? (
          <a
            href={officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-xs text-blue-600 underline underline-offset-2 hover:text-blue-800 font-semibold"
          >
            공식 홈페이지 →
          </a>
        ) : null}
      </div>

      {/* 코스 요약 배지 */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 text-[#FF5A5F] px-3 py-1 text-sm font-semibold">
          <Star size={13} fill="#FF5A5F" strokeWidth={0} />
          {course.name}
        </span>
        <span className="text-sm font-bold text-gray-900">
          {distanceLabel(course.distanceKm)}
        </span>
        <span className="text-xs text-gray-500 bg-gray-100 rounded-full px-2 py-0.5">
          {courseTypeLabel(course.type)}
        </span>
      </div>

      {/* 코스 경로 */}
      <div>
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">코스 경로</h4>
        {course.courseImageUrl ? (
          <div className="w-full rounded-xl overflow-hidden border border-gray-100">
            <img
              src={course.courseImageUrl}
              alt={`${course.name} 코스 지도`}
              className="w-full h-auto object-contain"
            />
          </div>
        ) : (
          <CourseMapMini key={course.id} course={course} />
        )}
      </div>

      {/* 고도 프로파일 - 공식 이미지가 없을 때만 표시 */}
      {!course.courseImageUrl && (
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">고도 프로파일</h4>
          <ElevationChart key={course.id} course={course} />
        </div>
      )}

      {/* 기타 코스 정보 */}
      <div className="grid grid-cols-2 gap-2">
        {course.startTime && (
          <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
            <Clock size={14} className="text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">출발 시각</p>
              <p className="text-sm font-semibold text-gray-900">{course.startTime}</p>
            </div>
          </div>
        )}
        {course.timeLimitMinutes && (
          <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
            <Clock size={14} className="text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">제한 시간</p>
              <p className="text-sm font-semibold text-gray-900">{minutesToHM(course.timeLimitMinutes)}</p>
            </div>
          </div>
        )}
        {course.entryFee && (
          <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 col-span-2">
            <div className="text-gray-400 text-sm font-bold">₩</div>
            <div>
              <p className="text-xs text-gray-500">참가비</p>
              <p className="text-sm font-semibold text-gray-900">{formatKRW(course.entryFee)}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── 탭 2: 코스 목록 ──────────────────────────────────────────────────────────

function CourseListTab({
  courses,
  onSelectCourse,
  selectedCourseId,
}: {
  courses: Course[];
  onSelectCourse: (c: Course) => void;
  selectedCourseId: string;
}) {
  const sorted = [...courses].sort((a, b) => b.distanceKm - a.distanceKm);

  return (
    <div className="space-y-2 pb-4">
      <p className="text-xs text-gray-500 mb-3">총 {courses.length}개 코스 · 클릭하면 코스 정보를 봅니다</p>
      {sorted.map((c) => (
        <button
          key={c.id}
          onClick={() => onSelectCourse(c)}
          className={`w-full text-left rounded-xl border px-4 py-3 transition-all ${
            c.id === selectedCourseId
              ? 'border-[#FF5A5F] bg-red-50'
              : 'border-gray-100 bg-white hover:border-gray-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {c.isLongest && (
                <span className="text-[10px] font-bold text-[#FF5A5F] bg-red-100 rounded-full px-1.5 py-0.5">
                  최장
                </span>
              )}
              <span className="text-sm font-semibold text-gray-900">{c.name}</span>
              <span className="text-xs text-gray-500">{distanceLabel(c.distanceKm)}</span>
            </div>
            <div className="flex items-center gap-2">
              {c.gpxData && (
                <span className="text-[10px] bg-blue-50 text-blue-600 rounded-full px-1.5 py-0.5 font-medium">GPX</span>
              )}
              <ChevronRight size={14} className="text-gray-400" />
            </div>
          </div>
          <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
            {c.startTime && <span>출발 {c.startTime}</span>}
            {c.timeLimitMinutes && <span>제한 {minutesToHM(c.timeLimitMinutes)}</span>}
            {c.entryFee && <span>{formatKRW(c.entryFee)}</span>}
          </div>
        </button>
      ))}
    </div>
  );
}

// ─── 탭 3: 기본 정보 ──────────────────────────────────────────────────────────

function BasicInfoTab({ event }: { event: Event }) {
  const rows: { label: string; value: string }[] = [
    { label: '대회명', value: event.name },
    { label: '날짜', value: `${event.date} (${getDayOfWeek(event.date)})` },
    { label: '시간', value: `오전 ${event.startTime} 출발` },
    { label: '장소', value: `${event.venue} · ${event.region}` },
    { label: '주소', value: event.address },
    { label: '주최', value: event.organizer },
    { label: '주관', value: event.hostOrganization },
    ...(event.maxParticipants
      ? [{ label: '최대 인원', value: `${event.maxParticipants.toLocaleString()}명` }]
      : []),
    { label: '접수 기간', value: `${event.registrationStart} ~ ${event.registrationEnd}` },
  ];

  return (
    <div className="space-y-3 pb-4">
      {event.description && (
        <div className="bg-amber-50 rounded-xl px-4 py-3 text-sm text-amber-800 leading-relaxed">
          {event.description}
        </div>
      )}
      <div className="rounded-xl border border-gray-100 overflow-hidden">
        {rows.map((row, i) => (
          <div
            key={row.label}
            className={`flex px-4 py-2.5 text-sm ${
              i % 2 === 0 ? 'bg-white' : 'bg-gray-50'
            }`}
          >
            <span className="w-24 shrink-0 text-gray-500 font-medium">{row.label}</span>
            <span className="text-gray-900 break-all">{row.value}</span>
          </div>
        ))}
      </div>
      {event.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {event.tags.map((tag) => (
            <span key={tag} className="text-xs bg-gray-100 text-gray-600 rounded-full px-2.5 py-1">
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function getDayOfWeek(dateStr: string): string {
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return days[new Date(dateStr).getDay()];
}

// ─── 메인 Modal ───────────────────────────────────────────────────────────────

export default function EventDetailModal() {
  const { selectedEvent, setSelectedEvent } = useAppStore();
  const [activeTab, setActiveTab] = useState<TabId>('course');
  const [viewCourse, setViewCourse] = useState<Course | null>(null);

  const event = selectedEvent;

  const close = useCallback(() => {
    setSelectedEvent(null);
    setActiveTab('course');
  }, [setSelectedEvent]);

  // 이벤트 변경 시 최장 코스로 초기화
  useEffect(() => {
    if (!event) return;
    setViewCourse(getLongestCourse(event.courses));
    setActiveTab('course');
  }, [event]);

  // ESC 닫기
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [close]);

  if (!event) return null;

  const longest = getLongestCourse(event.courses);
  const displayCourse = viewCourse ?? longest;

  const courseLabels = event.courses
    .sort((a, b) => b.distanceKm - a.distanceKm)
    .map((c) => distanceLabel(c.distanceKm));

  const handleSelectCourse = (course: Course) => {
    setViewCourse(course);
    setActiveTab('course');
  };

  const officialUrl = event.officialWebsite?.startsWith('http')
    ? event.officialWebsite
    : null;
  const isNaverSearch = officialUrl?.includes('search.naver.com');
  const fallbackUrl = `https://search.naver.com/search.naver?query=${encodeURIComponent(event.name)}`;
  const linkUrl = officialUrl ?? fallbackUrl;
  const linkLabel = isNaverSearch ? '네이버에서 검색' : officialUrl ? '공식 홈페이지 바로가기' : '네이버에서 검색';
  const isRealOfficialSite = officialUrl && !isNaverSearch;

  const TABS: { id: TabId; label: string }[] = [
    { id: 'course', label: '코스 & 고도' },
    { id: 'list', label: `코스 목록 (${event.courses.length})` },
    { id: 'info', label: '기본 정보' },
  ];

  const modalContent = (
    <div
      className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center md:p-4"
      style={{ zIndex: 9999 }}
      onClick={close}
    >
      {/* 패널 */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`${event.name} 상세 정보`}
        className="w-full md:max-w-2xl h-[92svh] md:h-auto md:max-h-[90vh] bg-white shadow-2xl rounded-t-3xl md:rounded-2xl flex flex-col animate-slide-up md:animate-popup"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ─── 헤더 ─── */}
        <div className="px-5 pt-4 md:pt-5 pb-4 border-b border-gray-100">
          {/* 모바일 드래그 핸들 */}
          <div className="md:hidden w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-lg font-bold text-gray-900 leading-snug line-clamp-2 flex-1">
              {event.name}
            </h2>
            <button
              onClick={close}
              className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
              aria-label="닫기"
            >
              <X size={18} />
            </button>
          </div>

          {/* 메타 정보 */}
          <div className="mt-3 space-y-1.5">
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <span className="flex items-center gap-1.5">
                <Calendar size={14} className="text-gray-400" />
                {event.date} ({getDayOfWeek(event.date)})
              </span>
              <StatusBadge status={event.registrationStatus} />
            </div>
            <div className="flex items-center gap-1.5 text-sm text-gray-600">
              <MapPin size={14} className="text-gray-400" />
              <span>{event.venue}</span>
              <span className="text-gray-300">·</span>
              <span className="text-xs text-gray-400">{event.region}</span>
            </div>
            {/* 종목 배지 */}
            <div className="flex flex-wrap gap-1 pt-0.5">
              {courseLabels.map((label) => (
                <CourseChip key={label} label={label} />
              ))}
            </div>
            <p className="text-xs text-gray-400">
              접수: {event.registrationStart} ~ {event.registrationEnd}
            </p>
          </div>
        </div>

        {/* ─── 탭 ─── */}
        <div className="flex border-b border-gray-100 bg-white shrink-0">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 text-xs font-semibold transition-colors relative ${
                activeTab === tab.id
                  ? 'text-[#FF5A5F]'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF5A5F] rounded-t-full" />
              )}
            </button>
          ))}
        </div>

        {/* ─── 탭 콘텐츠 ─── */}
        <div className="flex-1 overflow-y-auto px-5 pt-4">
          {activeTab === 'course' && <LongestCourseTab course={displayCourse} officialUrl={officialUrl} isNaverSearch={!!isNaverSearch} />}
          {activeTab === 'list' && (
            <CourseListTab
              courses={event.courses}
              onSelectCourse={handleSelectCourse}
              selectedCourseId={displayCourse.id}
            />
          )}
          {activeTab === 'info' && <BasicInfoTab event={event} />}
        </div>

        {/* ─── 하단 CTA ─── */}
        <div className="shrink-0 px-5 py-4 border-t border-gray-100 bg-white">
          <a
            href={linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className={`flex items-center justify-center gap-2 w-full h-12 rounded-xl text-sm font-bold transition-colors ${
              isRealOfficialSite
                ? 'bg-[#FF5A5F] text-white hover:bg-[#E5393D] active:bg-[#c73030]'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <ExternalLink size={15} />
            {linkLabel}
          </a>
          {!isRealOfficialSite && (
            <p className="text-center text-xs text-gray-400 mt-1.5">공식 홈페이지 연동 전 네이버 검색으로 연결됩니다</p>
          )}
        </div>
      </aside>
    </div>
  );

  return createPortal(modalContent, document.body);
}
