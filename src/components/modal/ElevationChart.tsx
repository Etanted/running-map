'use client';

import { useEffect, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { Course, ElevationPoint, ElevationStats } from '@/types';
import { parseGPX } from '@/lib/gpxParser';
import { TrendingUp, TrendingDown, Mountain, ArrowUpDown } from 'lucide-react';

interface ElevationChartProps {
  course: Course;
}

interface TooltipPayloadItem {
  value: number;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload?: TooltipPayloadItem[];
  label?: string | number;
}) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-lg text-xs">
        <p className="text-gray-500 mb-0.5">거리</p>
        <p className="font-bold text-gray-900">{Number(label).toFixed(1)} km</p>
        <p className="text-gray-500 mt-1 mb-0.5">고도</p>
        <p className="font-bold text-[#FF5A5F]">{payload[0].value} m</p>
      </div>
    );
  }
  return null;
}

export default function ElevationChart({ course }: ElevationChartProps) {
  const [elevData, setElevData] = useState<ElevationPoint[] | null>(null);
  const [stats, setStats] = useState<ElevationStats | null>(null);

  useEffect(() => {
    if (!course.gpxData) return;
    const result = parseGPX(course.gpxData);
    if (result) {
      setElevData(result.elevationData);
      setStats(result.elevationStats);
    }
  }, [course.gpxData]);

  if (!course.gpxData || !elevData || elevData.length === 0) {
    return (
      <div className="w-full h-36 rounded-xl bg-gray-50 border border-dashed border-gray-200 flex items-center justify-center">
        <p className="text-sm text-gray-400">고도 데이터 없음</p>
      </div>
    );
  }

  // 차트 데이터 (너무 많은 포인트 → 다운샘플링 최대 120)
  const step = Math.max(1, Math.floor(elevData.length / 120));
  const chartData = elevData.filter((_, i) => i % step === 0);

  const minY = stats ? Math.max(0, stats.minElevation - 20) : 0;
  const maxY = stats ? stats.maxElevation + 30 : 100;

  return (
    <div className="space-y-3">
      {/* 차트 */}
      <div className="bg-gray-50 rounded-xl p-3 pt-4">
        <ResponsiveContainer width="100%" height={150}>
          <AreaChart data={chartData} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="elevGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FF5A5F" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#FF5A5F" stopOpacity={0.03} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="distanceKm"
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              tickFormatter={(v) => `${Number(v).toFixed(0)}`}
              label={{ value: 'km', position: 'insideBottomRight', offset: -2, fontSize: 10, fill: '#9ca3af' }}
            />
            <YAxis
              domain={[minY, maxY]}
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              tickFormatter={(v) => `${v}`}
              label={{ value: 'm', position: 'insideTopLeft', offset: 5, fontSize: 10, fill: '#9ca3af' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="elevationM"
              stroke="#FF5A5F"
              strokeWidth={2}
              fill="url(#elevGradient)"
              dot={false}
              activeDot={{ r: 4, fill: '#FF5A5F', strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* 통계 카드 */}
      {stats && (
        <div className="grid grid-cols-2 gap-2">
          <StatCard
            icon={<TrendingUp size={14} className="text-green-500" />}
            label="총 상승"
            value={`+${stats.totalAscent.toLocaleString()} m`}
            color="text-green-600"
          />
          <StatCard
            icon={<TrendingDown size={14} className="text-blue-500" />}
            label="총 하강"
            value={`-${stats.totalDescent.toLocaleString()} m`}
            color="text-blue-600"
          />
          <StatCard
            icon={<Mountain size={14} className="text-orange-500" />}
            label="최고 고도"
            value={`${stats.maxElevation.toLocaleString()} m`}
            color="text-orange-600"
          />
          <StatCard
            icon={<ArrowUpDown size={14} className="text-purple-500" />}
            label="평균 경사"
            value={`${stats.avgGradient} %`}
            color="text-purple-600"
          />
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
      {icon}
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className={`text-sm font-bold ${color}`}>{value}</p>
      </div>
    </div>
  );
}
