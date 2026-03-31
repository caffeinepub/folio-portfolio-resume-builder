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
import { Loader2, Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ProfileSetupModalProps {
  open: boolean;
  onComplete: () => void;
}

export default function ProfileSetupModal({
  open,
  onComplete,
}: ProfileSetupModalProps) {
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const { mutateAsync: saveProfile, isPending } = useSaveUserProfile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !displayName.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    if (!/^[a-z0-9_-]+$/.test(username)) {
      toast.error(
        "Username can only contain lowercase letters, numbers, hyphens, and underscores",
      );
      return;
    }
    try {
      await saveProfile({
        username: username.trim(),
        displayName: displayName.trim(),
      });
      toast.success("Profile created!");
      onComplete();
    } catch {
      toast.error("Failed to create profile. Please try again.");
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent
        className="bg-card border-border"
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
            Choose a username and display name to get started with your
            portfolio.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="display-name">Display Name</Label>
            <Input
              id="display-name"
              placeholder="Jane Doe"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="bg-secondary border-border"
              data-ocid="profile_setup.input"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
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
            disabled={isPending}
            data-ocid="profile_setup.submit_button"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating
                Profile...
              </>
            ) : (
              "Create Profile →"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
