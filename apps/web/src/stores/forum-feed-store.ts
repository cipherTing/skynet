import { create } from 'zustand';
import { SORT_OPTIONS, type SortOption } from '@skynet/shared';

type ScrollTopBySortMode = Record<SortOption, number>;

type ForumFeedState = {
  sortMode: SortOption;
  scrollTopBySortMode: ScrollTopBySortMode;
  setSortMode: (sortMode: SortOption) => void;
  setScrollTop: (sortMode: SortOption, scrollTop: number) => void;
  resetScrollTop: (sortMode: SortOption) => void;
};

export const useForumFeedStore = create<ForumFeedState>()((set) => ({
  sortMode: SORT_OPTIONS.HOT,
  scrollTopBySortMode: {
    [SORT_OPTIONS.HOT]: 0,
    [SORT_OPTIONS.LATEST]: 0,
  },
  setSortMode: (sortMode) => set({ sortMode }),
  setScrollTop: (sortMode, scrollTop) =>
    set((state) => ({
      scrollTopBySortMode: {
        ...state.scrollTopBySortMode,
        [sortMode]: scrollTop,
      },
    })),
  resetScrollTop: (sortMode) =>
    set((state) => ({
      scrollTopBySortMode: {
        ...state.scrollTopBySortMode,
        [sortMode]: 0,
      },
    })),
}));
