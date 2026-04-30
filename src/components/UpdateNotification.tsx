"use client";

import { useEffect, useState } from "react";

export default function UpdateNotification() {
  const [updateInfo, setUpdateInfo] = useState<{ status: string; version?: string } | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !(window as any).electronAPI) return;

    const unsubscribe = (window as any).electronAPI.onUpdateStatus((data: any) => {
      console.log("[UpdateNotification] Status received:", data);
      if (data.status === "ready") {
        setUpdateInfo(data);
        setIsVisible(true);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleRestart = () => {
    if ((window as any).electronAPI) {
      (window as any).electronAPI.restartForUpdate();
    }
  };

  const handleLater = () => {
    setIsVisible(false);
  };

  if (!isVisible || !updateInfo) return null;

  return (
    <div className="fixed bottom-6 left-6 right-6 z-[9999] animate-in slide-in-from-bottom-8 duration-500">
      <div className="bg-white/90 backdrop-blur-xl border border-indigo-100 rounded-[32px] p-6 shadow-2xl shadow-indigo-500/10 flex flex-col items-center text-center max-w-sm mx-auto">
        {/* Animated Icon */}
        <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4 relative overflow-hidden group">
          <div className="absolute inset-0 bg-indigo-500/10 animate-pulse" />
          <svg className="w-8 h-8 text-indigo-600 relative z-10 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 16.5V7c0-.83.67-1.5 1.5-1.5h7c.83 0 1.5.67 1.5 1.5v9.5m-7 3l3.5 3.5 3.5-3.5" />
          </svg>
        </div>

        <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 mb-1">Update Ready</h3>
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-6">
          Version {updateInfo.version} is ready to install.
        </p>

        <div className="grid grid-cols-2 gap-3 w-full">
          <button
            onClick={handleLater}
            className="py-3 px-4 rounded-xl border border-gray-100 text-gray-400 hover:text-gray-900 hover:bg-gray-50 transition-all text-[10px] font-black uppercase tracking-widest"
          >
            Later
          </button>
          <button
            onClick={handleRestart}
            className="py-3 px-4 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-500/20 hover:bg-indigo-500 hover:scale-[1.02] active:scale-95 transition-all text-[10px] font-black uppercase tracking-widest"
          >
            Restart Now
          </button>
        </div>
      </div>
    </div>
  );
}
