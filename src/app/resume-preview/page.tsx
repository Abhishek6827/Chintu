"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import NeuralLoading from "@/components/NeuralLoading";

export default function ResumePreviewPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const template = searchParams.get("template") || "modern";

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.push("/sign-in");
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/profile");
        if (res.ok) {
          const { profile: data } = await res.json();
          if (data?.profile_data) {
            setProfile(data.profile_data);
          }
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [isLoaded, isSignedIn, router]);

  useEffect(() => {
    if (profile) {
      // Small delay to ensure styles are applied before print dialog
      const timer = setTimeout(() => {
        window.print();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [profile]);

  if (loading) return <NeuralLoading text="Generating ATS Resume..." />;
  if (!profile) return <div className="p-10 text-center">No profile data found. Please setup your profile first.</div>;

  return (
    <div className={`min-h-screen bg-[#f3f4f6] text-black leading-snug print:bg-white print:p-0 ${template === 'classic' ? 'font-serif' : 'font-sans'}`}>
      <style jsx global>{`
        @media print {
          @page {
            margin: 0;
            size: A4;
          }
          body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact;
          }
          .no-print {
            display: none !important;
          }
          .resume-container {
            margin: 0 !important;
            padding: 0.4in 0.5in !important;
            box-shadow: none !important;
            width: 100% !important;
            height: 100% !important;
          }
        }
        body {
          background: #f3f4f6;
          margin: 0;
          padding: 0;
        }
        .resume-container {
          background: white;
          width: 210mm;
          margin: 1.5rem auto;
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
          min-height: 297mm;
          padding: 0.5in 0.6in;
          color: #000;
        }
      `}</style>

      <div className="resume-container flex flex-col">
        {/* Header */}
        <header className={`mb-4 ${template === 'minimal' ? 'text-left' : 'text-center'}`}>
          <h1 className={`${template === 'minimal' ? 'text-3xl' : 'text-2xl'} font-bold uppercase tracking-tight mb-0`}>
            {profile.name}
          </h1>
          <p className={`${template === 'minimal' ? 'text-xs' : 'text-[10px]'} font-bold text-gray-700 uppercase tracking-[0.2em] mb-1`}>
            {profile.title}
          </p>
          <div className={`flex flex-wrap ${template === 'minimal' ? 'justify-start' : 'justify-center'} gap-x-2 text-[9px] text-gray-500 font-medium`}>
            {[
              profile.email || user?.emailAddresses[0].emailAddress,
              profile.phone,
              profile.linkedin?.replace(/^https?:\/\//, ''),
              profile.github?.replace(/^https?:\/\//, ''),
              profile.portfolio?.replace(/^https?:\/\//, '')
            ].filter(Boolean).map((item, index, array) => (
              <span key={index} className="flex items-center gap-2">
                {item}
                {index < array.length - 1 && <span className="text-gray-300">|</span>}
              </span>
            ))}
          </div>
        </header>

        {/* Summary */}
        {profile.summary && (
          <section className="mb-3">
            <h2 className={`text-[9.5px] font-bold uppercase tracking-widest ${template === 'minimal' ? 'border-none' : 'border-b-[1.5px] border-black'} mb-1 pb-0.5`}>
              Professional Summary
            </h2>
            <p className="text-[10.5px] text-gray-800 text-justify leading-snug">{profile.summary}</p>
          </section>
        )}

        {/* Experience */}
        {profile.experience?.length > 0 && (
          <section className="mb-3">
            <h2 className={`text-[9.5px] font-bold uppercase tracking-widest ${template === 'minimal' ? 'border-none' : 'border-b-[1.5px] border-black'} mb-1.5 pb-0.5`}>
              Experience
            </h2>
            {profile.experience.map((exp: any, i: number) => (
              <div key={i} className="mb-2 last:mb-0">
                <div className="flex justify-between items-baseline mb-0">
                  <h3 className="text-[10.5px] font-bold">{exp.role}</h3>
                  <span className="text-[9.5px] font-bold text-gray-700">{exp.duration}</span>
                </div>
                <p className="text-[9.5px] font-bold italic text-gray-600 mb-0.5">{exp.company}</p>
                <ul className="list-disc ml-4 text-[10px] text-gray-800 space-y-0">
                  {exp.highlights?.map((h: string, j: number) => (
                    <li key={j} className="pl-1 leading-tight">{h}</li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        )}

        {/* Projects */}
        {profile.projects?.length > 0 && (
          <section className="mb-3">
            <h2 className={`text-[9.5px] font-bold uppercase tracking-widest ${template === 'minimal' ? 'border-none' : 'border-b-[1.5px] border-black'} mb-1.5 pb-0.5`}>
              Projects
            </h2>
            {profile.projects.map((pr: any, i: number) => (
              <div key={i} className="mb-1.5 last:mb-0">
                <h3 className="text-[10.5px] font-bold mb-0">{pr.name}</h3>
                <p className="text-[10px] text-gray-800 leading-snug">{pr.description}</p>
                {pr.tech?.length > 0 && (
                  <p className="text-[8.5px] font-bold text-gray-500 mt-0 uppercase tracking-wider">
                    Tech: {pr.tech.join(", ")}
                  </p>
                )}
              </div>
            ))}
          </section>
        )}

        {/* Skills */}
        {profile.skills && (
          <section className="mb-3">
            <h2 className={`text-[9.5px] font-bold uppercase tracking-widest ${template === 'minimal' ? 'border-none' : 'border-b-[1.5px] border-black'} mb-1.5 pb-0.5`}>
              Technical Skills
            </h2>
            <div className="text-[10px] text-gray-800 space-y-0">
              {profile.skills.languages?.length > 0 && (
                <p><span className="font-bold">Languages:</span> {profile.skills.languages.join(", ")}</p>
              )}
              {profile.skills.frameworks?.length > 0 && (
                <p><span className="font-bold">Frameworks:</span> {profile.skills.frameworks.join(", ")}</p>
              )}
              {profile.skills.tools?.length > 0 && (
                <p><span className="font-bold">Tools:</span> {profile.skills.tools.join(", ")}</p>
              )}
              {profile.skills.other?.length > 0 && (
                <p><span className="font-bold">Other:</span> {profile.skills.other.join(", ")}</p>
              )}
            </div>
          </section>
        )}

        {/* Education */}
        {profile.education?.length > 0 && (
          <section className="mb-3 last:mb-0">
            <h2 className={`text-[9.5px] font-bold uppercase tracking-widest ${template === 'minimal' ? 'border-none' : 'border-b-[1.5px] border-black'} mb-1.5 pb-0.5`}>
              Education
            </h2>
            {profile.education.map((ed: any, i: number) => (
              <div key={i} className="flex justify-between items-baseline mb-0.5 last:mb-0">
                <div>
                  <h3 className="text-[10.5px] font-bold">{ed.degree}</h3>
                  <p className="text-[9.5px] italic text-gray-600">{ed.institution}</p>
                </div>
                <span className="text-[9.5px] font-bold text-gray-700">{ed.year}</span>
              </div>
            ))}
          </section>
        )}

        {/* Certifications/Achievements fallback */}
        {(profile.certifications?.length > 0 || profile.achievements?.length > 0) && (
          <section className="mt-4">
            <h2 className={`text-[10px] font-bold uppercase tracking-widest ${template === 'minimal' ? 'border-none' : 'border-b-[1.5px] border-black'} mb-2 pb-0.5`}>
              Certifications & Achievements
            </h2>
            <ul className="list-disc ml-4 text-[10.5px] text-gray-800 space-y-0.5">
              {profile.certifications?.map((c: string, i: number) => <li key={`c-${i}`} className="pl-1">{c}</li>)}
              {profile.achievements?.map((a: string, i: number) => <li key={`a-${i}`} className="pl-1">{a}</li>)}
            </ul>
          </section>
        )}
      </div>

      <div className="no-print fixed bottom-8 left-1/2 -translate-x-1/2 flex gap-4">
        <button 
          onClick={() => window.print()}
          className="px-6 py-3 bg-black text-white rounded-full font-bold shadow-xl hover:scale-105 transition-all"
        >
          Download PDF
        </button>
        <button 
          onClick={() => router.back()}
          className="px-6 py-3 bg-white text-black border border-gray-200 rounded-full font-bold shadow-xl hover:scale-105 transition-all"
        >
          Go Back
        </button>
      </div>
    </div>
  );
}
