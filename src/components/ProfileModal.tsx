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
    <span className="inline-block px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[0.6875rem] rounded-md font-medium mr-1 mb-1">{text}</span>
  );

  return (
    <div className="absolute inset-0 settings-overlay z-50 flex items-center justify-center p-2 sm:p-4" onClick={onClose}>
      <div className="settings-panel w-full max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-5" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-800">
              {profile ? "👤 Your Profile" : "👤 Setup Profile"}
            </h2>
            <p className="text-xs text-gray-400">AI uses this to personalize answers</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm">✕</button>
        </div>

        {error && (
          <div className="mb-3 bg-red-50 border border-red-200 text-red-600 text-xs px-3 py-2 rounded-xl flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError("")} className="ml-2 text-red-400">✕</button>
          </div>
        )}

        {/* No profile — show paste area */}
        {!profile && !editMode && (
          <div>
            <p className="text-sm text-gray-500 mb-3">Paste your resume text, LinkedIn summary, or anything about yourself. AI will structure it perfectly.</p>
            <textarea
              value={rawText}
              onChange={e => setRawText(e.target.value)}
              placeholder="Paste your resume or describe yourself here... (experience, projects, skills, education — everything)"
              className="w-full h-40 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
            />
            <button
              onClick={handleRefine}
              disabled={!rawText.trim() || isRefining}
              className={`w-full mt-3 py-3 rounded-xl text-sm font-bold transition-all ${
                rawText.trim() && !isRefining
                  ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg hover:shadow-xl hover:scale-[1.01]"
                  : "bg-gray-100 text-gray-300 cursor-not-allowed"
              }`}
            >
              {isRefining ? "✨ AI is structuring your profile..." : "✨ Refine with AI"}
            </button>
          </div>
        )}

        {/* Edit mode */}
        {editMode && (
          <div>
            <p className="text-xs text-gray-400 mb-2">Edit the JSON directly. Be careful with syntax.</p>
            <textarea
              value={editJson}
              onChange={e => setEditJson(e.target.value)}
              className="w-full h-60 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs text-gray-700 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
            />
            <div className="flex gap-2 mt-3">
              <button onClick={handleSaveEdit} className="flex-1 py-2.5 bg-indigo-500 text-white rounded-xl text-sm font-bold">Save</button>
              <button onClick={() => setEditMode(false)} className="flex-1 py-2.5 bg-gray-100 text-gray-500 rounded-xl text-sm font-medium">Cancel</button>
            </div>
          </div>
        )}

        {/* Profile display */}
        {profile && !editMode && (
          <div className="space-y-3">
            {/* Name & Title */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl px-4 py-3">
              <h3 className="text-base font-bold text-gray-800">{profile.name || "—"}</h3>
              {profile.title && <p className="text-sm text-indigo-600 font-medium">{profile.title}</p>}
              {profile.summary && <p className="text-xs text-gray-500 mt-1 leading-relaxed">{profile.summary}</p>}
            </div>

            {/* Experience */}
            {profile.experience?.length > 0 && (
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">💼 Experience</p>
                {profile.experience.map((exp, i) => (
                  <div key={i} className="bg-gray-50 rounded-lg px-3 py-2 mb-1.5">
                    <p className="text-sm font-semibold text-gray-700">{exp.role}</p>
                    <p className="text-xs text-gray-400">{exp.company} • {exp.duration}</p>
                    {exp.highlights?.map((h, j) => (
                      <p key={j} className="text-xs text-gray-500 mt-0.5">• {h}</p>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {/* Projects */}
            {profile.projects?.length > 0 && (
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">🚀 Projects</p>
                {profile.projects.map((pr, i) => (
                  <div key={i} className="bg-gray-50 rounded-lg px-3 py-2 mb-1.5">
                    <p className="text-sm font-semibold text-gray-700">{pr.name}</p>
                    <p className="text-xs text-gray-500">{pr.description}</p>
                    {pr.tech?.length > 0 && <div className="mt-1">{pr.tech.map((t, j) => <SkillTag key={j} text={t} />)}</div>}
                  </div>
                ))}
              </div>
            )}

            {/* Skills */}
            {profile.skills && (
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">🛠 Skills</p>
                <div className="bg-gray-50 rounded-lg px-3 py-2">
                  {profile.skills.languages?.length > 0 && <div className="mb-1">{profile.skills.languages.map((s, i) => <SkillTag key={i} text={s} />)}</div>}
                  {profile.skills.frameworks?.length > 0 && <div className="mb-1">{profile.skills.frameworks.map((s, i) => <SkillTag key={i} text={s} />)}</div>}
                  {profile.skills.tools?.length > 0 && <div className="mb-1">{profile.skills.tools.map((s, i) => <SkillTag key={i} text={s} />)}</div>}
                  {profile.skills.other?.length > 0 && <div>{profile.skills.other.map((s, i) => <SkillTag key={i} text={s} />)}</div>}
                </div>
              </div>
            )}

            {/* Education */}
            {profile.education?.length > 0 && (
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">🎓 Education</p>
                {profile.education.map((ed, i) => (
                  <div key={i} className="bg-gray-50 rounded-lg px-3 py-2 mb-1.5">
                    <p className="text-sm font-semibold text-gray-700">{ed.degree}</p>
                    <p className="text-xs text-gray-400">{ed.institution} • {ed.year}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2 pt-2">
              <button onClick={handleEdit} className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-xs font-semibold transition-colors">✏️ Edit</button>
              <button
                onClick={() => { handleDelete(); }}
                className="flex-1 py-2.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl text-xs font-semibold transition-colors"
              >
                🗑 Delete & Re-paste
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Full Page Loading Animation */}
      {isRefining && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0a0a0a]/95 backdrop-blur-2xl" onClick={e => e.stopPropagation()}>
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
          <p className="mt-8 text-xs text-white/40 font-medium tracking-[0.2em] uppercase text-center max-w-xs leading-relaxed">
            Please wait • Making you look awesome<br />
            <span className="text-white/30 text-[0.65rem] normal-case tracking-normal">This may take 5-10 minutes for the first time</span>
          </p>
        </div>
      )}
    </div>
  );
}
