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

function levelBadgeVariant(level: JobLevel) {
  if (level === "junior") return "success";
  if (level === "mid") return "warning";
  return "danger";
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

  function updateParam(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (!value) next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true });
  }

  // Debounced sync of the query param `q`
  useEffect(() => {
    // Don’t thrash history; keep URL in sync after debounce
    updateParam("q", debouncedQ.trim());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQ]);

  const query = useMemo(() => ({ q, level }), [q, level]);

  const state = useAsync(
    (signal: AbortSignal) => fetchJobs(query, signal),
    [query.q, query.level]
  );

  const visibleJobs: Job[] = useMemo(() => {
    if (state.status !== "success") return [];
    return savedOnly ? state.data.filter((j) => isSaved(saved, j.id)) : state.data;
  }, [state.status, state.status === "success" ? state.data : null, savedOnly, saved]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Jobs</h1>
          <p className="mt-1 text-sm text-white/60">
            Search, filter and save jobs. URL stays in sync (interview-friendly).
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <div className="relative w-full sm:w-80">
            <input
              value={qInput}
              onChange={(e) => setQInput(e.target.value)}
              placeholder="Search by title, company, location..."
              className="w-full rounded-xl bg-white/5 px-4 py-2.5 text-sm text-white ring-1 ring-white/10 placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/20"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-0">
            {LEVELS.map((opt) => {
              const active = opt.value === level;
              return (
                <button
                  key={opt.value}
                  onClick={() => {
                    updateParam("level", opt.value);
                    updateParam("saved", "");
                  }}
                  className={[
                    "rounded-xl px-4 py-2.5 text-sm font-semibold transition whitespace-nowrap",
                    active
                      ? "bg-white/10 text-white"
                      : "bg-white/5 text-white/80 hover:bg-white/10",
                  ].join(" ")}
                >
                  {opt.label}
                </button>
              );
            })}

            <button
              onClick={() => updateParam("saved", savedOnly ? "" : "1")}
              className={[
                "rounded-xl px-4 py-2.5 text-sm font-semibold transition whitespace-nowrap",
                savedOnly
                  ? "bg-white/10 text-white"
                  : "bg-white/5 text-white/80 hover:bg-white/10",
              ].join(" ")}
            >
              <span className="flex items-center gap-2">
                <span>Saved</span>
                {savedCount > 0 && (
                  <span className="rounded-lg bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-200">
                    {savedCount}
                  </span>
                )}
              </span>
            </button>
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