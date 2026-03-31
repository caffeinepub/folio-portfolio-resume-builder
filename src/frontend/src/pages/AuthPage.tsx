import { Button } from "@/components/ui/button";
import { useInternetIdentity } from "@/hooks/useInternetIdentity";
import { useRouter } from "@tanstack/react-router";
import { Loader2, Lock, Shield, Zap } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";

export default function AuthPage() {
  const router = useRouter();
  const { identity, login, isLoggingIn, isInitializing } =
    useInternetIdentity();
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");

  useEffect(() => {
    if (identity && !isInitializing) {
      router.navigate({ to: "/dashboard" });
    }
  }, [identity, isInitializing, router]);

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background:
          "linear-gradient(135deg, #070A12 0%, #0B1020 50%, #060A18 100%)",
      }}
    >
      {/* Background glow effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full opacity-10"
          style={{
            background: "radial-gradient(ellipse, #4D7CFF 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-[400px] h-[300px] rounded-full opacity-8"
          style={{
            background: "radial-gradient(ellipse, #35C6FF 0%, transparent 70%)",
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
            style={{ background: "linear-gradient(135deg, #4D7CFF, #35C6FF)" }}
          >
            <Zap className="w-7 h-7 text-white" />
          </div>
          <h1
            className="font-display text-3xl font-bold mb-1"
            style={{ color: "#EAF0FF" }}
          >
            Folio
          </h1>
          <p className="text-sm" style={{ color: "#8FA0C6" }}>
            Portfolio & Resume Builder
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8"
          style={{
            background: "#0E1628",
            border: "1px solid #1B2A44",
            boxShadow: "0 32px 64px rgba(0,0,0,0.5)",
          }}
        >
          {/* Tabs */}
          <div
            className="flex rounded-xl p-1 mb-8"
            style={{ background: "#111B30", border: "1px solid #203255" }}
          >
            <button
              type="button"
              onClick={() => setActiveTab("signin")}
              className="flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200"
              style={{
                background:
                  activeTab === "signin"
                    ? "linear-gradient(135deg, #4D7CFF, #35C6FF)"
                    : "transparent",
                color: activeTab === "signin" ? "white" : "#8FA0C6",
              }}
              data-ocid="auth.tab"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("signup")}
              className="flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200"
              style={{
                background:
                  activeTab === "signup"
                    ? "linear-gradient(135deg, #4D7CFF, #35C6FF)"
                    : "transparent",
                color: activeTab === "signup" ? "white" : "#8FA0C6",
              }}
              data-ocid="auth.tab"
            >
              Sign Up
            </button>
          </div>

          {/* Content */}
          <div className="text-center mb-8">
            {activeTab === "signin" ? (
              <>
                <h2
                  className="text-xl font-bold mb-2"
                  style={{ color: "#EAF0FF" }}
                >
                  Welcome back
                </h2>
                <p className="text-sm" style={{ color: "#8FA0C6" }}>
                  Sign in securely with Internet Identity — no password needed
                </p>
              </>
            ) : (
              <>
                <h2
                  className="text-xl font-bold mb-2"
                  style={{ color: "#EAF0FF" }}
                >
                  Create your account
                </h2>
                <p className="text-sm" style={{ color: "#8FA0C6" }}>
                  Get started for free. Build and publish your portfolio in
                  minutes
                </p>
              </>
            )}
          </div>

          {/* Trust badges */}
          <div className="flex gap-4 justify-center mb-8">
            {[
              { icon: Shield, label: "Passwordless" },
              { icon: Lock, label: "Fully Secure" },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium"
                style={{
                  background: "#111B30",
                  border: "1px solid #203255",
                  color: "#8FA0C6",
                }}
              >
                <Icon className="w-3.5 h-3.5" style={{ color: "#4D7CFF" }} />
                {label}
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <Button
            type="button"
            onClick={login}
            disabled={isLoggingIn || isInitializing}
            className="w-full h-12 text-base font-semibold rounded-xl border-0"
            style={{
              background: "linear-gradient(135deg, #4D7CFF, #35C6FF)",
              color: "white",
              opacity: isLoggingIn || isInitializing ? 0.7 : 1,
            }}
            data-ocid="auth.primary_button"
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : activeTab === "signin" ? (
              "Sign In with Internet Identity"
            ) : (
              "Sign Up with Internet Identity"
            )}
          </Button>

          <p className="text-xs text-center mt-6" style={{ color: "#8FA0C6" }}>
            Internet Identity is ICP's secure, privacy-preserving authentication
            system. No email, no password, no tracking.
          </p>
        </div>

        {/* Back to home */}
        <div className="text-center mt-6">
          <button
            type="button"
            onClick={() => router.navigate({ to: "/" })}
            className="text-sm transition-colors hover:opacity-80"
            style={{ color: "#8FA0C6" }}
            data-ocid="auth.link"
          >
            ← Back to home
          </button>
        </div>
      </motion.div>
    </div>
  );
}
