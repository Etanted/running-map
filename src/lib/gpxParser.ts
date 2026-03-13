import type { LatLng, ElevationPoint, ElevationStats, Course } from '@/types';

interface ParsedGPX {
  coordinates: LatLng[];
  elevationData: ElevationPoint[];
  elevationStats: ElevationStats;
}

/**
 * Haversine 공식으로 두 좌표간 거리 계산 (km)
 */
function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h =
    sinDLat * sinDLat +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      sinDLng *
      sinDLng;
  return R * 2 * Math.asin(Math.sqrt(h));
}

/**
 * GPX XML 문자열을 파싱해 좌표배열, 고도데이터, 고도통계를 반환
 */
export function parseGPX(gpxString: string): ParsedGPX | null {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(gpxString, 'application/xml');

    const parseError = doc.querySelector('parsererror');
    if (parseError) return null;

    const trkpts = Array.from(doc.querySelectorAll('trkpt'));
    if (trkpts.length === 0) return null;

    const coordinates: LatLng[] = [];
    const rawElevations: number[] = [];

    for (const pt of trkpts) {
      const lat = parseFloat(pt.getAttribute('lat') ?? '');
      const lng = parseFloat(pt.getAttribute('lon') ?? '');
      const eleEl = pt.querySelector('ele');
      const ele = eleEl ? parseFloat(eleEl.textContent ?? '0') : 0;

      if (!isNaN(lat) && !isNaN(lng)) {
        coordinates.push({ lat, lng });
        rawElevations.push(isNaN(ele) ? 0 : ele);
      }
    }

    if (coordinates.length === 0) return null;

    // 누적 거리 계산
    const elevationData: ElevationPoint[] = [];
    let cumulativeKm = 0;
    elevationData.push({ distanceKm: 0, elevationM: rawElevations[0] });

    for (let i = 1; i < coordinates.length; i++) {
      cumulativeKm += haversineKm(coordinates[i - 1], coordinates[i]);
      elevationData.push({
        distanceKm: parseFloat(cumulativeKm.toFixed(3)),
        elevationM: rawElevations[i],
      });
    }

    // 고도 통계 계산
    let totalAscent = 0;
    let totalDescent = 0;
    for (let i = 1; i < rawElevations.length; i++) {
      const diff = rawElevations[i] - rawElevations[i - 1];
      if (diff > 0) totalAscent += diff;
      else totalDescent += Math.abs(diff);
    }

    const minElevation = Math.min(...rawElevations);
    const maxElevation = Math.max(...rawElevations);
    const totalDistanceKm = cumulativeKm;
    const avgGradient =
      totalDistanceKm > 0
        ? parseFloat(((totalAscent / (totalDistanceKm * 1000)) * 100).toFixed(2))
        : 0;

    const elevationStats: ElevationStats = {
      totalAscent: Math.round(totalAscent),
      totalDescent: Math.round(totalDescent),
      minElevation: Math.round(minElevation),
      maxElevation: Math.round(maxElevation),
      avgGradient,
    };

    return { coordinates, elevationData, elevationStats };
  } catch {
    return null;
  }
}

/**
 * courses 배열에서 최장 코스 반환
 */
export function getLongestCourse(courses: Course[]): Course {
  const typeOrder: Record<string, number> = {
    trail: 0,
    crosscountry: 1,
    mixed: 2,
    road: 3,
    track: 4,
  };
  return [...courses].sort((a, b) => {
    if (b.distanceKm !== a.distanceKm) return b.distanceKm - a.distanceKm;
    return (typeOrder[a.type] ?? 9) - (typeOrder[b.type] ?? 9);
  })[0];
}

/**
 * 접수 상태 라벨 반환
 */
export function statusLabel(status: string): string {
  switch (status) {
    case 'open': return '접수중';
    case 'upcoming': return '접수예정';
    case 'closed': return '마감';
    default: return '미정';
  }
}

/**
 * 코스 타입 → 한글 라벨
 */
export function courseTypeLabel(type: string): string {
  switch (type) {
    case 'road': return '로드런';
    case 'trail': return '트레일';
    case 'crosscountry': return '크로스컨트리';
    case 'track': return '트랙';
    case 'mixed': return '혼합';
    default: return type;
  }
}

/**
 * 거리 → 짧은 라벨 (숫자+km 형태)
 */
export function distanceLabel(km: number): string {
  const rounded = Math.round(km * 10) / 10;
  return `${rounded}km`;
}

/**
 * 시간(분) → "Xh Ym" 표기
 */
export function minutesToHM(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return `${h}시간`;
  return `${h}시간 ${m}분`;
}

/**
 * 원 → "X만원" or "X,XXX원"
 */
export function formatKRW(won: number): string {
  if (won >= 10000) {
    const man = won / 10000;
    return `${man % 1 === 0 ? man : man.toFixed(1)}만원`;
  }
  return `${won.toLocaleString()}원`;
}
