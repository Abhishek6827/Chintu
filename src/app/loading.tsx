export default function RootLoading() {
  return (
    <div className="min-h-screen bg-[var(--bg-app)] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-[10px] font-black text-[var(--text-dim)] uppercase tracking-[0.3em]">Loading</p>
      </div>
    </div>
  );
}
