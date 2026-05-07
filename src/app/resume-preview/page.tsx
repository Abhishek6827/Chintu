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

    try {
      const stored = sessionStorage.getItem("tailoredProfile");
      if (stored) {
        setProfile(JSON.parse(stored));
      }
    } catch (err) {
      console.error("Error reading profile from sessionStorage:", err);
    } finally {
      setLoading(false);
    }
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
    <div className="resume-page">
      <style jsx global>{`
        /* Reset ALL app styles on the resume page */
        .resume-page,
        .resume-page * {
          color: #000 !important;
          font-family: 'Times New Roman', 'Georgia', serif !important;
        }
        .resume-page {
          background: #e8e8e8 !important;
          min-height: 100vh;
          padding: 0;
          margin: 0;
        }
        /* Hide app header/footer/nav on this page */
        nav[role="navigation"],
        footer[role="contentinfo"],
        .drag-region {
          display: none !important;
        }
        /* The A4 sheet */
        .resume-sheet {
          background: white !important;
          width: 210mm;
          min-height: 297mm;
          margin: 20px auto;
          padding: 0.5in 0.55in;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15);
          line-height: 1.35;
        }
        /* Section headings */
        .resume-sheet .section-heading {
          font-size: 11pt !important;
          font-weight: bold !important;
          border-bottom: 1px solid #000 !important;
          padding-bottom: 2px !important;
          margin-bottom: 6px !important;
          margin-top: 10px !important;
          text-transform: none !important;
          letter-spacing: 0 !important;
        }
        /* Name */
        .resume-sheet .resume-name {
          font-size: 18pt !important;
          font-weight: bold !important;
          text-align: center !important;
          margin: 0 !important;
          padding: 0 !important;
          line-height: 1.2 !important;
        }
        /* Contact line */
        .resume-sheet .resume-contact {
          text-align: center !important;
          font-size: 8.5pt !important;
          color: #333 !important;
          margin: 2px 0 0 0 !important;
          line-height: 1.4 !important;
        }
        /* Body text */
        .resume-sheet .body-text {
          font-size: 10pt !important;
          color: #000 !important;
          text-align: justify !important;
          line-height: 1.35 !important;
          margin: 0 !important;
        }
        /* Entry header row */
        .resume-sheet .entry-header {
          display: flex !important;
          justify-content: space-between !important;
          align-items: baseline !important;
          margin-bottom: 0 !important;
        }
        .resume-sheet .entry-title {
          font-size: 10.5pt !important;
          font-weight: bold !important;
        }
        .resume-sheet .entry-date {
          font-size: 9.5pt !important;
          font-weight: normal !important;
          color: #000 !important;
          white-space: nowrap !important;
        }
        .resume-sheet .entry-subtitle {
          font-size: 9.5pt !important;
          font-style: italic !important;
          color: #444 !important;
          margin: 0 0 2px 0 !important;
        }
        /* Bullet list */
        .resume-sheet .bullet-list {
          list-style: disc !important;
          padding-left: 18px !important;
          margin: 2px 0 6px 0 !important;
        }
        .resume-sheet .bullet-list li {
          font-size: 9.5pt !important;
          color: #000 !important;
          line-height: 1.35 !important;
          margin-bottom: 1px !important;
          padding-left: 2px !important;
        }
        /* Skills row */
        .resume-sheet .skill-row {
          font-size: 9.5pt !important;
          color: #000 !important;
          margin: 1px 0 !important;
          line-height: 1.4 !important;
        }
        .resume-sheet .skill-label {
          font-weight: bold !important;
        }
        /* Education entry */
        .resume-sheet .edu-entry {
          display: flex !important;
          justify-content: space-between !important;
          align-items: baseline !important;
          margin-bottom: 2px !important;
        }
        .resume-sheet .edu-degree {
          font-size: 10pt !important;
          font-weight: bold !important;
        }
        .resume-sheet .edu-institution {
          font-size: 9pt !important;
          font-style: italic !important;
          color: #444 !important;
        }
        .resume-sheet .edu-year {
          font-size: 9.5pt !important;
          text-align: right !important;
          white-space: nowrap !important;
        }
        /* Project tech */
        .resume-sheet .project-tech {
          font-size: 9pt !important;
          font-style: italic !important;
          color: #444 !important;
          margin: 0 0 2px 0 !important;
        }
        /* Print styles */
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
          .resume-page {
            background: white !important;
          }
          .resume-sheet {
            margin: 0 !important;
            padding: 0.4in 0.5in !important;
            box-shadow: none !important;
            width: 100% !important;
          }
        }
      `}</style>

      <div className="resume-sheet">
        {/* ─── Name ─── */}
        <h1 className="resume-name">{profile.name}</h1>

        {/* ─── Contact Info ─── */}
        <p className="resume-contact">
          {[
            profile.contact?.phone,
            profile.contact?.email || user?.emailAddresses[0]?.emailAddress,
            profile.contact?.linkedin?.replace(/^https?:\/\//, ''),
            profile.contact?.github?.replace(/^https?:\/\//, ''),
            profile.contact?.portfolio?.replace(/^https?:\/\//, '')
          ].filter(Boolean).join(' | ')}
        </p>

        {/* ─── Summary ─── */}
        {profile.summary && (
          <div>
            <h2 className="section-heading">Summary</h2>
            <p className="body-text">{profile.summary}</p>
          </div>
        )}

        {/* ─── Experience ─── */}
        {profile.experience?.length > 0 && (
          <div>
            <h2 className="section-heading">Experience</h2>
            {profile.experience.map((exp: any, i: number) => (
              <div key={i} style={{ marginBottom: '6px' }}>
                <div className="entry-header">
                  <span className="entry-title">{exp.role}</span>
                  <span className="entry-date">{exp.duration}</span>
                </div>
                <p className="entry-subtitle">{exp.company}</p>
                {exp.highlights?.length > 0 && (
                  <ul className="bullet-list">
                    {exp.highlights.map((h: string, j: number) => (
                      <li key={j}>{h}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ─── Projects ─── */}
        {profile.projects?.length > 0 && (
          <div>
            <h2 className="section-heading">Projects</h2>
            {profile.projects.map((pr: any, i: number) => (
              <div key={i} style={{ marginBottom: '6px' }}>
                <p className="entry-title">{pr.name}</p>
                {pr.tech?.length > 0 && (
                  <p className="project-tech">{pr.tech.join(', ')}</p>
                )}
                <p className="body-text" style={{ fontSize: '9.5pt' }}>{pr.description}</p>
              </div>
            ))}
          </div>
        )}

        {/* ─── Education ─── */}
        {profile.education?.length > 0 && (
          <div>
            <h2 className="section-heading">Education</h2>
            {profile.education.map((ed: any, i: number) => (
              <div key={i} className="edu-entry">
                <div>
                  <p className="edu-degree">{ed.degree}</p>
                  <p className="edu-institution">{ed.institution}</p>
                </div>
                <span className="edu-year">{ed.year}</span>
              </div>
            ))}
          </div>
        )}

        {/* ─── Skills ─── */}
        {profile.skills && (
          <div>
            <h2 className="section-heading">Skills</h2>
            {profile.skills.languages?.length > 0 && (
              <p className="skill-row"><span className="skill-label">Languages:</span> {profile.skills.languages.join(', ')}</p>
            )}
            {profile.skills.frameworks?.length > 0 && (
              <p className="skill-row"><span className="skill-label">Frameworks:</span> {profile.skills.frameworks.join(', ')}</p>
            )}
            {profile.skills.tools?.length > 0 && (
              <p className="skill-row"><span className="skill-label">Tools:</span> {profile.skills.tools.join(', ')}</p>
            )}
            {profile.skills.other?.length > 0 && (
              <p className="skill-row"><span className="skill-label">Other:</span> {profile.skills.other.join(', ')}</p>
            )}
          </div>
        )}

        {/* ─── Certifications & Achievements ─── */}
        {(profile.certifications?.length > 0 || profile.achievements?.length > 0) && (
          <div>
            <h2 className="section-heading">Certifications & Achievements</h2>
            <ul className="bullet-list">
              {profile.certifications?.map((c: string, i: number) => <li key={`c-${i}`}>{c}</li>)}
              {profile.achievements?.map((a: string, i: number) => <li key={`a-${i}`}>{a}</li>)}
            </ul>
          </div>
        )}
      </div>

      <div className="no-print" style={{ position: 'fixed', bottom: '30px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '16px', zIndex: 50 }}>
        <button 
          onClick={() => window.print()}
          style={{ padding: '12px 28px', background: '#000', color: '#fff', borderRadius: '999px', fontWeight: 'bold', fontSize: '14px', border: 'none', cursor: 'pointer', boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}
        >
          Download PDF
        </button>
        <button 
          onClick={() => router.back()}
          style={{ padding: '12px 28px', background: '#fff', color: '#000', borderRadius: '999px', fontWeight: 'bold', fontSize: '14px', border: '1px solid #ddd', cursor: 'pointer', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}
        >
          Go Back
        </button>
      </div>
    </div>
  );
}
