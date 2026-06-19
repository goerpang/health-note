// 마이페이지 전용 로딩 스켈레톤 (진입 즉시 표시, 마이페이지 레이아웃에 맞춤)
export default function Loading() {
  return (
    <main className="min-h-screen pb-10">
      <header className="px-5 pt-7 pb-4 flex items-center gap-3">
        <div className="w-10 h-10 -ml-2" />
        <div className="h-6 w-24 rounded-md bg-section animate-pulse" />
      </header>

      {/* 프로필 아이콘 */}
      <div className="flex flex-col items-center py-6">
        <div className="w-20 h-20 rounded-3xl bg-section animate-pulse" />
      </div>

      {/* 내 정보 + 로그아웃 */}
      <div className="px-5">
        <div className="h-4 w-16 rounded bg-section animate-pulse mb-2" />
        <div className="h-16 rounded-2xl bg-section animate-pulse" />
        <div className="mt-8 h-12 rounded-2xl bg-section animate-pulse" />
      </div>
    </main>
  );
}
