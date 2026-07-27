"use client";
import HeroSection from "@/components/HeroSection";
import Navbar from "@/components/Navbar";
import TechMarquee from "@/components/TechMarquee";
import Image from "next/image";
import { useState } from "react";

export default function Home() {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar isOpen={isOpen} setIsOpen={setIsOpen}/>
      <div className="flex-1 flex flex-col">
        <HeroSection isOpen={isOpen}/>
        <TechMarquee isOpen={isOpen}/>
      </div>
    </div>
  );
}
