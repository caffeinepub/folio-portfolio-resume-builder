import type {
  Education,
  PersonalInfo,
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
import { useInternetIdentity } from "@/hooks/useInternetIdentity";
import {
  useCallerUserProfile,
  useMyPortfolio,
  useSavePortfolio,
  useSetPublished,
  useUpgradeToPro,
} from "@/hooks/useQueries";
import { parseResumeFromPDF } from "@/utils/resumeParser";
import { useRouter } from "@tanstack/react-router";
import {
  Briefcase,
  Code2,
  ExternalLink,
  FileText,
  FolderGit2,
  Globe,
  GraduationCap,
  LayoutDashboard,
  Loader2,
  LogOut,
  Plus,
  Settings,
  Trash2,
  Upload,
  User,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
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
  const [activeTab, setActiveTab] = useState<EditorTab>("personal");
  const [activeSection, setActiveSection] = useState<SidebarSection>("resume");
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if (!profileLoading && !portfolioLoading && !userProfile && identity) {
      setShowProfileSetup(true);
    }
  }, [profileLoading, portfolioLoading, userProfile, identity]);

  const handlePDFFile = async (file: File) => {
    if (!file || file.type !== "application/pdf") {
      toast.error("Please upload a valid PDF file.");
      return;
    }
    setIsExtracting(true);
    try {
      const parsed = await parseResumeFromPDF(file);
      setPersonal((prev) => ({
        ...prev,
        ...(parsed.personal.name ? { name: parsed.personal.name } : {}),
        ...(parsed.personal.title ? { title: parsed.personal.title } : {}),
        ...(parsed.personal.email ? { email: parsed.personal.email } : {}),
        ...(parsed.personal.phone ? { phone: parsed.personal.phone } : {}),
        ...(parsed.personal.bio ? { bio: parsed.personal.bio } : {}),
      }));
      if (parsed.work.length > 0) setWork((prev) => [...prev, ...parsed.work]);
      if (parsed.education.length > 0)
        setEducation((prev) => [...prev, ...parsed.education]);
      if (parsed.projects.length > 0)
        setProjects((prev) => [...prev, ...parsed.projects]);
      if (parsed.skills.length > 0)
        setSkills((prev) => [
          ...prev,
          ...parsed.skills.filter((s) => !prev.includes(s)),
        ]);
      toast.success("Resume imported! Review and save your changes.");
    } catch {
      toast.error("Could not parse resume. Please fill in manually.");
    } finally {
      setIsExtracting(false);
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

  const removeSkill = (skill: string) =>
    setSkills((prev) => prev.filter((s) => s !== skill));

  const principalId = identity?.getPrincipal().toString();
  const isPro = portfolio?.plan === Plan.pro;

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

  if (isInitializing || portfolioLoading || profileLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "#070A12" }}
        data-ocid="dashboard.loading_state"
      >
        <div className="text-center">
          <div
            className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin mx-auto mb-4"
            style={{ borderColor: "#4D7CFF", borderTopColor: "transparent" }}
          />
          <p style={{ color: "#8FA0C6" }}>Loading your portfolio...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: "#070A12" }}
    >
      <ProfileSetupModal
        open={showProfileSetup}
        onComplete={() => setShowProfileSetup(false)}
      />

      {/* Fixed Left Sidebar */}
      <aside
        className="w-64 flex flex-col fixed left-0 top-0 h-full z-20"
        style={{ background: "#0B1222", borderRight: "1px solid #1B2A44" }}
      >
        {/* Top: Logo + Brand */}
        <div
          className="px-5 py-5"
          style={{ borderBottom: "1px solid #1B2A44" }}
        >
          <div className="flex items-center gap-2.5 mb-5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #4D7CFF, #35C6FF)",
              }}
            >
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span
              className="font-display font-bold text-lg"
              style={{ color: "#EAF0FF" }}
            >
              Folio
            </span>
          </div>

          {/* Avatar + User */}
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
              style={{
                background: "linear-gradient(135deg, #4D7CFF, #35C6FF)",
              }}
            >
              {(displayName || personal.name || "U").charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p
                className="font-semibold text-sm truncate"
                style={{ color: "#EAF0FF" }}
              >
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
                  if (
                    item.id === "portfolio" &&
                    portfolio?.isPublished &&
                    principalId
                  ) {
                    router.navigate({ to: `/portfolio/${principalId}` });
                  } else {
                    setActiveSection(item.id);
                    if (item.id === "resume") setActiveTab("personal");
                  }
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
                {item.id === "portfolio" && portfolio?.isPublished && (
                  <ExternalLink
                    className="w-3 h-3 ml-auto"
                    style={{ color: "#35C6FF" }}
                  />
                )}
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
        <div
          className="px-3 pb-4"
          style={{ borderTop: "1px solid #1B2A44", paddingTop: "12px" }}
        >
          <button
            type="button"
            onClick={() => {
              clear();
              router.navigate({ to: "/" });
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 hover:opacity-80"
            style={{ color: "#8FA0C6" }}
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
        <header
          className="flex items-center justify-between px-8 py-4 flex-shrink-0"
          style={{ borderBottom: "1px solid #1B2A44", background: "#0B1020" }}
        >
          <div>
            <h1
              className="font-display text-xl font-bold"
              style={{ color: "#EAF0FF" }}
            >
              {activeSection === "dashboard"
                ? "Dashboard"
                : activeSection === "resume"
                  ? "Resume Editor"
                  : activeSection === "portfolio"
                    ? "Portfolio"
                    : "Settings"}
            </h1>
            <p className="text-xs mt-0.5" style={{ color: "#8FA0C6" }}>
              {activeSection === "resume"
                ? "Edit your resume — changes reflect live in the preview"
                : "Manage your professional presence"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Published toggle */}
            <div className="flex items-center gap-2">
              <span
                className="text-xs font-medium"
                style={{ color: "#8FA0C6" }}
              >
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

        {/* Content: two columns */}
        <div className="flex-1 overflow-hidden flex gap-0">
          {/* LEFT: Editor area */}
          <div
            className="flex flex-col overflow-hidden"
            style={{ width: "55%", borderRight: "1px solid #1B2A44" }}
          >
            {/* Tab bar */}
            <div
              className="flex items-center gap-1 px-4 py-3 flex-shrink-0 overflow-x-auto"
              style={{
                borderBottom: "1px solid #1B2A44",
                background: "#0E1628",
              }}
            >
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
            <div
              className="flex-1 overflow-y-auto p-5"
              style={{ background: "#070A12" }}
            >
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
                                        ? { ...x, startDate: e.target.value }
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
                                        ? { ...x, description: e.target.value }
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
                        onClick={() => setWork((w) => [...w, { ...emptyWork }])}
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
                                        ? { ...x, institution: e.target.value }
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
                                          ? { ...x, startYear: e.target.value }
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
                                          ? { ...x, endYear: e.target.value }
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
                          className="flex-1 text-sm h-9"
                          style={{
                            background: "#111B30",
                            border: "1px solid #203255",
                            color: "#EAF0FF",
                          }}
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
                          className="text-center py-6"
                          style={{ color: "#8FA0C6" }}
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
                            setProjects((p) => p.filter((_, idx) => idx !== i))
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
                                        ? { ...x, description: e.target.value }
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
                        <p
                          className="text-sm mb-4"
                          style={{ color: "#8FA0C6" }}
                        >
                          Upload your existing resume PDF and we'll auto-extract
                          your details.
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
                          className="flex flex-col items-center justify-center gap-3 p-10 rounded-xl cursor-pointer transition-all duration-200"
                          style={{
                            border: `2px dashed ${isDragging ? "#4D7CFF" : "#203255"}`,
                            background: isDragging
                              ? "rgba(77,124,255,0.05)"
                              : "#111B30",
                          }}
                        >
                          <AnimatePresence mode="wait">
                            {isExtracting ? (
                              <motion.div
                                key="extracting"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex flex-col items-center gap-3"
                                data-ocid="resume.loading_state"
                              >
                                <Loader2
                                  className="w-8 h-8 animate-spin"
                                  style={{ color: "#4D7CFF" }}
                                />
                                <p
                                  className="text-sm font-medium"
                                  style={{ color: "#EAF0FF" }}
                                >
                                  Extracting your resume...
                                </p>
                                <p
                                  className="text-xs"
                                  style={{ color: "#8FA0C6" }}
                                >
                                  Parsing resume data, please wait
                                </p>
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
                                <p
                                  className="text-sm font-medium"
                                  style={{ color: "#EAF0FF" }}
                                >
                                  Drop your PDF here or click to browse
                                </p>
                                <p
                                  className="text-xs"
                                  style={{ color: "#8FA0C6" }}
                                >
                                  Auto-fills name, title, email, work history,
                                  education, skills & projects
                                </p>
                                <span
                                  className="flex items-center gap-2 text-xs font-medium px-4 py-2 rounded-lg mt-1"
                                  style={{
                                    background:
                                      "linear-gradient(135deg, #4D7CFF, #35C6FF)",
                                    color: "white",
                                  }}
                                  data-ocid="resume.upload_button"
                                >
                                  <Upload className="w-3.5 h-3.5" /> Upload PDF
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
            <div
              className="flex items-center justify-between px-5 py-3 flex-shrink-0"
              style={{
                borderBottom: "1px solid #1B2A44",
                background: "#0E1628",
              }}
            >
              <span
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: "#8FA0C6" }}
              >
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
            <div
              className="flex-1 overflow-y-auto p-6"
              style={{ background: "#0B1020" }}
            >
              {/* Paper-like resume document */}
              <div
                className="rounded-2xl p-8 min-h-full shadow-2xl"
                style={{ background: "#F6F8FC", color: "#1A2233" }}
              >
                {/* Header section */}
                <div
                  className="mb-6 pb-5"
                  style={{ borderBottom: "2px solid #E8EDF5" }}
                >
                  <h2
                    className="text-2xl font-bold mb-1"
                    style={{ color: "#1A2233", fontFamily: "inherit" }}
                  >
                    {personal.name || displayName || "Your Name"}
                  </h2>
                  {personal.title && (
                    <p
                      className="text-sm font-semibold mb-2"
                      style={{ color: "#4D7CFF" }}
                    >
                      {personal.title}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    {personal.email && (
                      <span className="text-xs" style={{ color: "#5A6A8A" }}>
                        {personal.email}
                      </span>
                    )}
                    {personal.phone && (
                      <span className="text-xs" style={{ color: "#5A6A8A" }}>
                        {personal.phone}
                      </span>
                    )}
                    {personal.website && (
                      <span className="text-xs" style={{ color: "#4D7CFF" }}>
                        {personal.website}
                      </span>
                    )}
                  </div>
                  {personal.bio && (
                    <p
                      className="text-xs mt-3 leading-relaxed"
                      style={{ color: "#3A4A6A" }}
                    >
                      {personal.bio}
                    </p>
                  )}
                </div>

                {/* Work Experience */}
                {work.length > 0 && (
                  <div className="mb-5">
                    <h3
                      className="text-xs font-bold uppercase tracking-widest mb-3"
                      style={{ color: "#4D7CFF" }}
                    >
                      Experience
                    </h3>
                    <div className="space-y-3">
                      {work.map((job, i) => (
                        <div key={`prev-work-${job.company}-${i}`}>
                          <div className="flex justify-between items-baseline mb-0.5">
                            <p
                              className="text-sm font-semibold"
                              style={{ color: "#1A2233" }}
                            >
                              {job.role || "Role"}
                            </p>
                            <span
                              className="text-xs"
                              style={{ color: "#8FA0C6" }}
                            >
                              {job.startDate}
                              {job.endDate ? ` – ${job.endDate}` : ""}
                            </span>
                          </div>
                          <p
                            className="text-xs font-medium mb-1"
                            style={{ color: "#4D7CFF" }}
                          >
                            {job.company}
                          </p>
                          {job.description && (
                            <p
                              className="text-xs leading-relaxed"
                              style={{ color: "#3A4A6A" }}
                            >
                              {job.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Education */}
                {education.length > 0 && (
                  <div className="mb-5">
                    <h3
                      className="text-xs font-bold uppercase tracking-widest mb-3"
                      style={{ color: "#4D7CFF" }}
                    >
                      Education
                    </h3>
                    <div className="space-y-2">
                      {education.map((edu, i) => (
                        <div key={`prev-edu-${edu.institution}-${i}`}>
                          <div className="flex justify-between items-baseline">
                            <p
                              className="text-sm font-semibold"
                              style={{ color: "#1A2233" }}
                            >
                              {edu.degree} {edu.field ? `in ${edu.field}` : ""}
                            </p>
                            <span
                              className="text-xs"
                              style={{ color: "#8FA0C6" }}
                            >
                              {edu.startYear}
                              {edu.endYear ? ` – ${edu.endYear}` : ""}
                            </span>
                          </div>
                          <p
                            className="text-xs font-medium"
                            style={{ color: "#4D7CFF" }}
                          >
                            {edu.institution}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Skills */}
                {skills.length > 0 && (
                  <div className="mb-5">
                    <h3
                      className="text-xs font-bold uppercase tracking-widest mb-3"
                      style={{ color: "#4D7CFF" }}
                    >
                      Skills
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {skills.map((skill) => (
                        <span
                          key={skill}
                          className="text-xs px-2.5 py-1 rounded-full font-medium"
                          style={{ background: "#E8EDF5", color: "#3A4A6A" }}
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Projects */}
                {projects.length > 0 && (
                  <div>
                    <h3
                      className="text-xs font-bold uppercase tracking-widest mb-3"
                      style={{ color: "#4D7CFF" }}
                    >
                      Projects
                    </h3>
                    <div className="space-y-2">
                      {projects.map((proj, i) => (
                        <div key={`prev-proj-${proj.name}-${i}`}>
                          <p
                            className="text-sm font-semibold"
                            style={{ color: "#1A2233" }}
                          >
                            {proj.name}
                          </p>
                          {proj.url && (
                            <p className="text-xs" style={{ color: "#4D7CFF" }}>
                              {proj.url}
                            </p>
                          )}
                          {proj.description && (
                            <p
                              className="text-xs leading-relaxed"
                              style={{ color: "#3A4A6A" }}
                            >
                              {proj.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty state for preview */}
                {!personal.name &&
                  work.length === 0 &&
                  education.length === 0 &&
                  skills.length === 0 && (
                    <div
                      className="flex flex-col items-center justify-center py-16"
                      style={{ color: "#8FA0C6" }}
                    >
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
        </div>
      </div>
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
      className="rounded-xl p-5"
      style={{ background: "#0E1628", border: "1px solid #1B2A44" }}
      data-ocid={ocid}
    >
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-semibold" style={{ color: "#EAF0FF" }}>
          {title}
        </h4>
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="p-1.5 rounded-lg transition-all hover:opacity-70"
            style={{ color: "#8FA0C6", background: "rgba(255,80,80,0.1)" }}
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
      <Label className="text-xs font-medium" style={{ color: "#8FA0C6" }}>
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
      className="h-8 text-sm"
      style={{
        background: "#111B30",
        border: "1px solid #203255",
        color: "#EAF0FF",
      }}
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
      className="text-sm min-h-[80px] resize-none"
      style={{
        background: "#111B30",
        border: "1px solid #203255",
        color: "#EAF0FF",
      }}
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
      className="rounded-xl p-10 flex flex-col items-center justify-center text-center"
      style={{ background: "#0E1628", border: "1px dashed #1B2A44" }}
      data-ocid={ocid}
    >
      <div className="mb-3" style={{ color: "#8FA0C6", opacity: 0.6 }}>
        {icon}
      </div>
      <p className="text-sm" style={{ color: "#8FA0C6" }}>
        {message}
      </p>
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
      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all hover:opacity-80"
      style={{
        background: "#0E1628",
        border: "1px dashed #1B2A44",
        color: "#8FA0C6",
      }}
      data-ocid={ocid}
    >
      <Plus className="w-4 h-4" /> {label}
    </button>
  );
}
