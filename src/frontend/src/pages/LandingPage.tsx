import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useInternetIdentity } from "@/hooks/useInternetIdentity";
import { useRouter } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Download,
  FileText,
  Globe,
  Sparkles,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";

const features = [
  {
    icon: FileText,
    title: "Resume Builder",
    description:
      "Craft a professional resume with guided sections for experience, education, skills, and projects. Export as styled PDF.",
  },
  {
    icon: Globe,
    title: "Live Portfolio",
    description:
      "Publish your portfolio as a live web page instantly. Share a link with recruiters and clients — no code required.",
  },
  {
    icon: BarChart3,
    title: "Analytics & Insights",
    description:
      "Track who's viewing your portfolio, where they're from, and which sections capture the most attention.",
  },
];

const freePlan = [
  "5 portfolio credits",
  "Standard templates",
  "Live portfolio page",
  "Basic resume builder",
  "Public portfolio link",
];

const proPlan = [
  "Unlimited credits",
  "Premium templates",
  "Custom domain support",
  "Advanced analytics",
  "Styled resume downloads",
  "Priority support",
  "Early access to new features",
];

export default function LandingPage() {
  const router = useRouter();
  const { login, identity, isLoggingIn } = useInternetIdentity();

  const handleCTA = () => {
    if (identity) {
      router.navigate({ to: "/dashboard" });
    } else {
      login();
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 60% 40% at 50% 20%, oklch(0.58 0.22 265 / 0.12) 0%, transparent 70%)",
          }}
        />
        <div className="max-w-[1200px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto mb-12"
          >
            <Badge
              variant="outline"
              className="mb-6 px-3 py-1.5 text-primary border-primary/30 bg-primary/10 font-medium"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              Now with AI-powered suggestions
            </Badge>
            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.1] tracking-tight text-foreground mb-6">
              Build Your Professional
              <br />
              <span
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.70 0.22 265), oklch(0.58 0.22 265))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Resume &amp; Portfolio
              </span>
              <br />
              in Minutes.
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-xl mx-auto">
              Create a stunning portfolio and resume that stands out. Share it
              with the world, track who&apos;s viewing it, and land your next
              opportunity.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={handleCTA}
                disabled={isLoggingIn}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base px-8 shadow-glow"
                data-ocid="hero.primary_button"
              >
                {isLoggingIn ? "Connecting..." : "Get Started For Free"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-border text-foreground hover:bg-secondary font-semibold text-base px-8"
                onClick={() =>
                  document
                    .getElementById("features")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
                data-ocid="hero.secondary_button"
              >
                See Features
              </Button>
            </div>
          </motion.div>

          {/* Product mockup */}
          <motion.div
            initial={{ opacity: 0, y: 48 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative rounded-2xl overflow-hidden border border-border shadow-card mx-auto max-w-5xl"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/20 pointer-events-none z-10" />
            <img
              src="/assets/generated/hero-resume-mockup.dim_1200x700.png"
              alt="Folio Resume Builder Interface"
              className="w-full object-cover"
            />
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-[1200px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-4xl font-bold text-foreground mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              All the tools to build, publish, and grow your professional
              presence in one place.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="bg-card border border-border rounded-2xl p-8 shadow-card hover:border-primary/40 transition-colors group"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-display text-xl font-semibold text-foreground mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-[1200px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-4xl font-bold text-foreground mb-4">
              Pricing
            </h2>
            <p className="text-muted-foreground text-lg max-w-md mx-auto">
              Start for free. Upgrade when you&apos;re ready.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Free */}
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-card border border-border rounded-2xl p-8 shadow-card"
            >
              <div className="mb-8">
                <h3 className="font-display text-xl font-bold text-foreground mb-2">
                  Free
                </h3>
                <div className="flex items-end gap-1 mb-3">
                  <span className="text-5xl font-display font-extrabold text-foreground">
                    $0
                  </span>
                  <span className="text-muted-foreground mb-2">/month</span>
                </div>
                <p className="text-muted-foreground text-sm">
                  Perfect for getting started.
                </p>
              </div>
              <ul className="space-y-3 mb-8">
                {freePlan.map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-3 text-sm text-muted-foreground"
                  >
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button
                onClick={handleCTA}
                variant="outline"
                className="w-full border-border hover:bg-secondary font-semibold"
                data-ocid="pricing.free.primary_button"
              >
                Get Started Free
              </Button>
            </motion.div>

            {/* Pro */}
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-card border-2 border-primary/50 rounded-2xl p-8 shadow-glow relative"
            >
              <Badge className="absolute -top-3 left-6 bg-primary text-primary-foreground font-semibold px-3 py-1">
                Most Popular
              </Badge>
              <div className="mb-8">
                <h3 className="font-display text-xl font-bold text-foreground mb-2">
                  Pro
                </h3>
                <div className="flex items-end gap-1 mb-3">
                  <span className="text-5xl font-display font-extrabold text-foreground">
                    $15
                  </span>
                  <span className="text-muted-foreground mb-2">/month</span>
                </div>
                <p className="text-muted-foreground text-sm">
                  For professionals and job seekers.
                </p>
              </div>
              <ul className="space-y-3 mb-8">
                {proPlan.map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-3 text-sm text-foreground"
                  >
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button
                onClick={handleCTA}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-glow-sm"
                data-ocid="pricing.pro.primary_button"
              >
                Get Pro Access
                <Zap className="w-4 h-4 ml-2" />
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Promo section */}
      <section className="py-24 px-6">
        <div className="max-w-[1200px] mx-auto">
          <div className="bg-card border border-border rounded-2xl p-12 grid md:grid-cols-2 gap-12 items-center shadow-card">
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <Badge
                variant="outline"
                className="mb-4 border-primary/30 bg-primary/10 text-primary"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Dynamic &amp; Editable
              </Badge>
              <h2 className="font-display text-4xl font-bold text-foreground mb-4 leading-tight">
                Your Dynamic Portfolio Awaits
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-8">
                Edit your resume and portfolio at any time. Changes go live
                instantly. No more sending stale PDFs — share a single link that
                always shows your latest work.
              </p>
              <Button
                size="lg"
                onClick={handleCTA}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-glow-sm"
                data-ocid="promo.primary_button"
              >
                Build Your Portfolio
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 32 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="rounded-xl overflow-hidden border border-border shadow-card"
            >
              <img
                src="/assets/generated/portfolio-preview-card.dim_600x400.png"
                alt="Portfolio Preview"
                className="w-full object-cover"
              />
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
