import type {
  Education,
  PersonalInfo,
  Project,
  WorkExperience,
} from "@/backend";

// Dynamically load pdfjs-dist from CDN to avoid build-time module resolution failure
const PDFJS_CDN =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.2.67/pdf.min.mjs";
const PDFJS_WORKER_CDN =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.2.67/pdf.worker.min.mjs";

let pdfjsLib: any = null;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("PDF parsing timed out")), ms),
    ),
  ]);
}

async function getPdfjsLib() {
  if (pdfjsLib) return pdfjsLib;
  const mod: any = await import(/* @vite-ignore */ PDFJS_CDN);
  pdfjsLib = mod;
  pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_CDN;
  return pdfjsLib;
}

async function extractTextFromPDF(
  file: File,
  onProgress?: (current: number, total: number) => void,
): Promise<string> {
  const lib = await getPdfjsLib();
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await lib.getDocument({ data: arrayBuffer }).promise;
  const pageTexts: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();

    // Group text items by vertical position (y coordinate)
    const itemsByLine: Map<number, { x: number; str: string }[]> = new Map();

    for (const item of content.items) {
      const it = item as any;
      if (!("str" in it) || !it.str.trim()) continue;
      const y = Math.round(it.transform[5]); // round to group items on same line
      if (!itemsByLine.has(y)) itemsByLine.set(y, []);
      itemsByLine.get(y)!.push({ x: it.transform[4], str: it.str });
    }

    // Sort lines top-to-bottom (PDF y is from bottom, so sort descending)
    const sortedYs = Array.from(itemsByLine.keys()).sort((a, b) => b - a);

    const lines = sortedYs
      .map((y) => {
        const items = itemsByLine.get(y)!;
        items.sort((a, b) => a.x - b.x);
        return items
          .map((it) => it.str)
          .join(" ")
          .trim();
      })
      .filter((line) => line.length > 0);

    pageTexts.push(lines.join("\n"));

    // Report progress after each page
    onProgress?.(i, pdf.numPages);
  }

  return pageTexts.join("\n");
}

function extractEmail(text: string): string {
  const match = text.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
  return match ? match[0] : "";
}

function extractPhone(text: string): string {
  const match = text.match(
    /(?:\+?\d{1,3}[\s\-.]?)?(?:\(?\d{3}\)?[\s\-.]?)\d{3}[\s\-.]?\d{4}/,
  );
  return match ? match[0].trim() : "";
}

function extractName(lines: string[]): string {
  for (const line of lines.slice(0, 8)) {
    const trimmed = line.trim();
    if (
      trimmed.length > 2 &&
      trimmed.length < 70 &&
      !trimmed.includes("@") &&
      !/\d{3}/.test(trimmed) &&
      !/http/i.test(trimmed)
    ) {
      return trimmed;
    }
  }
  return "";
}

function extractTitle(lines: string[], nameIndex: number): string {
  const titleKeywords =
    /engineer|developer|designer|manager|analyst|consultant|architect|lead|director|specialist|scientist|coordinator/i;
  for (let i = nameIndex + 1; i < Math.min(nameIndex + 5, lines.length); i++) {
    const trimmed = lines[i].trim();
    if (
      trimmed.length > 3 &&
      trimmed.length < 80 &&
      !trimmed.includes("@") &&
      (titleKeywords.test(trimmed) || /^[A-Z][a-z]/.test(trimmed))
    ) {
      return trimmed;
    }
  }
  return "";
}

const SECTION_HEADINGS =
  /^(experience|work experience|employment|employment history|professional experience|education|academic|qualifications|skills|technical skills|technologies|core competencies|tech stack|projects|personal projects|open source|portfolio|summary|profile|about|about me|objective|professional summary|contact|certifications|awards|publications|languages|interests|volunteer)\s*:?\s*$/i;

function getSectionText(
  lines: string[],
  headingPattern: RegExp,
  nextHeadingPattern: RegExp,
): string[] {
  let inSection = false;
  const result: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (headingPattern.test(trimmed)) {
      inSection = true;
      continue;
    }
    if (inSection) {
      if (nextHeadingPattern.test(trimmed)) break;
      if (trimmed) result.push(trimmed);
    }
  }

  return result;
}

function extractBio(lines: string[]): string {
  const bioLines = getSectionText(
    lines,
    /^(summary|profile|about|about me|objective|professional summary)\s*:?\s*$/i,
    SECTION_HEADINGS,
  );
  return bioLines.slice(0, 5).join(" ").trim();
}

