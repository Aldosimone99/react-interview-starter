import { useEffect, useState } from "react";
import type { Job } from "../types";
import { fetchJobs } from "../api";

type UseJobsState = {
  data: Job[];
  isLoading: boolean;
  error: string | null;
};

export function useJobs(): UseJobsState {
  const [data, setData] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        setIsLoading(true);
        setError(null);

        const result = await fetchJobs({});
        if (!cancelled) setData(result);
      } catch {
        if (!cancelled) setError("Failed to load jobs.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  return { data, isLoading, error };
}