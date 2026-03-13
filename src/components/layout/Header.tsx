'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Map, List, Calendar, SlidersHorizontal, Timer } from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import type { Region, RegistrationStatus, CourseType } from '@/types';

const REGIONS: { value: Region | 'all'; label: string }[] = [
  { value: 'all', label: '전체 지역' },
  { value: '서울', label: '서울' },
  { value: '경기', label: '경기' },
  { value: '인천', label: '인천' },
  { value: '강원', label: '강원' },
  { value: '충북', label: '충북' },
  { value: '충남', label: '충남' },
  { value: '대전', label: '대전' },
  { value: '세종', label: '세종' },
  { value: '전북', label: '전북' },
  { value: '전남', label: '전남' },
  { value: '광주', label: '광주' },
  { value: '경북', label: '경북' },
  { value: '경남', label: '경남' },
  { value: '대구', label: '대구' },
  { value: '부산', label: '부산' },
  { value: '울산', label: '울산' },
  { value: '제주', label: '제주' },
];

const COURSE_TYPES: { value: CourseType | 'all'; label: string }[] = [
  { value: 'all', label: '전체 종목' },
  { value: 'road', label: '로드' },
  { value: 'trail', label: '트레일' },
  { value: 'mixed', label: '혼합' },
];

const STATUSES: { value: RegistrationStatus | 'all'; label: string }[] = [
  { value: 'all', label: '전체 접수' },
  { value: 'open', label: '접수중' },
  { value: 'upcoming', label: '접수예정' },
  { value: 'closed', label: '마감' },
];

const NAV_ITEMS = [
  { href: '/', label: '지도', icon: Map },
  { href: '/list', label: '리스트', icon: List },
  { href: '/calendar', label: '캘린더', icon: Calendar },
  { href: '/pace', label: '마라톤 페이스', icon: Timer },
];

export default function Header() {
  const pathname = usePathname();
  const { filter, setFilter } = useAppStore();

  return (
    <header className="sticky top-0 z-50 h-14 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex h-full items-center px-4 gap-6 max-w-screen-2xl mx-auto">
        {/* 로고 */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="14" cy="14" r="14" fill="#FF5A5F"/>
            <path d="M10 20L14 12L18 16L20 12" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="14" cy="8" r="2" fill="white"/>
          </svg>
          <span className="text-base font-bold text-[#FF5A5F] tracking-tight">러닝맵</span>
        </Link>

        {/* 네비게이션 */}
        <nav className="flex items-center gap-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  active
                    ? 'bg-red-50 text-[#FF5A5F]'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon size={15} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="h-5 w-px bg-gray-200 mx-1" />

        {/* 필터 바 */}
        <div className="flex items-center gap-2 flex-1">
          <SlidersHorizontal size={15} className="text-gray-400 shrink-0" />
          <select
            value={filter.region}
            onChange={(e) => setFilter({ region: e.target.value as Region | 'all' })}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#FF5A5F]/30 focus:border-[#FF5A5F] cursor-pointer"
          >
            {REGIONS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
          <select
            value={filter.courseType}
            onChange={(e) => setFilter({ courseType: e.target.value as CourseType | 'all' })}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#FF5A5F]/30 focus:border-[#FF5A5F] cursor-pointer"
          >
            {COURSE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <select
            value={filter.status}
            onChange={(e) => setFilter({ status: e.target.value as RegistrationStatus | 'all' })}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#FF5A5F]/30 focus:border-[#FF5A5F] cursor-pointer"
          >
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>
    </header>
  );
}
