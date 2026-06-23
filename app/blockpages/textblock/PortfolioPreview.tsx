"use client";

import { MutableRefObject, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

import {
  FaBars,
  FaArrowRight,
  FaMobileAlt,
  FaEnvelope,
  FaPaperPlane,
  FaEye,
  FaPen,
  FaPlay,
  FaMapMarkerAlt,
  FaLinkedin,
  FaGithub,
  FaTrash,
  FaPlus,
  FaMinus
} from "react-icons/fa";
import { assetPath } from "@/lib/paths";
import { PORTFOLIO_PROJECTS_SLIDER_ID, scrollPortfolioProjectsSlider } from "@/lib/portfolioProjectsSlider";
import { useBuilder } from "../imageblock/BuilderContext";
import type { BlockData } from "../buttonblock/types";
import type { VideoBlockData } from "../videoblock/types";
import type { SectionStyleConfig } from "./types";
import type { DividerBlockProps } from "../dividerblock/types";
import DividerPreview from "../dividerblock/DividerPreview";
import type { IconBlockProps } from "../iconsblock/types";
import IconPreview from "../iconsblock/IconPreview";

const UploadedVideoPlayer = ({ blockProps, customImages, assetPath }: any) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      if (blockProps.startTime !== undefined && videoRef.current.currentTime < blockProps.startTime) {
        videoRef.current.currentTime = blockProps.startTime;
      } else if (blockProps.endTime !== undefined && videoRef.current.currentTime > blockProps.endTime) {
        videoRef.current.currentTime = blockProps.startTime || 0;
      }
    }
  }, [blockProps.startTime, blockProps.endTime]);

  return (
    <video
      ref={videoRef}
      src={blockProps.uploadUrl}
      poster={blockProps.posterImage || customImages?.["video_block_bg"] || assetPath("/video_block_bg.png")}
      autoPlay={blockProps.autoplay}
      loop={blockProps.loop}
      muted={blockProps.muted}
      controls={blockProps.showControls}
      disablePictureInPicture
      disableRemotePlayback
      controlsList="nodownload noremoteplayback noplaybackrate"
      className="w-full h-full object-cover"
      onTimeUpdate={(e) => {
        const video = e.currentTarget;
        const endTime = blockProps.endTime;
        const startTime = blockProps.startTime;
        const hasValidEndTime = endTime !== undefined && (startTime === undefined || endTime > startTime);
        
        if (hasValidEndTime && video.currentTime >= endTime) {
          if (blockProps.loop) {
            video.currentTime = startTime || 0;
            video.play().catch(() => {});
          } else {
            video.pause();
            video.currentTime = endTime;
          }
        } else if (startTime !== undefined && video.currentTime < startTime) {
          video.currentTime = startTime;
        }
      }}
      onLoadedMetadata={(e) => {
        const video = e.currentTarget;
        if (blockProps.startTime !== undefined && video.currentTime < blockProps.startTime) {
          video.currentTime = blockProps.startTime;
        }
      }}
    />
  );
};

