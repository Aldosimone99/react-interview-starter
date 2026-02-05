import { Link, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { fetchJobs } from "../features/jobs/api";
import type { Job, JobLevel } from "../features/jobs/types";
import { useAsync } from "../hooks/useAsync";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Skeleton } from "../components/ui/Skeleton";

const LEVELS: Array<{ label: string; value: "all" | JobLevel }> = [
  { label: "All", value: "all" },
  { label: "Junior", value: "junior" },
  { label: "Mid", value: "mid" },
  { label: "Senior", value: "senior" },
];

const SORTS = [
  { label: "Recent", value: "recent" },
  { label: "Seniority", value: "seniority" },
] as const;

type SortKey = (typeof SORTS)[number]["value"];

function levelLabel(value: "all" | JobLevel) {
  if (value === "all") return "All";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function levelBadgeVariant(level: JobLevel) {
  if (level === "junior") return "success";
  if (level === "mid") return "warning";
  return "danger";
}

function seniorityScore(level: JobLevel) {
  if (level === "senior") return 3;
  if (level === "mid") return 2;
  return 1;
}

function formatLevelLabel(level: JobLevel) {
  return level.charAt(0).toUpperCase() + level.slice(1);
}

// Small, self-contained debounce hook (keeps this file compile-safe)
function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(id);
  }, [value, delayMs]);

  return debounced;
}

// Saved jobs stored as a set-like object: { [id]: true }
type SavedJobsState = Record<number, true>;

function useLocalStorageState<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return initialValue;
      return JSON.parse(raw) as T;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // ignore write errors (e.g. private mode)
    }
  }, [key, value]);

  return [value, setValue] as const;
}

function isSaved(state: SavedJobsState, id: number) {
  return state[id] === true;
}

function toggleSaved(state: SavedJobsState, id: number): SavedJobsState {
  const next = { ...state };
  if (next[id]) delete next[id];
  else next[id] = true;
  return next;
}

