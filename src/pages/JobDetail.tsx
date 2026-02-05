import { Link, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { fetchJobById } from "../features/jobs/api";
import type { JobLevel } from "../features/jobs/types";
import { useAsync } from "../hooks/useAsync";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Skeleton } from "../components/ui/Skeleton";

// --- UI helpers ---
function levelBadgeVariant(level: JobLevel) {
  if (level === "junior") return "success";
  if (level === "mid") return "warning";
  return "danger";
}

function formatLevelLabel(level: JobLevel) {
  return level.charAt(0).toUpperCase() + level.slice(1);
}

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

// --- localStorage helpers (kept local to avoid extra deps) ---
type SavedJobsState = Record<number, true>;
type JobNotesState = Record<number, string>;

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

export default function JobDetail() {
  const { id } = useParams();
  const jobId = Number(id);

  const state = useAsync((signal: AbortSignal) => fetchJobById(jobId, signal), [jobId]);

  // Saved jobs (shared key with Jobs page)
  const [saved, setSaved] = useLocalStorageState<SavedJobsState>("savedJobs", {});

  // Per-job notes (local-only feature that makes the page feel realistic)
  const [notes, setNotes] = useLocalStorageState<JobNotesState>("jobNotes", {});

  const savedNow = useMemo(() => (Number.isFinite(jobId) ? isSaved(saved, jobId) : false), [saved, jobId]);
  const noteValue = useMemo(() => (Number.isFinite(jobId) ? notes[jobId] ?? "" : ""), [notes, jobId]);

  function onToggleSaved() {
    if (!Number.isFinite(jobId)) return;
    setSaved((prev) => toggleSaved(prev, jobId));
  }

  function onChangeNotes(next: string) {
    if (!Number.isFinite(jobId)) return;
    setNotes((prev) => ({ ...prev, [jobId]: next }));
  }

  function onComingSoon(action: string) {
    alert(`${action} is coming soon in a future iteration of this app.`);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6">
        <nav className="mb-4 flex items-center gap-2 text-sm text-white/70">
          <Link className="hover:text-white" to="/jobs">
            Jobs
          </Link>
          <span className="text-white/40" aria-hidden>
            →
          </span>
          <span className="text-white/90">
            {state.status === "success" && state.data ? state.data.title : "Job"}
          </span>
        </nav>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            className="inline-flex w-fit items-center gap-2 text-sm text-white/70 hover:text-white"
            to="/jobs"
          >
            <span aria-hidden>←</span> Back to Jobs
          </Link>

          <button
            type="button"
            aria-pressed={savedNow}
            onClick={onToggleSaved}
            className={cx(
              "rounded-xl px-4 py-2.5 text-sm font-semibold transition whitespace-nowrap",
              savedNow ? "bg-white/10 text-white" : "bg-white/5 text-white/80 hover:bg-white/10"
            )}
          >
            {savedNow ? "Saved" : "Save"}
          </button>
        </div>
      </div>

      {state.status === "loading" ? (
        <Card>
          <CardHeader title="Loading job…" subtitle="Fetching details" right={<Badge variant="muted">Loading</Badge>} />
          <CardBody>
            <div className="space-y-4">
              <Skeleton className="h-7 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
              <div className="grid gap-4 md:grid-cols-2">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
              <Skeleton className="h-28 w-full" />
            </div>
          </CardBody>
        </Card>
      ) : state.status === "error" ? (
        <Card>
          <CardHeader
            title="Failed to load"
            subtitle={state.error.message}
            right={<Badge variant="danger">Error</Badge>}
          />
          <CardBody>
            <p className="text-sm text-white/70">
              Try going back and opening the job again. In a real app you’d implement retry + logging.
            </p>
          </CardBody>
        </Card>
      ) : state.status === "success" ? (
        state.data ? (
          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            {/* Main */}
            <div className="space-y-6">
              <Card>
                <CardHeader
                  title={state.data.title}
                  subtitle={`${state.data.company} • ${state.data.location}`}
                  right={
                    <Badge variant={levelBadgeVariant(state.data.level)}>
                      {formatLevelLabel(state.data.level)}
                    </Badge>
                  }
                />
                <CardBody>
                  <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                    <div className="text-xs font-semibold text-white/60">Details</div>
                    <dl className="mt-3 grid grid-cols-1 gap-2 text-sm text-white/80 sm:grid-cols-2">
                      <div className="flex items-center justify-between gap-4 rounded-xl bg-white/5 px-3 py-2 ring-1 ring-white/10">
                        <dt className="text-white/60">Job ID</dt>
                        <dd className="font-medium text-white">{state.data.id}</dd>
                      </div>
                      <div className="flex items-center justify-between gap-4 rounded-xl bg-white/5 px-3 py-2 ring-1 ring-white/10">
                        <dt className="text-white/60">Level</dt>
                        <dd className="font-medium text-white">{formatLevelLabel(state.data.level)}</dd>
                      </div>
                      <div className="flex items-center justify-between gap-4 rounded-xl bg-white/5 px-3 py-2 ring-1 ring-white/10">
                        <dt className="text-white/60">Company</dt>
                        <dd className="font-medium text-white">{state.data.company}</dd>
                      </div>
                      <div className="flex items-center justify-between gap-4 rounded-xl bg-white/5 px-3 py-2 ring-1 ring-white/10">
                        <dt className="text-white/60">Location</dt>
                        <dd className="font-medium text-white">{state.data.location}</dd>
                      </div>
                    </dl>
                  </div>

                </CardBody>
              </Card>
            </div>

            {/* Sidebar */}
            <aside className="lg:sticky lg:top-24 h-fit">
              <div className="space-y-4">
                <Card>
                  <CardHeader
                    title="Actions"
                    subtitle="Quick shortcuts"
                    right={savedNow ? <Badge variant="success">Saved</Badge> : <Badge variant="muted">Not saved</Badge>}
                  />
                  <CardBody>
                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={onToggleSaved}
                        className={cx(
                          "rounded-xl px-4 py-2.5 text-sm font-semibold transition",
                          savedNow ? "bg-white/10 text-white" : "bg-white/5 text-white/80 hover:bg-white/10"
                        )}
                      >
                        {savedNow ? "Unsave" : "Save"}
                      </button>
                      <button
                        type="button"
                        onClick={() => onComingSoon("Apply")}
                        className="rounded-xl bg-white/5 px-4 py-2.5 text-sm font-semibold text-white/80 hover:bg-white/10"
                        title="Planned feature"
                      >
                        Apply
                      </button>
                      <button
                        type="button"
                        onClick={() => onComingSoon("Share")}
                        className="rounded-xl bg-white/5 px-4 py-2.5 text-sm font-semibold text-white/80 hover:bg-white/10"
                        title="Planned feature"
                      >
                        Share
                      </button>
                    </div>
                    <p className="mt-3 text-xs text-white/50">
                      Apply and Share are planned actions, intentionally scoped out of this demo.
                    </p>
                  </CardBody>
                </Card>

                <Card>
                  <CardHeader
                    title="Notes"
                    subtitle="Private to this device"
                    right={noteValue.trim().length > 0 ? <Badge variant="default">Draft</Badge> : <Badge variant="muted">Empty</Badge>}
                  />
                  <CardBody>
                    <textarea
                      value={noteValue}
                      onChange={(e) => onChangeNotes(e.target.value)}
                      placeholder="Add notes: stack, recruiters, interview steps…"
                      className="min-h-[180px] w-full resize-none rounded-xl bg-white/5 px-4 py-3 text-sm text-white ring-1 ring-white/10 placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/20"
                    />
                    <div className="mt-2 text-xs text-white/50">
                      Persisted in localStorage (no backend).
                    </div>
                  </CardBody>
                </Card>
              </div>
            </aside>
          </div>
        ) : (
          <Card>
            <CardHeader title="Not found" subtitle="Job does not exist." right={<Badge variant="warning">404</Badge>} />
            <CardBody>
              <p className="text-sm text-white/70">Go back to the list and pick an existing job.</p>
            </CardBody>
          </Card>
        )
      ) : null}
    </div>
  );
}