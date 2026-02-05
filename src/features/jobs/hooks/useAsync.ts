import { useEffect, useRef, useState } from "react";

type AsyncState<T> =
  | { status: "idle"; data: null; error: null }
  | { status: "loading"; data: null; error: null }
  | { status: "success"; data: T; error: null }
  | { status: "error"; data: null; error: Error };

export function useAsync<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  deps: unknown[]
) {
  const [state, setState] = useState<AsyncState<T>>({
    status: "idle",
    data: null,
    error: null,
  });

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    abortRef.current?.abort(); // cancella la precedente
    abortRef.current = controller;

    setState({ status: "loading", data: null, error: null });

    fn(controller.signal)
      .then((data) => setState({ status: "success", data, error: null }))
      .catch((err: unknown) => {
        // Se aborted: non è un errore “UI”
        if (err instanceof DOMException && err.name === "AbortError") return;
        const e = err instanceof Error ? err : new Error("Unknown error");
        setState({ status: "error", data: null, error: e });
      });

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}