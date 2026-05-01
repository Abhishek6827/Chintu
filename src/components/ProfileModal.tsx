"use client";
import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { createClient } from "@/utils/supabase/client";
import { Sparkles } from "lucide-react";

const isElectron = typeof window !== "undefined" && !!(window as any).electronAPI;

interface ProfileData {
  name: string;
  title: string;
  summary: string;
  experience: { role: string; company: string; duration: string; highlights: string[] }[];
  projects: { name: string; description: string; tech: string[] }[];
  skills: { languages: string[]; frameworks: string[]; tools: string[]; other: string[] };
  education: { degree: string; institution: string; year: string }[];
  certifications: string[];
  achievements: string[];
}

export function formatProfileContext(p: any): string {
  if (!p) return "";
  const lines: string[] = [];
  if (p.name) lines.push(`Name: ${p.name}`);
  if (p.title) lines.push(`Title: ${p.title}`);
  if (p.summary) lines.push(`Summary: ${p.summary}`);
  if (p.experience?.length) {
    lines.push("Experience:");
    p.experience.forEach((e: any) => {
      lines.push(`- ${e.role} at ${e.company} (${e.duration})`);
      e.highlights?.forEach((h: any) => lines.push(`  • ${h}`));
    });
  }
  if (p.projects?.length) {
    lines.push("Projects:");
    p.projects.forEach((pr: any) => {
      lines.push(`- ${pr.name}: ${pr.description} [${pr.tech?.join(", ")}]`);
    });
  }
  if (p.skills) {
    const all = [...(p.skills.languages||[]), ...(p.skills.frameworks||[]), ...(p.skills.tools||[]), ...(p.skills.other||[])];
    if (all.length) lines.push(`Skills: ${all.join(", ")}`);
  }
  if (p.education?.length) {
    lines.push("Education:");
    p.education.forEach((e: any) => lines.push(`- ${e.degree} from ${e.institution} (${e.year})`));
  }
  if (p.certifications?.length) lines.push(`Certifications: ${p.certifications.join(", ")}`);
  if (p.achievements?.length) lines.push(`Achievements: ${p.achievements.join(", ")}`);
  return lines.join("\n");
}

