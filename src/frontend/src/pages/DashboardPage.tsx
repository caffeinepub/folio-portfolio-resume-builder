import type {
  Education,
  PersonalInfo,
  PortfolioDTO,
  Project,
  WorkExperience,
} from "@/backend";
import { Plan } from "@/backend";
import ProfileSetupModal from "@/components/ProfileSetupModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useTheme } from "@/context/ThemeContext";
import { useInternetIdentity } from "@/hooks/useInternetIdentity";
import {
  useCallerUserProfile,
  useMyPortfolio,
  useSavePortfolio,
  useSetPublished,
  useUpgradeToPro,
} from "@/hooks/useQueries";
import TemplateClassic from "@/templates/TemplateClassic";
import TemplateCreative from "@/templates/TemplateCreative";
import TemplateMinimal from "@/templates/TemplateMinimal";
import TemplateModern from "@/templates/TemplateModern";
import { parseResumeFromPDF } from "@/utils/resumeParser";
import { useRouter } from "@tanstack/react-router";
import {
  Briefcase,
  Camera,
  CheckCircle,
  Code2,
  Copy,
  Download,
  ExternalLink,
  FileText,
  FolderGit2,
  Globe,
  GraduationCap,
  LayoutDashboard,
  Loader2,
  LogOut,
  Moon,
  Plus,
  Settings,
  Sun,
  Trash2,
  TrendingUp,
  Upload,
  User,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

const emptyPersonal: PersonalInfo = {
  name: "",
  title: "",
  bio: "",
  email: "",
  phone: "",
  website: "",
};

const emptyWork: WorkExperience = {
  company: "",
  role: "",
  description: "",
  startDate: "",
  endDate: "",
};

const emptyEdu: Education = {
  institution: "",
  degree: "",
  field: "",
  startYear: "",
  endYear: "",
};

const emptyProject: Project = {
  name: "",
  description: "",
  url: "",
};

const TEMPLATE_MAP: Record<
  string,
  React.ComponentType<{ portfolio: PortfolioDTO }>
> = {
  modern: TemplateModern,
  classic: TemplateClassic,
  minimal: TemplateMinimal,
  creative: TemplateCreative,
};

type EditorTab =
  | "personal"
  | "work"
  | "education"
  | "skills"
  | "projects"
  | "import";
type SidebarSection = "dashboard" | "resume" | "portfolio" | "settings";

export default function DashboardPage() {
  const router = useRouter();
  const { identity, clear, isInitializing } = useInternetIdentity();
  const { data: portfolio, isLoading: portfolioLoading } = useMyPortfolio();
  const { data: userProfile, isLoading: profileLoading } =
    useCallerUserProfile();
  const { mutateAsync: savePortfolio, isPending: isSaving } =
    useSavePortfolio();
  const { mutateAsync: setPublished, isPending: isPublishing } =
    useSetPublished();
  const { mutateAsync: upgradeToPro, isPending: isUpgrading } =
    useUpgradeToPro();

  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [hasDismissedSetup, setHasDismissedSetup] = useState(false);
  const [personal, setPersonal] = useState<PersonalInfo>(emptyPersonal);
  const [work, setWork] = useState<WorkExperience[]>([]);
  const [education, setEducation] = useState<Education[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractProgress, setExtractProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<EditorTab>("personal");
  const [activeSection, setActiveSection] = useState<SidebarSection>("resume");
  const { accentColor, setAccentColor, theme, toggleTheme } = useTheme();
  const [selectedTemplate, setSelectedTemplate] = useState<string>(() => {
    return localStorage.getItem("portfolio-template") || "modern";
  });
  const [avatarUrl, setAvatarUrl] = useState<string>(
    () => localStorage.getItem("folio-avatar") ?? "",
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sidebarAvatarInputRef = useRef<HTMLInputElement>(null);

  const previewPortfolio = useMemo<PortfolioDTO>(
    () => ({
      resume: {
        personal,
        work,
        education,
        skills,
        projects,
        lastUpdated: BigInt(0),
      },
      credits: BigInt(0),
      username,
      isPublished: portfolio?.isPublished ?? false,
      displayName: displayName || "Your Name",
      owner: portfolio?.owner ?? ({} as any),
      plan: portfolio?.plan ?? Plan.free,
      lastUpdated: BigInt(0),
    }),
    [
      personal,
      work,
      education,
      skills,
      projects,
      username,
      displayName,
      portfolio,
    ],
  );

  // Redirect if not authenticated
  useEffect(() => {
    if (!isInitializing && !identity) {
      router.navigate({ to: "/auth" });
    }
  }, [identity, isInitializing, router]);

  useEffect(() => {
    if (portfolio) {
      setPersonal(portfolio.resume.personal);
      setWork(portfolio.resume.work);
      setEducation(portfolio.resume.education);
      setSkills(portfolio.resume.skills);
      setProjects(portfolio.resume.projects);
      setUsername(portfolio.username);
      setDisplayName(portfolio.displayName);
    }
  }, [portfolio]);

  useEffect(() => {
    if (
      !profileLoading &&
      !portfolioLoading &&
      !userProfile &&
      identity &&
      !hasDismissedSetup
    ) {
      setShowProfileSetup(true);
    }
  }, [
    profileLoading,
    portfolioLoading,
    userProfile,
    identity,
    hasDismissedSetup,
  ]);

  const handlePDFFile = async (file: File) => {
    if (!file || file.type !== "application/pdf") {
      toast.error("Please upload a valid PDF file.");
      return;
    }
    setIsExtracting(true);
    setExtractProgress(null);
    try {
      const parsed = await parseResumeFromPDF(file, (current, total) => {
        setExtractProgress({ current, total });
      });
      // Replace fields instead of appending to avoid duplicates on re-upload
      setPersonal((prev) => ({
        ...prev,
        ...(parsed.personal.name ? { name: parsed.personal.name } : {}),
        ...(parsed.personal.title ? { title: parsed.personal.title } : {}),
        ...(parsed.personal.email ? { email: parsed.personal.email } : {}),
        ...(parsed.personal.phone ? { phone: parsed.personal.phone } : {}),
        ...(parsed.personal.bio ? { bio: parsed.personal.bio } : {}),
      }));
      if (parsed.work.length > 0) setWork(parsed.work);
      if (parsed.education.length > 0) setEducation(parsed.education);
      if (parsed.projects.length > 0) setProjects(parsed.projects);
      if (parsed.skills.length > 0) setSkills(parsed.skills);
      // Switch to personal tab so user can see filled fields immediately
      setActiveTab("personal");
      toast.success(
        `Resume imported! Found ${parsed.work.length} jobs, ${parsed.education.length} education entries, ${parsed.skills.length} skills.`,
      );
    } catch {
      toast.error("Could not parse resume. Please fill in manually.");
    } finally {
      setIsExtracting(false);
      setExtractProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handlePDFFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handlePDFFile(file);
  };

  const handleSave = async () => {
    try {
      await savePortfolio({
        username,
        displayName,
        personal,
        work,
        education,
        skills,
        projects,
      });
      toast.success("Portfolio saved successfully!");
    } catch {
      toast.error("Failed to save portfolio.");
    }
  };

  const handlePublishToggle = async (value: boolean) => {
    try {
      await setPublished(value);
      toast.success(value ? "Portfolio published!" : "Portfolio unpublished.");
    } catch {
      toast.error("Failed to update publish status.");
    }
  };

  const handleUpgrade = async () => {
    try {
      await upgradeToPro();
      toast.success("Upgraded to Pro! 🎉");
    } catch {
      toast.error("Upgrade failed. Please try again.");
    }
  };

  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills((prev) => [...prev, trimmed]);
      setSkillInput("");
    }
  };

  const principalId = identity?.getPrincipal().toString();
  const isPro = portfolio?.plan === Plan.pro;

  // Resume completeness calculation
  const completenessScore = useMemo(() => {
    const checks = [
      !!personal.name,
      !!personal.title,
      !!personal.email,
      !!personal.bio,
      work.length > 0,
      education.length > 0,
      skills.length > 0,
      projects.length > 0,
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [personal, work, education, skills, projects]);

  const editorTabs: { id: EditorTab; label: string; icon: React.ReactNode }[] =
    [
      {
        id: "personal",
        label: "Personal",
        icon: <User className="w-3.5 h-3.5" />,
      },
      {
        id: "work",
        label: "Experience",
        icon: <Briefcase className="w-3.5 h-3.5" />,
      },
      {
        id: "education",
        label: "Education",
        icon: <GraduationCap className="w-3.5 h-3.5" />,
      },
      {
        id: "skills",
        label: "Skills",
        icon: <Code2 className="w-3.5 h-3.5" />,
      },
      {
        id: "projects",
        label: "Projects",
        icon: <FolderGit2 className="w-3.5 h-3.5" />,
      },
      {
        id: "import",
        label: "Import PDF",
        icon: <Upload className="w-3.5 h-3.5" />,
      },
    ];

  const sidebarNav: {
    id: SidebarSection;
    label: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    { id: "resume", label: "Resume", icon: <FileText className="w-4 h-4" /> },
    {
      id: "portfolio",
      label: "Portfolio",
      icon: <Globe className="w-4 h-4" />,
    },
    {
      id: "settings",
      label: "Settings",
      icon: <Settings className="w-4 h-4" />,
    },
  ];

  const handleDownloadPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const hasWork = work.length > 0;
    const hasEducation = education.length > 0;
    const hasSkills = skills.length > 0;
    const hasProjects = projects.length > 0;

    const workHTML = hasWork
      ? `<section>
          <h2>Work Experience</h2>
          ${work
            .map(
              (w) =>
                `<div class="entry">
            <div class="entry-header">
              <div>
                <span class="entry-title">${w.role || "Role"}</span>
                <span class="entry-subtitle"> — ${w.company || "Company"}</span>
              </div>
              <span class="entry-dates">${w.startDate || ""}${w.endDate ? ` – ${w.endDate}` : ""}</span>
            </div>
            ${w.description ? `<p class="entry-desc">${w.description}</p>` : ""}
          </div>`,
            )
            .join("")}
        </section>`
      : "";

    const educationHTML = hasEducation
      ? `<section>
          <h2>Education</h2>
          ${education
            .map(
              (e) =>
                `<div class="entry">
            <div class="entry-header">
              <div>
                <span class="entry-title">${e.degree || ""}${e.field ? ` in ${e.field}` : ""}</span>
                <span class="entry-subtitle"> — ${e.institution || ""}</span>
              </div>
              <span class="entry-dates">${e.startYear || ""}${e.endYear ? ` – ${e.endYear}` : ""}</span>
            </div>
          </div>`,
            )
            .join("")}
        </section>`
      : "";

    const skillsHTML = hasSkills
      ? `<section>
          <h2>Skills</h2>
          <p class="skills-list">${skills.join(" · ")}</p>
        </section>`
      : "";

    const projectsHTML = hasProjects
      ? `<section>
          <h2>Projects</h2>
          ${projects
            .map(
              (p) =>
                `<div class="entry">
            <div class="entry-header">
              <span class="entry-title">${p.name || "Project"}</span>
            </div>
            ${p.description ? `<p class="entry-desc">${p.description}</p>` : ""}
          </div>`,
            )
            .join("")}
        </section>`
      : "";

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${personal.name || "Resume"} – Resume</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      font-size: 11pt;
      color: #1a1a1a;
      background: #fff;
      padding: 36px 48px;
      max-width: 800px;
      margin: 0 auto;
      line-height: 1.55;
    }
    header { margin-bottom: 24px; border-bottom: 2px solid #1a1a1a; padding-bottom: 16px; overflow: hidden; }
    header h1 { font-size: 26pt; font-weight: 700; letter-spacing: -0.5px; color: #0d0d0d; }
    header .title { font-size: 13pt; color: #444; margin-top: 4px; font-weight: 500; }
    header .contact { display: flex; flex-wrap: wrap; gap: 6px 16px; margin-top: 10px; font-size: 9.5pt; color: #555; }
    .bio { margin-bottom: 20px; color: #333; font-size: 10.5pt; line-height: 1.6; }
    section { margin-bottom: 22px; }
    section h2 {
      font-size: 10.5pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.2px;
      color: #0d0d0d;
      border-bottom: 1px solid #d0d0d0;
      padding-bottom: 4px;
      margin-bottom: 12px;
    }
    .entry { margin-bottom: 14px; }
    .entry-header { display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; gap: 4px; }
    .entry-title { font-weight: 600; font-size: 10.5pt; color: #111; }
    .entry-subtitle { font-size: 10pt; color: #444; }
    .entry-dates { font-size: 9pt; color: #777; white-space: nowrap; }
    .entry-desc { margin-top: 5px; font-size: 10pt; color: #444; line-height: 1.55; }
    .skills-list { font-size: 10.5pt; color: #333; line-height: 1.8; }
    @media print { body { padding: 20px 32px; } }
  </style>
</head>
<body>
  <header>
    ${avatarUrl ? `<img src="${avatarUrl}" style="float:right; width:72px; height:72px; border-radius:50%; object-fit:cover; margin-left:16px; margin-top:4px;" />` : ""}
    <h1>${personal.name || "Your Name"}</h1>
    ${personal.title ? `<div class="title">${personal.title}</div>` : ""}
    <div class="contact">
      ${personal.email ? `<span>${personal.email}</span>` : ""}
      ${personal.phone ? `<span>${personal.phone}</span>` : ""}
      ${personal.website ? `<span>${personal.website}</span>` : ""}
    </div>
  </header>
  ${personal.bio ? `<div class="bio">${personal.bio}</div>` : ""}
  ${workHTML}
  ${educationHTML}
  ${skillsHTML}
  ${projectsHTML}
</body>
</html>`;

    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }, 600);
  };

  if (isInitializing || portfolioLoading || profileLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-background"
        data-ocid="dashboard.loading_state"
      >
        <div className="text-center">
          <div
            className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin mx-auto mb-4"
            style={{ borderColor: "#4D7CFF", borderTopColor: "transparent" }}
          />
          <p className="text-muted-foreground">Loading your portfolio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <ProfileSetupModal
        open={showProfileSetup}
        onComplete={(
          resumeData,
          avatarDataUrl,
          modalUsername,
          modalDisplayName,
        ) => {
          setShowProfileSetup(false);
          setHasDismissedSetup(true);
          if (avatarDataUrl) {
            setAvatarUrl(avatarDataUrl);
          }
          // Apply username and displayName from the modal immediately
          if (modalUsername) setUsername(modalUsername);
          if (modalDisplayName) setDisplayName(modalDisplayName);
          if (resumeData) {
            // Ensure personal.name matches the displayName used in the modal
            const personalData = {
              ...resumeData.personal,
              name: resumeData.personal.name || modalDisplayName || "",
            };
            setPersonal((prev) => ({ ...prev, ...personalData }));
            if (resumeData.work.length > 0) setWork(resumeData.work);
            if (resumeData.education.length > 0)
              setEducation(resumeData.education);
            if (resumeData.skills.length > 0) setSkills(resumeData.skills);
            if (resumeData.projects.length > 0)
              setProjects(resumeData.projects);
          } else if (modalDisplayName) {
            // No resume — at least set the name from the display name
            setPersonal((prev) => ({ ...prev, name: modalDisplayName }));
          }
        }}
        onClose={() => {
          setShowProfileSetup(false);
          setHasDismissedSetup(true);
        }}
      />

      {/* Fixed Left Sidebar */}
      <aside className="w-64 flex flex-col fixed left-0 top-0 h-full z-20 bg-card border-r border-border">
        {/* Top: Logo + Brand */}
        <div className="px-5 py-5 border-b border-border">
          <div className="flex items-center gap-2.5 mb-5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #4D7CFF, #35C6FF)",
              }}
            >
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-lg text-foreground">
              Folio
            </span>
          </div>

          {/* Avatar + User */}
          <div className="flex items-center gap-3">
            <div className="relative group flex-shrink-0">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="avatar"
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                  style={{
                    background: "linear-gradient(135deg, #4D7CFF, #35C6FF)",
                  }}
                >
                  {(displayName || personal.name || "U")
                    .charAt(0)
                    .toUpperCase()}
                </div>
              )}
              <button
                type="button"
                onClick={() => sidebarAvatarInputRef.current?.click()}
                className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                style={{ background: "rgba(0,0,0,0.55)" }}
                title="Change photo"
              >
                <Camera className="w-3.5 h-3.5 text-white" />
              </button>
              <input
                ref={sidebarAvatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    const result = ev.target?.result;
                    if (typeof result === "string") {
                      setAvatarUrl(result);
                      localStorage.setItem("folio-avatar", result);
                    }
                  };
                  reader.readAsDataURL(file);
                }}
              />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate text-foreground">
                {displayName || personal.name || "Your Name"}
              </p>
              <span
                className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium mt-0.5"
                style={
                  isPro
                    ? {
                        background: "rgba(77,124,255,0.2)",
                        color: "#4D7CFF",
                        border: "1px solid rgba(77,124,255,0.3)",
                      }
                    : {
                        background: "rgba(143,160,198,0.1)",
                        color: "#8FA0C6",
                        border: "1px solid rgba(143,160,198,0.2)",
                      }
                }
              >
                {isPro && <Zap className="w-2.5 h-2.5" />}
                {isPro ? "Pro" : "Free"}
              </span>
            </div>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {sidebarNav.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveSection(item.id);
                  if (item.id === "resume") setActiveTab("personal");
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
                style={
                  isActive
                    ? {
                        background:
                          "linear-gradient(135deg, rgba(77,124,255,0.2), rgba(53,198,255,0.1))",
                        color: "#4D7CFF",
                        border: "1px solid rgba(77,124,255,0.25)",
                      }
                    : { color: "#8FA0C6", border: "1px solid transparent" }
                }
                data-ocid={`sidebar.${item.id}.link`}
              >
                {item.icon}
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Upgrade to Pro (if free) */}
        {!isPro && (
          <div className="px-3 pb-3">
            <button
              type="button"
              onClick={handleUpgrade}
              disabled={isUpgrading}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{
                background:
                  "linear-gradient(135deg, rgba(77,124,255,0.15), rgba(53,198,255,0.1))",
                color: "#4D7CFF",
                border: "1px solid rgba(77,124,255,0.3)",
              }}
              data-ocid="sidebar.upgrade.button"
            >
              {isUpgrading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Zap className="w-4 h-4" />
              )}
              Upgrade to Pro
            </button>
          </div>
        )}

        {/* Bottom: Logout */}
        <div className="px-3 pb-4 pt-3 border-t border-border">
          <button
            type="button"
            onClick={() => {
              clear();
              router.navigate({ to: "/" });
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 hover:opacity-80 text-muted-foreground"
            data-ocid="sidebar.logout.button"
          >
            <LogOut className="w-4 h-4" />
            Log Out
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 ml-64 flex flex-col h-screen overflow-hidden">
        {/* Top Bar */}
        <header className="flex items-center justify-between px-8 py-4 flex-shrink-0 border-b border-border bg-card">
          <div>
            <h1 className="font-display text-xl font-bold text-foreground">
              {activeSection === "dashboard"
                ? "Dashboard"
                : activeSection === "resume"
                  ? "Resume Editor"
                  : activeSection === "portfolio"
                    ? "Portfolio"
                    : "Settings"}
            </h1>
            <p className="text-xs mt-0.5 text-muted-foreground">
              {activeSection === "resume"
                ? "Edit your resume — changes reflect live in the preview"
                : activeSection === "dashboard"
                  ? `Welcome back, ${displayName || personal.name || "there"}!`
                  : activeSection === "settings"
                    ? "Manage your account and preferences"
                    : "Manage your professional presence"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Theme toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={
                theme === "dark"
                  ? "Switch to light mode"
                  : "Switch to dark mode"
              }
              className="flex items-center justify-center w-8 h-8 rounded-lg transition-all hover:opacity-80 bg-muted border border-border text-muted-foreground"
              data-ocid="dashboard.toggle"
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>
            {activeSection === "resume" && (
              <button
                type="button"
                onClick={handleDownloadPDF}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all hover:opacity-80 bg-muted text-foreground border border-border"
                data-ocid="dashboard.secondary_button"
              >
                <Download className="w-3.5 h-3.5" />
                Download PDF
              </button>
            )}
            {/* Published toggle */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                Published
              </span>
              <Switch
                checked={portfolio?.isPublished ?? false}
                onCheckedChange={handlePublishToggle}
                disabled={isPublishing}
                data-ocid="dashboard.switch"
              />
            </div>
            {portfolio?.isPublished && principalId && (
              <button
                type="button"
                onClick={() =>
                  router.navigate({ to: `/portfolio/${principalId}` })
                }
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
                style={{
                  background: "rgba(53,198,255,0.1)",
                  color: "#35C6FF",
                  border: "1px solid rgba(53,198,255,0.25)",
                }}
                data-ocid="dashboard.secondary_button"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                View Live
              </button>
            )}
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="font-semibold px-5 rounded-lg border-0"
              style={{
                background: "linear-gradient(135deg, #4D7CFF, #35C6FF)",
                color: "white",
              }}
              data-ocid="dashboard.save_button"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </header>

        {/* ── Dashboard Overview ── */}
        {activeSection === "dashboard" && (
          <DashboardOverviewPanel
            displayName={displayName || personal.name}
            completenessScore={completenessScore}
            isPublished={portfolio?.isPublished ?? false}
            credits={Number(portfolio?.credits ?? 0)}
            isPro={isPro}
            onEditResume={() => {
              setActiveSection("resume");
              setActiveTab("personal");
            }}
            onViewPortfolio={() => {
              if (portfolio?.isPublished && principalId) {
                router.navigate({ to: `/portfolio/${principalId}` });
              } else {
                toast.info("Publish your portfolio first to view it live.");
              }
            }}
          />
        )}

        {/* ── Settings Panel ── */}
        {activeSection === "settings" && (
          <SettingsPanel
            displayName={displayName || personal.name}
            username={username}
            principalId={principalId ?? ""}
            isPro={isPro}
            theme={theme}
            toggleTheme={toggleTheme}
            accentColor={accentColor}
            setAccentColor={setAccentColor}
            onLogout={() => {
              clear();
              router.navigate({ to: "/" });
            }}
          />
        )}

        {/* ── Resume Editor ── */}
        {activeSection === "resume" && (
          <div className="flex-1 overflow-hidden flex gap-0">
            {/* LEFT: Editor area */}
            <div
              className="flex flex-col overflow-hidden border-r border-border"
              style={{ width: "55%" }}
            >
              {/* Tab bar */}
              <div className="flex items-center gap-1 px-4 py-3 flex-shrink-0 overflow-x-auto border-b border-border bg-card">
                {editorTabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        setActiveTab(tab.id);
                        setActiveSection("resume");
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-150"
                      style={
                        isActive
                          ? {
                              background:
                                "linear-gradient(135deg, #4D7CFF, #35C6FF)",
                              color: "white",
                            }
                          : { color: "#8FA0C6", background: "transparent" }
                      }
                      data-ocid="dashboard.tab"
                    >
                      {tab.icon}
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Editor content */}
              <div className="flex-1 overflow-y-auto p-5 bg-background">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* Personal Info */}
                    {activeTab === "personal" && (
                      <div className="space-y-4">
                        <SectionCard title="Personal Information">
                          <div className="grid grid-cols-2 gap-3">
                            <FieldGroup label="Display Name">
                              <DarkInput
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                placeholder="Jane Doe"
                                ocid="personal.input"
                              />
                            </FieldGroup>
                            <FieldGroup label="Username">
                              <DarkInput
                                value={username}
                                onChange={(e) =>
                                  setUsername(e.target.value.toLowerCase())
                                }
                                placeholder="janedoe"
                                ocid="personal.input"
                              />
                            </FieldGroup>
                            <FieldGroup label="Full Name">
                              <DarkInput
                                value={personal.name}
                                onChange={(e) =>
                                  setPersonal((p) => ({
                                    ...p,
                                    name: e.target.value,
                                  }))
                                }
                                placeholder="Jane Doe"
                                ocid="personal.input"
                              />
                            </FieldGroup>
                            <FieldGroup label="Professional Title">
                              <DarkInput
                                value={personal.title}
                                onChange={(e) =>
                                  setPersonal((p) => ({
                                    ...p,
                                    title: e.target.value,
                                  }))
                                }
                                placeholder="Senior Engineer"
                                ocid="personal.input"
                              />
                            </FieldGroup>
                            <FieldGroup label="Email">
                              <DarkInput
                                type="email"
                                value={personal.email}
                                onChange={(e) =>
                                  setPersonal((p) => ({
                                    ...p,
                                    email: e.target.value,
                                  }))
                                }
                                placeholder="jane@example.com"
                                ocid="personal.input"
                              />
                            </FieldGroup>
                            <FieldGroup label="Phone">
                              <DarkInput
                                value={personal.phone}
                                onChange={(e) =>
                                  setPersonal((p) => ({
                                    ...p,
                                    phone: e.target.value,
                                  }))
                                }
                                placeholder="+1 (555) 000-0000"
                                ocid="personal.input"
                              />
                            </FieldGroup>
                            <FieldGroup label="Website" className="col-span-2">
                              <DarkInput
                                value={personal.website}
                                onChange={(e) =>
                                  setPersonal((p) => ({
                                    ...p,
                                    website: e.target.value,
                                  }))
                                }
                                placeholder="https://yourwebsite.com"
                                ocid="personal.input"
                              />
                            </FieldGroup>
                            <FieldGroup label="Bio" className="col-span-2">
                              <DarkTextarea
                                value={personal.bio}
                                onChange={(e) =>
                                  setPersonal((p) => ({
                                    ...p,
                                    bio: e.target.value,
                                  }))
                                }
                                placeholder="Write a short professional bio..."
                                ocid="personal.textarea"
                              />
                            </FieldGroup>
                          </div>
                        </SectionCard>
                      </div>
                    )}

                    {/* Work Experience */}
                    {activeTab === "work" && (
                      <div className="space-y-4">
                        {work.length === 0 && (
                          <EmptyState
                            icon={<Briefcase className="w-8 h-8" />}
                            message="No work experience added yet."
                            ocid="work.empty_state"
                          />
                        )}
                        {work.map((job, i) => (
                          <SectionCard
                            key={`work-${job.company}-${i}`}
                            title={job.company || `Experience ${i + 1}`}
                            onDelete={() =>
                              setWork((w) => w.filter((_, idx) => idx !== i))
                            }
                            deleteOcid={`work.delete_button.${i + 1}`}
                            ocid={`work.item.${i + 1}`}
                          >
                            <div className="grid grid-cols-2 gap-3">
                              <FieldGroup label="Company">
                                <DarkInput
                                  value={job.company}
                                  onChange={(e) =>
                                    setWork((w) =>
                                      w.map((x, idx) =>
                                        idx === i
                                          ? { ...x, company: e.target.value }
                                          : x,
                                      ),
                                    )
                                  }
                                  ocid="work.input"
                                />
                              </FieldGroup>
                              <FieldGroup label="Role">
                                <DarkInput
                                  value={job.role}
                                  onChange={(e) =>
                                    setWork((w) =>
                                      w.map((x, idx) =>
                                        idx === i
                                          ? { ...x, role: e.target.value }
                                          : x,
                                      ),
                                    )
                                  }
                                  ocid="work.input"
                                />
                              </FieldGroup>
                              <FieldGroup label="Start Date">
                                <DarkInput
                                  value={job.startDate}
                                  onChange={(e) =>
                                    setWork((w) =>
                                      w.map((x, idx) =>
                                        idx === i
                                          ? {
                                              ...x,
                                              startDate: e.target.value,
                                            }
                                          : x,
                                      ),
                                    )
                                  }
                                  placeholder="Jan 2022"
                                  ocid="work.input"
                                />
                              </FieldGroup>
                              <FieldGroup label="End Date">
                                <DarkInput
                                  value={job.endDate}
                                  onChange={(e) =>
                                    setWork((w) =>
                                      w.map((x, idx) =>
                                        idx === i
                                          ? { ...x, endDate: e.target.value }
                                          : x,
                                      ),
                                    )
                                  }
                                  placeholder="Present"
                                  ocid="work.input"
                                />
                              </FieldGroup>
                              <FieldGroup
                                label="Description"
                                className="col-span-2"
                              >
                                <DarkTextarea
                                  value={job.description}
                                  onChange={(e) =>
                                    setWork((w) =>
                                      w.map((x, idx) =>
                                        idx === i
                                          ? {
                                              ...x,
                                              description: e.target.value,
                                            }
                                          : x,
                                      ),
                                    )
                                  }
                                  ocid="work.textarea"
                                />
                              </FieldGroup>
                            </div>
                          </SectionCard>
                        ))}
                        <AddButton
                          onClick={() =>
                            setWork((w) => [...w, { ...emptyWork }])
                          }
                          label="Add Work Experience"
                          ocid="work.secondary_button"
                        />
                      </div>
                    )}

                    {/* Education */}
                    {activeTab === "education" && (
                      <div className="space-y-4">
                        {education.length === 0 && (
                          <EmptyState
                            icon={<GraduationCap className="w-8 h-8" />}
                            message="No education added yet."
                            ocid="education.empty_state"
                          />
                        )}
                        {education.map((edu, i) => (
                          <SectionCard
                            key={`edu-${edu.institution}-${i}`}
                            title={edu.institution || `Education ${i + 1}`}
                            onDelete={() =>
                              setEducation((ed) =>
                                ed.filter((_, idx) => idx !== i),
                              )
                            }
                            deleteOcid={`education.delete_button.${i + 1}`}
                            ocid={`education.item.${i + 1}`}
                          >
                            <div className="grid grid-cols-2 gap-3">
                              <FieldGroup label="Institution">
                                <DarkInput
                                  value={edu.institution}
                                  onChange={(e) =>
                                    setEducation((ed) =>
                                      ed.map((x, idx) =>
                                        idx === i
                                          ? {
                                              ...x,
                                              institution: e.target.value,
                                            }
                                          : x,
                                      ),
                                    )
                                  }
                                  ocid="education.input"
                                />
                              </FieldGroup>
                              <FieldGroup label="Degree">
                                <DarkInput
                                  value={edu.degree}
                                  onChange={(e) =>
                                    setEducation((ed) =>
                                      ed.map((x, idx) =>
                                        idx === i
                                          ? { ...x, degree: e.target.value }
                                          : x,
                                      ),
                                    )
                                  }
                                  ocid="education.input"
                                />
                              </FieldGroup>
                              <FieldGroup label="Field of Study">
                                <DarkInput
                                  value={edu.field}
                                  onChange={(e) =>
                                    setEducation((ed) =>
                                      ed.map((x, idx) =>
                                        idx === i
                                          ? { ...x, field: e.target.value }
                                          : x,
                                      ),
                                    )
                                  }
                                  ocid="education.input"
                                />
                              </FieldGroup>
                              <div className="grid grid-cols-2 gap-2">
                                <FieldGroup label="Start Year">
                                  <DarkInput
                                    value={edu.startYear}
                                    onChange={(e) =>
                                      setEducation((ed) =>
                                        ed.map((x, idx) =>
                                          idx === i
                                            ? {
                                                ...x,
                                                startYear: e.target.value,
                                              }
                                            : x,
                                        ),
                                      )
                                    }
                                    placeholder="2018"
                                    ocid="education.input"
                                  />
                                </FieldGroup>
                                <FieldGroup label="End Year">
                                  <DarkInput
                                    value={edu.endYear}
                                    onChange={(e) =>
                                      setEducation((ed) =>
                                        ed.map((x, idx) =>
                                          idx === i
                                            ? {
                                                ...x,
                                                endYear: e.target.value,
                                              }
                                            : x,
                                        ),
                                      )
                                    }
                                    placeholder="2022"
                                    ocid="education.input"
                                  />
                                </FieldGroup>
                              </div>
                            </div>
                          </SectionCard>
                        ))}
                        <AddButton
                          onClick={() =>
                            setEducation((ed) => [...ed, { ...emptyEdu }])
                          }
                          label="Add Education"
                          ocid="education.secondary_button"
                        />
                      </div>
                    )}

                    {/* Skills */}
                    {activeTab === "skills" && (
                      <SectionCard title="Skills">
                        <div className="flex gap-2 mb-4">
                          <Input
                            value={skillInput}
                            onChange={(e) => setSkillInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && addSkill()}
                            placeholder="e.g. React, TypeScript, Node.js"
                            className="flex-1 text-sm h-9 bg-muted border-border text-foreground"
                            data-ocid="skills.input"
                          />
                          <button
                            type="button"
                            onClick={addSkill}
                            className="px-3 py-2 rounded-lg text-sm font-medium"
                            style={{
                              background:
                                "linear-gradient(135deg, #4D7CFF, #35C6FF)",
                              color: "white",
                            }}
                            data-ocid="skills.secondary_button"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        {skills.length === 0 ? (
                          <div
                            className="text-center py-6 text-muted-foreground"
                            data-ocid="skills.empty_state"
                          >
                            <Code2 className="w-7 h-7 mx-auto mb-2" />
                            <p className="text-sm">
                              No skills yet. Add some above.
                            </p>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {skills.map((skill, i) => (
                              <button
                                key={skill}
                                type="button"
                                onClick={() => removeSkill(skill)}
                                className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-full font-medium transition-all hover:opacity-70"
                                style={{
                                  background: "rgba(77,124,255,0.15)",
                                  color: "#4D7CFF",
                                  border: "1px solid rgba(77,124,255,0.3)",
                                }}
                                data-ocid={`skills.item.${i + 1}`}
                              >
                                {skill} <span className="opacity-60">×</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </SectionCard>
                    )}

                    {/* Projects */}
                    {activeTab === "projects" && (
                      <div className="space-y-4">
                        {projects.length === 0 && (
                          <EmptyState
                            icon={<FolderGit2 className="w-8 h-8" />}
                            message="No projects added yet."
                            ocid="projects.empty_state"
                          />
                        )}
                        {projects.map((proj, i) => (
                          <SectionCard
                            key={`proj-${proj.name}-${i}`}
                            title={proj.name || `Project ${i + 1}`}
                            onDelete={() =>
                              setProjects((p) =>
                                p.filter((_, idx) => idx !== i),
                              )
                            }
                            deleteOcid={`projects.delete_button.${i + 1}`}
                            ocid={`projects.item.${i + 1}`}
                          >
                            <div className="space-y-3">
                              <FieldGroup label="Project Name">
                                <DarkInput
                                  value={proj.name}
                                  onChange={(e) =>
                                    setProjects((p) =>
                                      p.map((x, idx) =>
                                        idx === i
                                          ? { ...x, name: e.target.value }
                                          : x,
                                      ),
                                    )
                                  }
                                  ocid="projects.input"
                                />
                              </FieldGroup>
                              <FieldGroup label="URL">
                                <DarkInput
                                  value={proj.url}
                                  onChange={(e) =>
                                    setProjects((p) =>
                                      p.map((x, idx) =>
                                        idx === i
                                          ? { ...x, url: e.target.value }
                                          : x,
                                      ),
                                    )
                                  }
                                  placeholder="https://github.com/..."
                                  ocid="projects.input"
                                />
                              </FieldGroup>
                              <FieldGroup label="Description">
                                <DarkTextarea
                                  value={proj.description}
                                  onChange={(e) =>
                                    setProjects((p) =>
                                      p.map((x, idx) =>
                                        idx === i
                                          ? {
                                              ...x,
                                              description: e.target.value,
                                            }
                                          : x,
                                      ),
                                    )
                                  }
                                  ocid="projects.textarea"
                                />
                              </FieldGroup>
                            </div>
                          </SectionCard>
                        ))}
                        <AddButton
                          onClick={() =>
                            setProjects((p) => [...p, { ...emptyProject }])
                          }
                          label="Add Project"
                          ocid="projects.secondary_button"
                        />
                      </div>
                    )}

                    {/* Import PDF */}
                    {activeTab === "import" && (
                      <div className="space-y-4">
                        <SectionCard title="Import from PDF">
                          <p className="text-sm mb-4 text-muted-foreground">
                            Upload your existing resume PDF and we'll
                            auto-extract your details.
                          </p>
                          <input
                            ref={fileInputRef}
                            id="resume-pdf-input"
                            type="file"
                            accept=".pdf,application/pdf"
                            className="sr-only"
                            onChange={handleFileInputChange}
                          />
                          <label
                            htmlFor={
                              isExtracting ? undefined : "resume-pdf-input"
                            }
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            data-ocid="resume.dropzone"
                            className="flex flex-col items-center justify-center gap-3 p-10 rounded-xl cursor-pointer transition-all duration-200 bg-muted"
                            style={{
                              border: `2px dashed ${
                                isDragging
                                  ? "#4D7CFF"
                                  : "var(--color-border, #203255)"
                              }`,
                              background: isDragging
                                ? "rgba(77,124,255,0.05)"
                                : undefined,
                            }}
                          >
                            <AnimatePresence mode="wait">
                              {isExtracting ? (
                                <motion.div
                                  key="extracting"
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  exit={{ opacity: 0 }}
                                  className="flex flex-col items-center gap-3 w-full"
                                  data-ocid="resume.loading_state"
                                >
                                  <Loader2
                                    className="w-8 h-8 animate-spin"
                                    style={{ color: "#4D7CFF" }}
                                  />
                                  <p className="text-sm font-medium text-foreground">
                                    Extracting your resume...
                                  </p>
                                  {/* Progress bar */}
                                  <div className="w-full max-w-xs space-y-1.5">
                                    <div className="bg-background rounded-full h-1.5 w-full overflow-hidden">
                                      <div
                                        className="h-full rounded-full transition-all duration-300"
                                        style={{
                                          width: extractProgress
                                            ? `${Math.round((extractProgress.current / extractProgress.total) * 100)}%`
                                            : "5%",
                                          background:
                                            "linear-gradient(90deg, #4D7CFF, #35C6FF)",
                                        }}
                                      />
                                    </div>
                                    {extractProgress &&
                                    extractProgress.total > 0 ? (
                                      <p className="text-xs text-muted-foreground text-center">
                                        Processing page{" "}
                                        {extractProgress.current} of{" "}
                                        {extractProgress.total}
                                      </p>
                                    ) : (
                                      <p className="text-xs text-muted-foreground text-center">
                                        Loading PDF library...
                                      </p>
                                    )}
                                  </div>
                                </motion.div>
                              ) : (
                                <motion.div
                                  key="idle"
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  exit={{ opacity: 0 }}
                                  className="flex flex-col items-center gap-3"
                                >
                                  <div
                                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                                    style={{
                                      background: "rgba(77,124,255,0.15)",
                                    }}
                                  >
                                    <FileText
                                      className="w-6 h-6"
                                      style={{ color: "#4D7CFF" }}
                                    />
                                  </div>
                                  <p className="text-sm font-medium text-foreground">
                                    Drop your PDF here or click to browse
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Auto-fills name, title, email, work history,
                                    education, skills &amp; projects
                                  </p>
                                  <span
                                    className="flex items-center gap-2 text-xs font-medium px-4 py-2 rounded-lg mt-1"
                                    style={{
                                      background: "rgba(77,124,255,0.12)",
                                      color: "#4D7CFF",
                                      border: "1px solid rgba(77,124,255,0.25)",
                                    }}
                                  >
                                    <Upload className="w-3.5 h-3.5" />
                                    Choose PDF
                                  </span>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </label>
                        </SectionCard>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* RIGHT: Live Preview */}
            <div
              className="flex flex-col overflow-hidden"
              style={{ width: "45%" }}
            >
              <div className="flex items-center justify-between px-5 py-3 flex-shrink-0 border-b border-border bg-card">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Live Preview
                </span>
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ background: "#35C6FF" }}
                  />
                  <span className="text-xs" style={{ color: "#35C6FF" }}>
                    Live
                  </span>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto bg-background">
                {personal.name ||
                work.length > 0 ||
                education.length > 0 ||
                skills.length > 0 ? (
                  <div style={{ zoom: 0.55, pointerEvents: "none" }}>
                    {(() => {
                      const ActiveTemplate =
                        TEMPLATE_MAP[selectedTemplate] ?? TemplateModern;
                      return <ActiveTemplate portfolio={previewPortfolio} />;
                    })()}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full py-16 text-muted-foreground">
                    <FileText className="w-10 h-10 mb-3 opacity-40" />
                    <p className="text-sm text-center opacity-60">
                      Fill in your details on the left
                      <br />
                      to see your resume preview here
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Portfolio Builder ── */}
        {activeSection === "portfolio" && (
          <div className="flex-1 overflow-hidden flex gap-0">
            {/* LEFT: Portfolio Settings */}
            <div
              className="flex flex-col overflow-y-auto border-r border-border bg-background"
              style={{ width: "55%" }}
            >
              <div className="p-6 space-y-6">
                {/* Header */}
                <div>
                  <h2 className="text-base font-bold text-foreground mb-1">
                    Portfolio Settings
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Customize how your public portfolio looks and feels.
                  </p>
                </div>

                {/* Template Picker */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest mb-3 text-muted-foreground">
                    Template
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {(
                      [
                        {
                          key: "modern",
                          label: "Modern",
                          desc: "Clean cards with gradient accents",
                          preview: (
                            <div
                              className="h-16 rounded-lg overflow-hidden px-3 pt-2.5"
                              style={{ background: "#0F1623" }}
                            >
                              <div
                                className="h-2 rounded-full w-2/5 mb-1.5"
                                style={{
                                  background:
                                    "linear-gradient(90deg,#4D7CFF,#35C6FF)",
                                }}
                              />
                              <div
                                className="h-1 rounded-full w-4/5 mb-1"
                                style={{ background: "#1B2A44" }}
                              />
                              <div
                                className="h-1 rounded-full w-3/5"
                                style={{ background: "#1B2A44" }}
                              />
                            </div>
                          ),
                        },
                        {
                          key: "classic",
                          label: "Classic",
                          desc: "Traditional two-column layout",
                          preview: (
                            <div
                              className="h-16 rounded-lg overflow-hidden"
                              style={{ background: "#0F1623" }}
                            >
                              <div
                                className="h-3.5 w-full"
                                style={{ borderBottom: "1px solid #1B2A44" }}
                              >
                                <div
                                  className="h-1.5 rounded-full w-1/3"
                                  style={{ background: "#EAF0FF" }}
                                />
                              </div>
                              <div className="flex h-[calc(100%-1.25rem)]">
                                <div
                                  className="w-1/3 p-1.5 space-y-1"
                                  style={{ borderRight: "1px solid #1B2A44" }}
                                >
                                  <div
                                    className="h-1 rounded-full w-full"
                                    style={{ background: "#203255" }}
                                  />
                                  <div
                                    className="h-1 rounded-full w-3/4"
                                    style={{ background: "#203255" }}
                                  />
                                </div>
                                <div className="flex-1 p-1.5 space-y-1">
                                  <div
                                    className="h-1 rounded-full w-full"
                                    style={{ background: "#1B2A44" }}
                                  />
                                  <div
                                    className="h-1 rounded-full w-4/5"
                                    style={{ background: "#1B2A44" }}
                                  />
                                  <div
                                    className="h-1 rounded-full w-3/5"
                                    style={{ background: "#1B2A44" }}
                                  />
                                </div>
                              </div>
                            </div>
                          ),
                        },
                        {
                          key: "minimal",
                          label: "Minimal",
                          desc: "Clean typography with dividers",
                          preview: (
                            <div
                              className="h-16 rounded-lg overflow-hidden p-3"
                              style={{ background: "#0F1623" }}
                            >
                              <div
                                className="h-2 rounded-full w-1/2 mb-2"
                                style={{ background: "#EAF0FF" }}
                              />
                              <div
                                className="h-px w-full mb-2"
                                style={{ background: "#1B2A44" }}
                              />
                              <div
                                className="h-1 rounded-full w-full mb-1"
                                style={{ background: "#1B2A44" }}
                              />
                              <div
                                className="h-1 rounded-full w-4/5"
                                style={{ background: "#1B2A44" }}
                              />
                            </div>
                          ),
                        },
                        {
                          key: "creative",
                          label: "Creative",
                          desc: "Bold colors and dynamic layout",
                          preview: (
                            <div
                              className="h-16 rounded-lg overflow-hidden"
                              style={{ background: "#0F1623" }}
                            >
                              <div
                                className="h-1/3 w-full"
                                style={{
                                  background:
                                    "linear-gradient(135deg,#4D7CFF,#35C6FF)",
                                }}
                              />
                              <div className="p-2 space-y-1">
                                <div
                                  className="h-1 rounded-full w-3/5"
                                  style={{ background: "#1B2A44" }}
                                />
                                <div
                                  className="h-1 rounded-full w-4/5"
                                  style={{ background: "#1B2A44" }}
                                />
                              </div>
                            </div>
                          ),
                        },
                      ] as {
                        key: string;
                        label: string;
                        desc: string;
                        preview: React.ReactNode;
                      }[]
                    ).map((tmpl) => {
                      const isSelected = selectedTemplate === tmpl.key;
                      return (
                        <button
                          key={tmpl.key}
                          type="button"
                          onClick={() => {
                            setSelectedTemplate(tmpl.key);
                            localStorage.setItem(
                              "portfolio-template",
                              tmpl.key,
                            );
                          }}
                          className="relative rounded-xl overflow-hidden transition-all duration-200 text-left border-2"
                          style={
                            isSelected
                              ? {
                                  borderColor: "#4D7CFF",
                                  background: "rgba(77,124,255,0.08)",
                                }
                              : {
                                  borderColor: "transparent",
                                  background: "rgba(255,255,255,0.03)",
                                }
                          }
                          data-ocid="portfolio.template.toggle"
                        >
                          {tmpl.preview}
                          <div className="px-3 py-2">
                            <p className="text-xs font-semibold text-foreground">
                              {tmpl.label}
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              {tmpl.desc}
                            </p>
                          </div>
                          {isSelected && (
                            <div
                              className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                              style={{ background: "#4D7CFF" }}
                            >
                              <CheckCircle className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Accent Color */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest mb-3 text-muted-foreground">
                    Accent Color
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {(
                      [
                        { hue: "265", label: "Blue" },
                        { hue: "280", label: "Indigo" },
                        { hue: "300", label: "Purple" },
                        { hue: "340", label: "Pink" },
                        { hue: "20", label: "Red" },
                        { hue: "50", label: "Orange" },
                        { hue: "80", label: "Yellow" },
                        { hue: "150", label: "Green" },
                        { hue: "185", label: "Teal" },
                        { hue: "210", label: "Cyan" },
                      ] as { hue: string; label: string }[]
                    ).map(({ hue, label }) => {
                      const isSelected = accentColor === hue;
                      return (
                        <button
                          key={hue}
                          type="button"
                          title={label}
                          onClick={() => setAccentColor(hue)}
                          className="w-8 h-8 rounded-full transition-all duration-200 flex-shrink-0"
                          style={{
                            background: `oklch(0.58 0.22 ${hue})`,
                            outline: isSelected
                              ? `3px solid oklch(0.58 0.22 ${hue})`
                              : "3px solid transparent",
                            outlineOffset: "3px",
                          }}
                          data-ocid="portfolio.accent.toggle"
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Bio Override */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest mb-1 text-muted-foreground">
                    Portfolio Bio
                  </p>
                  <p className="text-[10px] text-muted-foreground mb-2">
                    This appears on your public portfolio page.
                  </p>
                  <Textarea
                    value={personal.bio}
                    onChange={(e) =>
                      setPersonal((p) => ({ ...p, bio: e.target.value }))
                    }
                    placeholder="Write a compelling bio for your portfolio visitors..."
                    className="text-sm bg-muted border-border text-foreground resize-none"
                    rows={4}
                    data-ocid="portfolio.bio.textarea"
                  />
                </div>

                {/* Publish Status */}
                <div className="rounded-xl p-4 border border-border bg-card">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-foreground">
                      Published Status
                    </p>
                    <Switch
                      checked={portfolio?.isPublished ?? false}
                      onCheckedChange={handlePublishToggle}
                      disabled={isPublishing}
                      data-ocid="portfolio.publish.switch"
                    />
                  </div>
                  {portfolio?.isPublished ? (
                    <p
                      className="text-xs font-medium"
                      style={{ color: "#22c55e" }}
                    >
                      ● Your portfolio is live
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Not published yet
                    </p>
                  )}
                  {portfolio?.isPublished && principalId && (
                    <button
                      type="button"
                      onClick={() =>
                        router.navigate({ to: `/portfolio/${principalId}` })
                      }
                      className="mt-3 flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
                      style={{
                        background: "rgba(53,198,255,0.1)",
                        color: "#35C6FF",
                        border: "1px solid rgba(53,198,255,0.25)",
                      }}
                      data-ocid="portfolio.view_live.button"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      View Live →
                    </button>
                  )}
                </div>

                {/* Note */}
                <div
                  className="rounded-lg px-4 py-3 text-xs text-muted-foreground border border-border"
                  style={{ background: "rgba(77,124,255,0.04)" }}
                >
                  <span style={{ color: "#4D7CFF" }}>💡</span> Edit your content
                  (name, work, education, skills) in the{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveSection("resume");
                      setActiveTab("personal");
                    }}
                    className="underline font-medium"
                    style={{ color: "#4D7CFF" }}
                    data-ocid="portfolio.resume_tab.link"
                  >
                    Resume tab
                  </button>
                  .
                </div>
              </div>
            </div>

            {/* RIGHT: Portfolio Website Preview */}
            <div
              className="flex flex-col overflow-hidden"
              style={{ width: "45%" }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3 flex-shrink-0 border-b border-border bg-card">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Website Preview
                </span>
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ background: "#35C6FF" }}
                  />
                  <span className="text-xs" style={{ color: "#35C6FF" }}>
                    Live
                  </span>
                </div>
              </div>

              {/* Browser chrome + preview */}
              <div
                className="flex-1 overflow-hidden flex flex-col"
                style={{ background: "#f5f6fa" }}
              >
                {/* Browser chrome bar */}
                <div
                  style={{
                    background: "#e8eaf0",
                    padding: "8px 12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    flexShrink: 0,
                    borderBottom: "1px solid #d0d4dc",
                  }}
                >
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: "#ff5f57",
                      flexShrink: 0,
                    }}
                  />
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: "#febc2e",
                      flexShrink: 0,
                    }}
                  />
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: "#28c840",
                      flexShrink: 0,
                    }}
                  />
                  <div
                    style={{
                      flex: 1,
                      margin: "0 8px",
                      background: "white",
                      borderRadius: 4,
                      padding: "2px 8px",
                      fontSize: 10,
                      color: "#666",
                      overflow: "hidden",
                      whiteSpace: "nowrap",
                      textOverflow: "ellipsis",
                    }}
                  >
                    folio.app/{username || "your-portfolio"}
                  </div>
                </div>

                {/* Scrollable preview area */}
                <div className="flex-1 overflow-y-auto bg-white">
                  {personal.name ||
                  work.length > 0 ||
                  education.length > 0 ||
                  skills.length > 0 ? (
                    <div style={{ zoom: 0.45, pointerEvents: "none" }}>
                      {(() => {
                        const ActiveTemplate =
                          TEMPLATE_MAP[selectedTemplate] ?? TemplateModern;
                        return <ActiveTemplate portfolio={previewPortfolio} />;
                      })()}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full py-16 px-6 text-center">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                        style={{ background: "rgba(77,124,255,0.1)" }}
                      >
                        <Globe
                          className="w-6 h-6"
                          style={{ color: "#4D7CFF" }}
                        />
                      </div>
                      <p className="text-sm font-medium text-foreground mb-1">
                        No content yet
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Fill in your content in the Resume tab to preview your
                        portfolio here
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  function removeSkill(skill: string) {
    setSkills((prev) => prev.filter((s) => s !== skill));
  }
}

// ── Dashboard Overview Panel ──

function DashboardOverviewPanel({
  displayName,
  completenessScore,
  isPublished,
  credits,
  isPro,
  onEditResume,
  onViewPortfolio,
}: {
  displayName: string;
  completenessScore: number;
  isPublished: boolean;
  credits: number;
  isPro: boolean;
  onEditResume: () => void;
  onViewPortfolio: () => void;
}) {
  return (
    <div className="flex-1 overflow-y-auto p-6 bg-background">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="max-w-3xl space-y-6"
      >
        {/* Greeting */}
        <div>
          <h2
            className="text-2xl font-bold text-foreground"
            style={{ letterSpacing: "-0.02em" }}
          >
            Welcome back,{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #4D7CFF, #35C6FF)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {displayName || "there"}
            </span>
            !
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Here's an overview of your portfolio and resume status.
          </p>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div
            className="bg-card border border-border rounded-xl p-4"
            data-ocid="dashboard.card"
          >
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4" style={{ color: "#4D7CFF" }} />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Completeness
              </span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {completenessScore}%
            </p>
            <div className="mt-2 bg-muted rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${completenessScore}%`,
                  background: "linear-gradient(90deg, #4D7CFF, #35C6FF)",
                }}
              />
            </div>
          </div>

          <div
            className="bg-card border border-border rounded-xl p-4"
            data-ocid="dashboard.card"
          >
            <div className="flex items-center gap-2 mb-2">
              <Globe
                className="w-4 h-4"
                style={{ color: isPublished ? "#35C6FF" : "#8FA0C6" }}
              />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Published
              </span>
            </div>
            <p
              className="text-lg font-bold"
              style={{ color: isPublished ? "#35C6FF" : "#8FA0C6" }}
            >
              {isPublished ? "Live" : "Draft"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {isPublished ? "Visible to public" : "Not yet public"}
            </p>
          </div>

          <div
            className="bg-card border border-border rounded-xl p-4"
            data-ocid="dashboard.card"
          >
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4" style={{ color: "#4D7CFF" }} />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Credits
              </span>
            </div>
            <p className="text-2xl font-bold text-foreground">{credits}</p>
            <p className="text-xs text-muted-foreground mt-1">Available</p>
          </div>

          <div
            className="bg-card border border-border rounded-xl p-4"
            data-ocid="dashboard.card"
          >
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle
                className="w-4 h-4"
                style={{ color: isPro ? "#4D7CFF" : "#8FA0C6" }}
              />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Plan
              </span>
            </div>
            <p
              className="text-lg font-bold"
              style={{ color: isPro ? "#4D7CFF" : undefined }}
            >
              {isPro ? "Pro" : "Free"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {isPro ? "All features unlocked" : "5 credits included"}
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">
            Quick Actions
          </h3>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={onEditResume}
              className="font-semibold border-0"
              style={{
                background: "linear-gradient(135deg, #4D7CFF, #35C6FF)",
                color: "white",
              }}
              data-ocid="dashboard.primary_button"
            >
              <FileText className="w-4 h-4 mr-2" />
              Edit Resume
            </Button>
            <Button
              variant="outline"
              onClick={onViewPortfolio}
              className="border-border text-foreground"
              data-ocid="dashboard.secondary_button"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View Portfolio
            </Button>
          </div>
        </div>

        {/* Tips */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">
            Tips to improve your profile
          </h3>
          <div className="space-y-3">
            {[
              {
                icon: <User className="w-4 h-4" />,
                tip: "Add a professional bio to introduce yourself to potential employers.",
              },
              {
                icon: <Briefcase className="w-4 h-4" />,
                tip: "Fill in at least 2-3 work experiences for a complete resume.",
              },
              {
                icon: <Code2 className="w-4 h-4" />,
                tip: "List 8-12 skills to improve discoverability and keyword matching.",
              },
              {
                icon: <FolderGit2 className="w-4 h-4" />,
                tip: "Add 2-3 projects with descriptions to showcase your practical work.",
              },
            ].map((item) => (
              <div key={item.tip} className="flex items-start gap-3">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{
                    background: "rgba(77,124,255,0.12)",
                    color: "#4D7CFF",
                  }}
                >
                  {item.icon}
                </div>
                <p className="text-sm text-muted-foreground">{item.tip}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ── Settings Panel ──

function SettingsPanel({
  displayName,
  username,
  principalId,
  isPro,
  theme,
  toggleTheme,
  accentColor,
  setAccentColor,
  onLogout,
}: {
  displayName: string;
  username: string;
  principalId: string;
  isPro: boolean;
  theme: string;
  toggleTheme: () => void;
  accentColor: string;
  setAccentColor: (hue: string) => void;
  onLogout: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopyPrincipal = () => {
    navigator.clipboard.writeText(principalId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const truncatePrincipal = (id: string) =>
    id.length > 20 ? `${id.slice(0, 10)}...${id.slice(-6)}` : id;

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-background">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="max-w-2xl space-y-5"
      >
        {/* Account section */}
        <div
          className="bg-card border border-border rounded-xl p-5"
          data-ocid="settings.card"
        >
          <h3 className="text-sm font-semibold text-foreground mb-4">
            Account
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-sm text-muted-foreground">
                Display Name
              </span>
              <span className="text-sm font-medium text-foreground">
                {displayName || "—"}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-sm text-muted-foreground">Username</span>
              <span className="text-sm font-medium text-foreground">
                {username ? `@${username}` : "—"}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-sm text-muted-foreground">Plan</span>
              <span
                className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold"
                style={
                  isPro
                    ? {
                        background: "rgba(77,124,255,0.15)",
                        color: "#4D7CFF",
                        border: "1px solid rgba(77,124,255,0.3)",
                      }
                    : {
                        background: "rgba(143,160,198,0.1)",
                        color: "#8FA0C6",
                        border: "1px solid rgba(143,160,198,0.2)",
                      }
                }
              >
                {isPro && <Zap className="w-3 h-3" />}
                {isPro ? "Pro" : "Free"}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">
                Principal ID
              </span>
              <button
                type="button"
                onClick={handleCopyPrincipal}
                className="flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-lg transition-all hover:opacity-80 bg-muted border border-border text-foreground"
                data-ocid="settings.secondary_button"
              >
                {truncatePrincipal(principalId)}
                {copied ? (
                  <CheckCircle
                    className="w-3 h-3"
                    style={{ color: "#35C6FF" }}
                  />
                ) : (
                  <Copy className="w-3 h-3 text-muted-foreground" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Appearance */}
        <div
          className="bg-card border border-border rounded-xl p-5"
          data-ocid="settings.card"
        >
          <h3 className="text-sm font-semibold text-foreground mb-4">
            Appearance
          </h3>

          {/* Theme toggle */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-sm font-medium text-foreground">Color Theme</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Switch between light and dark mode
              </p>
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-medium text-sm transition-all hover:opacity-90 border border-border bg-muted text-foreground"
              data-ocid="settings.toggle"
            >
              {theme === "dark" ? (
                <>
                  <Sun className="w-4 h-4" style={{ color: "#4D7CFF" }} />
                  Light Mode
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4" style={{ color: "#4D7CFF" }} />
                  Dark Mode
                </>
              )}
            </button>
          </div>

          {/* Accent color */}
          <div>
            <p className="text-sm font-medium text-foreground mb-1">
              Accent Color
            </p>
            <p className="text-xs text-muted-foreground mb-3">
              Personalizes your portfolio and dashboard highlights
            </p>
            <div className="flex flex-wrap gap-3">
              {[
                { hue: "265", label: "Blue" },
                { hue: "280", label: "Indigo" },
                { hue: "300", label: "Purple" },
                { hue: "340", label: "Pink" },
                { hue: "20", label: "Red" },
                { hue: "50", label: "Orange" },
                { hue: "80", label: "Yellow" },
                { hue: "150", label: "Green" },
                { hue: "185", label: "Teal" },
                { hue: "210", label: "Cyan" },
              ].map(({ hue, label }) => {
                const isSelected = accentColor === hue;
                return (
                  <button
                    key={hue}
                    type="button"
                    title={label}
                    onClick={() => setAccentColor(hue)}
                    className="w-9 h-9 rounded-full transition-all duration-200 flex-shrink-0"
                    style={{
                      background: `oklch(0.58 0.22 ${hue})`,
                      outline: isSelected
                        ? `3px solid oklch(0.58 0.22 ${hue})`
                        : "3px solid transparent",
                      outlineOffset: "3px",
                    }}
                    data-ocid="settings.toggle"
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Danger zone */}
        <div
          className="bg-card border border-border rounded-xl p-5"
          data-ocid="settings.card"
        >
          <h3 className="text-sm font-semibold text-foreground mb-1">
            Danger Zone
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            Actions here cannot be undone
          </p>
          <Button
            variant="outline"
            onClick={onLogout}
            className="border-destructive/40 text-destructive hover:bg-destructive/10"
            data-ocid="settings.delete_button"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Log Out
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Helper sub-components ──

function SectionCard({
  title,
  children,
  onDelete,
  deleteOcid,
  ocid,
}: {
  title: string;
  children: React.ReactNode;
  onDelete?: () => void;
  deleteOcid?: string;
  ocid?: string;
}) {
  return (
    <div
      className="rounded-xl p-5 bg-card border border-border"
      data-ocid={ocid}
    >
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="p-1.5 rounded-lg transition-all hover:opacity-70"
            style={{ background: "rgba(255,80,80,0.1)" }}
            data-ocid={deleteOcid}
          >
            <Trash2 className="w-3.5 h-3.5" style={{ color: "#ff5a5a" }} />
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function FieldGroup({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-1 ${className}`}>
      <Label className="text-xs font-medium text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

function DarkInput({
  value,
  onChange,
  placeholder,
  type,
  ocid,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  ocid?: string;
}) {
  return (
    <Input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="h-8 text-sm bg-muted border-border text-foreground"
      data-ocid={ocid}
    />
  );
}

function DarkTextarea({
  value,
  onChange,
  placeholder,
  ocid,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  ocid?: string;
}) {
  return (
    <Textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="text-sm min-h-[80px] resize-none bg-muted border-border text-foreground"
      data-ocid={ocid}
    />
  );
}

function EmptyState({
  icon,
  message,
  ocid,
}: {
  icon: React.ReactNode;
  message: string;
  ocid?: string;
}) {
  return (
    <div
      className="rounded-xl p-10 flex flex-col items-center justify-center text-center bg-card border border-dashed border-border"
      data-ocid={ocid}
    >
      <div className="mb-3 text-muted-foreground opacity-60">{icon}</div>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

function AddButton({
  onClick,
  label,
  ocid,
}: {
  onClick: () => void;
  label: string;
  ocid?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all hover:opacity-80 bg-card border border-dashed border-border text-muted-foreground"
      data-ocid={ocid}
    >
      <Plus className="w-4 h-4" /> {label}
    </button>
  );
}
