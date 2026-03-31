import type { Education, Project, WorkExperience } from "@/backend";
import type { PortfolioDTO } from "@/backend";
import { Globe, Mail, Phone } from "lucide-react";
import { motion } from "motion/react";

interface TemplateProps {
  portfolio: PortfolioDTO;
}

export default function TemplateCreative({ portfolio }: TemplateProps) {
  const { resume, displayName } = portfolio;
  const { personal, work, education, skills, projects } = resume;

  return (
    <main className="pt-16 pb-24 min-h-screen">
      <div className="max-w-[1100px] mx-auto px-4 md:px-8">
        <div className="flex flex-col md:flex-row gap-0">
          {/* Sidebar */}
          <motion.aside
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full md:w-[280px] flex-shrink-0 md:min-h-[calc(100vh-4rem)] md:sticky md:top-16 md:self-start"
          >
            <div className="bg-primary/5 border border-primary/10 rounded-2xl p-7 md:rounded-none md:border-0 md:bg-transparent md:p-0 md:pt-8 md:pr-8 md:pb-8">
              {/* Avatar */}
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/30 flex items-center justify-center text-3xl font-display font-extrabold text-primary-foreground mb-5">
                {(personal.name || displayName).charAt(0).toUpperCase()}
              </div>

              <h1 className="font-display text-2xl font-extrabold text-foreground leading-tight mb-1">
                {personal.name || displayName}
              </h1>
              {personal.title && (
                <p className="text-primary font-semibold text-sm mb-6">
                  {personal.title}
                </p>
              )}

              {/* Contact */}
              <div className="space-y-2.5 mb-8">
                {personal.email && (
                  <a
                    href={`mailto:${personal.email}`}
                    className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                    <span className="truncate">{personal.email}</span>
                  </a>
                )}
                {personal.phone && (
                  <span className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Phone className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                    {personal.phone}
                  </span>
                )}
                {personal.website && (
                  <a
                    href={personal.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Globe className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                    <span className="truncate">
                      {personal.website.replace(/^https?:\/\//, "")}
                    </span>
                  </a>
                )}
              </div>

              {/* Bio */}
              {personal.bio && (
                <p className="text-xs text-muted-foreground leading-relaxed mb-8">
                  {personal.bio}
                </p>
              )}

              {/* Skills */}
              {skills.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-primary mb-4">
                    Skills
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {skills.map((skill: string, i: number) => (
                      <span
                        key={skill}
                        className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium border border-primary/20"
                        data-ocid={`portfolio.skills.item.${i + 1}`}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.aside>

          {/* Main content */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex-1 pt-8 md:pl-10 md:border-l border-border space-y-16"
          >
            {/* Work Experience */}
            {work.length > 0 && (
              <section>
                <h2 className="font-display text-xs font-bold uppercase tracking-[0.2em] text-primary mb-10">
                  Work Experience
                </h2>
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-[3.5rem] top-0 bottom-0 w-px bg-border hidden sm:block" />
                  <div className="space-y-10">
                    {work.map((job: WorkExperience, i: number) => (
                      <motion.div
                        key={`work-${job.company}-${job.startDate}`}
                        initial={{ opacity: 0, x: 16 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: i * 0.08 }}
                        className="flex gap-6"
                        data-ocid={`portfolio.work.item.${i + 1}`}
                      >
                        {/* Year column */}
                        <div className="hidden sm:flex flex-col items-center w-14 flex-shrink-0 pt-1">
                          <span className="text-xs font-bold text-primary/70 tabular-nums">
                            {job.startDate.split("-")[0] || job.startDate}
                          </span>
                          <div className="w-2.5 h-2.5 rounded-full bg-primary mt-1.5 ring-2 ring-primary/20" />
                        </div>
                        {/* Content */}
                        <div className="flex-1">
                          <h3 className="font-display font-bold text-foreground text-lg leading-tight">
                            {job.role}
                          </h3>
                          <p className="text-primary font-semibold text-sm mb-1">
                            {job.company}
                          </p>
                          <p className="text-xs text-muted-foreground mb-2 sm:hidden">
                            {job.startDate} — {job.endDate || "Present"}
                          </p>
                          {job.description && (
                            <p className="text-muted-foreground text-sm leading-relaxed">
                              {job.description}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Education */}
            {education.length > 0 && (
              <section>
                <h2 className="font-display text-xs font-bold uppercase tracking-[0.2em] text-primary mb-10">
                  Education
                </h2>
                <div className="relative">
                  <div className="absolute left-[3.5rem] top-0 bottom-0 w-px bg-border hidden sm:block" />
                  <div className="space-y-8">
                    {education.map((edu: Education, i: number) => (
                      <motion.div
                        key={`edu-${edu.institution}-${edu.startYear}`}
                        initial={{ opacity: 0, x: 16 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: i * 0.08 }}
                        className="flex gap-6"
                        data-ocid={`portfolio.education.item.${i + 1}`}
                      >
                        <div className="hidden sm:flex flex-col items-center w-14 flex-shrink-0 pt-1">
                          <span className="text-xs font-bold text-primary/70 tabular-nums">
                            {edu.startYear}
                          </span>
                          <div className="w-2.5 h-2.5 rounded-full bg-primary mt-1.5 ring-2 ring-primary/20" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-display font-bold text-foreground">
                            {edu.degree} {edu.field && `in ${edu.field}`}
                          </h3>
                          <p className="text-primary font-semibold text-sm">
                            {edu.institution}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {edu.startYear} — {edu.endYear}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Projects */}
            {projects.length > 0 && (
              <section>
                <h2 className="font-display text-xs font-bold uppercase tracking-[0.2em] text-primary mb-8">
                  Projects
                </h2>
                <div className="space-y-6">
                  {projects.map((proj: Project, i: number) => (
                    <motion.div
                      key={proj.name}
                      initial={{ opacity: 0, y: 12 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: i * 0.08 }}
                      className="rounded-2xl border border-primary/10 bg-primary/5 p-6"
                      data-ocid={`portfolio.projects.item.${i + 1}`}
                    >
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <h3 className="font-display font-bold text-foreground text-lg">
                          {proj.name}
                        </h3>
                        {proj.url && (
                          <a
                            href={proj.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline flex-shrink-0"
                          >
                            {proj.url.replace(/^https?:\/\//, "")}
                          </a>
                        )}
                      </div>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {proj.description}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}
          </motion.div>
        </div>
      </div>
    </main>
  );
}
