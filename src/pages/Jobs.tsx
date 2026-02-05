import { Link, useSearchParams } from "react-router-dom";
import { useMemo } from "react";
import { fetchJobs } from "../features/jobs/api";
import type { JobLevel } from "../features/jobs/types";
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

export default function Jobs() {
  const [params, setParams] = useSearchParams();

  const q = params.get("q") ?? "";
  const level = (params.get("level") ?? "all") as "all" | JobLevel;

  const query = useMemo(() => ({ q, level }), [q, level]);

  const state = useAsync(
    (signal) => fetchJobs(query, signal),
    [query.q, query.level]
  );

  function updateParam(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (!value) next.delete(key);
    else next.set(key, value);
    // reset paginazione futura etc.
    setParams(next, { replace: true });
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Jobs</h1>
          <p className="mt-1 text-sm text-white/60">
            Search and filter jobs. URL stays in sync (interview-friendly).
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <div className="relative w-full sm:w-80">
            <input
              value={q}
              onChange={(e) => updateParam("q", e.target.value)}
              placeholder="Search by title, company, location..."
              className="w-full rounded-xl bg-white/5 px-4 py-2.5 text-sm text-white ring-1 ring-white/10 placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/20"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {LEVELS.map((opt) => {
              const active = opt.value === level;
              return (
                <button
                  key={opt.value}
                  onClick={() => updateParam("level", opt.value)}
                  className={[
                    "rounded-xl px-3 py-2 text-sm ring-1 transition",
                    active
                      ? "bg-white/10 text-white ring-white/20"
                      : "bg-transparent text-white/70 ring-white/10 hover:bg-white/5",
                  ].join(" ")}
                >
                  {opt.label}
                </button>
              );
            })}
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
        state.data.length === 0 ? (
          <Card>
            <CardHeader title="No results" subtitle="Try a different search or level." />
            <CardBody>
              <Badge variant="muted">Empty state</Badge>
            </CardBody>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {state.data.map((job) => (
              <Card key={job.id} className="transition hover:bg-white/[0.07]">
                <CardHeader
                  title={job.title}
                  subtitle={`${job.company} • ${job.location}`}
                  right={<Badge variant={levelBadgeVariant(job.level)}>{job.level}</Badge>}
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
            ))}
          </div>
        )
      ) : null}
    </div>
  );
}