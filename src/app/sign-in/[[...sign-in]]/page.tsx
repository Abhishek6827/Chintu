"use client";
import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#f8f9fa] relative" style={{ WebkitAppRegion: 'drag' } as any}>
      {/* Minimize Button */}
      <button 
        onClick={() => (window as any).electronAPI?.minimize()}
        className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg bg-white text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-all border border-gray-200 shadow-sm"
        style={{ WebkitAppRegion: 'no-drag' } as any}
      >
        ─
      </button>

      <div className="flex flex-col items-center w-full max-w-sm px-6" style={{ WebkitAppRegion: 'no-drag' } as any}>
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-indigo-600 to-purple-700 p-[1px] mx-auto mb-4 shadow-2xl shadow-indigo-500/10">
            <div className="w-full h-full bg-white rounded-[23px] flex items-center justify-center">
              <span className="text-3xl text-indigo-600">✦</span>
            </div>
          </div>
          <h1 className="text-2xl font-black tracking-tight uppercase text-gray-900">Chintu</h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] mt-1 text-center">AI Interview Assistant</p>
        </div>

        <div className="w-full bg-white rounded-3xl border border-gray-200 shadow-2xl overflow-hidden p-2">
          <SignIn 
            appearance={{
              elements: {
                card: "shadow-none border-none bg-transparent",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                socialButtonsBlockButton: "border-gray-200 hover:bg-gray-50 text-gray-600 font-semibold",
                formButtonPrimary: "bg-indigo-600 hover:bg-indigo-500 text-sm font-bold uppercase tracking-widest",
                footerActionLink: "text-indigo-600 hover:text-indigo-500 font-bold",
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
