export default function Home() {
  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold">Dieter HQ</h1>
      <p className="mt-2 text-slate-600">
        Chat-first homebase (PWA). Telegram replacement once stable.
      </p>

      <div className="mt-8 grid gap-4">
        <a className="rounded-xl border p-4 hover:bg-slate-50" href="/chat">
          <div className="font-medium">Chat</div>
          <div className="text-sm text-slate-600">Threads + artifacts + actions</div>
        </a>
        <a className="rounded-xl border p-4 hover:bg-slate-50" href="/kanban">
          <div className="font-medium">Kanban</div>
          <div className="text-sm text-slate-600">Inbox + planning + logic</div>
        </a>
        <a className="rounded-xl border p-4 hover:bg-slate-50" href="/calendar">
          <div className="font-medium">Calendar</div>
          <div className="text-sm text-slate-600">Agenda + upcoming</div>
        </a>
      </div>

      <p className="mt-10 text-xs text-slate-500">
        Note: This is a scaffold. Next step is auth + real chat stream.
      </p>
    </main>
  );
}
