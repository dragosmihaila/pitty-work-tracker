"use client";

export default function ErrorPage({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-md border border-red-200 bg-white p-6 shadow-sm">
        <p className="label text-red-700">Something needs attention</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-950">The request could not finish.</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">{error.message}</p>
        <button className="btn-primary mt-6 w-full" onClick={reset}>
          Try again
        </button>
      </div>
    </main>
  );
}

