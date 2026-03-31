import type { Education, Project, WorkExperience } from "@/backend";
import type { PortfolioDTO } from "@/backend";
import { Globe, Mail, Phone } from "lucide-react";
import { motion } from "motion/react";

interface TemplateProps {
  portfolio: PortfolioDTO;
}

export default function TemplateClassic({ portfolio }: TemplateProps) {
  const { resume, displayName } = portfolio;
  const { personal, work, education, skills, projects } = resume;

  return (
    <main className="pt-24 pb-24">
      <div className="max-w-[960px] mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-card border border-border rounded-2xl overflow-hidden"
        >
          {/* Header band */}
          <div className="px-8 py-7 border-b border-border">
            <h1 className="font-display text-3xl font-extrabold text-foreground mb-1">
              {personal.name || displayName}
            </h1>
            {personal.title && (
              <p className="text-primary font-semibold text-base mb-3">
                {personal.title}
              </p>
            )}
            <div className="flex flex-wrap gap-5 text-xs text-muted-foreground">
              {personal.email && (
                <a
                  href={`mailto:${personal.email}`}
                  className="flex items-center gap-1.5 hover:text-primary transition-colors"
                >
                  <Mail className="w-3 h-3" />
                  {personal.email}
                </a>
              )}
              {personal.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3 h-3" />
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
                  <Globe className="w-3 h-3" />
                  {personal.website.replace(/^https?:\/\//, "")}
                </a>
              )}
            </div>
            {personal.bio && (
              <p className="text-muted-foreground text-sm leading-relaxed mt-3 max-w-2xl">
                {personal.bio}
              </p>
            )}
          </div>

          {/* Two-column body */}
          <div className="flex flex-col md:flex-row">
            {/* Left column */}
            <div className="w-full md:w-[220px] flex-shrink-0 border-b md:border-b-0 md:border-r border-border p-6 space-y-8">
              {/* Education */}
              {education.length > 0 && (
                <motion.section
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4 }}
                >
                  <h3 className="text-xs font-bold uppercase tracking-widest text-primary pb-2 mb-4 border-b border-border">
                    Education
                  </h3>
                  <div className="space-y-5">
                    {education.map((edu: Education, i: number) => (
                      <div
                        key={`edu-${edu.institution}-${edu.startYear}`}
                        data-ocid={`portfolio.education.item.${i + 1}`}
                      >
                        <p className="font-semibold text-foreground text-sm leading-tight">
                          {edu.degree}
                        </p>
                        {edu.field && (
                          <p className="text-xs text-muted-foreground">
                            in {edu.field}
                          </p>
                        )}
                        <p className="text-primary text-xs font-medium mt-0.5">
                          {edu.institution}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {edu.startYear} — {edu.endYear}
                        </p>
                      </div>
                    ))}
                  </div>
                </motion.section>
              )}

              {/* Skills */}
              {skills.length > 0 && (
                <motion.section
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4 }}
                >
                  <h3 className="text-xs font-bold uppercase tracking-widest text-primary pb-2 mb-4 border-b border-border">
                    Skills
                  </h3>
                  <div className="flex flex-col gap-1.5">
                    {skills.map((skill: string, i: number) => (
                      <span
                        key={skill}
                        className="text-xs text-muted-foreground"
                        data-ocid={`portfolio.skills.item.${i + 1}`}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </motion.section>
              )}
            </div>

            {/* Right column */}
            <div className="flex-1 p-6 md:p-8 space-y-10">
              {/* Work Experience */}
              {work.length > 0 && (
                <motion.section
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4 }}
                >
                  <h3 className="text-xs font-bold uppercase tracking-widest text-primary pb-2 mb-6 border-b border-border">
                    Work Experience
                  </h3>
                  <div className="space-y-7">
                    {work.map((job: WorkExperience, i: number) => (
                      <div
                        key={`work-${job.company}-${job.startDate}`}
                        data-ocid={`portfolio.work.item.${i + 1}`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 mb-1">
                          <h4 className="font-display font-bold text-foreground">
                            {job.role}
                          </h4>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {job.startDate} — {job.endDate || "Present"}
                          </span>
                        </div>
                        <p className="text-primary text-sm font-medium mb-1.5">
                          {job.company}
                        </p>
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

              {/* Projects */}
              {projects.length > 0 && (
                <motion.section
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4 }}
                >
                  <h3 className="text-xs font-bold uppercase tracking-widest text-primary pb-2 mb-6 border-b border-border">
                    Projects
                  </h3>
                  <div className="space-y-5">
                    {projects.map((proj: Project, i: number) => (
                      <div
                        key={proj.name}
                        data-ocid={`portfolio.projects.item.${i + 1}`}
                      >
                        <div className="flex items-baseline gap-3 mb-1">
                          <h4 className="font-display font-bold text-foreground">
                            {proj.name}
                          </h4>
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
          </div>
        </motion.div>
      </div>
    </main>
  );
}
