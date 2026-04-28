"use client";
import { useState, useEffect } from "react";

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

const STORAGE_KEY = "chintu_user_profile";

export function getStoredProfile(): ProfileData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

const isElectron = typeof window !== "undefined" && !!(window as any).electronAPI;

export async function saveProfileToDisk(profile: ProfileData) {
  if (isElectron && (window as any).electronAPI?.saveProfile) {
    await (window as any).electronAPI.saveProfile(profile);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

export async function loadProfileFromDisk(): Promise<ProfileData | null> {
  if (isElectron && (window as any).electronAPI?.loadProfile) {
    const diskProfile = await (window as any).electronAPI.loadProfile();
    if (diskProfile) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(diskProfile));
      return diskProfile;
    }
  }
  return getStoredProfile();
}

export function getProfileContext(): string {
  const p = getStoredProfile();
  if (!p) return "";
  const lines: string[] = [];
  if (p.name) lines.push(`Name: ${p.name}`);
  if (p.title) lines.push(`Title: ${p.title}`);
  if (p.summary) lines.push(`Summary: ${p.summary}`);
  if (p.experience?.length) {
    lines.push("Experience:");
    p.experience.forEach(e => {
      lines.push(`- ${e.role} at ${e.company} (${e.duration})`);
      e.highlights?.forEach(h => lines.push(`  • ${h}`));
    });
  }
  if (p.projects?.length) {
    lines.push("Projects:");
    p.projects.forEach(pr => {
      lines.push(`- ${pr.name}: ${pr.description} [${pr.tech?.join(", ")}]`);
    });
  }
  if (p.skills) {
    const all = [...(p.skills.languages||[]), ...(p.skills.frameworks||[]), ...(p.skills.tools||[]), ...(p.skills.other||[])];
    if (all.length) lines.push(`Skills: ${all.join(", ")}`);
  }
  if (p.education?.length) {
    lines.push("Education:");
    p.education.forEach(e => lines.push(`- ${e.degree} from ${e.institution} (${e.year})`));
  }
  if (p.certifications?.length) lines.push(`Certifications: ${p.certifications.join(", ")}`);
  if (p.achievements?.length) lines.push(`Achievements: ${p.achievements.join(", ")}`);
  return lines.join("\n");
}

export default function ProfileModal({ onClose }: { onClose: () => void }) {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [rawText, setRawText] = useState("");
  const [isRefining, setIsRefining] = useState(false);
  const [error, setError] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [editJson, setEditJson] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    loadProfileFromDisk().then(p => {
      if (p) setProfile(p);
    });
  }, []);

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
        await saveProfileToDisk(data.profile);
        setRawText("");
      }
    } catch (err: any) {
      setError(err.message || "Failed to refine profile");
    }
    setIsRefining(false);
  };

  const handleDelete = async () => {
    localStorage.removeItem(STORAGE_KEY);
    if (isElectron && (window as any).electronAPI?.saveProfile) {
      await (window as any).electronAPI.saveProfile(null);
    }
    setProfile(null);
    setEditMode(false);
    setShowDeleteConfirm(false);
  };

  const handleEdit = () => {
    setEditJson(JSON.stringify(profile, null, 2));
    setEditMode(true);
  };

  const handleSaveEdit = () => {
    try {
      const parsed = JSON.parse(editJson);
      setProfile(parsed);
      saveProfileToDisk(parsed);
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
            <p className="text-[10px] font-black text-[var(--text-dim)] uppercase tracking-widest">Manual JSON Override</p>
            <textarea
              value={editJson}
              onChange={e => setEditJson(e.target.value)}
              className="w-full h-80 bg-black/40 border border-[var(--glass-border)] rounded-2xl px-4 py-3 text-xs text-indigo-300 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all resize-none"
            />
            <div className="flex gap-3">
              <button onClick={handleSaveEdit} className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-[var(--text-main)] rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-600/20 active:scale-95">Save Changes</button>
              <button onClick={() => setEditMode(false)} className="flex-1 py-3.5 bg-[var(--glass-bg)] hover:bg-white/10 text-[var(--text-dim)] rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95">Cancel</button>
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
      {isRefining && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[var(--bg-app)] backdrop-blur-2xl" onClick={e => e.stopPropagation()}>
          <div className="relative flex items-center justify-center w-32 h-32 mb-8">
            <div className="absolute inset-0 rounded-full border-[3px] border-indigo-500/30 animate-[spin_3s_linear_infinite]"></div>
            <div className="absolute inset-2 rounded-full border-[3px] border-t-purple-500 border-purple-500/20 animate-[spin_1.5s_ease-in-out_infinite_reverse]"></div>
            <div className="absolute inset-4 rounded-full border-[3px] border-b-cyan-400 border-cyan-400/20 animate-[spin_2s_linear_infinite]"></div>
            <div className="absolute inset-0 flex items-center justify-center text-4xl animate-pulse">
              ✨
            </div>
          </div>
          <h2 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 animate-pulse tracking-wide mb-3 text-center px-4">
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
        </div>
      )}
      {/* Profile Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 backdrop-blur-md bg-black/40 animate-in fade-in duration-300" onClick={(e) => e.stopPropagation()}>
          <div className="w-full max-w-xs bg-gradient-to-br from-red-500 via-rose-600 to-pink-700 p-[1.5px] rounded-[32px] shadow-[0_20px_50px_rgba(225,29,72,0.3)] animate-in zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()}>
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