export default function ProfileModal({ 
  onClose, 
  onSuccess, 
  isBackgroundRefining = false 
}: { 
  onClose: () => void, 
  onSuccess?: () => void,
  isBackgroundRefining?: boolean
}) {
  const { user } = useUser();
  const supabase = createClient();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [rawText, setRawText] = useState("");
  const [isRefining, setIsRefining] = useState(false);
  const [error, setError] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [editJson, setEditJson] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/profile");
        if (res.ok) {
          const { profile: data } = await res.json();
          if (data?.profile_data && typeof data.profile_data === 'object' && Object.keys(data.profile_data).length > 0) {
            setProfile(data.profile_data);
          } else {
            setProfile(null);
          }
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      }
    };

    fetchProfile();
  }, [user?.id, isBackgroundRefining]);

  const handleRefine = async () => {
    if (!rawText.trim()) return;
    setIsRefining(true);
    setError("");

    try {
      const res = await fetch("/api/refine-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText: rawText.trim() }),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || "Failed"); }
      const data = await res.json();
      if (data.profile) {
        setProfile(data.profile);
        if (user?.id) {
          // Note: The /api/refine-profile endpoint already saves the result.
          // If we need to save manually, we should use the POST /api/profile endpoint
          await fetch('/api/profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              profile_data: data.profile,
              raw_profile: rawText.trim()
            })
          });
        }
        setRawText("");
      }
    } catch (err: any) {
      setError(err.message || "Failed to refine profile");
    } finally {
      setIsRefining(false);
      if (!error && onSuccess) {
         onSuccess();
      }
    }
  };

  const handleDelete = async () => {
    if (user?.id) {
      await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile_data: null,
          raw_profile: null
        })
      });
    }
    setProfile(null);
    setEditMode(false);
    setShowDeleteConfirm(false);
  };

  const handleEdit = () => {
    setEditJson(JSON.stringify(profile, null, 2));
    setEditMode(true);
  };

  const handleSaveEdit = async () => {
    try {
      const parsed = JSON.parse(editJson);
      setProfile(parsed);
      if (user?.id) {
        await fetch('/api/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profile_data: parsed })
        });
      }
      setEditMode(false);
      setError("");
    } catch {
      setError("Invalid JSON — please fix the syntax");
    }
  };

  const SkillTag = ({ text }: { text: string }) => (
    <span className="inline-block px-2 py-0.5 bg-[var(--glass-bg)] text-[var(--text-main)] text-[0.6875rem] rounded-md font-medium mr-1 mb-1 border border-[var(--glass-border)]">{text}</span>
  );

  return (
    <div className="absolute inset-0 settings-overlay z-50 flex items-center justify-center p-2 sm:p-4" onClick={onClose}>
      <div className="settings-panel w-full max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-6 bg-[var(--panel-bg)] backdrop-filter blur(32px) border border-[var(--glass-border)] rounded-[32px] shadow-[0_30px_100px_rgba(0,0,0,0.3)]" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-black text-[var(--text-main)] uppercase tracking-tight">
              {profile ? "👤 Your Profile" : "👤 Setup Profile"}
            </h2>
            <p className="text-[10px] font-black text-[var(--text-dim)] uppercase tracking-[0.2em] mt-1">Personalized Intelligence</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-2xl bg-[var(--glass-bg)] text-[var(--text-dim)] flex items-center justify-center hover:bg-[var(--glass-bg)] hover:text-[var(--text-main)] transition-all active:scale-90">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-4 py-3 rounded-xl flex items-center justify-between animate-in fade-in slide-in-from-top-2">
            <span className="font-bold">{error}</span>
            <button onClick={() => setError("")} className="ml-2 text-red-500/40 hover:text-red-400 transition-colors">✕</button>
          </div>
        )}

        {/* No profile — show paste area */}
        {!profile && !editMode && (
          <div className="space-y-4 animate-in fade-in duration-500">
            <p className="text-xs text-[var(--text-dim)] leading-relaxed font-medium">Paste your resume, LinkedIn summary, or a brief bio. Our AI will structure it into your profile.</p>
            <textarea
              value={rawText}
              onChange={e => setRawText(e.target.value)}
              placeholder="Experience, projects, skills... Paste it all here."
              className="w-full h-48 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl px-4 py-3 text-sm text-[var(--text-main)] placeholder:text-[var(--text-dim)] focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all resize-none font-medium"
            />
            <button
              onClick={handleRefine}
              disabled={!rawText.trim() || isRefining}
              className={`w-full py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all active:scale-[0.98] ${
                rawText.trim() && !isRefining
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-[var(--text-main)] shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:scale-[1.01]"
                  : "bg-[var(--glass-bg)] text-[var(--text-dim)] cursor-not-allowed"
              }`}
            >
              {isRefining ? "✨ Optimizing Profile..." : "✨ Build Profile"}
            </button>
          </div>
        )}

        {/* Edit mode */}
        {editMode && (
          <div className="space-y-4 animate-in fade-in">
            <div className="flex bg-[var(--input-bg)] p-1 rounded-xl">
              <button 
                onClick={() => setEditJson("")}
                className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${!editJson.startsWith('{') ? 'bg-[var(--glass-bg)] text-[var(--text-main)] shadow-sm' : 'text-[var(--text-dim)] hover:text-[var(--text-main)]'}`}
              >
                Free Text
              </button>
              <button 
                onClick={() => setEditJson(JSON.stringify(profile, null, 2))}
                className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${editJson.startsWith('{') ? 'bg-[var(--glass-bg)] text-[var(--text-main)] shadow-sm' : 'text-[var(--text-dim)] hover:text-[var(--text-main)]'}`}
              >
                JSON
              </button>
            </div>
            
            <textarea
              value={editJson.startsWith('{') ? editJson : rawText}
              onChange={e => editJson.startsWith('{') ? setEditJson(e.target.value) : setRawText(e.target.value)}
              placeholder={editJson.startsWith('{') ? "Edit JSON directly..." : "Paste new experience, skills, etc. AI will merge it."}
              className={`w-full h-80 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all resize-none ${editJson.startsWith('{') ? 'font-mono text-[var(--text-main)]' : 'text-[var(--text-main)] font-medium'}`}
            />
            <div className="flex gap-3">
              <button 
                onClick={editJson.startsWith('{') ? handleSaveEdit : handleRefine} 
                disabled={(!editJson.startsWith('{') && !rawText.trim()) || isRefining}
                className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-600/20 active:scale-95 disabled:opacity-50"
              >
                {isRefining ? "Optimizing..." : "Save Changes"}
              </button>
              <button onClick={() => setEditMode(false)} className="flex-1 py-3.5 bg-[var(--glass-bg)] hover:bg-black/10 text-[var(--text-dim)] rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 border border-[var(--glass-border)]">Cancel</button>
            </div>
          </div>
        )}

        {/* Profile display */}
        {profile && !editMode && (
          <div className="space-y-6 animate-in fade-in duration-500">
            {/* Name & Title */}
            <div className="bg-gradient-to-br from-white/10 to-transparent rounded-2xl px-5 py-4 border border-[var(--glass-border)]">
              <h3 className="text-xl font-black text-[var(--text-main)] uppercase tracking-tight leading-none mb-1">{profile.name || "—"}</h3>
              {profile.title && <p className="text-xs text-indigo-400 font-black uppercase tracking-widest mb-2">{profile.title}</p>}
              {profile.summary && <p className="text-xs text-[var(--text-dim)] leading-relaxed font-medium">{profile.summary}</p>}
            </div>

            {/* Experience */}
            {profile.experience?.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-black text-[var(--text-dim)] uppercase tracking-[0.3em]">💼 Experience</p>
                {profile.experience.map((exp, i) => (
                  <div key={i} className="bg-[var(--input-bg)] rounded-2xl px-4 py-3 border border-[var(--glass-border)] hover:bg-[var(--glass-bg)] transition-colors group">
                    <p className="text-sm font-bold text-[var(--text-main)]">{exp.role}</p>
                    <p className="text-[10px] font-bold text-[var(--text-dim)] uppercase tracking-widest mt-0.5">{exp.company} • {exp.duration}</p>
                    {exp.highlights?.map((h, j) => (
                      <p key={j} className="text-xs text-[var(--text-dim)] mt-1 leading-relaxed">• {h}</p>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {/* Projects */}
            {profile.projects?.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-black text-[var(--text-dim)] uppercase tracking-[0.3em]">🚀 Projects</p>
                {profile.projects.map((pr, i) => (
                  <div key={i} className="bg-[var(--input-bg)] rounded-2xl px-4 py-3 border border-[var(--glass-border)] hover:bg-[var(--glass-bg)] transition-colors">
                    <p className="text-sm font-bold text-[var(--text-main)]">{pr.name}</p>
                    <p className="text-xs text-[var(--text-dim)] mt-0.5 mb-2">{pr.description}</p>
                    {pr.tech?.length > 0 && <div className="flex flex-wrap">{pr.tech.map((t, j) => <SkillTag key={j} text={t} />)}</div>}
                  </div>
                ))}
              </div>
            )}

            {/* Skills */}
            {profile.skills && (
              <div className="space-y-2">
                <p className="text-[10px] font-black text-[var(--text-dim)] uppercase tracking-[0.3em]">Skills</p>
                <div className="bg-[var(--input-bg)] rounded-2xl px-4 py-4 border border-[var(--glass-border)]">
                  {[
                    profile.skills.languages,
                    profile.skills.frameworks,
                    profile.skills.tools,
                    profile.skills.other
                  ].map((list, i) => (
                    list?.length > 0 && (
                      <div key={i} className="flex flex-wrap mb-1 last:mb-0">
                        {list.map((s, j) => <SkillTag key={j} text={s} />)}
                      </div>
                    )
                  ))}
                </div>
              </div>
            )}

            {/* Education */}
            {profile.education?.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-black text-[var(--text-dim)] uppercase tracking-[0.3em]">🎓 Education</p>
                {profile.education.map((ed, i) => (
                  <div key={i} className="bg-[var(--input-bg)] rounded-2xl px-4 py-3 border border-[var(--glass-border)] hover:bg-[var(--glass-bg)] transition-colors">
                    <p className="text-sm font-bold text-[var(--text-main)]">{ed.degree}</p>
                    <p className="text-[10px] font-bold text-[var(--text-dim)] uppercase tracking-widest mt-0.5">{ed.institution} • {ed.year}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Support & Guide Section */}
            <div className="pt-4 border-t border-[var(--glass-border)] space-y-3">
              <p className="text-[10px] font-black text-[var(--text-dim)] uppercase tracking-[0.3em]">Support & Guide</p>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => {
                    const supportUrl = "https://chintu.devilz.me/support";
                    if (isElectron) (window as any).electronAPI.openExternal(supportUrl);
                    else window.open(supportUrl, "_blank");
                  }}
                  className="flex items-center justify-center gap-2 py-3 bg-[var(--input-bg)] hover:bg-[var(--glass-bg)] text-[var(--text-dim)] rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-[var(--glass-border)]"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                  Support
                </button>
                <button 
                  onClick={() => {
                    // Trigger onboarding event that GlobalHeader listens to
                    window.dispatchEvent(new CustomEvent('chintu-open-guide'));
                    onClose();
                  }}
                  className="flex items-center justify-center gap-2 py-3 bg-[var(--input-bg)] hover:bg-[var(--glass-bg)] text-[var(--text-dim)] rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-[var(--glass-border)]"
                >
                  <Sparkles className="w-3 h-3" />
                  Operation Guide
                </button>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 pt-2">
              <button onClick={handleEdit} className="flex-1 py-3.5 bg-[var(--input-bg)] hover:bg-[var(--glass-bg)] text-[var(--text-dim)] rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 border border-[var(--glass-border)]">✏️ Edit</button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex-1 py-3.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 border border-red-500/10"
              >
                🗑 Clear Profile
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Full Page Loading Animation */}
      {(isRefining || isBackgroundRefining) && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[var(--bg-app)] backdrop-blur-2xl" onClick={e => e.stopPropagation()}>
          <div className="relative flex items-center justify-center w-32 h-32 mb-8">
            <div className="absolute inset-0 rounded-full border-[3px] border-indigo-500/30 animate-[spin_3s_linear_infinite]"></div>
            <div className="absolute inset-2 rounded-full border-[3px] border-t-purple-500 border-purple-500/20 animate-[spin_1.5s_ease-in-out_infinite_reverse]"></div>
            <div className="absolute inset-4 rounded-full border-[3px] border-b-cyan-500 border-cyan-500/20 animate-[spin_2s_linear_infinite]"></div>
            <div className="absolute inset-0 flex items-center justify-center text-4xl animate-pulse">
              ✨
            </div>
          </div>
          <h2 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 animate-pulse tracking-wide mb-3 text-center px-4">
            AI is structuring your profile...
          </h2>
          <div className="flex gap-1.5 items-center">
            <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: "0ms" }}></div>
            <div className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: "150ms" }}></div>
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-bounce" style={{ animationDelay: "300ms" }}></div>
          </div>
          <p className="mt-8 text-xs text-[var(--text-dim)] font-medium tracking-[0.2em] uppercase text-center max-w-xs leading-relaxed">
            Please wait • Making you look awesome<br />
            <span className="text-[var(--text-dim)] opacity-80 text-[0.65rem] normal-case tracking-normal">This may take a few moments</span>
          </p>
          <button 
            onClick={() => {
              // Dismiss UI, refinement continues in background
              onClose();
            }} 
            className="mt-8 px-6 py-3 rounded-xl bg-[var(--input-bg)] border border-[var(--glass-border)] text-[var(--text-main)] text-[10px] font-black uppercase tracking-widest hover:bg-[var(--glass-bg)] transition-all active:scale-95 shadow-lg shadow-black/20"
          >
            Skip & Run in Background
          </button>
        </div>
      )}
      {/* Profile Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 backdrop-blur-md bg-black/20 animate-in fade-in duration-300" onClick={(e) => e.stopPropagation()}>
          <div className="w-full max-w-xs bg-gradient-to-br from-red-500 via-rose-600 to-pink-700 p-[1.5px] rounded-[32px] shadow-2xl animate-in zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()}>
            <div className="bg-[var(--panel-bg)] backdrop-blur-2xl rounded-[30px] p-6 text-center">
              <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-lg font-black text-[var(--text-main)] mb-2 uppercase tracking-tight">Delete Profile?</h3>
              <p className="text-[var(--text-dim)] text-xs mb-6 leading-relaxed font-medium">
                This will wipe your personalized background, skills, and experience. AI will no longer be able to personalize its answers for you.
              </p>
              <div className="flex flex-col gap-2.5">
                <button
                  onClick={handleDelete}
                  className="w-full py-3.5 bg-red-600 hover:bg-red-500 text-white font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl transition-all active:scale-[0.98] shadow-lg shadow-red-600/20"
                >
                  Confirm Delete
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="w-full py-3.5 bg-[var(--input-bg)] hover:bg-[var(--glass-bg)] text-[var(--text-dim)] font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl transition-all border border-[var(--glass-border)]"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
