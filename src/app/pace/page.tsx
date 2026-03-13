'use client';

import { useState, useMemo } from 'react';
import { Timer, Ruler, TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp, Zap } from 'lucide-react';

// ─── 타입 ────────────────────────────────────────────────────────────────────

type Strategy = 'even' | 'positive' | 'negative';

interface SplitRow {
  km: number;
  paceSecPerKm: number;   // 이 구간 페이스 (초/km)
  splitSec: number;       // 구간 시간 (초)
  cumulativeSec: number;  // 누적 시간 (초)
}

// ─── 유틸 ────────────────────────────────────────────────────────────────────

/** 초 → "H:MM:SS" 또는 "MM:SS" */
function fmtTime(totalSec: number, forceHour = false): string {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = Math.round(totalSec % 60);
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  if (h > 0 || forceHour) return `${h}:${mm}:${ss}`;
  return `${mm}:${ss}`;
}

/** 초/km → "MM'SS\"" */
function fmtPace(secPerKm: number): string {
  const m = Math.floor(secPerKm / 60);
  const s = Math.round(secPerKm % 60);
  return `${m}'${String(s).padStart(2, '0')}"`;
}

/**
 * Riegel 공식: T2 = T1 × (D2/D1)^1.06
 * T1: 기준 기록(초), D1: 기준 거리(km), D2: 목표 거리(km)
 */
function riegelPredict(t1Sec: number, d1Km: number, d2Km: number): number {
  return t1Sec * Math.pow(d2Km / d1Km, 1.06);
}

/** 전략별 km당 페이스 배율 배열을 생성 */
function buildPaceMultipliers(totalKm: number, strategy: Strategy): number[] {
  const full = Math.floor(totalKm);
  const remainder = totalKm - full;
  const segments = remainder > 0.001 ? full + 1 : full;

  const mults: number[] = [];
  for (let i = 0; i < segments; i++) {
    const progress = i / (segments - 1 || 1); // 0 → 1
    if (strategy === 'even') {
      mults.push(1.0);
    } else if (strategy === 'positive') {
      // 초반 빠름(0.92) → 후반 느림(1.08)
      mults.push(0.92 + progress * 0.16);
    } else {
      // negative: 초반 느림(1.08) → 후반 빠름(0.92)
      mults.push(1.08 - progress * 0.16);
    }
  }
  return mults;
}

/** 스플릿 테이블 생성 */
function buildSplits(totalKm: number, totalSec: number, strategy: Strategy): SplitRow[] {
  const avgPace = totalSec / totalKm; // 초/km
  const mults = buildPaceMultipliers(totalKm, strategy);
  const full = Math.floor(totalKm);
  const remainder = totalKm - full;

  // 각 구간 실제 거리
  const segDists: number[] = [];
  for (let i = 0; i < full; i++) segDists.push(1.0);
  if (remainder > 0.001) segDists.push(remainder);

  // 배율 합에 맞게 normalise → 총 시간 보정
  const weightedSum = mults.reduce((acc, m, i) => acc + m * segDists[i], 0);
  const scale = totalSec / (avgPace * weightedSum); // ≈ 1, 소수점 보정

  const splits: SplitRow[] = [];
  let cumSec = 0;
  for (let i = 0; i < segDists.length; i++) {
    const paceHere = avgPace * mults[i] * scale;
    const splitSec = paceHere * segDists[i];
    cumSec += splitSec;
    splits.push({
      km: i + 1,
      paceSecPerKm: paceHere,
      splitSec,
      cumulativeSec: cumSec,
    });
  }
  return splits;
}

// ─── 상수 ────────────────────────────────────────────────────────────────────

const PRESET_DISTANCES = [
  { label: '5km', value: 5 },
  { label: '10km', value: 10 },
  { label: '하프 (21.1km)', value: 21.1 },
  { label: '풀 (42.195km)', value: 42.195 },
  { label: '직접 입력', value: 0 },
];

const STRATEGIES: { value: Strategy; label: string; desc: string; icon: React.JSX.Element }[] = [
  {
    value: 'even',
    label: '균등 페이스',
    desc: '전 구간 일정한 속도 유지',
    icon: <Minus size={15} />,
  },
  {
    value: 'positive',
    label: '초반 가속',
    desc: '초반 빠르게, 후반 여유있게',
    icon: <TrendingDown size={15} />,
  },
  {
    value: 'negative',
    label: '후반 가속',
    desc: '초반 여유있게, 후반 스퍼트',
    icon: <TrendingUp size={15} />,
  },
];

