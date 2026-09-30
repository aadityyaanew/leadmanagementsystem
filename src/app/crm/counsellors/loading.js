export default function Loading() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-48 rounded-xl bg-slate-100 animate-pulse" />
          <div className="h-4 w-36 rounded-lg bg-slate-100 animate-pulse" />
        </div>
        <div className="h-9 w-24 rounded-xl bg-slate-100 animate-pulse" />
      </div>
      <div className="flex gap-3">
        <div className="flex-1 h-10 rounded-xl bg-slate-100 animate-pulse" />
        <div className="h-10 w-32 rounded-xl bg-slate-100 animate-pulse" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-56 rounded-2xl bg-slate-100 animate-pulse" />
        ))}
      </div>
    </div>
  );
}
