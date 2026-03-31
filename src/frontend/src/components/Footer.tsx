import { useRouter } from "@tanstack/react-router";
import { Github, Linkedin, Twitter, Zap } from "lucide-react";

const cls = "text-muted-foreground hover:text-foreground transition-colors";

export default function Footer() {
  const year = new Date().getFullYear();
  const hostname = encodeURIComponent(window.location.hostname);
  const caffeineUrl = `https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${hostname}`;
  const router = useRouter();

  return (
    <footer className="bg-card border-t border-border">
      <div className="max-w-[1200px] mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2">
            <button
              type="button"
              className="flex items-center gap-2.5 mb-4"
              onClick={() => router.navigate({ to: "/" })}
            >
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Zap className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-lg text-foreground">
                Folio
              </span>
            </button>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              Build stunning portfolios and resumes that get you hired. Stand
              out from the crowd.
            </p>
            <div className="flex gap-4 mt-6">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className={cls}
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className={cls}
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className={cls}
              >
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-4">
              Product
            </h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <a href="#features" className={cls}>
                  Features
                </a>
              </li>
              <li>
                <a href="#pricing" className={cls}>
                  Pricing
                </a>
              </li>
              <li>
                <a href="#templates" className={cls}>
                  Templates
                </a>
              </li>
              <li>
                <a href="/dashboard" className={cls}>
                  Dashboard
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-4">
              Company
            </h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <a href="/about" className={cls}>
                  About
                </a>
              </li>
              <li>
                <a href="/blog" className={cls}>
                  Blog
                </a>
              </li>
              <li>
                <a href="/careers" className={cls}>
                  Careers
                </a>
              </li>
              <li>
                <a href="/contact" className={cls}>
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-4">
              Resources
            </h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <a href="/docs" className={cls}>
                  Documentation
                </a>
              </li>
              <li>
                <a href="/help" className={cls}>
                  Help Center
                </a>
              </li>
              <li>
                <a href="/api" className={cls}>
                  API
                </a>
              </li>
              <li>
                <a href="/status" className={cls}>
                  Status
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            &copy; {year}. Built with &hearts; using{" "}
            <a
              href={caffeineUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors underline"
            >
              caffeine.ai
            </a>
          </p>
          <div className="flex gap-6 text-xs text-muted-foreground">
            <a href="/privacy" className={cls}>
              Privacy Policy
            </a>
            <a href="/terms" className={cls}>
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
