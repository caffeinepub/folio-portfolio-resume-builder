import type { PortfolioDTO } from "@/backend";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { useActor } from "@/hooks/useActor";
import { usePortfolio } from "@/hooks/useQueries";
import TemplateClassic from "@/templates/TemplateClassic";
import TemplateCreative from "@/templates/TemplateCreative";
import TemplateMinimal from "@/templates/TemplateMinimal";
import TemplateModern from "@/templates/TemplateModern";
import { Principal } from "@icp-sdk/core/principal";
import { useParams, useRouter } from "@tanstack/react-router";
import { AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";

type TemplateKey = "modern" | "minimal" | "creative" | "classic";

function getTemplate(): TemplateKey {
  const stored = localStorage.getItem("portfolio-template") || "modern";
  if (
    stored === "modern" ||
    stored === "minimal" ||
    stored === "creative" ||
    stored === "classic"
  ) {
    return stored;
  }
  return "modern";
}

function TemplateRenderer({
  templateKey,
  portfolio,
}: {
  templateKey: TemplateKey;
  portfolio: PortfolioDTO;
}) {
  switch (templateKey) {
    case "minimal":
      return <TemplateMinimal portfolio={portfolio} />;
    case "creative":
      return <TemplateCreative portfolio={portfolio} />;
    case "classic":
      return <TemplateClassic portfolio={portfolio} />;
    default:
      return <TemplateModern portfolio={portfolio} />;
  }
}

export default function PortfolioPage() {
  const { principalId } = useParams({ strict: false }) as {
    principalId: string;
  };
  const router = useRouter();
  const [principal, setPrincipal] = useState<Principal | null>(null);
  const [principalError, setPrincipalError] = useState(false);
  const { isFetching: actorLoading } = useActor();
  const [templateKey, setTemplateKey] = useState<TemplateKey>(getTemplate);

  useEffect(() => {
    if (!principalId) return;
    try {
      setPrincipal(Principal.fromText(principalId));
    } catch {
      setPrincipalError(true);
    }
  }, [principalId]);

  // Sync template choice from localStorage whenever it changes
  useEffect(() => {
    const onStorage = () => setTemplateKey(getTemplate());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const { data: portfolio, isLoading } = usePortfolio(principal);

  if (isLoading || actorLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div
          className="flex items-center justify-center min-h-[60vh]"
          data-ocid="portfolio.loading_state"
        >
          <div className="text-center">
            <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading portfolio...</p>
          </div>
        </div>
      </div>
    );
  }

  if (principalError || !portfolio || !portfolio.isPublished) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div
          className="flex items-center justify-center min-h-[60vh]"
          data-ocid="portfolio.error_state"
        >
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="font-display text-2xl font-bold text-foreground mb-2">
              Portfolio Not Found
            </h2>
            <p className="text-muted-foreground mb-6">
              This portfolio doesn&apos;t exist or hasn&apos;t been published
              yet.
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.history.back()}
              data-ocid="portfolio.secondary_button"
            >
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <TemplateRenderer templateKey={templateKey} portfolio={portfolio} />
      <Footer />
    </div>
  );
}
