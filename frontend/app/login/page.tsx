"use client";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ArrowRight, Mail, Lock } from "lucide-react";
import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const containerRef = useRef(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter()

  useGSAP(() => {
    const tl = gsap.timeline();
    tl.from(".signin-eyebrow", {
      opacity: 0,
      y: 20,
      duration: 0.6,
      ease: "power3.out",
    })
      .from(
        ".signin-heading",
        { opacity: 0, y: 30, duration: 0.7, ease: "power3.out" },
        "-=0.3",
      )
      .from(
        ".signin-field",
        { opacity: 0, y: 20, duration: 0.5, stagger: 0.1, ease: "power3.out" },
        "-=0.3",
      )
      .from(
        ".signin-button",
        { opacity: 0, y: 20, duration: 0.5, ease: "power3.out" },
        "-=0.2",
      );
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:8000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.access_token);
        localStorage.setItem("token_type", data.token_type);
        router.push("/chat")
      } else {
        console.error("Login failed:", data.detail);
      }
    } catch (err) {
      console.error("Network error:", err);
    }

  };

  return (
    <div
      ref={containerRef}
      className="min-h-screen flex items-center justify-center px-6"
    >
      <div className="w-full max-w-sm flex flex-col">
        <div className="signin-eyebrow flex items-center gap-2 mb-6 justify-center">
          <div className="w-2 h-2 rounded-full bg-[#adf73f]" />
          <span className="text-xs tracking-widest text-[#888787] uppercase">
            Welcome back
          </span>
        </div>

        <h1 className="signin-heading text-4xl md:text-5xl text-center leading-tight mb-8">
          Log in to <span className="font-light text-[#c0bfbf]">continue</span>.
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="signin-field flex flex-col gap-2">
            <label className="text-xs tracking-widest text-[#888787] uppercase">
              Email
            </label>
            <div className="flex items-center gap-2 border border-[#242424] rounded-xl px-4 py-3 focus-within:border-[#adf73f] transition-colors">
              <Mail size={18} className="text-[#888787]" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="bg-transparent outline-none w-full text-sm placeholder:text-[#5a5a5a]"
                required
              />
            </div>
          </div>

          <div className="signin-field flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs tracking-widest text-[#888787] uppercase">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs text-[#888787] hover:text-[#adf73f] transition-colors"
              >
                Forgot?
              </Link>
            </div>
            <div className="flex items-center gap-2 border border-[#242424] rounded-xl px-4 py-3 focus-within:border-[#adf73f] transition-colors">
              <Lock size={18} className="text-[#888787]" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-transparent outline-none w-full text-sm placeholder:text-[#5a5a5a]"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="signin-button group relative overflow-hidden mt-2 px-6 py-3 rounded-xl bg-[#adf73f] text-black font-medium flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
          >
            <span>Sign in</span>
            <ArrowRight
              size={18}
              className="transition-transform group-hover:translate-x-1"
            />
          </button>
        </form>

        <p className="text-center text-sm text-[#888787] mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-[#adf73f] hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
