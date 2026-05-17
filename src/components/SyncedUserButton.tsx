"use client";
import { useState } from "react";
import { createPortal } from "react-dom";
import { UserButton, useUser } from "@clerk/nextjs";
import { CreditCard, Sparkles, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import ProfileModal from "./ProfileModal";

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

  if (!isSignedIn) return null;

  const handleManageSubscription = async () => {
    try {
      const res = await fetch("/api/manage-subscription");
      const data = await res.json();
      if (data.url) {
        openInBrowser(data.url);
      } else {
        alert(data.error || "Failed to load subscription portal.");
      }
    } catch (err) {
      console.error(err);
      alert("Error loading subscription portal.");
    }
  };

  const handleSupport = () => {
    router.push("/support");
  };

  return (
    <div className="relative group">
      <UserButton>
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
