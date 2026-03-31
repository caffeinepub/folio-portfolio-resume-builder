import type {
  Education,
  PersonalInfo,
  Project,
  WorkExperience,
} from "@/backend";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSaveUserProfile } from "@/hooks/useQueries";
import { parseResumeFromPDF } from "@/utils/resumeParser";
import { FileText, Loader2, Upload, X, Zap } from "lucide-react";
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
  onComplete: (resumeData?: ParsedResumeData) => void;
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
  const [parsedData, setParsedData] = useState<ParsedResumeData | null>(null);
  const [resumeFileName, setResumeFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { mutateAsync: saveProfile, isPending } = useSaveUserProfile();

  const handleResumeUpload = async (file: File) => {
    if (file.type !== "application/pdf") {
      toast.error("Please upload a PDF file.");
      return;
    }
    setIsExtracting(true);
    setResumeFileName(file.name);
    try {
      const parsed = await parseResumeFromPDF(file);
      setParsedData(parsed);
      // Auto-fill display name from resume
      if (parsed.personal.name && !displayName) {
        setDisplayName(parsed.personal.name);
        // Auto-generate username suggestion
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
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleResumeUpload(file);
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
    try {
      await saveProfile({
        username: username.trim(),
        displayName: displayName.trim(),
      });
      toast.success("Profile created!");
      onComplete(parsedData ?? undefined);
    } catch (err) {
      console.error("Profile creation failed:", err);
      toast.error("Failed to create profile. Please try again.");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <DialogContent
        className="bg-card border-border max-w-md"
        data-ocid="profile_setup.dialog"
      >
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-lg">Folio</span>
          </div>
          <DialogTitle className="text-xl font-display">
            Set Up Your Profile
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Upload your resume to auto-fill your details, or enter them
            manually.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Resume Upload */}
          <button
            type="button"
            className="w-full border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors hover:border-primary/60"
            style={{
              borderColor: "rgba(77,124,255,0.35)",
              background: "rgba(77,124,255,0.05)",
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
              <div className="flex flex-col items-center gap-2 py-1">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  Reading resume...
                </p>
              </div>
            ) : resumeFileName ? (
              <div className="flex items-center justify-center gap-2">
                <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-sm font-medium truncate max-w-[200px]">
                  {resumeFileName}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setResumeFileName(null);
                    setParsedData(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="text-muted-foreground hover:text-foreground ml-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1 py-1">
                <Upload className="w-5 h-5 text-muted-foreground" />
                <p className="text-sm font-medium">Upload Resume (PDF)</p>
                <p className="text-xs text-muted-foreground">
                  Auto-fills your name, skills, work &amp; education
                </p>
              </div>
            )}
          </button>

          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="display-name">Display Name *</Label>
            <Input
              id="display-name"
              placeholder="Jane Doe"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="bg-secondary border-border"
              data-ocid="profile_setup.input"
            />
          </div>

          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username">Username *</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                folio.app/
              </span>
              <Input
                id="username"
                placeholder="janedoe"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                className="bg-secondary border-border pl-24"
                data-ocid="profile_setup.input"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Only lowercase letters, numbers, hyphens, and underscores.
            </p>
          </div>

          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            disabled={isPending || isExtracting}
            data-ocid="profile_setup.submit_button"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating
                Profile...
              </>
            ) : (
              "Create Profile \u2192"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
