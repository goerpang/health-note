// /records/* 진입 즉시 표시되는 로딩 스켈레톤
export default function Loading() {
  return (
    <main className="min-h-screen pb-10">
      <header className="px-5 pt-7 pb-4 flex items-center gap-3">
        <div className="w-10 h-10 -ml-2" />
        <div className="h-6 w-32 rounded-md bg-section animate-pulse" />
      </header>
      <div className="px-5 space-y-6">
        <div className="h-12 rounded-2xl bg-section animate-pulse" />
        <div className="h-11 rounded-2xl bg-section animate-pulse" />
        <div className="h-14 rounded-2xl bg-section animate-pulse" />
        <div className="h-14 rounded-2xl bg-section animate-pulse" />
        <div className="h-24 rounded-2xl bg-section animate-pulse" />
        <div className="h-12 rounded-2xl bg-brand/30 animate-pulse" />
      </div>
    </main>
  );
}
