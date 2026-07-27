"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef } from "react";

export default function HeroSection({ isOpen }: { isOpen: Boolean }) {
  const heroRef = useRef(null);
  const router = useRouter()

  useGSAP(() => {
    gsap.from(".hero1", {
      opacity: 1,
      y: 100,
      duration: 1,
      ease: "power4.out",
    })
    gsap.from(".hero2", {
      opacity: 1,
      y: 100,
      duration: 1,
      ease: "power2.out",
    })
    gsap.from(".desc", {
      opacity: 1,
      y: 100,
      duration: 1,
      ease: "power1.out",
    })
    gsap.from(".try-now", {
        opacity: 0,
        duration: 1.5,
        ease: "back.inOut"
    })
  }, []);

  return (
    <div
      className={` ${isOpen ? "blur" : "bg-tansparent"} mx-8 my-5 flex flex-col justify-center md:justify-start md:grid md:grid-cols-2 md:mx-14 flex-1`}
    >
      <div className="flex flex-col mt-0 md:mt-15 ">
        <div className="flex flex-col  gap-3 md:gap-5 text-center md:text-start relative">
          <div className="overflow-hidden ">
            <h1 className="text-7xl md:text-[85px] md:leading-tight hero1">
              Ask your{" "}
              <span className="font-light text-[#c0bfbf]">documents</span>{" "}
              anything.
            </h1>
          </div>
          <div className="flex flex-col relative">
            <div className="overflow-hidden">
              <h1 className="text-3xl md:text-5xl text-[#424242] hero2">
                Get grounded answers, cited.
              </h1>
            </div>
            <div className="overflow-hidden">
              <p className="w-full max-w-xl mt-5 text-thin text-[#888787] desc">
                Upload a PDF, ask a question, and get an answer grounded in the
                exact page it came from, powered by agentic retrieval that
                checks its own work before responding."
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center md:justify-start mt-5 md:mt-3 try-now">
          <button className="mt-5 px-8 py-2 text-2xl md:px-6 md:py-3 bg-[#adf73f] text-black rounded-[20px] w-fit cursor-pointer" onClick={() => router.push("/signup")}>
            Try Now
          </button>
        </div>
      </div>
    </div>
  );
}

