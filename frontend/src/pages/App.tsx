import { useEffect, useState } from "react";
import { obtenerEstadoApi } from "../services/healthService";

type ConnectionState = "loading" | "connected" | "error";

export function App() {
  const [state, setState] = useState<ConnectionState>("loading");
  const [application, setApplication] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setState("loading");

    obtenerEstadoApi(controller.signal)
      .then((health) => {
        setApplication(health.application);
        setState("connected");
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setState("error");
      });

    return () => controller.abort();
  }, [attempt]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-slate-100">
      <section className="w-full max-w-xl rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">
          ReservApp
        </p>
        <h1 className="text-3xl font-bold tracking-tight">Comedor corporativo</h1>
        <p className="mt-3 text-slate-300">
          Verificación de la conexión entre el frontend de Vercel y la API de Railway.
        </p>

        <div className="mt-8 rounded-2xl border border-slate-700 bg-slate-950 p-5" aria-live="polite">
          {state === "loading" && <p>Conectando con la API…</p>}
          {state === "connected" && (
            <p className="text-emerald-300">
              Conexión establecida con <strong>{application}</strong>.
            </p>
          )}
          {state === "error" && (
            <div>
              <p className="text-red-300">No se pudo conectar con la API.</p>
              <button
                className="mt-4 rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-slate-950 outline-none hover:bg-emerald-400 focus-visible:ring-2 focus-visible:ring-emerald-300"
                type="button"
                onClick={() => setAttempt((current) => current + 1)}
              >
                Reintentar
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
