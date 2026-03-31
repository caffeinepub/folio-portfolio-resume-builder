import type { Education, Project, WorkExperience } from "@/backend";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useActor } from "@/hooks/useActor";
import { usePortfolio } from "@/hooks/useQueries";
import { Principal } from "@icp-sdk/core/principal";
import { useParams } from "@tanstack/react-router";
import { useRouter } from "@tanstack/react-router";
import {
  AlertCircle,
  Briefcase,
  Code2,
  ExternalLink,
  FolderGit2,
  Globe,
  GraduationCap,
  Mail,
  Phone,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";

export default function PortfolioPage() {
  const { principalId } = useParams({ strict: false }) as {
    principalId: string;
  };
  const router = useRouter();
  const [principal, setPrincipal] = useState<Principal | null>(null);
  const [principalError, setPrincipalError] = useState(false);
  const { isFetching: actorLoading } = useActor();

  useEffect(() => {
    if (!principalId) return;
    try {
      setPrincipal(Principal.fromText(principalId));
    } catch {
      setPrincipalError(true);
    }
  }, [principalId]);

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

  const { resume, displayName, plan } = portfolio;
  const { personal, work, education, skills, projects } = resume;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="pt-24 pb-20">
        {/* Hero/Profile */}
        <section className="relative py-20 px-6 overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 50% 30% at 50% 0%, oklch(0.58 0.22 265 / 0.1) 0%, transparent 70%)",
            }}
          />
          <div className="max-w-[900px] mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary/40 flex items-center justify-center text-4xl font-display font-bold text-primary-foreground mx-auto mb-6">
                {displayName.charAt(0).toUpperCase() || "?"}
              </div>
              {plan === "pro" && (
                <Badge className="mb-4 bg-primary/20 text-primary border-primary/30">
                  Pro
                </Badge>
              )}
              <h1 className="font-display text-5xl font-extrabold text-foreground mb-3">
                {personal.name || displayName}
              </h1>
              {personal.title && (
                <p className="text-xl text-primary font-semibold mb-4">
                  {personal.title}
                </p>
              )}
              {personal.bio && (
                <p className="text-muted-foreground text-lg leading-relaxed max-w-2xl mx-auto mb-8">
                  {personal.bio}
                </p>
              )}
              <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
                {personal.email && (
                  <a
                    href={`mailto:${personal.email}`}
                    className="flex items-center gap-2 hover:text-primary transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                    {personal.email}
                  </a>
                )}
                {personal.phone && (
                  <span className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    {personal.phone}
                  </span>
                )}
                {personal.website && (
                  <a
                    href={personal.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 hover:text-primary transition-colors"
                  >
                    <Globe className="w-4 h-4" />
                    {personal.website.replace(/^https?:\/\//, "")}
                  </a>
                )}
              </div>
            </motion.div>
          </div>
        </section>

        <div className="max-w-[900px] mx-auto px-6 space-y-16">
          {/* Work Experience */}
          {work.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-primary" />
                </div>
                <h2 className="font-display text-2xl font-bold text-foreground">
                  Work Experience
                </h2>
              </div>
              <div className="space-y-6">
                {work.map((job: WorkExperience, i: number) => (
                  <div
                    key={`work-${job.company}-${job.startDate}`}
                    className="bg-card border border-border rounded-2xl p-6"
                    data-ocid={`portfolio.work.item.${i + 1}`}
                  >
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 mb-3">
                      <div>
                        <h3 className="font-semibold text-foreground text-lg">
                          {job.role}
                        </h3>
                        <p className="text-primary font-medium">
                          {job.company}
                        </p>
                      </div>
                      <span className="text-sm text-muted-foreground whitespace-nowrap">
                        {job.startDate} — {job.endDate || "Present"}
                      </span>
                    </div>
                    {job.description && (
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {job.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </motion.section>
          )}

          {/* Education */}
          {education.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-primary" />
                </div>
                <h2 className="font-display text-2xl font-bold text-foreground">
                  Education
                </h2>
              </div>
              <div className="space-y-4">
                {education.map((edu: Education, i: number) => (
                  <div
                    key={`edu-${edu.institution}-${edu.startYear}`}
                    className="bg-card border border-border rounded-2xl p-6"
                    data-ocid={`portfolio.education.item.${i + 1}`}
                  >
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {edu.degree} {edu.field && `in ${edu.field}`}
                        </h3>
                        <p className="text-primary font-medium">
                          {edu.institution}
                        </p>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {edu.startYear} — {edu.endYear}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>
          )}

          {/* Skills */}
          {skills.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Code2 className="w-5 h-5 text-primary" />
                </div>
                <h2 className="font-display text-2xl font-bold text-foreground">
                  Skills
                </h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill: string, i: number) => (
                  <Badge
                    key={skill}
                    className="bg-primary/10 text-primary border-primary/30 font-medium px-3 py-1.5"
                    data-ocid={`portfolio.skills.item.${i + 1}`}
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            </motion.section>
          )}

          {/* Projects */}
          {projects.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <FolderGit2 className="w-5 h-5 text-primary" />
                </div>
                <h2 className="font-display text-2xl font-bold text-foreground">
                  Projects
                </h2>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                {projects.map((proj: Project, i: number) => (
                  <div
                    key={proj.name}
                    className="bg-card border border-border rounded-2xl p-6"
                    data-ocid={`portfolio.projects.item.${i + 1}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-foreground">
                        {proj.name}
                      </h3>
                      {proj.url && (
                        <a
                          href={proj.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-primary transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {proj.description}
                    </p>
                  </div>
                ))}
              </div>
            </motion.section>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
