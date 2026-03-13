// ─── 공통 타입 ───────────────────────────────────────────────────────────────

export type Region =
  | '서울' | '경기' | '인천' | '강원' | '충북' | '충남'
  | '대전' | '세종' | '전북' | '전남' | '광주' | '경북'
  | '경남' | '대구' | '부산' | '울산' | '제주';

export type RegistrationStatus = 'open' | 'upcoming' | 'closed' | 'unknown';
export type CourseType = 'road' | 'trail' | 'crosscountry' | 'track' | 'mixed';

export interface LatLng {
  lat: number;
  lng: number;
}

// ─── 고도 데이터 ──────────────────────────────────────────────────────────────

export interface ElevationPoint {
  distanceKm: number;   // 누적 거리 (km)
  elevationM: number;   // 고도 (m)
}

export interface ElevationStats {
  totalAscent: number;    // 총 상승 (m)
  totalDescent: number;   // 총 하강 (m)
  minElevation: number;   // 최저 고도 (m)
  maxElevation: number;   // 최고 고도 (m)
  avgGradient: number;    // 평균 경사 (%)
}

// ─── 코스 ─────────────────────────────────────────────────────────────────────

export interface Course {
  id: string;
  eventId: string;
  name: string;                        // "풀코스", "하프", "10km" …
  distanceKm: number;
  isLongest: boolean;
  startTime?: string;                  // "08:00"
  timeLimitMinutes?: number;
  entryFee?: number;                   // 원
  type: CourseType;
  gpxData?: string;                    // GPX XML 문자열 (직접 포함)
  courseImageUrl?: string;             // 공식 홈페이지 코스 이미지 URL
  routeCoordinates?: LatLng[];         // 파싱된 경로
  elevationData?: ElevationPoint[];    // 파싱된 고도
  elevationStats?: ElevationStats;     // 통계 캐시
}

// ─── 이벤트 ──────────────────────────────────────────────────────────────────

export interface Event {
  id: string;
  name: string;
  date: string;                        // "2026-03-15"
  startTime: string;
  venue: string;                       // 장소 지명
  address: string;
  lat: number;
  lng: number;
  region: Region;
  organizer: string;
  hostOrganization: string;
  officialWebsite: string;
  registrationStart: string;
  registrationEnd: string;
  registrationStatus: RegistrationStatus;
  thumbnailUrl?: string;
  courses: Course[];
  maxParticipants?: number;
  description?: string;
  tags: string[];
}

// ─── 지도 클러스터 ────────────────────────────────────────────────────────────

export interface MapSpot {
  eventId: string;
  lat: number;
  lng: number;
  venueName: string;
  eventName: string;
  status: RegistrationStatus;
  courseLabels: string[];
}

export interface Cluster {
  lat: number;
  lng: number;
  count: number;
  eventIds: string[];
}

// ─── 필터 ─────────────────────────────────────────────────────────────────────

export interface FilterState {
  region: Region | 'all';
  courseType: CourseType | 'all';
  status: RegistrationStatus | 'all';
}
