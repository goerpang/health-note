// /members/* 로 이동하는 즉시 표시되는 로딩 스켈레톤 (체감 속도 향상)
export default function Loading() {
  return (
    <main className="min-h-screen pb-10">
      <header className="px-5 pt-7 pb-4 flex items-center gap-3">
        <div className="w-10 h-10 -ml-2" />
        <div className="h-6 w-28 rounded-md bg-section animate-pulse" />
      </header>
      <div className="px-5 space-y-6">
        <div className="flex justify-center pt-2">
          <div className="w-20 h-20 rounded-3xl bg-section animate-pulse" />
        </div>
        <div className="grid grid-cols-6 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-2xl bg-section animate-pulse" />
          ))}
        </div>
        <div className="h-12 rounded-2xl bg-section animate-pulse" />
        <div className="h-12 rounded-2xl bg-section animate-pulse" />
        <div className="h-12 rounded-2xl bg-brand/30 animate-pulse" />
      </div>
    </main>
  );
}
