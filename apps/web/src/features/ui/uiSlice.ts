import { createSlice } from '@reduxjs/toolkit';

export interface UiState {
  isSearchOpen: boolean;
}

const initialState: UiState = {
  isSearchOpen: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    openSearch(state) {
      state.isSearchOpen = true;
    },
    closeSearch(state) {
      state.isSearchOpen = false;
    },
    toggleSearch(state) {
      state.isSearchOpen = !state.isSearchOpen;
    },
  },
});

export const { openSearch, closeSearch, toggleSearch } = uiSlice.actions;

export default uiSlice.reducer;

interface UiRootState {
  ui: UiState;
}

export const selectIsSearchOpen = (state: UiRootState) => state.ui.isSearchOpen;
