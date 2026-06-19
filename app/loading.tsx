// 홈 등 서버 렌더링 중 즉시 표시되는 로딩 스켈레톤 (흰 화면 깜빡임 방지)
export default function Loading() {
  return (
    <div className="w-full min-h-screen pb-10">
      {/* 헤더 */}
      <header className="px-5 pt-7 pb-4 flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-4 w-28 rounded bg-section animate-pulse" />
          <div className="h-6 w-40 rounded bg-section animate-pulse" />
        </div>
        <div className="flex gap-2">
          <div className="w-10 h-10 rounded-full bg-section animate-pulse" />
          <div className="w-10 h-10 rounded-full bg-section animate-pulse" />
        </div>
      </header>

      {/* 구성원 칩 */}
      <div className="px-5 pt-2 flex gap-2">
        <div className="h-11 w-24 rounded-2xl bg-section animate-pulse" />
        <div className="h-11 w-24 rounded-2xl bg-section animate-pulse" />
        <div className="h-11 w-16 rounded-2xl bg-section animate-pulse" />
      </div>

      {/* 본문 카드 */}
      <div className="px-5 pt-8">
        <div className="h-40 rounded-2xl bg-section animate-pulse" />
      </div>
    </div>
  );
}
