"use client";

import { MutableRefObject, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";


import {
  FaBars,
  FaArrowRight,
  FaMobileAlt,
  FaEnvelope,
  FaPaperPlane,
} from "react-icons/fa";

import { FaEye, FaPen } from "react-icons/fa";
import { assetPath } from "@/lib/paths";

function useLocalInView<T extends HTMLElement>({
  threshold = 0.3,
  triggerOnce = false,
}: {
  threshold?: number;
  triggerOnce?: boolean;
} = {}): { ref: MutableRefObject<T | null>; inView: boolean } {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isVisible = Boolean(entry?.isIntersecting);
        setInView(isVisible);
        if (isVisible && triggerOnce) observer.disconnect();
      },
      { threshold }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold, triggerOnce]);

  return { ref, inView };
}

function AnimatedCount({
  start = 0,
  end,
  suffix = "",
  duration = 1.2,
}: {
  start?: number;
  end: number;
  suffix?: string;
  duration?: number;
}) {
  const [value, setValue] = useState(start);

  useEffect(() => {
    let frameId = 0;
    const startedAt = performance.now();
    const durationMs = duration <= 20 ? duration * 1000 : duration;

    const tick = (now: number) => {
      const progress = Math.min((now - startedAt) / durationMs, 1);
      setValue(Math.round(start + (end - start) * progress));
      if (progress < 1) frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [duration, end, start]);

  return (
    <>
      {value}
      {suffix}
    </>
  );
}

export default function PortfolioPreview({
  isImageEditingMode = false,
  customImages = {},
  onEditImage,
  isButtonEditingMode = false,
  customButtons = {},
  onEditButton
}: {
  isImageEditingMode?: boolean;
  customImages?: Record<string, string>;
  onEditImage?: (id: string) => void;
  isButtonEditingMode?: boolean;
  customButtons?: Record<string, Record<string, any>>;
  onEditButton?: (id: string) => void;
} = {}) {
  const [innerMobileMenuOpen, setInnerMobileMenuOpen] = useState(false);

  const getCustomButtonStyle = (buttonId: string, defaultClassName: string) => {
    const props = customButtons?.[buttonId];
    if (!props) return { className: defaultClassName, style: {} };
    
    const w = (props.width as string) || '';
    const parsedW = (w !== '' && !isNaN(Number(w))) ? `${w}px` : w;
    const h = (props.height as string) || '';
    const parsedH = (h !== '' && !isNaN(Number(h))) ? `${h}px` : h;
    const bg = (props.backgroundColor as string) || '';
    const op = typeof props.opacity === 'number' ? props.opacity : 100;
    const variant = props.buttonVariant as string;
    const br = (props.borderRadius as string) || '6px';
    const parsedBr = (br !== '' && !isNaN(Number(br))) ? `${br}px` : br;
    const effect = props.effect as string;

    const style: React.CSSProperties = {
      borderRadius: variant === 'pill' ? '9999px' : parsedBr,
      opacity: op / 100,
      backdropFilter: effect === 'blur' ? 'blur(8px)' : undefined,
      boxShadow: props.dropShadow ? '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' : undefined,
      transform: `rotate(${props.rotation || 0}deg) scaleX(${props.flipH ? -1 : 1}) scaleY(${props.flipV ? -1 : 1})`,
    };

    if (parsedW && parsedW !== 'auto') style.width = parsedW;
    if (parsedH && parsedH !== 'auto') style.height = parsedH;
    if (bg) style.background = bg;
    if (props.padding !== undefined) style.padding = `${props.padding}px`;

    let className = defaultClassName;
    if (bg) {
      className = className.replace(/bg-gradient-to-r\s+from-\[[^\]]+\]\s+to-\[[^\]]+\]/, '');
      className = className.replace(/bg-\[[^\]]+\]/, '');
    }
    
    return { className: className.trim(), style };
  };

  const [heroImageProps] = useState({
    width: 165,
    height: 245,
    borderRadius: 50, // 50% for full round
    shadow: false,
    opacity: 100
  });

  //animations for stats and progress bars
  const { ref: skillsRef, inView: skillsInView } = useLocalInView<HTMLDivElement>({
    triggerOnce: false,
    threshold: 0.3,
  });

  const { ref: statsRef, inView: statsInView } = useLocalInView<HTMLDivElement>({
    triggerOnce: false,
    threshold: 0.3,
  });

  const { ref: processRef, inView: processInView } = useLocalInView<HTMLDivElement>({
    triggerOnce: true,
    threshold: 0.2,
  });

  const { ref: testimonialsRef, inView: testimonialsInView } = useLocalInView<HTMLDivElement>({
    triggerOnce: true,
    threshold: 0.2,
  });

  const stats = [
    { value: 5, suffix: "+", label: "Years of Experience" },
    { value: 120, suffix: "+", label: "Projects Done" },
    { value: 98, suffix: "%", label: "Client Satisfaction" },
  ];

  const skills = [
    { name: "Photoshop", value: 90, color: "#1a3636" },
    { name: "Figma", value: 80, color: "#e84b72" },
    { name: "HTML", value: 85, color: "#e44d26" },
    { name: "CSS", value: 75, color: "#264de4" },
  ];

  const processSteps = [
    {
      step: "01",
      title: "Discover",
      desc: "Map goals, user needs, brand tone, and the moments that matter most.",
    },
    {
      step: "02",
      title: "Design",
      desc: "Create clean wireframes, polished screens, and responsive interaction states.",
    },
    {
      step: "03",
      title: "Deliver",
      desc: "Prepare developer-ready assets with smooth handoff notes and launch support.",
    },
  ];

  const testimonials = [
    {
      quote: "The design felt premium, fast, and very easy for our team to present to clients.",
      name: "Aarav Mehta",
      role: "Product Lead",
    },
    {
      quote: "Every screen had a clear reason behind it. The final website looked sharp on all devices.",
      name: "Priya Shah",
      role: "Startup Founder",
    },
  ];

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (

    <main className="flex flex-col min-h-screen bg-white">
      {/* ====== MAIN BUILDER LAYOUT ====== */}
      <div className="flex flex-1">

        {/* MAIN CONTENT */}

        {/* <div className="flex-1 bg-white p-4 md:p-7 flex justify-center min-w-0 overflow-hidden"> */}
        <div className="flex-1 bg-white p-4 md:p-7 flex justify-center min-w-0">

          <div className="w-full max-w-[1200px] relative flex flex-col h-[calc(100vh-80px)] min-w-0">

            {/* Canvas Box */}

            {/* <div className="flex-1 overflow-y-auto min-w-0"> */}
            <div className="flex-1 overflow-y-auto min-w-0 relative z-0">
              <div className="w-full min-h-[530px] bg-[#F2F2F2] rounded-xl border-2 border-gray-300 flex flex-col relative portfolio-shell">


                {/* <div className="flex w-full flex-wrap items-center justify-between gap-2 sm:gap-4 px-3 sm:px-4 py-2 sm:py-3 md:px-8 xl:flex-nowrap border-b border-gray-300 bg-[#06224C] rounded-t-xl"> */}
                <div className="sticky top-0 z-50 backdrop-blur-md bg-[#06224C]/95 flex w-full flex-wrap items-center justify-between gap-2 sm:gap-4 px-3 sm:px-4 py-2 sm:py-3 md:px-8 xl:flex-nowrap border-b border-gray-300 rounded-t-xl">

                  {/* ✅ MOBILE LAYOUT */}
                  <div className="flex flex-col w-full lg:hidden gap-2">

                    {/* ROW 1 → Logo + Menu */}
                    {/* TOP ROW → Logo + Title + Menu */}
                    <div className="flex flex-wrap items-center justify-between w-full gap-2">

                      {/* LEFT → Logo */}
                      <Link
                        href="/landing"
                        className="flex h-7 w-[64px] sm:h-8 sm:w-[80px] items-center justify-center overflow-hidden rounded-[50%] bg-white px-1 sm:px-2 shrink-0"
                      >
                        <Image
                          src={assetPath("/stackly-logo.webp")}
                          alt="Stackly logo"
                          width={80}
                          height={24}
                          className="h-[12px] sm:h-[14px] object-contain"
                          unoptimized
                        />
                      </Link>

                      {/* CENTER → Title */}
                      <span className="text-base sm:text-lg font-semibold text-white text-center flex-1 min-w-[100px]">
                        Portfolio
                      </span>

                      {/* RIGHT → Menu */}
                      <button
                        onClick={() => setInnerMobileMenuOpen((v) => !v)}
                        className="h-8 w-8 border border-white/25 text-white rounded-md hover:bg-white/10 transition flex items-center justify-center shrink-0"
                      >
                        <FaBars />
                      </button>

                    </div>

                    {/* ROW 3 → Actions (NOW VISIBLE ON MOBILE ✅) */}
                    <div className="flex justify-center">
                      <div className="flex flex-wrap justify-center gap-2 w-full max-w-[220px]">

                        {/* Save Draft */}
                        <button className="px-3 py-1 text-xs font-semibold border border-gray-300 rounded-md text-white hover:bg-white hover:text-black transition">
                          Save Draft
                        </button>

                        {/* Preview */}
                        <a href="preview.html" className="px-3 py-1 text-xs font-semibold flex items-center gap-1 border border-gray-300 rounded-md text-white hover:bg-white hover:text-black transition">
                          Preview <FaEye className="text-[10px]" />
                        </a>

                      </div>
                    </div>

                  </div>

                  {/* ✅ DESKTOP (unchanged) */}
                  <div className="hidden lg:flex w-full items-center justify-between">

                    <div className="flex shrink-0 justify-start">
                      <Link href="/landing" className="flex h-10 min-w-[92px] items-center justify-center rounded-[50%] bg-white px-3">
                        <Image src={assetPath("/stackly-logo.webp")} alt="Stackly logo" width={92} height={28} className="h-[18px] w-auto" unoptimized />
                      </Link>
                    </div>

                    <div className="flex flex-1 justify-center px-4">
                      <span className="text-lg font-semibold text-white">Portfolio</span>
                    </div>


                    <div className="flex shrink-0 items-center gap-x-6">

                      {/* NAV LINKS */}
                      <div className="flex gap-x-6">
                        {/* {["Home", "About Me", "Projects", "Contacts"].map((item, i) => (
                          <button key={i} className="relative text-white text-sm group">
                            {item}
                            <span className="absolute left-0 -bottom-1 w-0 h-[2px] bg-white transition-all duration-300 group-hover:w-full"></span>
                          </button>
                        ))} */}
                        {[
                          { name: "Home", id: "home" },
                          { name: "About Me", id: "about" },
                          { name: "Projects", id: "projects" },
                          { name: "Contacts", id: "contact" },
                        ].map((item, i) => (
                          <button
                            key={i}
                            onClick={() => scrollToSection(item.id)}
                            className="relative text-white text-sm group"
                          >
                            {item.name}
                            <span className="absolute left-0 -bottom-1 w-0 h-[2px] bg-white transition-all duration-300 group-hover:w-full"></span>
                          </button>
                        ))}
                      </div>

                      {/* ACTION BUTTONS ✅ */}
                      <div className="flex border-2 border-gray-300 rounded-md overflow-hidden text-xs text-white font-bold">

                        <button className="px-2 py-1 hover:bg-white hover:text-black transition">
                          Save Draft
                        </button>

                        <div className="w-px border-1 border-gray-300"></div>

                        <a href="preview.html" className="px-2 py-1 flex items-center gap-1 hover:bg-white hover:text-black transition">
                          Preview <FaEye className="text-[10px]" />
                        </a>

                      </div>

                    </div>
                  </div>

                </div>

                {/* MOBILE MENU */}
                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${innerMobileMenuOpen ? "max-h-40 opacity-100" : "max-h-0 opacity-0"}`}>
                  <div className="px-3 pb-3 pt-2 bg-[#06224C] grid grid-cols-2 gap-2">
                    {/* {["Home", "About Us", "Projects", "Contact"].map((item, i) => (
                      <button key={i} onClick={() => setInnerMobileMenuOpen(false)} className="border border-white/25 px-3 py-2 text-xs text-white rounded-md hover:bg-white/10 transition hover:scale-105">
                        {item}
                      </button>
                    ))} */}
                    {[
                      { name: "Home", id: "home" },
                      { name: "About Us", id: "about" },
                      { name: "Projects", id: "projects" },
                      { name: "Contact", id: "contact" },
                    ].map((item, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          scrollToSection(item.id);
                          setInnerMobileMenuOpen(false);
                        }}
                        className="border border-white/25 px-3 py-2 text-xs text-white rounded-md hover:bg-white/10 transition hover:scale-105"
                      >
                        {item.name}
                      </button>
                    ))}
                  </div>
                </div>


                {/* HERO SECTION WRAPPER */}
                <div id="home" className="relative w-full overflow-hidden flex flex-col portfolio-hero">

                  {/* HERO CONTENT */}

                  <div className="flex-1 flex flex-col px-4 sm:px-6 md:px-8 lg:px-12 py-6 md:py-8 relative z-10">
                    <div className="flex flex-col lg:flex-row items-center lg:items-stretch justify-between w-full gap-8">

                      <div className="w-full lg:w-[50%] xl:w-[55%] shrink-0 flex flex-col relative z-30 text-center lg:text-left portfolio-hero-copy">
                        <div className="mx-auto lg:mx-0 mb-4 inline-flex w-max items-center gap-2 rounded-full border border-[#63e5ff]/60 bg-white/80 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#06224C] shadow-sm">
                          <span className="h-2 w-2 rounded-full bg-[#63e5ff] animate-pulse"></span>
                          Available for freelance work
                        </div>
                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mt-4 md:mt-6 text-gray-800 leading-snug md:leading-normal break-words whitespace-normal">
                          <div className="mb-2">Hello, I&apos;m</div>
                          <div className="text-[#63e5ff] mb-2 leading-snug break-words">Srinivas Pentakota</div>
                          <div className="leading-snug break-words">UI/UX Designer</div>
                        </h1>

                        <p className="text-gray-600 mt-4 md:mt-6 text-base md:text-lg max-w-xl mx-auto lg:mx-0 break-words relative z-20">
                          I design sleek digital products, landing pages, and brand experiences that feel clear, fast, and memorable.
                        </p>

                        {/* MOBILE BLOBS + IMAGE */}
                        <div className="lg:hidden mt-8 mb-4 flex justify-center px-4 sm:px-6 w-full">
                          <div className="relative w-full max-w-[220px]">

                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">

                              <div className="w-[90%] h-[90%] bg-gradient-to-r from-purple-500 via-blue-400 to-cyan-300 opacity-20 blur-2xl rounded-full"></div>

                              <div className="absolute w-[70%] h-[50%] bg-cyan-300 opacity-20 blur-2xl rounded-full"></div>

                              <div className="absolute w-[40%] h-[40%] bg-pink-400 opacity-20 rounded-full bottom-2 right-2"></div>

                              <div className="absolute w-[60%] h-[80%] bg-cyan-300 opacity-20 blur-2xl rounded-[60%_40%_55%_45%] -top-4 -left-4"></div>

                              <div className="absolute w-[65%] h-[95%] bg-white/70 rounded-[80px] rotate-[-30deg] shadow-md"></div>
                            </div>

                            <div className="relative mx-auto transition-all duration-300"
                              style={{
                                width: `${heroImageProps.width}px`,
                                height: `${heroImageProps.height}px`,
                                maxWidth: '100%',
                              }}>
                              <div className="absolute inset-0 overflow-hidden border-4 border-white z-10"
                                style={{
                                  borderRadius: `${heroImageProps.borderRadius}%`,
                                  boxShadow: heroImageProps.shadow ? '0 10px 25px rgba(0,0,0,0.3)' : 'none',
                                  opacity: heroImageProps.opacity / 100
                                }}>
                                <Image
                                  src={customImages["hero_image_1"] || assetPath("/portfoliologo.webp")}
                                  alt="Srinivas Pentakota - UI/UX Designer Portfolio"
                                  fill
                                  sizes="220px"
                                  className="w-full h-full object-cover"
                                  unoptimized
                                />
                              </div>
                              {isImageEditingMode && (
                                <button
                                  onClick={() => onEditImage?.("hero_image_1")}
                                  className="absolute -top-2 -right-2 bg-white/90 text-gray-800 p-2 rounded-full shadow-lg hover:bg-white hover:scale-110 transition-transform z-50 flex items-center justify-center cursor-pointer border border-gray-200"
                                  title="Edit Image"
                                >
                                  <FaPen size={12} />
                                </button>
                              )}
                            </div>

                          </div>
                        </div>


                        <div className="flex flex-wrap gap-4 mt-8 justify-center lg:justify-start">

                          <div className="relative inline-block">
                            <button
                              type="button"
                              onClick={() => scrollToSection("projects")}
                              className={getCustomButtonStyle("hero_btn_1", "w-40 flex justify-center items-center px-3 py-2 bg-gradient-to-r from-[#06224C] to-[#1A5BBC] text-white rounded-lg text-sm transition transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg outline-none focus:outline-none focus-visible:ring-4 focus-visible:ring-yellow-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#06224C]").className}
                              style={getCustomButtonStyle("hero_btn_1", "").style}
                            >
                              View My Works
                            </button>
                            {isButtonEditingMode && (
                              <button
                                onClick={() => onEditButton?.("hero_btn_1")}
                                className="absolute -top-3 -right-3 bg-white/90 text-gray-800 p-1.5 rounded-full shadow-lg hover:bg-white hover:scale-110 transition-transform z-50 flex items-center justify-center cursor-pointer border border-gray-200"
                                title="Edit Button"
                              >
                                <FaPen size={12} />
                              </button>
                            )}
                          </div>

                          <div className="relative inline-block">
                            <Link
                              href="/page-not-found"
                              className={getCustomButtonStyle("hero_btn_2", "w-40 flex justify-center items-center px-3 py-2 bg-gradient-to-r from-[#06224C] to-[#1A5BBC] text-white rounded-lg text-sm transition transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg outline-none focus:outline-none focus-visible:ring-4 focus-visible:ring-yellow-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#06224C]").className}
                              style={getCustomButtonStyle("hero_btn_2", "").style}
                            >
                              Download CV
                            </Link>
                            {isButtonEditingMode && (
                              <button
                                onClick={() => onEditButton?.("hero_btn_2")}
                                className="absolute -top-3 -right-3 bg-white/90 text-gray-800 p-1.5 rounded-full shadow-lg hover:bg-white hover:scale-110 transition-transform z-50 flex items-center justify-center cursor-pointer border border-gray-200"
                                title="Edit Button"
                              >
                                <FaPen size={12} />
                              </button>
                            )}
                          </div>

                        </div>

                        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-xl mx-auto lg:mx-0">
                          {["Research-led", "Pixel perfect", "Mobile first"].map((item, i) => (
                            <div
                              key={item}
                              className="portfolio-mini-card rounded-lg border border-white/80 bg-white/75 px-4 py-3 text-sm font-bold text-gray-800 shadow-sm backdrop-blur"
                              style={{ animationDelay: `${i * 90}ms` }}
                            >
                              {item}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* DESKTOP BLOBS */}
                      <div className="hidden lg:flex lg:w-[45%] xl:w-[40%] items-center justify-center relative min-h-[400px]">
                        <div className="relative w-full max-w-[400px] h-full flex items-center justify-center portfolio-portrait-wrap">
                          <div className="absolute w-[300px] h-[300px] bg-gradient-to-r from-purple-500 via-blue-400 to-cyan-300 opacity-20 blur-2xl rounded-full animate-[float_6s_ease-in-out_infinite]"></div>
                          <div className="absolute w-[200px] h-[150px] right-10 top-10 bg-cyan-300 opacity-20 blur-2xl rounded-full animate-[float_7s_ease-in-out_infinite]"></div>
                          <div className="absolute w-[100px] h-[100px] left-17 bottom-22 bg-pink-400 opacity-20 rounded-full animate-[float_5s_ease-in-out_infinite]"></div>
                          <div className="absolute w-[140px] h-[230px] bg-white/70 rounded-[80px] rotate-[-30deg] shadow-md animate-[float_6s_ease-in-out_infinite]"></div>
                          <div className="absolute -right-2 bottom-14 z-30 rounded-xl border border-white/80 bg-white/90 px-4 py-3 text-left shadow-xl portfolio-floating-badge">
                            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500">Focus</p>
                            <p className="text-sm font-extrabold text-gray-900">Human centered UI</p>
                          </div>
                          <div className="relative z-20 animate-[float_6s_ease-in-out_infinite] transition-all duration-300"
                            style={{
                              width: `${heroImageProps.width}px`,
                              height: `${heroImageProps.height}px`,
                            }}>
                            <div className="absolute inset-0 overflow-hidden border-4 border-white"
                                style={{
                                  borderRadius: `${heroImageProps.borderRadius}%`,
                                  boxShadow: heroImageProps.shadow ? '0 10px 25px rgba(0,0,0,0.3)' : 'none',
                                  opacity: heroImageProps.opacity / 100
                                }}>
                              <Image src={customImages["hero_image_1"] || assetPath("/portfoliologo.webp")} alt="Srinivas Pentakota - UI/UX Designer Portfolio" fill sizes="245px" className="w-full h-full object-cover" unoptimized />
                            </div>
                            {isImageEditingMode && (
                              <button
                                onClick={() => onEditImage?.("hero_image_1")}
                                className="absolute -top-2 -right-2 bg-white/90 text-gray-800 p-2 rounded-full shadow-lg hover:bg-white hover:scale-110 transition-transform z-50 flex items-center justify-center cursor-pointer border border-gray-200"
                                title="Edit Image"
                              >
                                <FaPen size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* STATS */}

                    <div ref={statsRef} className="flex flex-col sm:flex-row items-stretch justify-center gap-4 sm:gap-6 lg:gap-8 mt-12 md:mt-15 mb-2 w-full flex-wrap">
                      {stats.map((item, i) => (
                        <div
                          key={i}
                          className="portfolio-stat-card flex-1 min-w-[140px] sm:min-w-[160px] max-w-[280px] mx-auto sm:mx-0 bg-white py-4 min-h-[6rem] px-4 rounded-lg shadow-md flex flex-col items-center justify-center text-gray-700 transition transform hover:-translate-y-2 hover:shadow-xl text-center"
                          style={{ animationDelay: `${i * 110}ms` }}
                        >
                          <h5 className="text-2xl font-bold">
                            {statsInView ? (
                              <AnimatedCount
                                key={statsInView ? "start" : "reset"} // 👈 important fix
                                start={0}
                                end={item.value}
                                duration={2}
                                suffix={item.suffix}
                              />
                            ) : (
                              "0"
                            )}
                          </h5>

                          <span className="text-sm mt-1 break-words">{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
                {/* FLOAT ANIMATION */}
                <style jsx>{`
                  @keyframes float {
                    0% { transform: translateY(0px); }
                    50% { transform: translateY(-12px); }
                    100% { transform: translateY(0px); }
                  }

                  @keyframes portfolio-rise {
                    from { opacity: 0; transform: translateY(18px); }
                    to { opacity: 1; transform: translateY(0); }
                  }

                  @keyframes portfolio-slide-left {
                    from { opacity: 0; transform: translateX(-24px); }
                    to { opacity: 1; transform: translateX(0); }
                  }

                  @keyframes portfolio-glow {
                    0%, 100% { transform: scale(0.95); opacity: 0.6; }
                    50% { transform: scale(1.08); opacity: 0.95; }
                  }

                  .portfolio-shell {
                    background:
                      radial-gradient(circle at 12% 12%, rgba(99, 229, 255, 0.28), transparent 18rem),
                      radial-gradient(circle at 88% 18%, rgba(232, 75, 114, 0.13), transparent 18rem),
                      linear-gradient(180deg, #f8fbff 0%, #f2f2f2 34%, #f7fafc 100%);
                  }

                  .portfolio-hero::before {
                    content: "";
                    position: absolute;
                    inset: 0;
                    pointer-events: none;
                    background:
                      linear-gradient(115deg, rgba(255, 255, 255, 0.82), rgba(255, 255, 255, 0.28)),
                      radial-gradient(circle at 76% 38%, rgba(99, 229, 255, 0.2), transparent 16rem);
                  }

                  .portfolio-hero-copy {
                    animation: portfolio-slide-left 0.65s ease both;
                  }

                  .portfolio-mini-card,
                  .portfolio-stat-card,
                  .portfolio-service-card,
                  .portfolio-project-card {
                    animation: portfolio-rise 0.58s ease both;
                  }

                  .portfolio-portrait-wrap::before {
                    content: "";
                    position: absolute;
                    width: 18rem;
                    height: 18rem;
                    border-radius: 999px;
                    background: radial-gradient(circle, rgba(99, 229, 255, 0.35), transparent 64%);
                    animation: portfolio-glow 4.5s ease-in-out infinite;
                  }

                  .portfolio-floating-badge {
                    animation: float 5.5s ease-in-out infinite;
                  }

                  .portfolio-reveal {
                    opacity: 0;
                    transform: translateY(22px);
                    transition: opacity 650ms ease, transform 650ms ease;
                  }

                  .portfolio-reveal.is-visible {
                    opacity: 1;
                    transform: translateY(0);
                  }

                  @media (prefers-reduced-motion: reduce) {
                    .portfolio-hero-copy,
                    .portfolio-mini-card,
                    .portfolio-stat-card,
                    .portfolio-service-card,
                    .portfolio-project-card,
                    .portfolio-floating-badge,
                    .portfolio-portrait-wrap::before,
                    .portfolio-reveal {
                      animation: none !important;
                      transition: none !important;
                      opacity: 1;
                      transform: none;
                    }
                  }
                `}</style>


                {/* ABOUT SECTION */}
                {/* <div className="w-full bg-[#F2F2F2] px-6 md:px-12 lg:px-20 py-16 md:py-24"> */}
                <div id="about" className="w-full bg-[#F2F2F2] px-4 sm:px-6 md:px-12 lg:px-20 py-10 md:py-16">
                  <div className="flex items-center gap-2 mb-4">
                    <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">About</h2>
                    <span className="bg-[#63e5ff] text-gray-900 font-extrabold px-3 py-1 rounded-full text-2xl md:text-3xl tracking-tight leading-none">Me</span>
                  </div>

                  <h3 className="text-sm sm:text-base md:text-xl lg:text-2xl font-extrabold text-gray-800 mb-8 md:mb-16 max-w-full md:max-w-3xl leading-relaxed break-words text-center md:text-left">
                    Described Briefly My Professional Background Skills and Accomplishments
                  </h3>

                  {/* <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 border-b border-white pb-6"> */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 border-b border-white pb-6">

                    {/* LEFT → TEXT */}
                    <div className="flex flex-col justify-center">

                      <p className="font-extrabold text-gray-800 text-lg md:text-2xl mb-4 md:mb-6 leading-snug">
                        Hello! I&apos;m a UI/UX Designer providing awesome and modern design solutions for clients. My vision is to satisfy my clients.
                      </p>

                      <p className="text-gray-500 mb-6 md:mb-0 leading-relaxed text-sm md:text-lg">
                        I turn rough ideas into visual systems, interactive prototypes, and responsive layouts that help users move confidently from first impression to final action.
                      </p>

                    </div>


                    <div ref={skillsRef} className="space-y-6 md:space-y-8">
                      {skills.map((skill, index) => (
                        <div key={skill.name}>
                          <div className="flex justify-between mb-2 md:mb-3">
                            <span className="font-bold text-gray-800 text-sm md:text-lg">
                              {skill.name}
                            </span>
                            <span className="text-gray-500 text-xs md:text-sm">
                              {skill.value}%
                            </span>
                          </div>

                          <div className="w-full bg-gray-300 h-[4px] md:h-[6px] overflow-hidden">
                            <div
                              className="h-full transition-all duration-1000 ease-out"
                              style={{
                                width: skillsInView ? `${skill.value}%` : "0%",
                                transitionDelay: `${index * 150}ms`,
                                backgroundColor: skill.color
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                  </div>
                </div>

                {/* EDUCATION & EXPERIENCE SECTION */}
                <div className="w-full bg-[#F2F2F2] px-4 sm:px-6 md:px-12 lg:px-20 pb-12 md:pb-16 lg:pb-24">

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 lg:gap-20">

                    {/* EDUCATION */}
                    <div>
                      <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-4 md:mb-6 border-b border-gray-200 pb-3">
                        Education
                      </h3>

                      <div className="space-y-5 md:space-y-6">

                        {[
                          { id: "01", date: "March 2013 - 2016", title: "Computer Science" },
                          { id: "02", date: "March 2017 - 2018", title: "Graphic Design" },
                          { id: "03", date: "June 2019 - 2021", title: "Web Development" },
                        ].map((item) => (
                          <div
                            key={item.id}
                            className="portfolio-reveal is-visible flex items-start sm:items-center gap-4 sm:gap-6 border-b border-gray-200 pb-4 sm:pb-6"
                          >
                            {/* NUMBER */}
                            <div className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 bg-[#1a3636] text-white rounded-full flex justify-center items-center font-bold text-xs sm:text-sm">
                              {item.id}
                            </div>

                            {/* TEXT */}
                            <div className="flex-1">
                              <p className="text-gray-500 text-xs sm:text-sm mb-1 font-medium break-words">
                                {item.date}
                              </p>
                              <h4 className="text-base sm:text-lg font-bold text-gray-800 break-words">
                                {item.title}
                              </h4>
                            </div>
                          </div>
                        ))}

                      </div>
                    </div>

                    {/* EXPERIENCE */}
                    <div>
                      <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-4 md:mb-6 border-b border-gray-200 pb-3">
                        Experience
                      </h3>

                      <div className="space-y-5 md:space-y-6">

                        {[
                          { id: "01", date: "January 2021 - 2022", title: "Microsoft" },
                          { id: "02", date: "March 2022 - 2023", title: "Google Inc" },
                        ].map((item) => (
                          <div
                            key={item.id}
                            className="portfolio-reveal is-visible flex items-start sm:items-center gap-4 sm:gap-6 border-b border-gray-200 pb-4 sm:pb-6"
                          >
                            {/* NUMBER */}
                            <div className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 bg-[#1a3636] text-white rounded-full flex justify-center items-center font-bold text-xs sm:text-sm">
                              {item.id}
                            </div>

                            {/* TEXT */}
                            <div className="flex-1">
                              <p className="text-gray-500 text-xs sm:text-sm mb-1 font-medium break-words">
                                {item.date}
                              </p>
                              <h4 className="text-base sm:text-lg font-bold text-gray-800 break-words">
                                {item.title}
                              </h4>
                            </div>
                          </div>
                        ))}

                      </div>
                    </div>

                  </div>
                </div>
                {/* </div> */}

                {/* MY SERVICES SECTION */}
                <div className="w-full bg-[#F2F2F2] px-6 md:px-12 lg:px-20 pb-16 lg:pb-24">
                  <div className="text-center mb-16">
                    {/* <h3 className="text-base font-bold flex items-center justify-center gap-1 mb-4 text-gray-800 tracking-wide"> */}
                    <div className="flex items-center gap-2 mb-4">
                      <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">My</h2>
                      <span className="bg-[#63e5ff] text-gray-900 font-extrabold px-3 py-1 rounded-full text-2xl md:text-3xl tracking-tight leading-none">Services</span>
                    </div>
                    {/* <h3 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 max-w-2xl mx-auto leading-tight"> */}

                    <h3 className="text-sm sm:text-base md:text-xl lg:text-2xl font-extrabold text-gray-800 mb-8 md:mb-16 max-w-full md:max-w-3xl leading-relaxed break-words text-center md:text-left">
                      Provide Wide Range of  Digital Services
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 max-w-7xl mx-auto">
                    {[
                      { id: "01", title: "Web Development", desc: "Responsive, clean websites with purposeful layouts and polished front-end details." },
                      { id: "02", title: "UI / UX DESIGN", desc: "User journeys, wireframes, visual systems, and prototypes that make products easier to use." },
                      { id: "03", title: "eCommerce Solution", desc: "Storefront experiences built around discovery, trust, and smooth checkout flows." },
                      { id: "04", title: "CMS Development", desc: "Editable content structures for teams that need control after launch." },
                      { id: "05", title: "Web Design", desc: "Landing pages and brand sites with strong hierarchy, spacing, and conversion focus." },
                      { id: "06", title: "3D Printing", desc: "Product visuals and concept presentations that help technical ideas feel tangible." },
                      { id: "07", title: "App Development", desc: "Mobile-first screens, component states, and interaction patterns for product teams." },
                      { id: "08", title: "Marketing", desc: "Campaign visuals, social assets, and creative direction for stronger digital presence." },
                    ].map((service) => (
                      <div key={service.id} className="portfolio-service-card border border-gray-200 rounded-[20px] p-5 sm:p-6 lg:p-8 flex flex-col items-start transition-all duration-300 hover:-translate-y-2 hover:shadow-xl bg-white group hover:border-gray-300 cursor-pointer h-full" style={{ animationDelay: `${Number(service.id) * 45}ms` }}>
                        <div className="w-12 h-12 mb-4 sm:mb-6 flex items-center justify-center text-gray-800 shrink-0">
                          {service.id === "01" && <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>}
                          {service.id === "02" && <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>}
                          {service.id === "03" && <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>}
                          {service.id === "04" && <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line><circle cx="12" cy="10" r="2"></circle></svg>}
                          {service.id === "05" && <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"></path><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path><path d="M2 2l7.586 7.586"></path></svg>}
                          {service.id === "06" && <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>}
                          {service.id === "07" && <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>}
                          {service.id === "08" && <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1h1.76a1 1 0 0 1 .84.45l2.4 3.6a1 1 0 0 1-.84 1.55H11z"></path><path d="M18 10h-2V6a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-4z"></path></svg>}
                        </div>
                        <h4 className="text-[17px] font-bold text-gray-900 mb-2 sm:mb-3">{service.title}</h4>
                        <p className="text-gray-500 text-[13px] leading-relaxed mb-6 sm:mb-8 flex-1">
                          {service.desc}
                        </p>
                        <div className="mt-auto flex items-center gap-1.5 w-full shrink-0">
                          <div className="w-[30px] h-[30px] rounded-full bg-[#1a3636] text-white flex items-center justify-center text-[11px] font-semibold shrink-0 group-hover:bg-[#63e5ff] group-hover:text-gray-900 transition-colors">
                            {service.id}
                          </div>
                          <div className="flex items-center text-gray-300 group-hover:text-gray-900 transition-colors">
                            <span className="w-8 h-[1px] bg-current"></span>
                            <FaArrowRight size={10} className="-ml-[2px]" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* DESIGN PROCESS SECTION */}
                <div ref={processRef} className="w-full bg-[#F2F2F2] px-4 sm:px-6 md:px-12 lg:px-20 pb-16 lg:pb-24">
                  <div className="overflow-hidden rounded-2xl bg-[#06224C] px-5 py-8 sm:px-8 md:px-10 md:py-12 text-white shadow-xl relative">
                    <div className="absolute right-[-5rem] top-[-5rem] h-56 w-56 rounded-full bg-[#63e5ff]/20 blur-3xl"></div>
                    <div className="absolute left-[-4rem] bottom-[-5rem] h-48 w-48 rounded-full bg-white/10 blur-3xl"></div>
                    <div className="relative grid grid-cols-1 lg:grid-cols-[0.9fr_1.4fr] gap-8 lg:gap-12 items-start">
                      <div className={`portfolio-reveal ${processInView ? "is-visible" : ""}`}>
                        <div className="flex items-center gap-2 mb-4">
                          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Design</h2>
                          <span className="bg-[#63e5ff] text-gray-900 font-extrabold px-3 py-1 rounded-full text-2xl md:text-3xl tracking-tight leading-none">Process</span>
                        </div>
                        <p className="text-sm md:text-base text-blue-100 leading-relaxed max-w-md">
                          A simple workflow keeps every project moving from rough idea to polished launch without losing the user&apos;s needs along the way.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {processSteps.map((item, i) => (
                          <div
                            key={item.step}
                            className={`portfolio-reveal rounded-xl border border-white/15 bg-white/10 p-5 backdrop-blur transition hover:-translate-y-1 hover:bg-white/15 ${processInView ? "is-visible" : ""}`}
                            style={{ transitionDelay: `${i * 120}ms` }}
                          >
                            <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-[#63e5ff] text-sm font-extrabold text-[#06224C]">
                              {item.step}
                            </div>
                            <h3 className="mb-2 text-lg font-extrabold">{item.title}</h3>
                            <p className="text-sm leading-relaxed text-blue-100">{item.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* MY PROJECTS SECTION */}

                <div id="projects" className="w-full bg-[#F2F2F2] px-0 md:px-6 lg:px-12 pb-16 lg:pb-24 relative overflow-hidden">

                  {/* <div className="px-6 md:px-6 lg:px-8 mb-12">
                    <h2 className="text-base font-bold flex items-center gap-1 mb-4 text-gray-800 tracking-wide w-max">
                      My <span className="bg-[#c4ff0b] text-gray-900 px-2 py-0.5 rounded-full text-sm font-extrabold ml-1 leading-none shadow-sm flex items-center h-6">Projects</span>
                    </h2>
                    <h3 className="text-3xl md:text-4xl lg:text-4xl font-extrabold text-gray-900 max-w-2xl leading-[1.15]">
                      Showcase Your Talent with Our <br className="hidden md:block" /> Latest Works
                    </h3>
                  </div> */}
                  <div className="text-center mb-16">
                    {/* <h3 className="text-base font-bold flex items-center justify-center gap-1 mb-4 text-gray-800 tracking-wide"> */}
                    <div className="flex items-center gap-2 mb-4">
                      <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">My</h2>
                      <span className="bg-[#63e5ff] text-gray-900 font-extrabold px-3 py-1 rounded-full text-2xl md:text-3xl tracking-tight leading-none">Projects</span>
                    </div>
                    {/* <h3 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 max-w-2xl mx-auto leading-tight"> */}

                    <h3 className="text-sm sm:text-base md:text-xl lg:text-2xl font-extrabold text-gray-800 mb-8 md:mb-16 max-w-full md:max-w-3xl leading-relaxed break-words text-center md:text-left">
                      Showcase Your Talent with Our <br className="hidden md:block" /> Latest Works
                    </h3>
                  </div>


                  <div
                    id="projects-slider"
                    className="w-full overflow-x-auto flex gap-4 sm:gap-6 px-4 sm:px-6 lg:px-8 pb-8 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden scroll-smooth"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  >
                    {[
                      {
                        tag: "Graphics Design",
                        title: "UI / UX Mobile App Design",
                        img: "https://images.unsplash.com/photo-1542744094-3a31f272c490?w=500&h=500&fit=crop"
                      },
                      {
                        tag: "UI UX Design",
                        title: "Website Template Design",
                        img: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=500&h=500&fit=crop"
                      },
                      {
                        tag: "Programming",
                        title: "ISO App Development",
                        img: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=500&h=500&fit=crop"
                      },
                      {
                        tag: "Graphics Design",
                        title: "Handcraft With Palm Fan",
                        img: "https://images.unsplash.com/photo-1542744094-3a31f272c490?w=500&h=500&fit=crop"
                      },
                      {
                        tag: "Marketing",
                        title: "Social Media Marketing",
                        img: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=500&h=500&fit=crop"
                      },
                      {
                        tag: "Development",
                        title: "Full Stack Web Application",
                        img: "https://images.unsplash.com/photo-1555421689-491a97ff2040?w=500&h=500&fit=crop"
                      }
                    ].map((proj, i) => (
                      <div key={i} className="portfolio-project-card flex flex-col flex-none w-[240px] sm:w-[260px] max-w-[80vw] shrink-0 snap-start cursor-pointer group" style={{ animationDelay: `${i * 80}ms` }}>
                        <div className="w-full aspect-square rounded-[20px] mb-4 sm:mb-5 relative border border-gray-100 shadow-sm">
                          <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors z-10 w-full h-full rounded-[20px] pointer-events-none"></div>
                          <div className="absolute inset-0 overflow-hidden rounded-[20px]">
                            <Image src={customImages[`project_image_${i}`] || proj.img} alt={proj.title} fill sizes="260px" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" unoptimized />
                          </div>
                          {isImageEditingMode && (
                            <button
                              onClick={(e) => { e.stopPropagation(); onEditImage?.(`project_image_${i}`); }}
                              className="absolute top-3 right-3 bg-white/90 text-gray-800 p-2 rounded-full shadow-lg hover:bg-white hover:scale-110 transition-transform z-50 flex items-center justify-center cursor-pointer border border-gray-200"
                              title="Edit Image"
                            >
                              <FaPen size={14} />
                            </button>
                          )}
                        </div>
                        <div className="flex items-start mb-3">
                          <span className="bg-[#63e5ff] border border-gray-900 text-gray-900 px-3.5 py-1.5 rounded-full text-[11px] font-semibold leading-none">
                            {proj.tag}
                          </span>
                        </div>
                        <h4 className="font-bold text-[15px] text-gray-900 leading-snug group-hover:text-[#1a3636] transition-colors mt-1">{proj.title}</h4>
                      </div>
                    ))}
                  </div>


                  <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mt-4 sm:mt-6 w-full relative px-4 sm:px-8">
                    <button
                      onClick={() => {
                        const slider = document.getElementById('projects-slider');
                        if (slider) slider.scrollBy({ left: -280, behavior: 'smooth' });
                      }}
                      className="flex items-center justify-center p-2 group hover:opacity-70 transition-opacity cursor-pointer"
                      aria-label="Slide Left"
                    >
                      <svg width="40" height="16" viewBox="0 0 60 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[40px] sm:w-[60px]">
                        <path d="M10 5L5 10L10 15M5 10H55" stroke="#1a3636" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                    <button
                      onClick={() => {
                        const slider = document.getElementById('projects-slider');
                        if (slider) slider.scrollBy({ left: 280, behavior: 'smooth' });
                      }}
                      className="flex items-center justify-center p-2 group hover:opacity-70 transition-opacity cursor-pointer"
                      aria-label="Slide Right"
                    >
                      <svg width="40" height="16" viewBox="0 0 60 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[40px] sm:w-[60px]">
                        <path d="M50 5L55 10L50 15M55 10H5" stroke="#1a3636" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>

                    {/* <button
                      className="md:absolute right-4 md:right-8 bg-[#1a3636] text-white w-10 h-10 rounded-full flex items-center justify-center shadow-lg hover:-translate-y-1 transition-transform ml-auto md:ml-0 shrink-0"
                      aria-label="Scroll to top"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>
                    </button> */}
                  </div>
                </div>

                {/* TESTIMONIALS SECTION */}
                <div ref={testimonialsRef} className="w-full bg-[#F2F2F2] px-4 sm:px-6 md:px-12 lg:px-20 pb-16 lg:pb-24">
                  <div className="grid grid-cols-1 lg:grid-cols-[0.8fr_1.2fr] gap-6 lg:gap-10 items-stretch">
                    <div className={`portfolio-reveal rounded-2xl bg-white p-6 md:p-8 shadow-lg border border-gray-100 ${testimonialsInView ? "is-visible" : ""}`}>
                      <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1a3636] mb-4">Client Words</p>
                      <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight mb-4">
                        Designs that feel clear before they feel clever.
                      </h2>
                      <p className="text-gray-600 text-sm md:text-base leading-relaxed">
                        Strong visuals are only useful when they help people understand, trust, and take action.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {testimonials.map((item, i) => (
                        <div
                          key={item.name}
                          className={`portfolio-reveal rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl ${testimonialsInView ? "is-visible" : ""}`}
                          style={{ transitionDelay: `${i * 140}ms` }}
                        >
                          <div className="mb-5 text-5xl font-black leading-none text-[#63e5ff]">“</div>
                          <p className="mb-6 text-sm leading-relaxed text-gray-600">{item.quote}</p>
                          <div className="flex items-center gap-3">
                            <div className="h-11 w-11 rounded-full bg-[#06224C] text-white flex items-center justify-center text-sm font-black">
                              {item.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-extrabold text-gray-900">{item.name}</p>
                              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{item.role}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* CONTACT SECTION */}
                <div id="contact" className="w-full bg-[#F2F2F2] px-4 sm:px-6 md:px-12 lg:px-20 py-12 sm:py-16 lg:py-24 relative border-t border-gray-100">
                  <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 lg:gap-20 items-start lg:items-center">

                    <div>
                      {/* <h2 className="text-base font-bold flex items-center gap-1 mb-4 text-gray-800 tracking-wide w-max">
                        Get In <span className="bg-[#c4ff0b] text-gray-900 px-2 py-0.5 rounded-full text-sm font-extrabold ml-1 leading-none shadow-sm flex items-center h-6">Touch</span>
                      </h2> */}
                      <div className="flex items-center gap-2 mb-4">
                        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">Get In</h2>
                        <span className="bg-[#63e5ff] text-gray-900 font-extrabold px-3 py-1 rounded-full text-2xl md:text-3xl tracking-tight leading-none">Touch</span>
                      </div>
                      <h3 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 max-w-2xl leading-[1.15] mb-6">
                        Let’s build something <br className="hidden md:block" />  great together.
                      </h3>
                      <p className="text-gray-600 mb-8 max-w-md">
                        Fill out the form or reach out via email to discuss how we can work together to bring your ideas to life.
                      </p>

                      <div className="space-y-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 text-[#1a3636]">
                            <FaEnvelope size={18} />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Email</p>
                            <p className="text-gray-900 font-bold">hello@example.com</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 text-[#1a3636]">
                            <FaMobileAlt size={18} />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Phone</p>
                            <p className="text-gray-900 font-bold">+1 (555) 000-0000</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 md:p-8 shadow-xl shadow-gray-200/50 border border-gray-100">
                      <form className="space-y-4 sm:space-y-5" onSubmit={(e) => e.preventDefault()}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                          <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1.5 ml-1">Your Name</label>
                            <input type="text" placeholder="John Doe" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#63e5ff] focus:border-transparent transition-all" />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1.5 ml-1">Your Email</label>
                            <input type="email" placeholder="john@example.com" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#63e5ff] focus:border-transparent transition-all" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1.5 ml-1">Subject</label>
                          <input type="text" placeholder="Web Design Inquiry" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#63e5ff] focus:border-transparent transition-all" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1.5 ml-1">Message</label>
                          <textarea rows={4} placeholder="Tell us about your project..." className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#63e5ff] focus:border-transparent transition-all resize-none"></textarea>
                        </div>
                        <div className="relative">
                          <button 
                            className={getCustomButtonStyle("contact_btn", "w-full bg-[#1a3636] hover:bg-gray-900 text-white font-bold rounded-xl px-4 py-3.5 text-sm transition-colors flex items-center justify-center gap-2 group shadow-lg shadow-gray-900/20").className}
                            style={getCustomButtonStyle("contact_btn", "").style}
                          >
                            Send Message
                            <FaPaperPlane className="group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform" />
                          </button>
                          {isButtonEditingMode && (
                            <button
                              onClick={() => onEditButton?.("contact_btn")}
                              className="absolute -top-3 -right-3 bg-white/90 text-gray-800 p-1.5 rounded-full shadow-lg hover:bg-white hover:scale-110 transition-transform z-50 flex items-center justify-center cursor-pointer border border-gray-200"
                              title="Edit Button"
                            >
                              <FaPen size={12} />
                            </button>
                          )}
                        </div>
                      </form>
                    </div>

                  </div>
                </div>
</div>
            </div>

            {/* <div className="w-full flex items-center justify-between mt-8 px-4"> */}
            <div className="w-full flex items-center justify-between px-4 py-3 mt-10 border-t bg-white">

              {/* 
              <button className="h-10 px-4 rounded-lg flex items-center gap-2 text-blue-800 border border-blue-600 bg-transparent hover:bg-blue-50">
                Help
              </button>


              <div className="h-10 flex items-center justify-center rounded-lg px-3 gap-3 bg-transparent border border-blue-600">
                <button className="h-full px-3 rounded flex items-center text-blue-800 hover:bg-blue-50">
                  <FaLaptop />
                </button>
                <button className="h-full px-3 rounded flex items-center text-blue-800 hover:bg-blue-50">
                  <FaMobileAlt />
                </button>
                <button className="h-full px-3 rounded flex items-center text-blue-800 hover:bg-blue-50">
                  <FaTabletAlt />
                </button>
                <button className="h-full px-3 rounded flex items-center text-blue-800 hover:bg-blue-50">
                  <FaSearch />
                </button>
              </div>


              <button className="h-10 px-4 rounded-lg flex items-center gap-2 text-blue-800 border border-blue-600 bg-transparent hover:bg-blue-50">
                Zoom
              </button> */}

            </div>
          </div>


        </div>




      </div>
    </main>
  );
}

