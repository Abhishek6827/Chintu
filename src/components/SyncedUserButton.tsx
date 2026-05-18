"use client";
import { useState } from "react";
import { createPortal } from "react-dom";
import { UserButton, useUser } from "@clerk/nextjs";
import { CreditCard, Sparkles, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import ProfileModal from "./ProfileModal";
import { useThemeToggle } from "@/hooks/useThemeToggle";

function getIsElectron() {
  return typeof window !== "undefined" && !!(window as any).electronAPI;
}

function openInBrowser(url: string) {
  if (getIsElectron()) {
    (window as any).electronAPI.openExternal(url);
  } else {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

export default function SyncedUserButton() {
  const { isSignedIn } = useUser();
  const router = useRouter();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const { currentTheme } = useThemeToggle();
  const isDark = currentTheme === "dark";

  if (!isSignedIn) return null;

  const handleManageSubscription = async () => {
    // On web, always navigate to the subscription page which handles all cases
    if (!getIsElectron()) {
      router.push("/subscription");
      return;
    }

    // For Electron: try to get external portal URL (Stripe), fallback to subscription page
    try {
      const res = await fetch("/api/manage-subscription");
      const data = await res.json();
      if (data.url) {
        openInBrowser(data.url);
      } else {
        router.push("/subscription");
      }
    } catch (err) {
      console.error(err);
      router.push("/subscription");
    }
  };

  const handleSupport = () => {
    router.push("/support");
  };

  return (
    <div className="relative group">
      <UserButton
        key={isDark ? "dark" : "light"}
        appearance={{
          variables: isDark ? {
            colorBackground: '#0a0a14',
            colorPrimary: '#ffffff',
            colorText: '#ffffff',
            colorTextSecondary: '#8f90a6',
            colorInputBackground: '#161622',
            colorInputText: '#ffffff',
            colorBorder: 'rgba(255, 255, 255, 0.08)',
          } : {
            colorBackground: '#ffffff',
            colorPrimary: '#000000',
            colorText: '#000000',
            colorTextSecondary: '#4b5563',
            colorInputBackground: '#f3f4f6',
            colorInputText: '#000000',
            colorBorder: 'rgba(0, 0, 0, 0.08)',
          },
          elements: isDark ? {
            card: 'bg-[#0a0a14] border border-white/10 rounded-3xl shadow-2xl',
            userButtonPopoverCard: 'bg-[#0a0a14] border border-white/10 rounded-3xl shadow-2xl !text-white',
            userButtonPopoverActionButton: 'hover:bg-white/5 !text-white',
            userButtonPopoverActionButtonText: '!text-white font-medium',
            userButtonPopoverActionButtonIcon: '!text-white/70',
            userButtonPopoverCustomItemButton: 'hover:bg-white/5 !text-white',
            userButtonPopoverCustomItemButtonText: '!text-white font-medium',
            userButtonPopoverCustomItemButtonIcon: '!text-white/70',
            userButtonPopoverFooter: 'hidden',
          } : {
            card: 'bg-[#ffffff] border border-black/10 rounded-3xl shadow-2xl',
            userButtonPopoverCard: 'bg-[#ffffff] border border-black/10 rounded-3xl shadow-2xl !text-black',
            userButtonPopoverActionButton: 'hover:bg-black/5 !text-black',
            userButtonPopoverActionButtonText: '!text-black font-medium',
            userButtonPopoverActionButtonIcon: '!text-black/70',
            userButtonPopoverCustomItemButton: 'hover:bg-black/5 !text-black',
            userButtonPopoverCustomItemButtonText: '!text-black font-medium',
            userButtonPopoverCustomItemButtonIcon: '!text-black/70',
            userButtonPopoverFooter: 'hidden',
          }
        }}
      >
        <UserButton.MenuItems>
          <UserButton.Action 
            label="Manage Subscription" 
            labelIcon={<CreditCard className="w-4 h-4" />} 
            onClick={handleManageSubscription} 
          />
          <UserButton.Action 
            label="My AI Profile" 
            labelIcon={<Sparkles className="w-4 h-4" />} 
            onClick={() => setShowProfileModal(true)} 
          />
          <UserButton.Action 
            label="Support" 
            labelIcon={<Zap className="w-4 h-4" />} 
            onClick={handleSupport} 
          />
        </UserButton.MenuItems>
      </UserButton>
      

      
      {showProfileModal && typeof document !== "undefined" && createPortal(
        <ProfileModal onClose={() => setShowProfileModal(false)} />,
        document.body
      )}
    </div>
  );
}
