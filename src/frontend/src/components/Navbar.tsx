import { Button } from "@/components/ui/button";
import { useInternetIdentity } from "@/hooks/useInternetIdentity";
import { useRouter } from "@tanstack/react-router";
import { Menu, X, Zap } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

export default function Navbar() {
  const { identity, clear, isLoggingIn, isInitializing } =
    useInternetIdentity();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navigate = (path: string) => router.navigate({ to: path });

  const handleAuth = () => {
    if (identity) {
      navigate("/dashboard");
    } else {
      navigate("/auth");
    }
  };

  const handleLogout = () => {
    clear();
    navigate("/");
  };

  const navLinks = [
    { label: "Features", href: "#features" },
    { label: "Templates", href: "#templates" },
    { label: "Pricing", href: "#pricing" },
    { label: "Dashboard", href: "/dashboard", isRoute: true },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <button
          type="button"
          className="flex items-center gap-2.5"
          onClick={() => navigate("/")}
          data-ocid="nav.link"
        >
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Zap className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-lg text-foreground tracking-tight">
            Folio
          </span>
        </button>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={
                link.isRoute
                  ? (e) => {
                      e.preventDefault();
                      navigate(link.href);
                    }
                  : undefined
              }
              className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-secondary"
              data-ocid="nav.link"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right actions */}
        <div className="hidden md:flex items-center gap-3">
          {identity ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/dashboard")}
                data-ocid="nav.link"
              >
                Dashboard
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                data-ocid="nav.secondary_button"
              >
                Log Out
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/auth")}
                disabled={isLoggingIn || isInitializing}
                data-ocid="nav.link"
              >
                Log In
              </Button>
              <Button
                size="sm"
                onClick={handleAuth}
                disabled={isLoggingIn || isInitializing}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-glow-sm"
                data-ocid="nav.primary_button"
              >
                {isLoggingIn ? "Connecting..." : "Build Now – For Free"}
              </Button>
            </>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button
          type="button"
          className="md:hidden p-2 text-muted-foreground hover:text-foreground"
          onClick={() => setMobileOpen(!mobileOpen)}
          data-ocid="nav.toggle"
        >
          {mobileOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="md:hidden border-t border-border bg-background px-6 py-4 flex flex-col gap-2"
          >
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                data-ocid="nav.link"
              >
                {link.label}
              </a>
            ))}
            <div className="pt-2 flex flex-col gap-2">
              {identity ? (
                <Button
                  variant="outline"
                  onClick={handleLogout}
                  data-ocid="nav.secondary_button"
                >
                  Log Out
                </Button>
              ) : (
                <Button
                  onClick={() => navigate("/auth")}
                  data-ocid="nav.primary_button"
                >
                  Build Now – For Free
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