export default function Jobs() {
  const [params, setParams] = useSearchParams();

  // URL-driven state (shareable / back-forward friendly)
  const q = params.get("q") ?? "";
  const level = (params.get("level") ?? "all") as "all" | JobLevel;
  const savedOnly = params.get("saved") === "1";
  const sort = (params.get("sort") ?? "recent") as SortKey;

  // Local input state + debounce (UI responsive, fetch not spammy)
  const [qInput, setQInput] = useState(q);
  const debouncedQ = useDebouncedValue(qInput, 300);

  // Keep input in sync with URL changes (e.g., back/forward navigation)
  useEffect(() => {
    setQInput(q);
  }, [q]);

  // Saved jobs (localStorage)
  const [saved, setSaved] = useLocalStorageState<SavedJobsState>("savedJobs", {});

  const savedCount = useMemo(() => Object.keys(saved).length, [saved]);

  function updateParams(patch: Record<string, string | null | undefined>) {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const [key, value] of Object.entries(patch)) {
          if (!value) next.delete(key);
          else next.set(key, value);
        }
        return next;
      },
      { replace: true }
    );
  }

  // Debounced sync of the query param `q`
  useEffect(() => {
    // Don’t thrash history; keep URL in sync after debounce
    updateParams({ q: debouncedQ.trim() });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQ]);

  const query = useMemo(() => ({ q, level }), [q, level]);

  const state = useAsync(
    (signal: AbortSignal) => fetchJobs(query, signal),
    [query.q, query.level]
  );

  const visibleJobs: Job[] = useMemo(() => {
    if (state.status !== "success") return [];

    const base = savedOnly ? state.data.filter((j) => isSaved(saved, j.id)) : state.data;

    const sorted = [...base].sort((a, b) => {
      if (sort === "seniority") {
        // Higher seniority first; then newest first as tie-breaker
        const diff = seniorityScore(b.level) - seniorityScore(a.level);
        return diff !== 0 ? diff : b.id - a.id;
      }

      // "recent": newest first (we use id as a stable proxy in this demo)
      return b.id - a.id;
    });

    return sorted;
  }, [state.status, state.status === "success" ? state.data : null, savedOnly, saved, sort]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 grid gap-6 lg:grid-cols-[1fr_560px] lg:items-start">
        <div>
          <h1 className="text-2xl font-semibold text-white">Jobs</h1>
          <p className="mt-1 text-sm text-white/60">
            Search, filter and save jobs. URL stays in sync (interview-friendly).
          </p>
        </div>

        {/* Controls */}
        <div className="space-y-2">
          {/* Row 1: Search */}
          <div className="relative w-full">
            <input
              value={qInput}
              onChange={(e) => setQInput(e.target.value)}
              placeholder="Search by title, company, location..."
              className="w-full rounded-xl bg-white/5 px-4 py-2 text-sm text-white ring-1 ring-white/10 placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/20"
            />
          </div>

          {/* Row 2: Filters/Saved (left) + Sort (right) */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <details className="relative">
                <summary
                  className={[
                    "list-none cursor-pointer rounded-xl px-3.5 py-2 text-[13px] font-semibold transition whitespace-nowrap",
                    "bg-white/5 text-white/80 hover:bg-white/10",
                    "flex items-center gap-2",
                  ].join(" ")}
                >
                  Filters
                  <span className="text-white/50">•</span>
                  <span className="text-white/90">{levelLabel(level)}</span>
                  <span className="ml-1 text-white/50" aria-hidden>
                    ▾
                  </span>
                </summary>

                <div className="absolute left-0 z-20 mt-2 w-56 rounded-2xl bg-zinc-900/95 p-2 shadow-xl shadow-black/30 ring-1 ring-white/10 backdrop-blur">
                  <div className="px-2 py-2 text-xs font-semibold text-white/50">Level</div>

                  {LEVELS.map((opt) => {
                    const active = opt.value === level;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          const details = e.currentTarget.closest("details") as HTMLDetailsElement | null;
                          if (details) details.open = false;
                          updateParams({ level: opt.value, saved: "", sort: "recent" });
                        }}
                        className={[
                          "w-full rounded-xl px-3 py-2 text-left text-sm font-semibold transition",
                          active ? "bg-white/10 text-white" : "bg-transparent text-white/75 hover:bg-white/5",
                        ].join(" ")}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </details>

              <button
                onClick={() => updateParams({ saved: savedOnly ? "" : "1" })}
                className={[
                  "rounded-xl px-4 py-2 text-sm font-semibold transition whitespace-nowrap",
                  savedOnly ? "bg-white/10 text-white" : "bg-white/5 text-white/80 hover:bg-white/10",
                ].join(" ")}
              >
                <span className="flex items-center gap-2">
                  <span>Saved</span>
                  {savedCount > 0 && (
                    <span className="rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-200">
                      {savedCount}
                    </span>
                  )}
                </span>
              </button>
            </div>

            <details className="relative">
              <summary
                className={[
                  "list-none cursor-pointer rounded-xl px-3.5 py-2 text-[13px] font-semibold transition whitespace-nowrap",
                  "bg-white/5 text-white/80 hover:bg-white/10",
                  "flex items-center gap-2",
                ].join(" ")}
              >
                Sort
                <span className="text-white/50">•</span>
                <span className="text-white/90">
                  {SORTS.find((s) => s.value === sort)?.label ?? "Recent"}
                </span>
                <span className="ml-1 text-white/50" aria-hidden>
                  ▾
                </span>
              </summary>

              <div className="absolute right-0 z-20 mt-2 w-56 rounded-2xl bg-zinc-900/95 p-2 shadow-xl shadow-black/30 ring-1 ring-white/10 backdrop-blur">
                <div className="px-2 py-2 text-xs font-semibold text-white/50">Sort by</div>

                {SORTS.map((opt) => {
                  const active = opt.value === sort;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        const details = e.currentTarget.closest("details") as HTMLDetailsElement | null;
                        if (details) details.open = false;
                        updateParams({ sort: opt.value });
                      }}
                      className={[
                        "w-full rounded-xl px-3 py-2 text-left text-sm font-semibold transition",
                        active ? "bg-white/10 text-white" : "bg-transparent text-white/75 hover:bg-white/5",
                      ].join(" ")}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </details>
          </div>
        </div>
      </div>

      {state.status === "loading" ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-5">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="mt-3 h-3 w-1/2" />
              <div className="mt-4 flex gap-2">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>
            </Card>
          ))}
        </div>
      ) : state.status === "error" ? (
        <Card>
          <CardHeader
            title="Something went wrong"
            subtitle={state.error.message}
            right={<Badge variant="danger">Error</Badge>}
          />
          <CardBody>
            <p className="text-sm text-white/70">
              In interview: explain retry strategy (button), logging, and UI fallback.
            </p>
          </CardBody>
        </Card>
      ) : state.status === "success" ? (
        visibleJobs.length === 0 ? (
          <Card>
            <CardHeader
              title="No results"
              subtitle={
                savedOnly
                  ? "No saved jobs match your filters."
                  : "Try a different search or level."
              }
            />
            <CardBody>
              <Badge variant="muted">Empty state</Badge>
            </CardBody>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {visibleJobs.map((job) => {
              const savedNow = isSaved(saved, job.id);

              return (
                <Card key={job.id} className="transition hover:bg-white/[0.07]">
                  <CardHeader
                    title={job.title}
                    subtitle={`${job.company} • ${job.location}`}
                    right={
                      <div className="flex items-center gap-2">
                        <Badge variant={levelBadgeVariant(job.level)}>{formatLevelLabel(job.level)}</Badge>
                        <button
                          type="button"
                          aria-pressed={savedNow}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setSaved((prev) => toggleSaved(prev, job.id));
                          }}
                          className={[
                            "rounded-xl px-2.5 py-1 text-xs ring-1 transition",
                            savedNow
                              ? "bg-emerald-500/15 text-emerald-200 ring-emerald-500/30"
                              : "bg-white/5 text-white/70 ring-white/10 hover:bg-white/10",
                          ].join(" ")}
                        >
                          {savedNow ? "Saved" : "Save"}
                        </button>
                      </div>
                    }
                  />
                  <CardBody>
                    <Link
                      className="inline-flex items-center gap-2 text-sm font-medium text-white/90 hover:text-white"
                      to={`/jobs/${job.id}`}
                    >
                      View details <span aria-hidden>→</span>
                    </Link>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        )
      ) : null}
    </div>
  );
}