import type {
  Education,
  PersonalInfo,
  Project,
  WorkExperience,
} from "@/backend";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useActor } from "@/hooks/useActor";
import { useSaveUserProfile } from "@/hooks/useQueries";
import { parseResumeFromPDF } from "@/utils/resumeParser";
import {
  Camera,
  CheckCircle2,
  FileText,
  Loader2,
  Upload,
  X,
  Zap,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

export interface ParsedResumeData {
  personal: Partial<PersonalInfo>;
  work: WorkExperience[];
  education: Education[];
  skills: string[];
  projects: Project[];
}

interface ProfileSetupModalProps {
  open: boolean;
  onComplete: (
    resumeData?: ParsedResumeData,
    avatarDataUrl?: string,
    username?: string,
    displayName?: string,
  ) => void;
  onClose: () => void;
}

export default function ProfileSetupModal({
  open,
  onComplete,
  onClose,
}: ProfileSetupModalProps) {
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractProgress, setExtractProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);
  const [parsedData, setParsedData] = useState<ParsedResumeData | null>(null);
  const [resumeFileName, setResumeFileName] = useState<string | null>(null);
  const [avatarDataUrl, setAvatarDataUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const { mutateAsync: saveProfile, isPending } = useSaveUserProfile();
  const { actor, isFetching: isActorLoading } = useActor();

  const handleResumeUpload = async (file: File) => {
    if (file.type !== "application/pdf") {
      toast.error("Please upload a PDF file.");
      return;
    }
    setIsExtracting(true);
    setExtractProgress(null);
    setResumeFileName(file.name);
    try {
      const parsed = await parseResumeFromPDF(file, (current, total) => {
        setExtractProgress({ current, total });
      });
      setParsedData(parsed);
      if (parsed.personal.name && !displayName) {
        setDisplayName(parsed.personal.name);
        if (!username) {
          const suggested = parsed.personal.name
            .toLowerCase()
            .replace(/\s+/g, "")
            .replace(/[^a-z0-9_-]/g, "")
            .slice(0, 20);
          setUsername(suggested);
        }
      }
      toast.success("Resume uploaded! Details have been auto-filled.");
    } catch {
      toast.error("Could not read resume. Please fill in details manually.");
    } finally {
      setIsExtracting(false);
      setExtractProgress(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleResumeUpload(file);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result;
      if (typeof result === "string") {
        setAvatarDataUrl(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !displayName.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }
    if (!/^[a-z0-9_-]+$/.test(username)) {
      toast.error(
        "Username can only contain lowercase letters, numbers, hyphens, and underscores.",
      );
      return;
    }
    if (!actor) {
      toast.error("Still connecting. Please wait a moment and try again.");
      return;
    }
    try {
      await saveProfile({
        username: username.trim(),
        displayName: displayName.trim(),
      });
      if (avatarDataUrl) {
        localStorage.setItem("folio-avatar", avatarDataUrl);
      }
      toast.success("Profile created!");
      onComplete(
        parsedData ?? undefined,
        avatarDataUrl ?? undefined,
        username.trim(),
        displayName.trim(),
      );
    } catch (err) {
      console.error("Profile creation failed:", err);
      toast.error("Failed to create profile. Please try again.");
    }
  };

  const isSubmitDisabled = isPending || isActorLoading || !actor;
  const progressPct =
    extractProgress && extractProgress.total > 0
      ? Math.round((extractProgress.current / extractProgress.total) * 100)
      : 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <DialogContent
        className="p-0 overflow-hidden bg-background border border-border"
        style={{
          maxWidth: "520px",
          width: "95vw",
          borderRadius: "20px",
        }}
        data-ocid="profile_setup.dialog"
      >
        {/* Accessible dialog title (visually hidden — visible h2 is in the header below) */}
        <DialogTitle className="sr-only">Set Up Your Profile</DialogTitle>

        {/* Gradient header */}
        <div
          className="relative px-7 pt-7 pb-5"
          style={{
            background:
              "linear-gradient(135deg, rgba(77,124,255,0.18) 0%, rgba(53,198,255,0.10) 100%)",
            borderBottom: "1px solid rgba(77,124,255,0.15)",
          }}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 rounded-lg p-1.5 transition-colors hover:bg-white/10 text-muted-foreground"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Brand */}
          <div className="flex items-center gap-2 mb-4">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #4D7CFF, #35C6FF)",
              }}
            >
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-base tracking-tight text-foreground">
              Folio
            </span>
          </div>

          <h2
            className="text-xl font-bold mb-1 text-foreground"
            style={{ letterSpacing: "-0.02em" }}
          >
            Set Up Your Profile
          </h2>
          <p className="text-sm text-muted-foreground">
            Upload your resume to auto-fill your details, or enter them
            manually.
          </p>
        </div>

        {/* Form content */}
        <div className="px-7 py-6">
          {/* Avatar upload */}
          <div className="flex flex-col items-center mb-6">
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              className="relative group cursor-pointer"
              title="Upload profile photo"
            >
              <div
                className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center border-2 transition-all group-hover:border-[#4D7CFF]"
                style={{
                  background: avatarDataUrl
                    ? "transparent"
                    : "linear-gradient(135deg, rgba(77,124,255,0.2), rgba(53,198,255,0.12))",
                  borderColor: avatarDataUrl
                    ? "#4D7CFF"
                    : "rgba(77,124,255,0.3)",
                }}
              >
                {avatarDataUrl ? (
                  <img
                    src={avatarDataUrl}
                    alt="Avatar preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Camera className="w-7 h-7" style={{ color: "#4D7CFF" }} />
                )}
              </div>
              {/* Camera overlay on hover */}
              {avatarDataUrl && (
                <div
                  className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: "rgba(0,0,0,0.5)" }}
                >
                  <Camera className="w-5 h-5 text-white" />
                </div>
              )}
            </button>
            <p className="text-xs mt-2 text-muted-foreground">
              {avatarDataUrl ? "Click to change photo" : "Add profile photo"}
            </p>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* PDF Upload zone */}
            <div>
              <p className="text-xs font-medium mb-2 text-muted-foreground">
                AUTO-FILL FROM RESUME
              </p>
              <button
                type="button"
                className="w-full rounded-xl p-4 text-center cursor-pointer transition-all"
                style={{
                  border: `1.5px dashed ${
                    resumeFileName
                      ? "rgba(53,198,255,0.5)"
                      : "rgba(77,124,255,0.35)"
                  }`,
                  background: resumeFileName
                    ? "rgba(53,198,255,0.06)"
                    : "rgba(77,124,255,0.05)",
                }}
                onClick={() => !isExtracting && fileInputRef.current?.click()}
                disabled={isExtracting}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={handleFileChange}
                />
                {isExtracting ? (
                  <div className="flex flex-col items-center gap-2.5 py-1">
                    <Loader2
                      className="w-5 h-5 animate-spin flex-shrink-0"
                      style={{ color: "#4D7CFF" }}
                    />
                    <p className="text-sm font-medium text-foreground">
                      Extracting your resume...
                    </p>
                    {/* Progress bar */}
                    <div className="w-full space-y-1">
                      <div className="bg-muted rounded-full h-1.5 w-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${progressPct}%`,
                            background:
                              "linear-gradient(90deg, #4D7CFF, #35C6FF)",
                          }}
                        />
                      </div>
                      {extractProgress && extractProgress.total > 0 && (
                        <p className="text-xs text-muted-foreground text-center">
                          Processing page {extractProgress.current} of{" "}
                          {extractProgress.total}
                        </p>
                      )}
                    </div>
                  </div>
                ) : resumeFileName ? (
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2
                      className="w-4 h-4 flex-shrink-0"
                      style={{ color: "#35C6FF" }}
                    />
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-sm font-medium truncate text-foreground">
                        {resumeFileName}
                      </p>
                      <p
                        className="text-xs mt-0.5"
                        style={{ color: "#35C6FF" }}
                      >
                        Details auto-filled below
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setResumeFileName(null);
                        setParsedData(null);
                        if (fileInputRef.current)
                          fileInputRef.current.value = "";
                      }}
                      className="p-1 rounded-md transition-colors hover:bg-white/10 flex-shrink-0 text-muted-foreground"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: "rgba(77,124,255,0.15)" }}
                    >
                      <Upload
                        className="w-4 h-4"
                        style={{ color: "#4D7CFF" }}
                      />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-foreground">
                        Upload Resume (PDF)
                      </p>
                      <p className="text-xs mt-0.5 text-muted-foreground">
                        Auto-fills name, skills, work &amp; education
                      </p>
                    </div>
                    <FileText
                      className="w-4 h-4 ml-auto flex-shrink-0"
                      style={{ color: "rgba(77,124,255,0.5)" }}
                    />
                  </div>
                )}
              </button>
            </div>

            {/* Fields: 2-col on sm+ */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label
                  htmlFor="display-name"
                  className="text-xs font-medium text-muted-foreground"
                >
                  DISPLAY NAME *
                </Label>
                <Input
                  id="display-name"
                  placeholder="Jane Doe"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="text-sm h-10 rounded-lg border bg-muted border-border text-foreground"
                  data-ocid="profile_setup.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor="username"
                  className="text-xs font-medium text-muted-foreground"
                >
                  USERNAME *
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs pointer-events-none select-none text-muted-foreground/60">
                    @
                  </span>
                  <Input
                    id="username"
                    placeholder="janedoe"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase())}
                    className="text-sm h-10 rounded-lg pl-7 bg-muted border-border text-foreground"
                    data-ocid="profile_setup.input"
                  />
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground/60">
              Lowercase letters, numbers, hyphens and underscores only.
            </p>

            {/* Submit */}
            <Button
              type="submit"
              className="w-full h-11 font-semibold rounded-xl border-0 text-white mt-1"
              disabled={isSubmitDisabled}
              style={{
                background: isSubmitDisabled
                  ? "rgba(77,124,255,0.4)"
                  : "linear-gradient(135deg, #4D7CFF, #35C6FF)",
                boxShadow: isSubmitDisabled
                  ? "none"
                  : "0 4px 24px rgba(77,124,255,0.35)",
              }}
              data-ocid="profile_setup.submit_button"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating
                  Profile...
                </>
              ) : isActorLoading || !actor ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                  Connecting...
                </>
              ) : (
                "Create Profile →"
              )}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
