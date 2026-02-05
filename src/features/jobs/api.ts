import type { Job } from "./types";
import { jobs as seed } from "./data";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export type JobsQuery = {
  q?: string; // search
  level?: Job["level"] | "all";
};

function matches(job: Job, query: JobsQuery) {
  const q = query.q?.trim().toLowerCase();
  const level = query.level;

  const qOk =
    !q ||
    job.title.toLowerCase().includes(q) ||
    job.company.toLowerCase().includes(q) ||
    job.location.toLowerCase().includes(q);

  const levelOk = !level || level === "all" ? true : job.level === level;

  return qOk && levelOk;
}

export async function fetchJobs(query: JobsQuery, signal?: AbortSignal): Promise<Job[]> {
  // Simula network + possibilità di annullare request
  await sleep(500);

  if (signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }

  return seed.filter((j) => matches(j, query));
}

export async function fetchJobById(id: number, signal?: AbortSignal): Promise<Job | null> {
  await sleep(350);

  if (signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }

  return seed.find((j) => j.id === id) ?? null;
}