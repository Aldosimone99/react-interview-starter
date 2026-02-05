import { useEffect, useState } from "react";
import type { Job } from "../types";
import { fetchJobById } from "../api";

type UseJobState = {
  data: Job | null;
  isLoading: boolean;
  error: string | null;
};

export function useJob(id: number | null): UseJobState {
  const [data, setData] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      // id non valido
      if (id == null || Number.isNaN(id)) {
        setData(null);
        setIsLoading(false);
        setError(null);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const result = await fetchJobById(id);

        if (!cancelled) {
          setData(result ?? null);
        }
      } catch {
        if (!cancelled) setError("Failed to load job.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [id]);

  return { data, isLoading, error };
}