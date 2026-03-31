import type {
  Education,
  PersonalInfo,
  Project,
  WorkExperience,
} from "@/backend";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.mjs",
  import.meta.url,
).toString();

async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const textParts: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    textParts.push(pageText);
  }

  return textParts.join("\n");
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
  // Name is typically the first non-empty, non-email, non-phone line
  for (const line of lines.slice(0, 5)) {
    const trimmed = line.trim();
    if (
      trimmed.length > 2 &&
      trimmed.length < 60 &&
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
  // Title is usually on line 2-4, short, often contains keywords
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

const SECTION_HEADINGS =
  /^(experience|work experience|employment|education|skills|technical skills|technologies|projects|summary|profile|about|objective|contact)\s*:?$/i;

function extractBio(lines: string[]): string {
  const bioLines = getSectionText(
    lines,
    /^(summary|profile|about|about me|objective|professional summary)\s*:?$/i,
    SECTION_HEADINGS,
  );
  return bioLines.slice(0, 5).join(" ").trim();
}

function extractSkills(lines: string[]): string[] {
  const skillLines = getSectionText(
    lines,
    /^(skills|technical skills|technologies|core competencies|tech stack)\s*:?$/i,
    SECTION_HEADINGS,
  );

  const skills: string[] = [];
  for (const line of skillLines) {
    // Split by common delimiters
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
    /^(experience|work experience|employment history|professional experience)\s*:?$/i,
    /^(education|skills|technical skills|projects|certifications|awards)\s*:?$/i,
  );

  const experiences: WorkExperience[] = [];
  let current: Partial<WorkExperience> | null = null;
  const descLines: string[] = [];

  const datePattern =
    /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\d{4})[\w\s,]*(?:–|-|to)[\s\w,]*(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\d{4}|present|current)/i;

  for (const line of expLines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Lines with date ranges often indicate a new experience entry
    if (datePattern.test(trimmed)) {
      if (current) {
        current.description = descLines.join(" ").trim();
        if (current.company || current.role) {
          experiences.push(current as WorkExperience);
        }
        descLines.length = 0;
      }
      // Extract dates
      const dateMatch = trimmed.match(datePattern);
      const dates = dateMatch ? dateMatch[0] : "";
      const parts = dates.split(/–|-|to/i);
      current = {
        company: "",
        role: "",
        startDate: parts[0]?.trim() ?? "",
        endDate: parts[1]?.trim() ?? "",
        description: "",
      };
    } else if (
      current &&
      !current.company &&
      trimmed.length < 80 &&
      /^[A-Z]/.test(trimmed)
    ) {
      current.company = trimmed;
    } else if (
      current &&
      !current.role &&
      current.company &&
      trimmed.length < 80
    ) {
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

  if (current) {
    current.description = descLines.join(" ").trim();
    if (current.company || current.role) {
      experiences.push(current as WorkExperience);
    }
  }

  return experiences.slice(0, 10);
}

function extractEducation(lines: string[]): Education[] {
  const eduLines = getSectionText(
    lines,
    /^(education|academic background|qualifications)\s*:?$/i,
    /^(experience|work experience|skills|technical skills|projects|certifications)\s*:?$/i,
  );

  const educations: Education[] = [];
  let current: Partial<Education> | null = null;

  const yearPattern = /\b(19|20)\d{2}\b/g;

  for (const line of eduLines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const years = trimmed.match(yearPattern);
    if (years && years.length >= 1) {
      if (current) {
        educations.push(current as Education);
      }
      current = {
        institution: "",
        degree: "",
        field: "",
        startYear: years[0] ?? "",
        endYear: years[1] ?? years[0] ?? "",
      };
    } else if (current && !current.institution && /^[A-Z]/.test(trimmed)) {
      current.institution = trimmed;
    } else if (current && !current.degree && /^[A-Z]/.test(trimmed)) {
      const degreeMatch = trimmed.match(
        /\b(bachelor|master|phd|doctor|associate|b\.?s|m\.?s|b\.?a|m\.?b\.?a|m\.?eng|b\.?eng)[\w\s]*/i,
      );
      if (degreeMatch) {
        current.degree = degreeMatch[0].trim();
      } else {
        current.degree = trimmed;
      }
    } else if (current && !current.field && trimmed.length < 60) {
      current.field = trimmed;
    } else if (!current && /^[A-Z]/.test(trimmed)) {
      current = {
        institution: trimmed,
        degree: "",
        field: "",
        startYear: "",
        endYear: "",
      };
    }
  }

  if (current) educations.push(current as Education);

  return educations.slice(0, 5);
}

function extractProjects(lines: string[]): Project[] {
  const projLines = getSectionText(
    lines,
    /^(projects|personal projects|open source|portfolio projects)\s*:?$/i,
    /^(experience|work experience|education|skills|certifications|awards)\s*:?$/i,
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

export async function parseResumeFromPDF(file: File): Promise<{
  personal: Partial<PersonalInfo>;
  work: WorkExperience[];
  education: Education[];
  skills: string[];
  projects: Project[];
}> {
  const rawText = await extractTextFromPDF(file);
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
