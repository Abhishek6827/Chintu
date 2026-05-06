"use client";
import { useState } from "react";
import { UserButton, useUser } from "@clerk/nextjs";
import { CreditCard, Sparkles, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import ProfileModal from "./ProfileModal";

export default function SyncedUserButton() {
  const { isSignedIn } = useUser();
  const router = useRouter();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const isElectron = typeof window !== "undefined" && !!(window as any).electronAPI;

  if (!isSignedIn) return null;

  const handleManageSubscription = async () => {
    try {
      const res = await fetch("/api/manage-subscription");
      const data = await res.json();
      if (data.url) {
        if (isElectron) {
          (window as any).electronAPI.openExternal(data.url);
        } else {
          window.location.href = data.url;
        }
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
      <UserButton afterSignOutUrl="/">
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
      

      
      {showProfileModal && <ProfileModal onClose={() => setShowProfileModal(false)} />}
    </div>
  );
}
