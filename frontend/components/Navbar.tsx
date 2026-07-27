"use client";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ArrowUpRight, Menu, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import ScrambleTextPlugin from "gsap/ScrambleTextPlugin";

gsap.registerPlugin(ScrambleTextPlugin)

function NavLink({ children }: { children: string }) {
  const innerRef = useRef<HTMLDivElement>(null);

  const handleEnter = () => {
    gsap.to(innerRef.current, { y: "-50%", duration: 0.5, ease: "power3.out" });
  };
  const handleLeave = () => {
    gsap.to(innerRef.current, { y: "0%", duration: 0.5, ease: "power3.out" });
  };

  return (
    <div className="relative overflow-hidden h-[1.2em] cursor-pointer" onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
      <div ref={innerRef} className="flex flex-col">
        <span>{children}</span>
        <span>{children}</span>
      </div>
    </div>
  );
}

function MagneticButton({ children }: { children: React.ReactNode }) {
  const btnRef = useRef<HTMLDivElement>(null);

  const handleMove = (e: React.MouseEvent) => {
    const rect = btnRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    gsap.to(btnRef.current, { x: x * 0.3, y: y * 0.3, duration: 0.3, ease: "power2.out" });
  };
  const handleLeave = () => {
    gsap.to(btnRef.current, { x: 0, y: 0, duration: 0.5, ease: "elastic.out(1, 0.3)" });
  };

  return (
    <div ref={btnRef} onMouseMove={handleMove} onMouseLeave={handleLeave}>
      {children}
    </div>
  );
}

function ScrambleText() {
  const titleRef = useRef(null);
  useGSAP(() => {
    gsap.from(titleRef.current, { scrambleText: "#%&$0", duration: 0.8 });
  }, []);

  return <h1 ref={titleRef} className="text-3xl text-black">Lumen</h1>;
}

export default function Navbar({
  isOpen,
  setIsOpen,
}: {
  isOpen: Boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
}) {
  const [isMounted, setIsMounted] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);
  const navContainer = useRef(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const linksRef = useRef<HTMLButtonElement[]>([]);
  const router = useRouter();

  useEffect(() => {
    setIsAuthed(!!localStorage.getItem("token"));
  }, []);

  const MOBILE_LINKS = isAuthed
    ? ["FEATURES", "PIPELINE", "LOG OUT"]
    : ["FEATURES", "PIPELINE", "SIGN IN", "SIGN UP"];

  useGSAP(() => {
    gsap.from(navContainer.current, { y: -20, opacity: 0, duration: 1, ease: "power4.out" });
  }, []);

  const openMenu = () => {
    setIsMounted(true);
    setIsOpen(true);
  };

  const closeMenu = () => {
    setIsOpen(false);
    gsap.to(menuRef.current, {
      y: -20,
      opacity: 0,
      duration: 0.35,
      ease: "power3.in",
      onComplete: () => setIsMounted(false),
    });
  };

  const toggleMenu = () => {
    isOpen ? closeMenu() : openMenu();
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("token_type");
    setIsAuthed(false);
    router.push("/");
  };

  useGSAP(() => {
    if (isOpen && menuRef.current) {
      gsap.fromTo(menuRef.current, { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: "power3.out" });
      gsap.fromTo(
        linksRef.current,
        { y: -12, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.35, stagger: 0.06, delay: 0.1, ease: "power3.out" }
      );
    }
  }, [isOpen]);

  return (
    <div className="flex justify-between items-center mx-8 my-5">
      <div className={`${isOpen ? "blur" : "bg-tansparent"}`}>
        <ScrambleText />
      </div>

      <div
        ref={navContainer}
        className={`hidden md:flex items-center justify-between rounded-full py-1 gap-5 text-[#414141] ${isOpen ? "bg-blur" : "bg-[#dfdfdf]"}`}
      >
        <div className="flex gap-5 pl-6">
          <NavLink>FEATURES</NavLink>
          <NavLink>PIPELINE</NavLink>
        </div>
        <div className="flex items-center gap-5 px-1">
          {isAuthed ? (
            <>
            <Link href="/dashboard">
                <NavLink>DASHBOARD</NavLink>
              </Link>
            <MagneticButton>
              <div
                className="flex items-center gap-1 cursor-pointer bg-[#adf73f] text-black rounded-[20px] px-3 py-2"
                onClick={handleLogout}
              >
                <h1 className="text-md">LOG OUT</h1>
                <ArrowUpRight size={18} color="#0F0F0F" />
              </div>
            </MagneticButton>
            </>
          ) : (
            <>
              <Link href="/login">
                <NavLink>SIGN IN</NavLink>
              </Link>
              <MagneticButton>
                <div
                  className="flex items-center gap-1 cursor-pointer bg-[#adf73f] text-black rounded-[20px] px-3 py-2"
                  onClick={() => router.push("/signup")}
                >
                  <h1 className="text-md">GET STARTED</h1>
                  <ArrowUpRight size={18} color="#0F0F0F" />
                </div>
              </MagneticButton>
            </>
          )}
        </div>
      </div>

      <div className="md:hidden flex items-center z-50">
        <button onClick={toggleMenu}>
          {isOpen ? <X size={25} /> : <Menu size={25} />}
        </button>
      </div>

      {isOpen && isMounted && (
        <div
          ref={menuRef}
          className="absolute top-16 right-5 bg-[#ffffff] rounded-lg flex flex-col justify-end items-center gap-2 min-w-35 p-4 text-xl z-40 opacity-0"
        >
          {MOBILE_LINKS.map((label, i) => (
            <button
              key={label}
              ref={(el) => {
                if (el) linksRef.current[i] = el;
              }}
              className="cursor-pointer opacity-0"
              onClick={() => {
                if (label === "LOG OUT") handleLogout();
                closeMenu();
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