function extractSkills(lines: string[]): string[] {
  const skillLines = getSectionText(
    lines,
    /^(skills|technical skills|technologies|core competencies|tech stack)\s*:?\s*$/i,
    SECTION_HEADINGS,
  );

  const skills: string[] = [];
  for (const line of skillLines) {
    const parts = line.split(/[,•|·/\t]+/).map((s) => s.trim());
    for (const part of parts) {
      const cleaned = part.replace(/^[-–•*]\s*/, "").trim();
      if (cleaned.length > 1 && cleaned.length < 40) {
        skills.push(cleaned);
      }
    }
  }

  return [...new Set(skills.filter(Boolean))];
}

function extractWorkExperience(lines: string[]): WorkExperience[] {
  const expLines = getSectionText(
    lines,
    /^(experience|work experience|employment|employment history|professional experience)\s*:?\s*$/i,
    /^(education|academic|qualifications|skills|technical skills|projects|certifications|awards|publications|languages|interests|volunteer)\s*:?\s*$/i,
  );

  const experiences: WorkExperience[] = [];
  let current: Partial<WorkExperience> | null = null;
  const descLines: string[] = [];

  const datePattern =
    /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\d{4})[\w\s,]*(?:–|-|to)[\s\w,]*(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\d{4}|present|current)/i;

  // Pattern for lines like: "Company Name | Jan 2020 – Present"
  const inlineDatePattern =
    /^(.+?)\s*[|\t]\s*(.+(?:–|-|to).+(?:present|current|\d{4}))$/i;

  const flushCurrent = () => {
    if (current) {
      current.description = descLines.join(" ").trim();
      if (current.company || current.role) {
        experiences.push(current as WorkExperience);
      }
      descLines.length = 0;
    }
  };

  for (const line of expLines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Check for inline company | date pattern
    const inlineMatch = trimmed.match(inlineDatePattern);
    if (inlineMatch) {
      flushCurrent();
      const companyOrRole = inlineMatch[1].trim();
      const dateStr = inlineMatch[2].trim();
      const dateParts = dateStr.split(/–|-|to/i);
      current = {
        company: companyOrRole,
        role: "",
        startDate: dateParts[0]?.trim() ?? "",
        endDate: dateParts[1]?.trim() ?? "",
        description: "",
      };
      continue;
    }

    if (datePattern.test(trimmed)) {
      // Date line found — start or continue a block
      const dateMatch = trimmed.match(datePattern);
      const dates = dateMatch ? dateMatch[0] : "";
      const parts = dates.split(/–|-|to/i);

      if (!current) {
        // No preceding company/role captured yet
        current = {
          company: "",
          role: "",
          startDate: parts[0]?.trim() ?? "",
          endDate: parts[1]?.trim() ?? "",
          description: "",
        };
      } else if (current.company && current.role) {
        // Already have a full entry; dates are the dates for existing entry
        current.startDate = parts[0]?.trim() ?? current.startDate;
        current.endDate = parts[1]?.trim() ?? current.endDate;
      } else {
        // Flush and start new
        flushCurrent();
        current = {
          company: "",
          role: "",
          startDate: parts[0]?.trim() ?? "",
          endDate: parts[1]?.trim() ?? "",
          description: "",
        };
      }
    } else if (
      current &&
      !current.role &&
      !current.company &&
      trimmed.length < 80 &&
      /^[A-Z]/.test(trimmed)
    ) {
      // First text after date — treat as role (title-first format)
      current.role = trimmed;
    } else if (
      current?.role &&
      !current.company &&
      trimmed.length < 80 &&
      /^[A-Z]/.test(trimmed)
    ) {
      // Second text after date — treat as company
      current.company = trimmed;
    } else if (
      current &&
      !current.company &&
      trimmed.length < 80 &&
      /^[A-Z]/.test(trimmed)
    ) {
      current.company = trimmed;
    } else if (current?.company && !current.role && trimmed.length < 80) {
      current.role = trimmed;
    } else if (!current && /^[A-Z]/.test(trimmed) && trimmed.length < 80) {
      current = {
        company: trimmed,
        role: "",
        startDate: "",
        endDate: "",
        description: "",
      };
    } else if (current) {
      descLines.push(trimmed);
    }
  }

  flushCurrent();

  return experiences.slice(0, 10);
}

