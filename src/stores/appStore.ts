import { create } from 'zustand';
import type { FilterState, Event } from '@/types';

interface AppStore {
  // 필터 상태
  filter: FilterState;
  setFilter: (partial: Partial<FilterState>) => void;
  resetFilter: () => void;

  // 선택된 이벤트 (팝업)
  selectedEventId: string | null;
  setSelectedEventId: (id: string | null) => void;

  // 선택된 이벤트 객체 (리스트/캘린더에서 직접 여는 경우)
  selectedEvent: Event | null;
  setSelectedEvent: (event: Event | null) => void;
}

const defaultFilter: FilterState = {
  region: 'all',
  courseType: 'all',
  status: 'all',
};

export const useAppStore = create<AppStore>((set) => ({
  filter: defaultFilter,
  setFilter: (partial) =>
    set((state) => ({ filter: { ...state.filter, ...partial } })),
  resetFilter: () => set({ filter: defaultFilter }),

  selectedEventId: null,
  setSelectedEventId: (id) => set({ selectedEventId: id }),

  selectedEvent: null,
  setSelectedEvent: (event) => set({ selectedEvent: event }),
}));
