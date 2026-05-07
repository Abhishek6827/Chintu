
export interface ProfileData {
  name: string;
  title: string;
  atsScore?: number;
  atsFeedback?: string[];
  contact?: {
    email: string;
    phone: string;
    linkedin: string;
    github: string;
  };
  summary: string;
  experience: { role: string; company: string; duration: string; highlights: string[] }[];
  projects: { name: string; description: string; tech: string[] }[];
  skills: { languages: string[]; frameworks: string[]; tools: string[]; other: string[] };
  education: { degree: string; institution: string; year: string }[];
  certifications: string[];
  achievements: string[];
}

export function generateLaTeX(p: ProfileData, template: string = 'modern'): string {
  const escapeLatex = (str: string) => {
    if (!str) return "";
    return str
      .replace(/\\/g, "\\\\")
      .replace(/&/g, "\\&")
      .replace(/%/g, "\\%")
      .replace(/\$/g, "\\$")
      .replace(/#/g, "\\#")
      .replace(/_/g, "\\_")
      .replace(/\{/g, "\\{")
      .replace(/\}/g, "\\}")
      .replace(/~/g, "\\textasciitilde")
      .replace(/\^/g, "\\textasciicircum");
  };

  const experience = (p.experience || []).map(exp => `
\\noindent \\textbf{${escapeLatex(exp.role)}} \\hfill ${escapeLatex(exp.duration)} \\\\
\\textit{${escapeLatex(exp.company)}}
\\begin{itemize}
    ${(exp.highlights || []).map(h => `\\item ${escapeLatex(h)}`).join('\n    ')}
\\end{itemize}
\\vspace{6pt}`).join('');

  const projects = (p.projects || []).map(pr => `
\\noindent \\textbf{${escapeLatex(pr.name)}} \\\\
${escapeLatex(pr.description)} \\\\
\\textit{Technologies: ${escapeLatex((pr.tech || []).join(', '))}}
\\vspace{6pt}`).join('');

  const education = (p.education || []).map(ed => `
\\noindent \\textbf{${escapeLatex(ed.degree)}} \\hfill ${escapeLatex(ed.year)} \\\\
\\textit{${escapeLatex(ed.institution)}}
\\vspace{4pt}`).join('');

  const skills = p.skills ? `
\\begin{itemize}
    ${p.skills.languages?.length ? `\\item \\textbf{Languages:} ${escapeLatex(p.skills.languages.join(', '))}` : ''}
    ${p.skills.frameworks?.length ? `\\item \\textbf{Frameworks:} ${escapeLatex(p.skills.frameworks.join(', '))}` : ''}
    ${p.skills.tools?.length ? `\\item \\textbf{Tools:} ${escapeLatex(p.skills.tools.join(', '))}` : ''}
    ${p.skills.other?.length ? `\\item \\textbf{Other:} ${escapeLatex(p.skills.other.join(', '))}` : ''}
\\end{itemize}` : '';

  const certifications = (p.certifications || []).length > 0 ? `
\\section*{Certifications}
\\begin{itemize}
    ${p.certifications.map(c => `\\item ${escapeLatex(c)}`).join('\n    ')}
\\end{itemize}` : '';

  const achievements = (p.achievements || []).length > 0 ? `
\\section*{Achievements}
\\begin{itemize}
    ${p.achievements.map(a => `\\item ${escapeLatex(a)}`).join('\n    ')}
\\end{itemize}` : '';

  let styleConfigs = "";
  let headerConfig = "";

  const contactLine = p.contact ? [
    p.contact.email,
    p.contact.phone,
    p.contact.linkedin,
    p.contact.github
  ].filter(Boolean).map(item => escapeLatex(item)).join(' \\textbullet{} ') : "";

  if (template === 'classic') {
    styleConfigs = `
\\documentclass[11pt,a4paper,serif]{article}
\\usepackage[margin=0.75in]{geometry}
\\titleformat{\\section}{\\large\\bfseries\\scshape}{}{0em}{}[\\titlerule]
`;
    headerConfig = `
\\begin{center}
    {\\huge \\scshape ${escapeLatex(p.name)}} \\\\
    \\vspace{4pt}
    ${escapeLatex(p.title)} \\\\
    \\vspace{2pt}
    {\\small ${contactLine}}
\\end{center}
`;
  } else if (template === 'minimal') {
    styleConfigs = `
\\documentclass[10pt,a4paper,sans]{article}
\\usepackage[margin=1in]{geometry}
\\titleformat{\\section}{\\small\\bfseries\\uppercase}{}{0em}{}[\\vspace{2pt}]
\\titlespacing*{\\section}{0pt}{15pt}{6pt}
`;
    headerConfig = `
\\noindent {\\Huge \\bfseries ${escapeLatex(p.name)}} \\\\
\\noindent {\\large ${escapeLatex(p.title)}} \\\\
\\noindent {\\small ${contactLine}} \\\\
\\vspace{15pt}
`;
  } else {
    // Default: Modern
    styleConfigs = `
\\documentclass[11pt,a4paper,sans]{article}
\\usepackage[margin=0.75in]{geometry}
\\titleformat{\\section}{\\large\\bfseries\\uppercase}{}{0em}{}[\\titlerule]
`;
    headerConfig = `
\\begin{center}
    {\\huge \\bfseries ${escapeLatex(p.name)}} \\\\
    \\vspace{2pt}
    ${escapeLatex(p.title)} \\\\
    \\vspace{2pt}
    {\\small ${contactLine}}
\\end{center}
`;
  }

  return `
${styleConfigs}
\\usepackage[utf8]{inputenc}
\\usepackage{enumitem}
\\usepackage{titlesec}
\\usepackage{hyperref}
\\usepackage{xcolor}

% Universal style definitions
\\titlespacing*{\\section}{0pt}{12pt}{6pt}
\\setlist[itemize]{noitemsep, topsep=0pt, leftmargin=*}
\\hypersetup{colorlinks=true, linkcolor=blue, urlcolor=blue}

\\begin{document}
${headerConfig}

% Summary
\\section*{Professional Summary}
${escapeLatex(p.summary)}

% Experience
\\section*{Experience}
${experience}

% Projects
\\section*{Projects}
${projects}

% Skills
\\section*{Skills}
${skills}

% Education
\\section*{Education}
${education}

${certifications}

${achievements}

\\end{document}
  `.trim();
}