type PortfolioPreviewProps = {
  isImageEditingMode?: boolean;
  customImages?: Record<string, string>;
  onEditImage?: (imageId: string) => void;
  editingImageId?: string | null;
  isButtonEditingMode?: boolean;
  customButtons?: Record<string, BlockData["props"]>;
  onEditButton?: (buttonId: string) => void;
  videoBlocks?: VideoBlockData[];
  isVideoEditingMode?: boolean;
  onEditVideo?: (videoId: string) => void;
  sectionStyles?: Record<string, SectionStyleConfig>;
  onPreview?: () => void;
  appliedDividers?: { id: string, props: DividerBlockProps, position?: { x: number, y: number }, scale?: number }[];
  onRemoveDivider?: (id: string) => void;
  onUpdateDividerPosition?: (id: string, position: { x: number, y: number }) => void;
  onUpdateDividerScale?: (id: string, scale: number) => void;
  appliedIcons?: { id: string, props: IconBlockProps, position?: { x: number, y: number }, scale?: number }[];
  onRemoveIcon?: (id: string) => void;
  onUpdateIconPosition?: (id: string, position: { x: number, y: number }) => void;
  onUpdateIconScale?: (id: string, scale: number) => void;
  isIconEditingMode?: boolean;
  customIcons?: Record<string, IconBlockProps>;
  onEditIcon?: (iconId: string) => void;
  editingIconId?: string | null;
};

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
  editingImageId,
  isButtonEditingMode = false,
  customButtons = {},
  onEditButton,
  videoBlocks = [],
  isVideoEditingMode = false,
  onEditVideo,
  sectionStyles = {},
  onPreview,
  appliedDividers = [],
  onRemoveDivider,
  onUpdateDividerPosition,
  onUpdateDividerScale,
  appliedIcons = [],
  onRemoveIcon,
  onUpdateIconPosition,
  onUpdateIconScale,
  isIconEditingMode = false,
  customIcons = {},
  onEditIcon,
  editingIconId,
}: PortfolioPreviewProps) {
  const [innerMobileMenuOpen, setInnerMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const projectsSliderRef = useRef<HTMLDivElement>(null);

  const videoBlockProps = videoBlocks[0]?.props;
  // Read global builder state for image adjustments
  const builder = useBuilder();
  const { imageAdjustments, activeFilter, activeCrop } = builder || {};

  // Helper to generate styles for a specific section
  const getSpecificSectionStyle = (sectionId: string) => {
    const styleConfig = sectionStyles[sectionId];
    if (!styleConfig) return {};
    const bgImage = styleConfig.backgroundImage ? `url(${styleConfig.backgroundImage})` : '';

    const style: React.CSSProperties = {};

    if (styleConfig.gradientBackground) {
      style.background = styleConfig.gradientBackground;
    } else if (styleConfig.backgroundColor) {
      style.background = styleConfig.backgroundColor;
    }

    if (bgImage) {
      style.backgroundImage = bgImage;
      style.backgroundSize = 'cover';
      style.backgroundPosition = 'center';
    }

    return style;
  };

  const getPresetFilter = () => {
    switch (activeFilter) {
      case 'Vintage': return 'sepia(50%) hue-rotate(-30deg) contrast(120%)';
      case 'Cinematic': return 'contrast(120%) saturate(120%) brightness(90%)';
      case 'Black & White': return 'grayscale(100%)';
      case 'Nature': return 'saturate(150%) contrast(110%)';
      case 'Creative': return 'hue-rotate(90deg) saturate(150%)';
      default: return '';
    }
  };

  const getCropAspect = () => {
    switch (activeCrop) {
      case 'Square': return '1 / 1';
      case '16:9': return '16 / 9';
      case '5:4': return '5 / 4';
      case '4:3': return '4 / 3';
      case '9:16': return '9 / 16';
      case '7:5': return '7 / 5';
      default: return 'auto';
    }
  };

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

    const borderThickness = typeof props.borderThickness === 'number' ? props.borderThickness : undefined;
    const borderColor = props.borderColor as string;
    if (borderThickness !== undefined) {
      style.borderWidth = `${borderThickness}px`;
      style.borderStyle = borderThickness > 0 ? 'solid' : undefined;
    }
    if (borderColor) {
      style.borderColor = borderColor;
    }

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

  useEffect(() => {
    let frameIds: number[] = [];
    if (statsInView) {
      const statsElements = document.querySelectorAll('.stat-animate-count');
      statsElements.forEach(el => {
        if (document.activeElement === el) return;
        const target = parseInt((el as HTMLElement).dataset.target || "0", 10);
        const suffix = (el as HTMLElement).dataset.suffix || "";
        const duration = 2000;
        const start = performance.now();
        const step = (now: number) => {
          if (document.activeElement === el) return;
          const progress = Math.min((now - start) / duration, 1);
          el.textContent = Math.round(progress * target).toString();
          if (progress < 1) frameIds.push(requestAnimationFrame(step));
          else el.textContent = target.toString() + suffix;
        };
        frameIds.push(requestAnimationFrame(step));
      });
    }
    return () => {
      frameIds.forEach(cancelAnimationFrame);
    };
  }, [statsInView]);

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

  useEffect(() => {
    const handleScrollEvent = (e: CustomEvent) => {
      scrollToSection(e.detail);
    };
    window.addEventListener('scrollToSectionEvent', handleScrollEvent as EventListener);
    return () => window.removeEventListener('scrollToSectionEvent', handleScrollEvent as EventListener);
  }, []);

  console.log("PortfolioPreview Debug:", { isImageEditingMode, editingImageId, imageAdjustments, activeFilter, activeCrop });

  const getFilterStyle = (imageId: string) => {
    if (!isImageEditingMode || editingImageId !== imageId || !imageAdjustments) return {};

    return {
      filter: `brightness(${(imageAdjustments.brightness / 60) * 100}%) contrast(${(imageAdjustments.contrast / 45) * 100}%) saturate(${(imageAdjustments.saturation / 55) * 100}%) drop-shadow(0 4px ${imageAdjustments.shadows / 2}px rgba(0,0,0,0.3)) hue-rotate(${(imageAdjustments.tint - 30) * 2}deg) sepia(${imageAdjustments.temperature > 65 ? (imageAdjustments.temperature - 65) : 0}%) ${getPresetFilter()}`
    };
  };

  return (

    <main className="flex flex-col min-h-screen bg-white relative">
      {imageAdjustments && isImageEditingMode && editingImageId && (
        <style>{`
          [data-crop-wrapper-id="${editingImageId}"] {
            ${activeCrop !== 'Custom' && activeCrop !== 'Original' ? `aspect-ratio: ${getCropAspect()} !important; height: auto !important;` : ''}
          }
          [data-vignette-id="${editingImageId}"]::after {
            content: '';
            position: absolute;
            inset: 0;
            pointer-events: none;
            box-shadow: inset 0 0 ${imageAdjustments.vignette * 3}px rgba(0,0,0,0.7) !important;
            z-index: 20;
          }
        `}</style>
      )}
      {/* ====== MAIN BUILDER LAYOUT ====== */}
      <div className="flex flex-1">

        {/* MAIN CONTENT */}

        {/* <div className="flex-1 bg-white p-4 md:p-7 flex justify-center min-w-0 overflow-hidden"> */}
        <div className="flex-1 bg-white p-0 flex justify-center min-w-0">

          {/* <div className="w-full max-w-[1200px] relative flex flex-col h-[calc(100vh-80px)] min-w-0"> */}
          <div className="w-full relative flex flex-col min-w-0 max-w-none">
            {/* Canvas Box */}

            {/* <div className="flex-1 overflow-y-auto min-w-0"> */}
            {/* <div className="flex-1 overflow-y-auto min-w-0 relative z-0"> */}
            <div className="flex-1 min-w-0 relative z-0">
              <div className="@container w-full min-h-[530px] max-w-full min-w-0 overflow-x-hidden rounded-none sm:rounded-xl border-0 sm:border-2 border-gray-300 flex flex-col relative portfolio-shell bg-[#F2F2F2] box-border">


                {/* <div className="flex w-full flex-wrap items-center justify-between gap-2 sm:gap-4 px-3 sm:px-4 py-2 sm:py-3 md:px-8 lg:flex-nowrap border-b border-gray-300 bg-[#06224C] rounded-t-xl"> */}
                <div className="sticky top-0 z-50 backdrop-blur-md bg-[#06224C]/95 flex w-full flex-wrap items-center justify-between gap-1 sm:gap-4 px-2 sm:px-4 py-2 sm:py-3 md:px-8 border-b border-gray-300 sm:rounded-t-xl">

                  {/* ✅ MOBILE LAYOUT */}
                  <div className="flex flex-col w-full lg:hidden gap-2">

                    {/* ROW 1 → Logo + Menu */}
                    {/* TOP ROW → Logo + Menu */}
                    <div className="flex items-center justify-between w-full gap-1">

                      {/* LEFT → Logo */}
                      <Link
                        href="/landing"
                        className="flex h-6 w-[56px] sm:h-8 sm:w-[80px] items-center justify-center overflow-hidden rounded-[50%] bg-white px-1 sm:px-2 shrink-0"
                      >
                        <Image
                          src={assetPath("/stackly-logo.webp")}
                          alt="Stackly logo"
                          width={80}
                          height={24}
                          className="h-[10px] sm:h-[14px] object-contain"
                          unoptimized
                        />
                      </Link>

                      {/* RIGHT → Menu */}
                      <button
                        onClick={() => setInnerMobileMenuOpen((v) => !v)}
                        className="portfolio-mobile-menu-btn h-7 w-7 sm:h-8 sm:w-8 border border-white/25 text-white rounded-md hover:bg-white/10 transition flex items-center justify-center shrink-0"
                      >
                        <FaBars className="text-sm" />
                      </button>

                    </div>

                    {/* ROW 2 → Title */}
                    <div className="flex w-full justify-center px-2 py-0.5">
                      <span className="text-sm sm:text-lg font-semibold text-white text-center break-words">
                        Portfolio
                      </span>
                    </div>

                    {/* ROW 3 → Actions (NOW VISIBLE ON MOBILE ✅) */}
                    <div className="flex justify-center" data-builder-chrome="true">
                      <div className="flex flex-wrap justify-center gap-1 sm:gap-2 w-full">

                        {/* Save Draft */}
                        <button onClick={() => alert("Working on it - In progress!")} className="relative group px-2 sm:px-3 py-1 border border-gray-300/40 rounded-md overflow-hidden shadow-sm">
                          <span className="absolute inset-0 bg-white/20 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300 ease-out"></span>
                          <span className="relative z-10 text-[10px] sm:text-xs font-semibold text-white inline-block transition-transform duration-300 group-hover:scale-105">Save Draft</span>
                        </button>

                        {/* Preview */}
                        <button type="button" onClick={onPreview} className="relative group px-2 sm:px-3 py-1 border border-gray-300/40 rounded-md overflow-hidden shadow-sm">
                          <span className="absolute inset-0 bg-white/20 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300 ease-out"></span>
                          <span className="relative z-10 flex items-center gap-1 text-[10px] sm:text-xs font-semibold text-white transition-transform duration-300 group-hover:scale-105">
                            Preview <FaEye className="text-[10px]" />
                          </span>
                        </button>

                      </div>
                    </div>

                  </div>

                  {/* ✅ DESKTOP (unchanged) */}
                  <div className="hidden lg:flex w-full items-center justify-between flex-nowrap gap-2">

                    <div className="flex shrink-0 justify-start">
                      <Link href="/landing" className="flex h-10 min-w-[92px] items-center justify-center rounded-[50%] bg-white px-3">
                        <Image src={assetPath("/stackly-logo.webp")} alt="Stackly logo" width={92} height={28} className="h-[18px] w-auto" unoptimized />
                      </Link>
                    </div>

                    <div className="flex flex-1 justify-center px-4">
                      <span className="text-lg font-semibold text-white truncate">Portfolio</span>
                    </div>

                    <div className="flex items-center gap-2 xl:gap-6 flex-nowrap justify-end shrink-0">

                      {/* NAV LINKS */}
                      <div className="flex gap-3 xl:gap-6 flex-nowrap justify-end">
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
                            className="relative text-white text-sm group whitespace-nowrap"
                          >
                            {item.name}
                            <span className="absolute left-0 -bottom-1 w-0 h-[2px] bg-white transition-all duration-300 group-hover:w-full"></span>
                          </button>
                        ))}
                      </div>

                      {/* ACTION BUTTONS ✅ */}
                      <div className="flex border border-gray-300/40 rounded-md overflow-hidden text-xs font-bold whitespace-nowrap bg-white/5 shadow-sm" data-builder-chrome="true">

                        <button onClick={() => alert("Working on it - In progress!")} className="relative group px-3 py-1.5 overflow-hidden">
                          <span className="absolute inset-0 bg-white/20 scale-y-0 group-hover:scale-y-100 origin-bottom transition-transform duration-300 ease-out"></span>
                          <span className="relative z-10 text-white transition-transform duration-300 group-hover:-translate-y-0.5 inline-block">Save Draft</span>
                        </button>

                        <div className="w-px bg-gray-300/40"></div>

                        <button type="button" onClick={onPreview} className="relative group px-3 py-1.5 overflow-hidden flex items-center gap-1.5">
                          <span className="absolute inset-0 bg-white/20 scale-y-0 group-hover:scale-y-100 origin-bottom transition-transform duration-300 ease-out"></span>
                          <span className="relative z-10 text-white flex items-center gap-1 transition-transform duration-300 group-hover:-translate-y-0.5">
                            Preview <FaEye className="text-[11px]" />
                          </span>
                        </button>

                      </div>

                    </div>
                  </div>

                </div>

                {/* MOBILE MENU */}
                <div className={`portfolio-mobile-menu transition-all duration-300 ease-in-out overflow-hidden ${innerMobileMenuOpen ? "max-h-40 opacity-100" : "max-h-0 opacity-0"}`}>
                  <div className="px-3 pb-3 pt-2 bg-[#06224C] grid grid-cols-2 gap-2">
                    {/* {["Home", "About Us", "Projects", "Contact"].map((item, i) => (
                      <button key={i} onClick={() => setInnerMobileMenuOpen(false)} className="border border-white/25 px-3 py-2 text-xs text-white rounded-md hover:bg-white/10 transition hover:scale-105">
                        {item}
                      </button>
                    ))} */}
                    {[
                      { name: "Home", id: "home" },
                      { name: "About Me", id: "about" },
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
                <div id="home" className="relative w-full overflow-hidden flex flex-col portfolio-hero" style={getSpecificSectionStyle('home')}>

                  {/* HERO CONTENT */}

                  <div className="flex-1 flex flex-col px-4 sm:px-6 md:px-8 lg:px-12 py-6 md:py-8 relative z-10">
                    <div className="flex flex-col lg:flex-row items-center lg:items-stretch justify-between w-full gap-8">

                      <div className="w-full lg:w-[50%] lg:w-[55%] shrink-0 flex flex-col relative z-30 text-center lg:text-left portfolio-hero-copy">
                        <div className="mx-auto lg:mx-0 mb-4 inline-flex max-w-full flex-wrap justify-center text-center items-center gap-2 rounded-full border border-[#63e5ff]/60 bg-white/80 px-3 py-1 text-[clamp(0.5625rem,2cqi,0.6875rem)] font-bold uppercase tracking-[0.12em] sm:tracking-[0.18em] text-[#06224C] shadow-sm min-w-0 break-words">
                          <span className="h-2 w-2 rounded-full bg-[#63e5ff] animate-pulse"></span>
                          Available for freelance work
                        </div>
                        <h1 className="text-[clamp(1.75rem,5cqi,3rem)] sm:text-3xl md:text-4xl lg:text-5xl font-bold mt-4 md:mt-6 text-gray-800 leading-snug md:leading-normal break-words whitespace-normal min-w-0 max-w-full">
                          <div className="mb-1 sm:mb-2 min-w-0 break-words">Hello, I&apos;m</div>
                          <div className="text-[#63e5ff] mb-1 sm:mb-2 leading-snug break-words min-w-0 max-w-full">Srinivas Pentakota</div>
                          <div className="leading-snug break-words min-w-0 max-w-full">UI/UX Designer</div>
                        </h1>

                        <p className="text-gray-600 mt-3 sm:mt-4 md:mt-6 text-sm sm:text-base md:text-lg max-w-xl mx-auto lg:mx-0 break-words relative z-20">
                          I design sleek digital products, landing pages, and brand experiences that feel clear, fast, and memorable.
                        </p>

                        {/* MOBILE BLOBS + IMAGE */}
                        <div className="lg:hidden mt-8 mb-4 flex flex-col items-center justify-center px-4 sm:px-6 w-full gap-6">
                          <div className="relative w-full max-w-[220px]">

                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">

                              <div className="w-[90%] h-[90%] bg-gradient-to-r from-purple-500 via-blue-400 to-cyan-300 opacity-20 blur-2xl rounded-full"></div>

                              <div className="absolute w-[70%] h-[50%] bg-cyan-300 opacity-20 blur-2xl rounded-full"></div>

                              <div className="absolute w-[40%] h-[40%] bg-pink-400 opacity-20 rounded-full bottom-2 right-2"></div>

                              <div className="absolute w-[60%] h-[80%] bg-cyan-300 opacity-20 blur-2xl rounded-[60%_40%_55%_45%] -top-4 -left-4"></div>

                              <div className="absolute w-[65%] h-[95%] bg-white/70 rounded-[80px] rotate-[-30deg] shadow-md"></div>
                            </div>

                            <div className="relative mx-auto transition-all duration-300"
                              data-crop-wrapper-id="hero_image_1"
                              style={{
                                width: `${heroImageProps.width}px`,
                                height: `${heroImageProps.height}px`,
                                maxWidth: '100%',
                              }}>
                              <div className="absolute inset-0 overflow-hidden border-4 border-white z-10"
                                data-vignette-id="hero_image_1"
                                style={{
                                  borderRadius: `${heroImageProps.borderRadius}%`,
                                  boxShadow: heroImageProps.shadow ? '0 10px 25px rgba(0,0,0,0.3)' : 'none',
                                  opacity: heroImageProps.opacity / 100
                                }}>
                                <Image
                                  src={customImages["hero_image_1"] || assetPath("/portfoliologo.webp")}
                                  alt="Srinivas Pentakota - UI/UX Designer Portfolio"
                                  fill
                                  data-image-id="hero_image_1"
                                  className={`w-full h-full object-cover transition duration-700 hover:scale-105`}
                                  style={getFilterStyle("hero_image_1")}
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

                          {/* Mobile Floating Badge (Moved below the image) */}
                          <div className="relative z-30 rounded-xl border border-white/80 bg-white/90 px-4 py-3 text-center shadow-md portfolio-floating-badge whitespace-nowrap">
                            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500">Focus</p>
                            <p className="text-sm font-extrabold text-gray-900">Human centered UI</p>
                          </div>
                        </div>


                        <div className="flex flex-wrap gap-4 mt-8 justify-center lg:justify-start">

                          <div className="relative inline-block">
                            <button
                              type="button"
                              onClick={() => scrollToSection("projects")}
                              className={getCustomButtonStyle("hero_btn_1", "w-full sm:w-auto min-w-[160px] flex justify-center items-center px-4 py-3 bg-gradient-to-r from-[#06224C] to-[#1A5BBC] text-white rounded-lg text-sm font-semibold transition transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg outline-none focus:outline-none focus-visible:ring-4 focus-visible:ring-yellow-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#06224C] whitespace-normal break-words").className}
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
                              className={getCustomButtonStyle("hero_btn_2", "w-full sm:w-auto min-w-[160px] flex justify-center items-center px-4 py-3 bg-gradient-to-r from-[#06224C] to-[#1A5BBC] text-white rounded-lg text-sm font-semibold transition transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg outline-none focus:outline-none focus-visible:ring-4 focus-visible:ring-yellow-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#06224C] whitespace-normal break-words").className}
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
                      <div className="hidden lg:flex lg:w-[45%] lg:w-[40%] items-center justify-center relative min-h-[400px]">
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
                            data-crop-wrapper-id="hero_image_1"
                            style={{
                              width: `${heroImageProps.width}px`,
                              height: `${heroImageProps.height}px`,
                            }}>
                            <div className="absolute inset-0 overflow-hidden border-4 border-white"
                              data-vignette-id="hero_image_1"
                              style={{
                                borderRadius: `${heroImageProps.borderRadius}%`,
                                boxShadow: heroImageProps.shadow ? '0 10px 25px rgba(0,0,0,0.3)' : 'none',
                                opacity: heroImageProps.opacity / 100
                              }}>
                              <Image src={customImages["hero_image_1"] || assetPath("/portfoliologo.webp")} alt="Srinivas Pentakota - UI/UX Designer Portfolio" fill sizes="245px" data-image-id="hero_image_1" className="w-full h-full object-cover" style={getFilterStyle("hero_image_1")} unoptimized />
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

                    <div ref={statsRef} className="flex flex-col sm:flex-row items-stretch justify-center gap-3 sm:gap-6 lg:gap-8 mt-12 md:mt-15 mb-2 w-full flex-wrap">
                      {stats.map((item, i) => (
                        <div
                          key={i}
                          className="portfolio-stat-card flex-1 min-w-[120px] sm:min-w-[160px] max-w-full sm:max-w-[280px] mx-auto sm:mx-0 bg-white py-4 sm:py-5 h-auto px-4 rounded-lg shadow-md flex flex-col items-center justify-center text-gray-700 transition transform hover:-translate-y-2 hover:shadow-xl text-center"
                          style={{ animationDelay: `${i * 110}ms` }}
                        >
                          <h5
                            className="text-2xl font-bold stat-animate-count"
                            suppressContentEditableWarning
                            data-target={item.value}
                            data-suffix={item.suffix}
                            onInput={(e) => {
                              const text = e.currentTarget.textContent || "";
                              const match = text.match(/(\d+)(.*)/);
                              if (match) {
                                e.currentTarget.dataset.target = match[1];
                                e.currentTarget.dataset.suffix = match[2];
                              }
                            }}
                          >
                            {item.value}{item.suffix}
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

                  .portfolio-services-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(min(100%, 15rem), 1fr));
                  }

                  .portfolio-service-card {
                    min-width: 0;
                    max-width: 100%;
                    overflow: hidden;
                    box-sizing: border-box;
                  }

                  .portfolio-service-card h4,
                  .portfolio-service-card p {
                    overflow-wrap: anywhere;
                    word-break: normal;
                    min-width: 0;
                    max-width: 100%;
                  }

                  .portfolio-shell h1,
                  .portfolio-shell h2,
                  .portfolio-shell h3,
                  .portfolio-shell h4,
                  .portfolio-shell p {
                    overflow-wrap: break-word;
                    word-wrap: break-word;
                    min-width: 0;
                    max-width: 100%;
                  }

                  @container (max-width: 768px) {
                    .portfolio-shell .portfolio-service-card h4 {
                      font-size: clamp(1rem, 3cqi, 1.0625rem) !important;
                      white-space: normal !important;
                    }
                    .portfolio-shell .portfolio-service-card p {
                      font-size: clamp(0.8125rem, 2.5cqi, 0.8125rem) !important;
                      white-space: normal !important;
                    }
                  }
                `}</style>

                {appliedIcons.map((icon, index) => (
                  <motion.div
                    key={icon.id}
                    drag
                    dragMomentum={false}
                    initial={{ x: icon.position?.x ?? 0, y: icon.position?.y ?? 0 }}
                    onDragEnd={(e, info) => {
                      onUpdateIconPosition?.(icon.id, {
                        x: (icon.position?.x ?? 0) + info.offset.x,
                        y: (icon.position?.y ?? 0) + info.offset.y
                      });
                    }}
                    data-draggable-chrome="true"
                    className="absolute left-0 z-[100] flex w-full max-w-full flex-col items-center bg-transparent cursor-move active:cursor-grabbing px-4 py-2 sm:px-6 md:px-12 lg:px-20"
                    style={{ top: `${200 + index * 50}px` }}
                    title="Drag to move the icon"
                  >
                    <div className="relative flex flex-col items-center justify-center group/inner outline-none" tabIndex={0}>
                      <div className="absolute inset-0 -top-12 bg-transparent z-0" />
                      <div className="relative z-10 transition-transform group-hover/inner:outline group-hover/inner:outline-2 group-hover/inner:outline-blue-400 group-hover/inner:outline-dashed group-focus-within/inner:outline group-focus-within/inner:outline-2 group-focus-within/inner:outline-blue-400 group-focus-within/inner:outline-dashed rounded-md p-2" style={{ transform: `scale(${icon.scale ?? 1})`, transformOrigin: 'center' }}>
                        <IconPreview props={icon.props} />
                      </div>
                      <div data-builder-chrome="true" className="absolute -top-10 left-1/2 -translate-x-1/2 hidden group-hover/inner:flex group-focus-within/inner:flex items-center gap-2 z-[110] bg-white p-1.5 rounded-lg shadow-xl border border-gray-200">
                        <button
                          onClick={() => onUpdateIconScale?.(icon.id, Math.max(0.2, (icon.scale ?? 1) - 0.1))}
                          className="bg-gray-100 text-gray-700 p-1.5 rounded-md shadow-sm hover:bg-gray-200 hover:scale-105 transition-transform flex items-center justify-center cursor-pointer"
                          title="Decrease Size"
                        >
                          <FaMinus size={12} />
                        </button>
                        <button
                          onClick={() => onUpdateIconScale?.(icon.id, (icon.scale ?? 1) + 0.1)}
                          className="bg-gray-100 text-gray-700 p-1.5 rounded-md shadow-sm hover:bg-gray-200 hover:scale-105 transition-transform flex items-center justify-center cursor-pointer"
                          title="Increase Size"
                        >
                          <FaPlus size={12} />
                        </button>
                        <button
                          onClick={() => onRemoveIcon?.(icon.id)}
                          className="bg-red-50 text-red-500 p-1.5 rounded-md shadow-sm hover:bg-red-100 hover:scale-105 transition-transform flex items-center justify-center cursor-pointer"
                          title="Remove Icon"
                        >
                          <FaTrash size={12} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {appliedDividers.map((divider, index) => (
                  <motion.div
                    key={divider.id}
                    drag
                    dragMomentum={false}
                    initial={{ x: divider.position?.x ?? 0, y: divider.position?.y ?? 0 }}
                    onDragEnd={(e, info) => {
                      onUpdateDividerPosition?.(divider.id, {
                        x: (divider.position?.x ?? 0) + info.offset.x,
                        y: (divider.position?.y ?? 0) + info.offset.y
                      });
                    }}
                    data-draggable-chrome="true"
                    className="absolute left-0 z-[100] flex w-full max-w-full flex-col items-center bg-transparent cursor-move active:cursor-grabbing px-4 py-2 sm:px-6 md:px-12 lg:px-20"
                    style={{ top: `${400 + index * 60}px` }}
                    title="Drag to move the divider"
                  >
                    <div className="relative flex flex-col items-center w-full group/inner outline-none" tabIndex={0}>
                      <div className="absolute inset-0 -top-12 bg-transparent z-0" />
                      <div className="relative z-10 transition-transform group-hover/inner:outline group-hover/inner:outline-2 group-hover/inner:outline-blue-400 group-hover/inner:outline-dashed group-focus-within/inner:outline group-focus-within/inner:outline-2 group-focus-within/inner:outline-blue-400 group-focus-within/inner:outline-dashed rounded-md p-2" style={{ transform: `scale(${divider.scale ?? 1})`, transformOrigin: 'center', width: divider.props.width || '100%' }}>
                        <DividerPreview props={divider.props} />
                      </div>
                      <div data-builder-chrome="true" className="absolute -top-10 left-1/2 -translate-x-1/2 hidden group-hover/inner:flex group-focus-within/inner:flex items-center gap-2 z-[110] bg-white p-1.5 rounded-lg shadow-xl border border-gray-200">
                        <button
                          onClick={() => onUpdateDividerScale?.(divider.id, Math.max(0.2, (divider.scale ?? 1) - 0.1))}
                          className="bg-gray-100 text-gray-700 p-1.5 rounded-md shadow-sm hover:bg-gray-200 hover:scale-105 transition-transform flex items-center justify-center cursor-pointer"
                          title="Decrease Size"
                        >
                          <FaMinus size={12} />
                        </button>
                        <button
                          onClick={() => onUpdateDividerScale?.(divider.id, (divider.scale ?? 1) + 0.1)}
                          className="bg-gray-100 text-gray-700 p-1.5 rounded-md shadow-sm hover:bg-gray-200 hover:scale-105 transition-transform flex items-center justify-center cursor-pointer"
                          title="Increase Size"
                        >
                          <FaPlus size={12} />
                        </button>
                        <button
                          onClick={() => onRemoveDivider?.(divider.id)}
                          className="bg-red-50 text-red-500 p-1.5 rounded-md shadow-sm hover:bg-red-100 hover:scale-105 transition-transform flex items-center justify-center cursor-pointer"
                          title="Remove Divider"
                        >
                          <FaTrash size={12} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {/* ABOUT SECTION */}
                <div className="relative w-full overflow-hidden portfolio-hero bg-[#F2F2F2]" style={getSpecificSectionStyle('about')}>
                  <div id="about" className="relative z-10 w-full px-4 sm:px-6 md:px-12 lg:px-20 py-10 md:py-16">
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-4">
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
                          <div key={skill.name} className="skill-container">
                            <div className="flex justify-between mb-2 md:mb-3">
                              <span className="font-bold text-gray-800 text-sm md:text-lg">
                                {skill.name}
                              </span>
                              <span
                                className="text-gray-500 text-xs md:text-sm skill-value-text"
                                onInput={(e) => {
                                  const text = e.currentTarget.textContent || "";
                                  const val = parseInt(text.replace(/[^0-9]/g, ''));
                                  if (!isNaN(val)) {
                                    const container = e.currentTarget.closest('.skill-container') as HTMLElement;
                                    if (container) {
                                      container.style.setProperty('--skill-width', `${val}%`);
                                    }
                                  }
                                }}
                                suppressContentEditableWarning
                              >
                                {skill.value}%
                              </span>
                            </div>

                            <div className="w-full bg-gray-300 h-[4px] md:h-[6px] overflow-hidden">
                              <div
                                className="h-full transition-all duration-1000 ease-out skill-progress-bar"
                                data-target-width={`var(--skill-width, ${skill.value}%)`}
                                style={{
                                  width: skillsInView ? `var(--skill-width, ${skill.value}%)` : "0%",
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
                  <div className="relative z-10 w-full px-4 sm:px-6 md:px-12 lg:px-20 pb-12 md:pb-16 lg:pb-24">

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
                              <div className="flex-1 min-w-0">
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
                              <div className="flex-1 min-w-0">
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
                  <div className="relative z-10 w-full max-w-full overflow-x-hidden px-4 sm:px-6 md:px-12 lg:px-20 pb-16 lg:pb-24">
                    <div className="text-center mb-16 min-w-0 max-w-full">
                      <div className="flex flex-wrap items-center justify-center gap-2 mb-4 min-w-0 max-w-full">
                        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight break-words leading-tight min-w-0">My</h2>
                        <span className="bg-[#63e5ff] text-gray-900 font-extrabold px-3 py-1 rounded-full text-2xl md:text-3xl tracking-tight leading-none break-words">Services</span>
                      </div>

                      <h3 className="text-sm sm:text-base md:text-xl lg:text-2xl font-extrabold text-gray-800 mb-8 md:mb-16 max-w-full md:max-w-3xl leading-relaxed break-words text-center md:text-left min-w-0">
                        Provide Wide Range of  Digital Services
                      </h3>
                    </div>

                    <div className="grid portfolio-services-grid gap-3 sm:gap-6 max-w-7xl mx-auto min-w-0 max-w-full">
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
                        <div key={service.id} className="portfolio-service-card border border-gray-200 rounded-[20px] p-5 sm:p-6 lg:p-8 flex flex-col items-start transition-all duration-300 hover:-translate-y-2 hover:shadow-xl bg-white group hover:border-gray-300 cursor-pointer h-full min-w-0 max-w-full break-words overflow-hidden" style={{ animationDelay: `${Number(service.id) * 45}ms` }}>
                          <div
                            className={`w-12 h-12 mb-4 sm:mb-6 flex items-center justify-center shrink-0 ${isIconEditingMode ? "cursor-pointer rounded-lg border-2 border-dashed border-blue-400 hover:bg-blue-50 transition-colors" : ""
                              } ${editingIconId === `service-${service.id}` ? "ring-2 ring-blue-500 bg-blue-50" : "text-gray-800"}`}
                            onClick={(e) => {
                              if (isIconEditingMode && onEditIcon) {
                                e.preventDefault();
                                e.stopPropagation();
                                onEditIcon(`service-${service.id}`);
                              }
                            }}
                          >
                            {customIcons[`service-${service.id}`] ? (
                              <IconPreview props={customIcons[`service-${service.id}`]} />
                            ) : (
                              <>
                                {service.id === "01" && <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>}
                                {service.id === "02" && <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>}
                                {service.id === "03" && <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>}
                                {service.id === "04" && <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line><circle cx="12" cy="10" r="2"></circle></svg>}
                                {service.id === "05" && <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"></path><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path><path d="M2 2l7.586 7.586"></path></svg>}
                                {service.id === "06" && <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>}
                                {service.id === "07" && <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>}
                                {service.id === "08" && <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1h1.76a1 1 0 0 1 .84.45l2.4 3.6a1 1 0 0 1-.84 1.55H11z"></path><path d="M18 10h-2V6a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-4z"></path></svg>}
                              </>
                            )}
                          </div>
                          <h4 className="text-[clamp(1rem,3cqi,1.0625rem)] font-bold text-gray-900 mb-2 sm:mb-3 min-w-0 break-words w-full">{service.title}</h4>
                          <p className="text-gray-500 text-[13px] leading-relaxed mb-6 sm:mb-8 flex-1 min-w-0 break-words w-full">
                            {service.desc}
                          </p>
                          <div className="mt-auto flex flex-wrap items-center gap-1.5 w-full shrink-0 min-w-0">
                            <div className="w-[30px] h-[30px] rounded-full bg-[#1a3636] text-white flex items-center justify-center text-[11px] font-semibold shrink-0 group-hover:bg-[#63e5ff] group-hover:text-gray-900 transition-colors">
                              {service.id}
                            </div>
                            {/* <div className="flex items-center text-gray-300 group-hover:text-gray-900 transition-colors">
                              <span className="w-8 h-[1px] bg-current"></span>
                              <FaArrowRight size={10} className="-ml-[2px]" />
                            </div> */}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* DESIGN PROCESS SECTION */}
                  <div ref={processRef} className="relative z-10 w-full px-4 sm:px-6 md:px-12 lg:px-20 pb-16 lg:pb-24">
                    <div className="overflow-hidden rounded-2xl bg-[#06224C] px-5 py-8 sm:px-8 md:px-10 md:py-12 text-white shadow-xl relative">
                      <div className="absolute right-[-5rem] top-[-5rem] h-56 w-56 rounded-full bg-[#63e5ff]/20 blur-3xl"></div>
                      <div className="absolute left-[-4rem] bottom-[-5rem] h-48 w-48 rounded-full bg-white/10 blur-3xl"></div>
                      <div className="relative grid grid-cols-1 xl:grid-cols-[0.6fr_2fr] gap-8 lg:gap-12 items-start">
                        <div className={`portfolio-reveal flex flex-col items-center xl:items-start text-center xl:text-left ${processInView ? "is-visible" : ""}`}>
                          <div className="flex flex-wrap items-center justify-center xl:justify-start gap-2 mb-4">
                            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Design</h2>
                            <span className="bg-[#63e5ff] text-gray-900 font-extrabold px-3 py-1 rounded-full text-2xl md:text-3xl tracking-tight leading-none break-words">Process</span>
                          </div>
                          <p className="text-sm md:text-base text-blue-100 leading-relaxed max-w-md break-words">
                            A simple workflow keeps every project moving from rough idea to polished launch without losing the user&apos;s needs along the way.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {processSteps.map((item, i) => (
                            <div
                              key={item.step}
                              className={`portfolio-reveal rounded-xl border border-white/15 bg-white/10 p-5 backdrop-blur transition hover:-translate-y-1 hover:bg-white/15 text-center flex flex-col items-center ${processInView ? "is-visible" : ""}`}
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

                </div>
                {/* MY PROJECTS SECTION */}

                <div className="relative w-full overflow-hidden portfolio-hero" style={{ backgroundColor: '#FFFFFF', ...getSpecificSectionStyle('projects') }}>
                  <div id="projects" className="w-full px-0 md:px-6 lg:px-12 pb-16 lg:pb-24 relative z-10 overflow-hidden">

                    {/* <div className="px-6 md:px-6 lg:px-8 mb-12">
                    <h2 className="text-base font-bold flex items-center gap-1 mb-4 text-gray-800 tracking-wide max-w-full w-fit">
                      My <span className="bg-[#c4ff0b] text-gray-900 px-2 py-0.5 rounded-full text-sm font-extrabold ml-1 leading-none shadow-sm flex items-center h-6">Projects</span>
                    </h2>
                    <h3 className="text-3xl md:text-4xl lg:text-4xl font-extrabold text-gray-900 max-w-2xl leading-[1.15]">
                      Showcase Your Talent with Our <br className="hidden md:block" /> Latest Works
                    </h3>
                  </div> */}
                    <div className="text-center mb-16">
                      {/* <h3 className="text-base font-bold flex items-center justify-center gap-1 mb-4 text-gray-800 tracking-wide"> */}
                      <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
                        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">My</h2>
                        <span className="bg-[#63e5ff] text-gray-900 font-extrabold px-3 py-1 rounded-full text-2xl md:text-3xl tracking-tight leading-none">Projects</span>
                      </div>
                      {/* <h3 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 max-w-2xl mx-auto leading-tight"> */}

                      <h3 className="text-sm sm:text-base md:text-xl lg:text-2xl font-extrabold text-gray-800 mb-8 md:mb-16 max-w-full md:max-w-3xl leading-relaxed break-words text-center md:text-left">
                        Showcase Your Talent with Our <br className="hidden md:block" /> Latest Works
                      </h3>
                    </div>


                    <div
                      id={PORTFOLIO_PROJECTS_SLIDER_ID}
                      ref={projectsSliderRef}
                      data-portfolio-projects-slider="true"
                      className="relative w-full overflow-x-auto flex gap-4 sm:gap-6 px-4 sm:px-6 lg:px-8 pb-8 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden"
                      style={{
                        scrollbarWidth: "none",
                        msOverflowStyle: "none",
                        WebkitOverflowScrolling: "touch",
                      }}
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
                          <div className="w-full aspect-square rounded-[20px] mb-4 sm:mb-5 relative border border-gray-100 shadow-sm" data-crop-wrapper-id={`project_image_${i}`}>
                            <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors z-10 w-full h-full rounded-[20px] pointer-events-none"></div>
                            <div className="absolute inset-0 overflow-hidden rounded-[20px]" data-vignette-id={`project_image_${i}`}>
                              <Image src={customImages[`project_image_${i}`] || proj.img} alt={proj.title} fill sizes="260px" data-image-id={`project_image_${i}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" style={getFilterStyle(`project_image_${i}`)} unoptimized />
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
                      {/* Spacer to ensure right padding is respected on mobile scroll */}
                      <div className="w-1 sm:w-2 shrink-0 flex-none snap-end"></div>
                    </div>


                    <div className="hidden sm:flex flex-wrap items-center justify-center gap-4 sm:gap-6 mt-4 sm:mt-6 w-full relative px-4 sm:px-8">
                      <button
                        type="button"
                        data-slider-nav="prev"
                        data-slider-target={PORTFOLIO_PROJECTS_SLIDER_ID}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          // Force hot reload again
                          const slider = projectsSliderRef.current;
                          if (slider) scrollPortfolioProjectsSlider(slider, -1);
                        }}
                        className="flex items-center justify-center p-2 group hover:opacity-70 transition-opacity cursor-pointer"
                        aria-label="Slide Left"
                      >
                        <svg width="40" height="16" viewBox="0 0 60 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[40px] sm:w-[60px]">
                          <path d="M10 5L5 10L10 15M5 10H55" stroke="#1a3636" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        data-slider-nav="next"
                        data-slider-target={PORTFOLIO_PROJECTS_SLIDER_ID}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const slider = projectsSliderRef.current;
                          if (slider) scrollPortfolioProjectsSlider(slider, 1);
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
                  <div ref={testimonialsRef} className="relative z-10 w-full max-w-full overflow-x-hidden px-4 sm:px-6 md:px-12 lg:px-20 pb-16 lg:pb-24">
                    <div className="grid grid-cols-1 lg:grid-cols-[0.8fr_1.2fr] gap-6 lg:gap-10 items-stretch min-w-0 max-w-full">
                      <div className={`portfolio-reveal rounded-2xl bg-white p-6 md:p-8 shadow-lg border border-gray-100 min-w-0 max-w-full break-words overflow-hidden ${testimonialsInView ? "is-visible" : ""}`}>
                        <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1a3636] mb-4 min-w-0 break-words">Client Words</p>
                        <h2 className="text-[clamp(1.5rem,4cqi,2.25rem)] md:text-4xl font-extrabold text-gray-900 leading-tight mb-4 min-w-0 break-words">
                          Designs that feel clear before they feel clever.
                        </h2>
                        <p className="text-gray-600 text-sm md:text-base leading-relaxed min-w-0 break-words">
                          Strong visuals are only useful when they help people understand, trust, and take action.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-w-0 max-w-full">
                        {testimonials.map((item, i) => (
                          <div
                            key={item.name}
                            className={`portfolio-reveal rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl break-words min-w-0 max-w-full overflow-hidden ${testimonialsInView ? "is-visible" : ""}`}
                            style={{ transitionDelay: `${i * 140}ms` }}
                          >
                            <div className="mb-5 text-5xl font-black leading-none text-[#63e5ff]">“</div>
                            <p className="mb-6 text-[clamp(0.875rem,2.5cqi,1rem)] leading-relaxed text-gray-600 break-words whitespace-normal min-w-0">{item.quote}</p>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 min-w-0">
                              <div className="h-11 w-11 shrink-0 rounded-full bg-[#06224C] text-white flex items-center justify-center text-sm font-black">
                                {item.name.charAt(0)}
                              </div>
                              <div className="min-w-0 break-words flex-1">
                                <p className="font-extrabold text-gray-900 min-w-0 break-words">{item.name}</p>
                                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 min-w-0 break-words">{item.role}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                </div>

                {/* VIDEO SECTION */}
                <div id="video" className="w-full px-4 sm:px-6 md:px-12 lg:px-20 py-16 lg:py-24 relative overflow-hidden portfolio-hero" style={{ backgroundColor: '#0B1D40', ...getSpecificSectionStyle('video') }}>
                  <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col-reverse lg:flex-row items-center justify-between gap-12 lg:gap-8">

                    {/* LEFT COLUMN: Text Content */}
                    <div className="flex w-full flex-col justify-center space-y-6 lg:w-5/12 relative z-10">
                      <div>
                        <p className="text-[#38BDF8] font-bold tracking-widest uppercase text-sm md:text-base mb-4">
                          Creative Marketing
                        </p>
                        <h2 className="text-[clamp(2rem,5cqi,4.5rem)] font-black text-white leading-[1.1] tracking-tight mb-6">
                          Showreel 2026
                        </h2>
                        <p className="text-gray-300 text-base sm:text-lg md:text-xl font-medium max-w-md leading-relaxed mb-8">
                          We Create digital experience that drives results.
                        </p>
                      </div>

                      <div>
                        <button
                          type="button"
                          className="group flex items-center justify-center gap-3 sm:gap-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white px-5 sm:px-8 py-3 sm:py-4 rounded-[30px] sm:rounded-full font-bold uppercase text-xs sm:text-sm tracking-wider hover:from-blue-500 hover:to-blue-400 transition-all shadow-lg shadow-blue-500/30 max-w-full w-fit"
                        >
                          <span className="text-left sm:text-center leading-[1.1] sm:leading-normal">
                            Watch<br className="sm:hidden" />
                            <span className="hidden sm:inline"> </span>Now
                          </span>
                          <div className="bg-white text-blue-600 rounded-full w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                            <FaPlay className="text-[10px] sm:text-xs ml-0.5" aria-hidden="true" />
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* RIGHT COLUMN: Image/Video */}
                    <div className="relative w-full lg:w-7/12 flex justify-center lg:justify-end">
                      <div className="relative w-full max-w-[640px] aspect-video rounded-[2rem] overflow-hidden shadow-2xl" data-crop-wrapper-id="video_block_bg">
                        {videoBlockProps?.sourceType === 'embed' && videoBlockProps.embedCode ? (
                          (() => {
                            const trimmed = videoBlockProps.embedCode.trim();
                            const isUrl = /^https?:\/\//.test(trimmed) && !trimmed.includes('<iframe');
                            if (isUrl) {
                              let embedUrl = trimmed;
                              try {
                                if (embedUrl.includes('youtube.com/watch?v=')) {
                                  const videoId = new URL(embedUrl).searchParams.get('v');
                                  if (videoId) embedUrl = `https://www.youtube.com/embed/${videoId}`;
                                } else if (embedUrl.includes('youtu.be/')) {
                                  const videoId = embedUrl.split('youtu.be/')[1].split('?')[0];
                                  if (videoId) embedUrl = `https://www.youtube.com/embed/${videoId}`;
                                } else if (embedUrl.includes('vimeo.com/')) {
                                  const videoId = embedUrl.split('vimeo.com/')[1].split('?')[0];
                                  if (videoId) embedUrl = `https://player.vimeo.com/video/${videoId}`;
                                }

                                const urlObj = new URL(embedUrl);
                                if (embedUrl.includes('youtube.com')) {
                                  if (videoBlockProps.startTime !== undefined) urlObj.searchParams.set('start', Math.floor(videoBlockProps.startTime).toString());
                                  if (videoBlockProps.endTime !== undefined) urlObj.searchParams.set('end', Math.floor(videoBlockProps.endTime).toString());
                                  embedUrl = urlObj.toString();
                                } else if (embedUrl.includes('vimeo.com')) {
                                  if (videoBlockProps.startTime !== undefined) urlObj.hash = `#t=${Math.floor(videoBlockProps.startTime)}s`;
                                  embedUrl = urlObj.toString();
                                }
                              } catch (e) {
                                // Ignore URL parsing errors
                              }
                              return (
                                <iframe
                                  src={embedUrl}
                                  className="w-full h-full"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                />
                              );
                            }
                            return <div className="w-full h-full [&>iframe]:w-full [&>iframe]:h-full" dangerouslySetInnerHTML={{ __html: videoBlockProps.embedCode }} />;
                          })()
                        ) : videoBlockProps?.sourceType === 'upload' && videoBlockProps.uploadUrl ? (
                          <UploadedVideoPlayer 
                            blockProps={videoBlockProps} 
                            customImages={customImages} 
                            assetPath={assetPath} 
                          />
                        ) : (
                          <img
                            src={videoBlockProps?.posterImage || customImages?.["video_block_bg"] || assetPath("/video_block_bg.png")}
                            alt="Workspace Desk"
                            className="w-full h-full object-cover"
                            data-image-id="video_block_bg"
                            style={getFilterStyle("video_block_bg")}
                          />
                        )}
                        <div className="absolute inset-0 bg-blue-900/10 mix-blend-overlay pointer-events-none"></div>
                      </div>
                    </div>

                    {/* CENTER: Edit Button Overlay */}
                    {isVideoEditingMode && (
                      <button
                        onClick={() => onEditVideo?.("video_block")}
                        className="absolute top-4 right-4 bg-white/90 text-gray-800 p-2 rounded-full shadow-lg hover:bg-white hover:scale-110 transition-transform z-50 flex items-center justify-center cursor-pointer border border-gray-200"
                        title="Edit Video"
                      >
                        <FaPen size={14} />
                      </button>
                    )}
                    {isImageEditingMode && (
                      <button
                        onClick={() => onEditImage?.("video_block_bg")}
                        className="absolute top-4 right-4 bg-white/90 text-gray-800 p-2 rounded-full shadow-lg hover:bg-white hover:scale-110 transition-transform z-50 flex items-center justify-center cursor-pointer border border-gray-200"
                        title="Edit Image"
                      >
                        <FaPen size={14} />
                      </button>
                    )}
                  </div>
                </div>
                {/* CONTACT SECTION */}
                <div id="contact" className="w-full px-4 sm:px-6 md:px-12 lg:px-20 py-12 sm:py-16 lg:py-24 relative overflow-hidden border-t border-gray-100 portfolio-hero" style={getSpecificSectionStyle('contact')}>
                  <div className="relative z-10 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 lg:gap-20 items-start lg:items-center">

                    <div>
                      {/* <h2 className="text-base font-bold flex items-center gap-1 mb-4 text-gray-800 tracking-wide max-w-full w-fit">
                        Get In <span className="bg-[#c4ff0b] text-gray-900 px-2 py-0.5 rounded-full text-sm font-extrabold ml-1 leading-none shadow-sm flex items-center h-6">Touch</span>
                      </h2> */}
                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-4">
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
                          <div
                            className={`w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 shrink-0 ${isIconEditingMode ? "cursor-pointer border-2 border-dashed border-blue-400 hover:bg-blue-50 transition-colors" : "text-[#1a3636]"
                              } ${editingIconId === "contact-email" ? "ring-2 ring-blue-500 bg-blue-50" : ""}`}
                            onClick={(e) => {
                              if (isIconEditingMode && onEditIcon) {
                                e.preventDefault();
                                e.stopPropagation();
                                onEditIcon("contact-email");
                              }
                            }}
                          >
                            {customIcons["contact-email"] ? (
                              <IconPreview props={customIcons["contact-email"]} />
                            ) : (
                              <FaEnvelope size={18} />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Email</p>
                            <p className="text-gray-900 font-bold break-all">hello@example.com</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 shrink-0 ${isIconEditingMode ? "cursor-pointer border-2 border-dashed border-blue-400 hover:bg-blue-50 transition-colors" : "text-[#1a3636]"
                              } ${editingIconId === "contact-phone" ? "ring-2 ring-blue-500 bg-blue-50" : ""}`}
                            onClick={(e) => {
                              if (isIconEditingMode && onEditIcon) {
                                e.preventDefault();
                                e.stopPropagation();
                                onEditIcon("contact-phone");
                              }
                            }}
                          >
                            {customIcons["contact-phone"] ? (
                              <IconPreview props={customIcons["contact-phone"]} />
                            ) : (
                              <FaMobileAlt size={18} />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Phone</p>
                            <p className="text-gray-900 font-bold break-words">+1 (555) 000-0000</p>
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

                {/* FOOTER SECTION */}
                <footer id="footer" className="stackly-footer w-full px-4 sm:px-6 md:px-12 lg:px-20 py-12 lg:py-20 rounded-b-xl bg-[#06224C]" style={getSpecificSectionStyle('footer')}>
                  <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
                      {/* Brand Column */}
                      <div className="flex flex-col items-start lg:col-span-1">
                        <Link
                          href="/landing"
                          className="flex h-10 min-w-[92px] items-center justify-center rounded-[50%] bg-white px-3 mb-8"
                        >
                          <Image
                            src={assetPath("/stackly-logo.webp")}
                            alt="Stackly logo"
                            width={92}
                            height={28}
                            className="h-[18px] w-auto"
                            unoptimized
                          />
                        </Link>
                        <h2 className="text-[22px] font-bold text-white mb-4 leading-snug">
                          Turning Ideas Into <br /> Meaningful Experiences.
                        </h2>
                        <p className="text-[#8B9DB1] text-sm mb-8 leading-relaxed max-w-[280px]">
                          Im a UI/UX Designer & Frontend Developer who craft clean, user-focused digital experience.
                        </p>
                        <button className="px-5 py-2 border border-white/20 text-white text-sm font-semibold rounded-md flex items-center gap-2 hover:bg-white/10 transition group">
                          Let's work together <FaArrowRight className="-rotate-45 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </button>
                      </div>

                      {/* Navigation Column */}
                      <div>
                        <h3 className="text-white font-bold text-sm mb-8 ml-6 tracking-wider uppercase">Navigation</h3>
                        <ul className="space-y-5">
                          {['Home', 'About', 'Projects', 'Contact'].map(link => (
                            <li key={link}><a href={`#${link.toLowerCase()}`} className="ml-6 text-[#8B9DB1] hover:text-white text-[15px] font-medium transition-colors">{link}</a></li>
                          ))}
                        </ul>
                      </div>

                      {/* Services Column */}
                      <div>
                        <h3 className="text-white font-bold text-sm mb-8 tracking-wider uppercase">Services</h3>
                        <ul className="space-y-5">
                          {['UI/UX Design', 'Web Development', 'Responsive Design', 'Prototyping', 'Design Systems'].map(link => (
                            <li key={link}><a href="#" className="text-[#8B9DB1] hover:text-white text-[15px] font-medium transition-colors">{link}</a></li>
                          ))}
                        </ul>
                      </div>

                      {/* Connect Column */}
                      <div>
                        <h3 className="text-white font-bold text-sm mb-8 tracking-wider uppercase">Let's Connect</h3>
                        <ul className="space-y-5">
                          <li>
                            <a href="mailto:@thestackly.com" className="flex items-center gap-3 text-[#8B9DB1] hover:text-white text-[15px] font-medium transition-colors">
                              <span
                                className={`flex items-center justify-center w-5 shrink-0 ${isIconEditingMode ? "cursor-pointer rounded border border-dashed border-blue-400 hover:bg-blue-50 transition-colors" : "text-red-500"
                                  } ${editingIconId === "footer-email" ? "ring-2 ring-blue-500 bg-blue-50" : ""}`}
                                onClick={(e) => {
                                  if (isIconEditingMode && onEditIcon) {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onEditIcon("footer-email");
                                  }
                                }}
                              >
                                {customIcons["footer-email"] ? (
                                  <IconPreview props={customIcons["footer-email"]} />
                                ) : (
                                  <FaEnvelope size={18} />
                                )}
                              </span>
                              <span className="flex-1 min-w-0 break-all">@thestackly.com</span>
                            </a>
                          </li>
                          <li>
                            <a href="tel:+9956796541" className="flex items-center gap-3 text-[#8B9DB1] hover:text-white text-[15px] font-medium transition-colors">
                              <span
                                className={`flex items-center justify-center w-5 shrink-0 ${isIconEditingMode ? "cursor-pointer rounded border border-dashed border-blue-400 hover:bg-blue-50 transition-colors" : "text-[#517AA5]"
                                  } ${editingIconId === "footer-phone" ? "ring-2 ring-blue-500 bg-blue-50" : ""}`}
                                onClick={(e) => {
                                  if (isIconEditingMode && onEditIcon) {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onEditIcon("footer-phone");
                                  }
                                }}
                              >
                                {customIcons["footer-phone"] ? (
                                  <IconPreview props={customIcons["footer-phone"]} />
                                ) : (
                                  <FaMobileAlt size={18} />
                                )}
                              </span>
                              <span className="flex-1 min-w-0 break-words">+9956796541</span>
                            </a>
                          </li>
                          <li>
                            <span className="flex items-center gap-3 text-[#8B9DB1] text-[15px] font-medium">
                              <span
                                className={`flex items-center justify-center w-5 shrink-0 ${isIconEditingMode ? "cursor-pointer rounded border border-dashed border-blue-400 hover:bg-blue-50 transition-colors" : "text-green-500"
                                  } ${editingIconId === "footer-map" ? "ring-2 ring-blue-500 bg-blue-50" : ""}`}
                                onClick={(e) => {
                                  if (isIconEditingMode && onEditIcon) {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onEditIcon("footer-map");
                                  }
                                }}
                              >
                                {customIcons["footer-map"] ? (
                                  <IconPreview props={customIcons["footer-map"]} />
                                ) : (
                                  <FaMapMarkerAlt size={18} />
                                )}
                              </span>
                              <span className="flex-1 min-w-0 break-words">Bengaluru, India</span>
                            </span>
                          </li>
                          <li>
                            <a href="https://linkedin.com/in/stackly" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-[#8B9DB1] hover:text-white text-[15px] font-medium transition-colors">
                              <span
                                className={`flex items-center justify-center w-5 shrink-0 ${isIconEditingMode ? "cursor-pointer rounded border border-dashed border-blue-400 hover:bg-blue-50 transition-colors" : "text-blue-500"
                                  } ${editingIconId === "footer-linkedin" ? "ring-2 ring-blue-500 bg-blue-50" : ""}`}
                                onClick={(e) => {
                                  if (isIconEditingMode && onEditIcon) {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onEditIcon("footer-linkedin");
                                  }
                                }}
                              >
                                {customIcons["footer-linkedin"] ? (
                                  <IconPreview props={customIcons["footer-linkedin"]} />
                                ) : (
                                  <FaLinkedin size={18} />
                                )}
                              </span>
                              <span className="flex-1 min-w-0 break-all">linkedin.com/in/stackly</span>
                            </a>
                          </li>
                          <li>
                            <a href="https://github.com/stackly" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-[#8B9DB1] hover:text-white text-[15px] font-medium transition-colors">
                              <span
                                className={`flex items-center justify-center w-5 shrink-0 ${isIconEditingMode ? "cursor-pointer rounded border border-dashed border-blue-400 hover:bg-blue-50 transition-colors" : "text-white"
                                  } ${editingIconId === "footer-github" ? "ring-2 ring-blue-500 bg-blue-50" : ""}`}
                                onClick={(e) => {
                                  if (isIconEditingMode && onEditIcon) {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onEditIcon("footer-github");
                                  }
                                }}
                              >
                                {customIcons["footer-github"] ? (
                                  <IconPreview props={customIcons["footer-github"]} />
                                ) : (
                                  <FaGithub size={18} />
                                )}
                              </span>
                              <span className="flex-1 min-w-0 break-all">github.com/stackly</span>
                            </a>
                          </li>
                        </ul>
                      </div>
                    </div>

                    <div className="border-t border-white/10 mt-16 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
                      <p className="text-[#8B9DB1] text-[15px] font-medium text-center md:text-left">© 2026 Stackly. All rights reserved.</p>
                      <p className="text-[#8B9DB1] text-[15px] font-medium text-center md:text-right">Designed & Built with <span className="text-red-500 text-lg leading-none inline-block align-middle mx-1">❤️</span> and lots of coffee ☕</p>
                    </div>
                  </div>
                </footer>
              </div>
            </div>

            {/* <div className="w-full flex items-center justify-between mt-8 px-4"> */}
            {/* <div className="w-full flex items-center justify-between px-4 py-3 mt-10 border-t bg-white"> */}

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

            {/* </div> */}
          </div>


        </div>




      </div>
    </main>
  );
}

