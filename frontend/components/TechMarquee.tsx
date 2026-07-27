import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { useRef } from "react"

const TECH_STACK = [
  "React", "Next.js", "FastAPI", "LangChain", "LangGraph", "ChromaDB", "Groq", "TypeScript", "Tailwind CSS"
]

export default function TechMarquee({isOpen}: {isOpen: Boolean}) {
    const wrapperRef = useRef(null)

    useGSAP(() => {
    gsap.from(wrapperRef.current, {
      opacity: 0,
      y: 30,
      duration: 2,
      ease: "power3.out",
    })
  }, [])

  return (
    <div ref={wrapperRef} className={` ${isOpen ? "blur" : "bg-tansparent"} block w-full overflow-hidden border-t border-[#242424] py-6 mt-auto bg-[#adf73f]`}>
      <div className="flex w-max animate-marquee gap-16">
        {[...TECH_STACK, ...TECH_STACK].map((tech, i) => (
          <span
            key={i}
            className="text-[#0F0F0F] text-sm tracking-widest uppercase whitespace-nowrap"
          >
            {tech}
          </span>
        ))}
      </div>
    </div>
  )
}