/** Riegel 예측에 사용할 일반적인 기준 기록 프리셋 */
const RIEGEL_REF: { label: string; distKm: number }[] = [
  { label: '5km', distKm: 5 },
  { label: '10km', distKm: 10 },
  { label: '하프', distKm: 21.1 },
  { label: '풀코스', distKm: 42.195 },
];

// ─── 컴포넌트 ─────────────────────────────────────────────────────────────────

export default function PacePage() {
  // ── 입력 상태
  const [presetIdx, setPresetIdx] = useState(2); // 기본 하프
  const [customKm, setCustomKm] = useState('');
  const [hh, setHh] = useState('1');
  const [mm, setMm] = useState('45');
  const [ss, setSs] = useState('00');
  const [strategy, setStrategy] = useState<Strategy>('even');

  // Riegel
  const [rRefIdx, setRRefIdx] = useState(1); // 10km 기준
  const [rRefHh, setRRefHh] = useState('0');
  const [rRefMm, setRRefMm] = useState('55');
  const [rRefSs, setRRefSs] = useState('00');
  const [rTargetIdx, setRTargetIdx] = useState(2); // 하프 예측

  // UI
  const [showAllSplits, setShowAllSplits] = useState(false);

  // ── 파생값
  const distKm = useMemo(() => {
    if (PRESET_DISTANCES[presetIdx].value === 0) {
      return parseFloat(customKm) || 0;
    }
    return PRESET_DISTANCES[presetIdx].value;
  }, [presetIdx, customKm]);

  const totalSec = useMemo(() => {
    const h = parseInt(hh) || 0;
    const m = parseInt(mm) || 0;
    const s = parseInt(ss) || 0;
    return h * 3600 + m * 60 + s;
  }, [hh, mm, ss]);

  const avgPaceSec = useMemo(() => {
    if (distKm <= 0 || totalSec <= 0) return 0;
    return totalSec / distKm;
  }, [distKm, totalSec]);

  const splits = useMemo<SplitRow[]>(() => {
    if (distKm <= 0 || totalSec <= 0) return [];
    return buildSplits(distKm, totalSec, strategy);
  }, [distKm, totalSec, strategy]);

  const halfIdx = Math.floor(splits.length / 2);
  const firstHalf = splits.slice(0, halfIdx);
  const secondHalf = splits.slice(halfIdx);

  const firstHalfSec = firstHalf.reduce((a, r) => a + r.splitSec, 0);
  const secondHalfSec = secondHalf.reduce((a, r) => a + r.splitSec, 0);

  // Riegel 계산
  const riegelSec = useMemo(() => {
    const rh = parseInt(rRefHh) || 0;
    const rm = parseInt(rRefMm) || 0;
    const rs = parseInt(rRefSs) || 0;
    const refSec = rh * 3600 + rm * 60 + rs;
    const refDist = RIEGEL_REF[rRefIdx].distKm;
    const targetDist = RIEGEL_REF[rTargetIdx].distKm;
    if (refSec <= 0 || refDist <= 0 || targetDist <= 0) return 0;
    return riegelPredict(refSec, refDist, targetDist);
  }, [rRefHh, rRefMm, rRefSs, rRefIdx, rTargetIdx]);

  const valid = distKm > 0 && totalSec > 0 && splits.length > 0;

  // 프로그레스 바 배경 (전략별 색)
  const stratColor: Record<Strategy, string> = {
    even: 'bg-blue-500',
    positive: 'bg-orange-500',
    negative: 'bg-emerald-500',
  };

  const visibleSplits = showAllSplits ? splits : splits.slice(0, 20);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

        {/* ── 헤더 */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FF5A5F] flex items-center justify-center shadow">
            <Timer size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">마라톤 페이스 계산기</h1>
            <p className="text-sm text-gray-500">거리와 목표 시간으로 구간별 페이스를 계산합니다</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── 왼쪽: 입력 패널 */}
          <div className="lg:col-span-1 space-y-5">

            {/* 거리 */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Ruler size={15} className="text-[#FF5A5F]" />
                러닝 거리
              </div>
              <div className="grid grid-cols-2 gap-2">
                {PRESET_DISTANCES.map((p, i) => (
                  <button
                    key={p.label}
                    onClick={() => setPresetIdx(i)}
                    className={`py-2 px-3 rounded-xl text-sm font-medium border transition-all ${
                      presetIdx === i
                        ? 'bg-[#FF5A5F] text-white border-[#FF5A5F] shadow'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-[#FF5A5F] hover:text-[#FF5A5F]'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              {presetIdx === 4 && (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0.1}
                    step={0.1}
                    value={customKm}
                    onChange={(e) => setCustomKm(e.target.value)}
                    placeholder="거리 입력 (km)"
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5A5F]/30 focus:border-[#FF5A5F]"
                  />
                  <span className="text-sm text-gray-500">km</span>
                </div>
              )}
            </div>

            {/* 목표 시간 */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Timer size={15} className="text-[#FF5A5F]" />
                목표 시간
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 text-center">
                  <input
                    type="number"
                    min={0}
                    max={23}
                    value={hh}
                    onChange={(e) => setHh(e.target.value)}
                    className="w-full text-center text-2xl font-bold border border-gray-200 rounded-xl py-2 focus:outline-none focus:ring-2 focus:ring-[#FF5A5F]/30 focus:border-[#FF5A5F]"
                  />
                  <span className="text-xs text-gray-400 mt-1 block">시간</span>
                </div>
                <span className="text-2xl font-bold text-gray-400 mb-4">:</span>
                <div className="flex-1 text-center">
                  <input
                    type="number"
                    min={0}
                    max={59}
                    value={mm}
                    onChange={(e) => setMm(e.target.value)}
                    className="w-full text-center text-2xl font-bold border border-gray-200 rounded-xl py-2 focus:outline-none focus:ring-2 focus:ring-[#FF5A5F]/30 focus:border-[#FF5A5F]"
                  />
                  <span className="text-xs text-gray-400 mt-1 block">분</span>
                </div>
                <span className="text-2xl font-bold text-gray-400 mb-4">:</span>
                <div className="flex-1 text-center">
                  <input
                    type="number"
                    min={0}
                    max={59}
                    value={ss}
                    onChange={(e) => setSs(e.target.value)}
                    className="w-full text-center text-2xl font-bold border border-gray-200 rounded-xl py-2 focus:outline-none focus:ring-2 focus:ring-[#FF5A5F]/30 focus:border-[#FF5A5F]"
                  />
                  <span className="text-xs text-gray-400 mt-1 block">초</span>
                </div>
              </div>
            </div>

            {/* 러닝 전략 */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <TrendingUp size={15} className="text-[#FF5A5F]" />
                러닝 전략
              </div>
              <div className="space-y-2">
                {STRATEGIES.map((st) => (
                  <button
                    key={st.value}
                    onClick={() => setStrategy(st.value)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                      strategy === st.value
                        ? 'bg-[#FF5A5F]/5 border-[#FF5A5F] text-[#FF5A5F]'
                        : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span className={strategy === st.value ? 'text-[#FF5A5F]' : 'text-gray-400'}>
                      {st.icon}
                    </span>
                    <div>
                      <div className="text-sm font-medium">{st.label}</div>
                      <div className="text-xs text-gray-400">{st.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Riegel 레이스 예측 */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Zap size={15} className="text-amber-500" />
                레이스 예측 (Riegel 공식)
              </div>
              <p className="text-xs text-gray-400">
                T₂ = T₁ × (D₂/D₁)^1.06 — 기준 기록으로 목표 거리 완주 시간 예측
              </p>

              {/* 기준 기록 */}
              <div className="space-y-2">
                <label className="text-xs text-gray-500 font-medium">기준 기록</label>
                <div className="flex gap-2">
                  <select
                    value={rRefIdx}
                    onChange={(e) => setRRefIdx(Number(e.target.value))}
                    className="flex-1 text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400"
                  >
                    {RIEGEL_REF.map((r, i) => (
                      <option key={r.label} value={i}>{r.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={0}
                    max={9}
                    value={rRefHh}
                    onChange={(e) => setRRefHh(e.target.value)}
                    className="w-14 text-center border border-gray-200 rounded-lg py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400"
                  />
                  <span className="text-gray-400 text-sm">h</span>
                  <input
                    type="number"
                    min={0}
                    max={59}
                    value={rRefMm}
                    onChange={(e) => setRRefMm(e.target.value)}
                    className="w-14 text-center border border-gray-200 rounded-lg py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400"
                  />
                  <span className="text-gray-400 text-sm">m</span>
                  <input
                    type="number"
                    min={0}
                    max={59}
                    value={rRefSs}
                    onChange={(e) => setRRefSs(e.target.value)}
                    className="w-14 text-center border border-gray-200 rounded-lg py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400"
                  />
                  <span className="text-gray-400 text-sm">s</span>
                </div>
              </div>

              {/* 목표 거리 */}
              <div className="space-y-2">
                <label className="text-xs text-gray-500 font-medium">예측 거리</label>
                <select
                  value={rTargetIdx}
                  onChange={(e) => setRTargetIdx(Number(e.target.value))}
                  className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400"
                >
                  {RIEGEL_REF.map((r, i) => (
                    <option key={r.label} value={i}>{r.label}</option>
                  ))}
                </select>
              </div>

              {/* 결과 */}
              {riegelSec > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
                  <div className="text-xs text-amber-600 font-medium mb-1">
                    {RIEGEL_REF[rRefIdx].label} 기록 기준 → {RIEGEL_REF[rTargetIdx].label} 예측
                  </div>
                  <div className="text-2xl font-bold text-amber-700">
                    {fmtTime(riegelSec, true)}
                  </div>
                  <div className="text-xs text-amber-500 mt-0.5">
                    평균 페이스 {fmtPace(riegelSec / RIEGEL_REF[rTargetIdx].distKm)} /km
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── 오른쪽: 대시보드 + 스플릿 */}
          <div className="lg:col-span-2 space-y-5">

            {/* 대시보드 카드 */}
            {valid ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    {
                      label: '총 거리',
                      value: `${distKm % 1 === 0 ? distKm : distKm.toFixed(3)}`,
                      unit: 'km',
                      color: 'text-[#FF5A5F]',
                      bg: 'bg-red-50',
                    },
                    {
                      label: '목표 시간',
                      value: fmtTime(totalSec, true),
                      unit: '',
                      color: 'text-blue-600',
                      bg: 'bg-blue-50',
                    },
                    {
                      label: '평균 페이스',
                      value: fmtPace(avgPaceSec),
                      unit: '/km',
                      color: 'text-purple-600',
                      bg: 'bg-purple-50',
                    },
                    {
                      label: '평균 속도',
                      value: (3600 / avgPaceSec).toFixed(2),
                      unit: 'km/h',
                      color: 'text-emerald-600',
                      bg: 'bg-emerald-50',
                    },
                  ].map((card) => (
                    <div key={card.label} className={`${card.bg} rounded-2xl p-4 text-center`}>
                      <div className="text-xs text-gray-500 font-medium mb-1">{card.label}</div>
                      <div className={`text-xl font-bold ${card.color}`}>{card.value}</div>
                      {card.unit && <div className="text-xs text-gray-400 mt-0.5">{card.unit}</div>}
                    </div>
                  ))}
                </div>

                {/* 전후반 현황 */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                  <h2 className="text-sm font-semibold text-gray-700">전체 코스 진행 현황</h2>

                  {/* 프로그레스 바 */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>전반 ({firstHalf.length}km)</span>
                      <span>후반 ({splits.length - firstHalf.length}km)</span>
                    </div>
                    <div className="h-3 rounded-full bg-gray-100 flex overflow-hidden">
                      <div
                        className={`${stratColor[strategy]} opacity-80 transition-all`}
                        style={{ width: `${(firstHalfSec / totalSec) * 100}%` }}
                      />
                      <div
                        className={`${stratColor[strategy]} opacity-40`}
                        style={{ width: `${(secondHalfSec / totalSec) * 100}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 font-medium">
                      <span>{fmtTime(firstHalfSec)}</span>
                      <span>{fmtTime(secondHalfSec)}</span>
                    </div>
                  </div>

                  {/* 전반 / 후반 카드 */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      {
                        label: '전반',
                        range: `1 ~ ${firstHalf.length}km`,
                        timeSec: firstHalfSec,
                        paceAvg: firstHalf.reduce((a, r) => a + r.paceSecPerKm, 0) / (firstHalf.length || 1),
                        color: 'border-l-blue-400 bg-blue-50',
                        chip: 'bg-blue-100 text-blue-700',
                      },
                      {
                        label: '후반',
                        range: `${firstHalf.length + 1} ~ ${splits.length}km`,
                        timeSec: secondHalfSec,
                        paceAvg: secondHalf.reduce((a, r) => a + r.paceSecPerKm, 0) / (secondHalf.length || 1),
                        color: 'border-l-purple-400 bg-purple-50',
                        chip: 'bg-purple-100 text-purple-700',
                      },
                    ].map((half) => (
                      <div
                        key={half.label}
                        className={`${half.color} border-l-4 rounded-xl p-4 space-y-2`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${half.chip}`}>
                            {half.label}
                          </span>
                          <span className="text-xs text-gray-400">{half.range}</span>
                        </div>
                        <div className="text-lg font-bold text-gray-800">{fmtTime(half.timeSec)}</div>
                        <div className="text-xs text-gray-500">
                          avg {fmtPace(half.paceAvg)} /km
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* 전후반 차이 */}
                  {strategy !== 'even' && (
                    <div className="text-center text-sm text-gray-500">
                      전후반 차이&nbsp;
                      <span className="font-semibold text-gray-700">
                        {fmtTime(Math.abs(secondHalfSec - firstHalfSec))}
                      </span>
                      &nbsp;
                      {secondHalfSec < firstHalfSec ? (
                        <span className="text-emerald-600 font-semibold">네거티브 스플릿 ✓</span>
                      ) : (
                        <span className="text-orange-500 font-semibold">포지티브 스플릿</span>
                      )}
                    </div>
                  )}
                </div>

                {/* 스플릿 테이블 */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-gray-700">
                      구간별 스플릿
                      <span className="ml-2 text-xs text-gray-400 font-normal">({splits.length}구간)</span>
                    </h2>
                    <div className="flex gap-2">
                      {[
                        { v: 'even' as Strategy, l: '균등' },
                        { v: 'positive' as Strategy, l: '초반가속' },
                        { v: 'negative' as Strategy, l: '후반가속' },
                      ].map((s) => (
                        <button
                          key={s.v}
                          onClick={() => setStrategy(s.v)}
                          className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                            strategy === s.v
                              ? 'bg-[#FF5A5F] text-white border-[#FF5A5F]'
                              : 'text-gray-500 border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {s.l}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">KM</th>
                          <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500">페이스 (/km)</th>
                          <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500">구간 시간</th>
                          <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500">누적 시간</th>
                          <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">페이스 바</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          const maxPace = splits.length ? Math.max(...splits.map((r) => r.paceSecPerKm)) : 1;
                          const minPace = splits.length ? Math.min(...splits.map((r) => r.paceSecPerKm)) : 0;
                          const paceRange = maxPace - minPace || 1;
                          const rows: React.ReactNode[] = [];

                          visibleSplits.forEach((row, i) => {
                            const isFirstHalf = i < halfIdx;
                            const barWidth = strategy === 'even'
                              ? 60
                              : 20 + ((maxPace - row.paceSecPerKm) / paceRange) * 70;

                            rows.push(
                              <tr
                                key={`row-${row.km}`}
                                className={`border-t border-gray-50 hover:bg-gray-50 transition-colors ${
                                  isFirstHalf ? 'bg-white' : 'bg-purple-50/30'
                                }`}
                              >
                                <td className="px-4 py-2.5 font-semibold text-gray-700">
                                  {i === splits.length - 1 && distKm % 1 > 0.001
                                    ? `${Math.floor(distKm)}+${(distKm % 1).toFixed(3).slice(1)}`
                                    : row.km}
                                </td>
                                <td className="px-4 py-2.5 text-right text-gray-600 font-mono">
                                  {fmtPace(row.paceSecPerKm)}
                                </td>
                                <td className="px-4 py-2.5 text-right text-gray-600 font-mono">
                                  {fmtTime(row.splitSec)}
                                </td>
                                <td className="px-4 py-2.5 text-right font-semibold text-gray-800 font-mono">
                                  {fmtTime(row.cumulativeSec)}
                                </td>
                                <td className="px-4 py-2.5">
                                  <div className="h-2 rounded-full bg-gray-100 overflow-hidden w-24">
                                    <div
                                      className={`h-full rounded-full ${stratColor[strategy]} transition-all`}
                                      style={{ width: `${barWidth}%` }}
                                    />
                                  </div>
                                </td>
                              </tr>
                            );

                            if (i === halfIdx - 1) {
                              rows.push(
                                <tr key="half-divider" className="bg-gray-100">
                                  <td colSpan={5} className="px-4 py-1.5 text-xs text-center text-gray-400 font-medium tracking-wide">
                                    ── 전반 완료 {fmtTime(firstHalfSec)} ── 후반 시작 ──
                                  </td>
                                </tr>
                              );
                            }
                          });

                          return rows;
                        })()}
                      </tbody>
                    </table>
                  </div>

                  {splits.length > 20 && (
                    <div className="px-5 py-3 border-t border-gray-100 text-center">
                      <button
                        onClick={() => setShowAllSplits(!showAllSplits)}
                        className="flex items-center gap-1 text-sm text-[#FF5A5F] font-medium mx-auto hover:underline"
                      >
                        {showAllSplits ? (
                          <><ChevronUp size={15} /> 접기</>
                        ) : (
                          <><ChevronDown size={15} /> 전체 {splits.length}구간 보기</>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center py-20 gap-4 text-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                  <Timer size={28} className="text-gray-300" />
                </div>
                <div>
                  <p className="text-gray-500 font-medium">거리와 목표 시간을 입력하세요</p>
                  <p className="text-xs text-gray-400 mt-1">왼쪽 패널에서 설정하면 스플릿이 자동 계산됩니다</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
