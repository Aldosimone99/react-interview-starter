export type SavedJobsState = Record<number, true>;

export function toggleSaved(state: SavedJobsState, id: number): SavedJobsState {
  const next = { ...state };
  if (next[id]) delete next[id];
  else next[id] = true;
  return next;
}

export function isSaved(state: SavedJobsState, id: number) {
  return Boolean(state[id]);
}