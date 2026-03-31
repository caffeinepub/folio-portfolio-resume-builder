import type { Education, Project, WorkExperience } from "@/backend";
import type { PortfolioDTO } from "@/backend";
import { Globe, Mail, Phone } from "lucide-react";
import { motion } from "motion/react";

interface TemplateProps {
  portfolio: PortfolioDTO;
}

export default function TemplateMinimal({ portfolio }: TemplateProps) {
  const { resume, displayName } = portfolio;
  const { personal, work, education, skills, projects } = resume;

  return (
    <main className="pt-28 pb-24">
      <div className="max-w-[720px] mx-auto px-8">
        {/* Hero */}
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="mb-16"
        >
          <div className="flex items-center gap-4 mb-6">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-primary-foreground flex-shrink-0"
              style={{ background: "oklch(0.58 0.22 var(--accent-hue, 265))" }}
            >
              <span className="text-primary-foreground font-display font-extrabold">
                {(personal.name || displayName).charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="font-display text-4xl font-extrabold text-foreground leading-tight">
                {personal.name || displayName}
              </h1>
              {personal.title && (
                <p className="text-primary font-medium mt-0.5">
                  {personal.title}
                </p>
              )}
            </div>
          </div>

          {personal.bio && (
            <p className="text-muted-foreground leading-relaxed text-base mb-6 max-w-xl">
              {personal.bio}
            </p>
          )}

          <div className="flex flex-wrap gap-5 text-sm text-muted-foreground">
            {personal.email && (
              <a
                href={`mailto:${personal.email}`}
                className="flex items-center gap-1.5 hover:text-primary transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                {personal.email}
              </a>
            )}
            {personal.phone && (
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" />
                {personal.phone}
              </span>
            )}
            {personal.website && (
              <a
                href={personal.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:text-primary transition-colors"
              >
                <Globe className="w-3.5 h-3.5" />
                {personal.website.replace(/^https?:\/\//, "")}
              </a>
            )}
          </div>
        </motion.header>

        {/* Work Experience */}
        {work.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-14"
          >
            <hr className="border-border mb-8" />
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-8">
              Work Experience
            </h2>
            <div className="space-y-10">
              {work.map((job: WorkExperience, i: number) => (
                <div
                  key={`work-${job.company}-${job.startDate}`}
                  data-ocid={`portfolio.work.item.${i + 1}`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 mb-2">
                    <div>
                      <h3 className="font-display font-bold text-foreground text-lg">
                        {job.role}
                      </h3>
                      <p className="text-primary text-sm font-medium">
                        {job.company}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
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
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-14"
          >
            <hr className="border-border mb-8" />
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-8">
              Education
            </h2>
            <div className="space-y-8">
              {education.map((edu: Education, i: number) => (
                <div
                  key={`edu-${edu.institution}-${edu.startYear}`}
                  data-ocid={`portfolio.education.item.${i + 1}`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
                    <div>
                      <h3 className="font-display font-bold text-foreground">
                        {edu.degree} {edu.field && `in ${edu.field}`}
                      </h3>
                      <p className="text-primary text-sm font-medium">
                        {edu.institution}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
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
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-14"
          >
            <hr className="border-border mb-8" />
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-8">
              Skills
            </h2>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill: string, i: number) => (
                <span
                  key={skill}
                  className="text-sm text-foreground"
                  data-ocid={`portfolio.skills.item.${i + 1}`}
                >
                  {i > 0 && <span className="text-border mr-2">/</span>}
                  {skill}
                </span>
              ))}
            </div>
          </motion.section>
        )}

        {/* Projects */}
        {projects.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-14"
          >
            <hr className="border-border mb-8" />
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-8">
              Projects
            </h2>
            <div className="space-y-8">
              {projects.map((proj: Project, i: number) => (
                <div
                  key={proj.name}
                  data-ocid={`portfolio.projects.item.${i + 1}`}
                >
                  <div className="flex items-baseline gap-3 mb-1">
                    <h3 className="font-display font-bold text-foreground">
                      {proj.name}
                    </h3>
                    {proj.url && (
                      <a
                        href={proj.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline"
                      >
                        {proj.url.replace(/^https?:\/\//, "")}
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
  );
}