function extractEducation(lines: string[]): Education[] {
  const eduLines = getSectionText(
    lines,
    /^(education|academic|academic background|qualifications)\s*:?\s*$/i,
    /^(experience|work experience|employment|employment history|professional experience|skills|technical skills|projects|certifications|awards)\s*:?\s*$/i,
  );

  const educations: Education[] = [];
  let current: Partial<Education> | null = null;

  const yearPattern = /\b(19|20)\d{2}\b/g;
  const degreeKeywords =
    /\b(bachelor|master|phd|doctor|associate|b\.?s|m\.?s|b\.?a|m\.?b\.?a|m\.?eng|b\.?eng|b\.?e|m\.?e|b\.?tech|m\.?tech|diploma|certificate|hnd|ond)\b/i;

  for (const line of eduLines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const years = trimmed.match(yearPattern);

    // Check if this line contains a degree keyword (may also contain institution)
    const hasDegree = degreeKeywords.test(trimmed);

    if (years && years.length >= 1) {
      if (current?.institution) {
        educations.push(current as Education);
      }
      current = {
        institution: "",
        degree: "",
        field: "",
        startYear: years[0] ?? "",
        endYear: years[1] ?? years[0] ?? "",
      };
      // Check if institution or degree is on the same line as the year
      const withoutYears = trimmed
        .replace(/\b(19|20)\d{2}\b/g, "")
        .replace(/[–|\-]/g, "")
        .trim();
      if (withoutYears.length > 2) {
        if (hasDegree) {
          const degMatch = withoutYears.match(
            /\b(bachelor[\w\s]*|master[\w\s]*|phd[\w\s]*|doctor[\w\s]*|associate[\w\s]*|b\.?s\.?[\w\s]*|m\.?s\.?[\w\s]*|b\.?a\.?[\w\s]*|m\.?b\.?a\.?[\w\s]*|m\.?eng[\w\s]*|b\.?eng[\w\s]*|b\.?tech[\w\s]*|m\.?tech[\w\s]*|diploma[\w\s]*|certificate[\w\s]*)\b/i,
          );
          current.degree = degMatch ? degMatch[0].trim() : withoutYears;
        } else {
          current.institution = withoutYears;
        }
      }
    } else if (hasDegree && trimmed.length < 120) {
      // Degree line (with or without inline institution separated by comma/dash)
      const parts = trimmed.split(/[,–\-]/);
      if (current && !current.degree) {
        current.degree = parts[0].trim();
        if (parts[1] && !current.institution) {
          current.institution = parts[1].trim();
        }
      } else if (!current) {
        current = {
          institution: parts[1]?.trim() ?? "",
          degree: parts[0].trim(),
          field: "",
          startYear: "",
          endYear: "",
        };
      }
    } else if (/^[A-Z]/.test(trimmed) && trimmed.length < 120) {
      if (!current) {
        current = {
          institution: trimmed,
          degree: "",
          field: "",
          startYear: "",
          endYear: "",
        };
      } else if (!current.institution) {
        current.institution = trimmed;
      } else if (!current.degree) {
        current.degree = trimmed;
      } else if (!current.field && trimmed.length < 60) {
        current.field = trimmed;
      }
    }
  }

  if (current?.institution || current?.degree) {
    educations.push(current as Education);
  }

  return educations.slice(0, 5);
}

function extractProjects(lines: string[]): Project[] {
  const projLines = getSectionText(
    lines,
    /^(projects|personal projects|open source|portfolio|portfolio projects)\s*:?\s*$/i,
    /^(experience|work experience|employment|employment history|professional experience|education|skills|certifications|awards)\s*:?\s*$/i,
  );

  const projects: Project[] = [];
  let current: Partial<Project> | null = null;
  const descLines: string[] = [];

  for (const line of projLines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const urlMatch = trimmed.match(/https?:\/\/[^\s]+/);
    if (
      /^[A-Z]/.test(trimmed) &&
      trimmed.length < 80 &&
      !trimmed.startsWith("http")
    ) {
      if (current) {
        current.description = descLines.join(" ").trim();
        if (current.name) projects.push(current as Project);
        descLines.length = 0;
      }
      current = { name: trimmed, description: "", url: "" };
    } else if (urlMatch && current) {
      current.url = urlMatch[0];
    } else if (current) {
      descLines.push(trimmed);
    }
  }

  if (current) {
    current.description = descLines.join(" ").trim();
    if (current.name) projects.push(current as Project);
  }

  return projects.slice(0, 8);
}

export async function parseResumeFromPDF(
  file: File,
  onProgress?: (current: number, total: number) => void,
): Promise<{
  personal: Partial<PersonalInfo>;
  work: WorkExperience[];
  education: Education[];
  skills: string[];
  projects: Project[];
}> {
  const rawText = await withTimeout(
    extractTextFromPDF(file, onProgress),
    15000,
  );
  const lines = rawText
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);

  const name = extractName(lines);
  const nameIndex = lines.findIndex((l) => l.trim() === name);
  const title = extractTitle(lines, nameIndex >= 0 ? nameIndex : 0);
  const email = extractEmail(rawText);
  const phone = extractPhone(rawText);
  const bio = extractBio(lines);

  const personal: Partial<PersonalInfo> = {};
  if (name) personal.name = name;
  if (title) personal.title = title;
  if (email) personal.email = email;
  if (phone) personal.phone = phone;
  if (bio) personal.bio = bio;

  const work = extractWorkExperience(lines);
  const education = extractEducation(lines);
  const skills = extractSkills(lines);
  const projects = extractProjects(lines);

  return { personal, work, education, skills, projects };
}
