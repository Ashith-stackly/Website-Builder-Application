"use client";

import Image from "next/image";
import Link from "next/link";
import {
  FaArrowRight,
  FaCrosshairs,
  FaDesktop,
  FaEye,
  FaGem,
  FaGlobe,
  FaHeadset,
  FaRegFlag,
  FaRegHeart,
  FaRegStar,
  FaRocket,
  FaUsers,
} from "react-icons/fa";
import { assetPath } from "@/lib/paths";

const focusCards = [
  {
    title: "Our Mission",
    text: "To make website building easy, accessible, and effective for everyone.",
    icon: FaRocket,
  },
  {
    title: "Our Vision",
    text: "To be the world's most trusted website platform for creators and businesses.",
    icon: FaEye,
  },
  {
    title: "Our Values",
    text: "Simplicity, innovation, reliability, and customer success drive everything we do.",
    icon: FaGem,
  },
  {
    title: "Our Promise",
    text: "We're committed to your success with tools, support, and continuous improvement.",
    icon: FaRegHeart,
  },
];

const timelineCards = [
  {
    year: "2015",
    title: "The Beginning",
    text: "Stackly was founded with a mission to simplify website creation for all.",
    icon: FaRegFlag,
  },
  {
    year: "2018",
    title: "Growing Together",
    text: "We reached our first 10,000 users and expanded our team and features.",
    icon: FaUsers,
  },
  {
    year: "2021",
    title: "Expanding Horizons",
    text: "New tools, templates, and integrations helped businesses scale online.",
    icon: FaCrosshairs,
  },
  {
    year: "Today",
    title: "Stronger Than Ever",
    text: "Thousands of users trust Stackly to build, manage, and grow their online presence.",
    icon: FaRegStar,
  },
];

const stats = [
  {
    value: "50K+",
    label: "Happy Users",
    icon: FaUsers,
  },
  {
    value: "120+",
    label: "Countries",
    icon: FaGlobe,
  },
  {
    value: "500+",
    label: "Templates",
    icon: FaDesktop,
  },
  {
    value: "24/7 Customer",
    label: "Support",
    icon: FaHeadset,
  },
];

const timelineAnimationClasses = [
  "[animation:planning-card-in_0.55s_ease_0.10s_both]",
  "[animation:planning-card-in_0.55s_ease_0.16s_both]",
  "[animation:planning-card-in_0.55s_ease_0.22s_both]",
  "[animation:planning-card-in_0.55s_ease_0.28s_both]",
];

export default function AboutUs() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-white text-[#092652]">
      <section className="relative bg-[#e7f0fc] px-5 pb-20 pt-10 shadow-[inset_0_-2px_5px_rgba(6,34,76,0.18)] sm:px-8 lg:px-12 lg:pb-24 xl:px-0">
        <div className="mx-auto grid w-full max-w-[1180px] items-center gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:gap-16">
          <div className="min-w-0 text-center [animation:planning-fade-up_0.58s_ease_both] lg:text-left">
            <p className="mb-5 text-sm font-bold uppercase tracking-wide text-[#2454ff] sm:text-base">
              About Us
            </p>
            <h1 className="mx-auto max-w-[620px] text-balance text-3xl font-extrabold italic leading-tight text-[#092652] sm:text-4xl lg:mx-0 lg:text-5xl">
              Building Better Websites for a Better Future
            </h1>
            <p className="mx-auto mt-6 max-w-[560px] text-pretty text-base leading-7 text-[#173866] sm:text-lg lg:mx-0">
              Stackly is a powerful website builder that empowers individuals, businesses, and organizations to create stunning websites without any coding. We combine simplicity with flexibility to help you build, grow, and succeed online.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center lg:justify-start">
              <Link
                href="/landing#templates"
                className="inline-flex h-11 min-w-0 items-center justify-center rounded-md bg-[#06285b] px-6 text-sm font-bold text-white shadow-[0_4px_8px_rgba(6,34,76,0.22)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#0a3471] hover:shadow-[0_12px_24px_rgba(6,34,76,0.22)] active:scale-95 sm:min-w-[15rem] sm:text-base"
              >
                Explore Our Products
              </Link>
              <Link
                href="/landing#contact"
                className="inline-flex h-11 min-w-0 items-center justify-center rounded-md border border-[#06285b] bg-white px-6 text-sm font-bold text-[#092652] shadow-[0_3px_8px_rgba(6,34,76,0.18)] transition duration-300 hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-[0_12px_24px_rgba(6,34,76,0.14)] active:scale-95 sm:min-w-[10.5rem] sm:text-base"
              >
                Contact Us
              </Link>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[610px] [animation:planning-panel-in_0.68s_ease_0.08s_both] lg:max-w-none">
            <div className="group relative aspect-[1.49/1] overflow-hidden rounded-xl shadow-[0_3px_10px_rgba(6,34,76,0.22)] ring-1 ring-[#9fb0c7] transition duration-500 hover:-translate-y-1 hover:shadow-[0_22px_42px_rgba(6,34,76,0.20)]">
              <Image
                src={assetPath("/business09.webp")}
                alt="Stackly team meeting"
                fill
                sizes="(max-width: 1024px) 92vw, 46vw"
                className="object-cover transition duration-700 group-hover:scale-105"
                priority
                unoptimized
              />
              <div className="absolute left-4 top-4 rounded-full bg-white/75 px-3 py-1.5 shadow-sm backdrop-blur-sm sm:left-6 sm:top-5">
                <Image
                  src={assetPath("/stackly-logo.webp")}
                  alt="Stackly"
                  width={92}
                  height={28}
                  className="h-auto w-[92px]"
                  unoptimized
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto -mt-14 w-full max-w-[1180px] px-5 sm:px-8 xl:px-0">
        <div className="grid overflow-hidden rounded-2xl border border-[#8ea2bd] bg-white p-5 shadow-[0_4px_8px_rgba(6,34,76,0.22)] [animation:planning-card-in_0.6s_ease_0.12s_both] sm:grid-cols-2 sm:p-6 lg:grid-cols-4 lg:p-7">
          {focusCards.map(({ title, text, icon: Icon }, index) => (
            <article
              key={title}
              className="group grid min-w-0 grid-cols-[2.5rem_1fr] gap-x-4 gap-y-2 rounded-lg py-3 text-left transition duration-300 hover:bg-[#f6f9ff] sm:p-3 lg:border-r lg:border-[#8ea2bd] lg:px-5 lg:last:border-r-0"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[#06285b] text-white shadow-[0_3px_6px_rgba(6,34,76,0.35)] transition duration-300 group-hover:-translate-y-1 group-hover:rotate-3">
                <Icon className="text-sm" />
              </span>
              <h2 className="text-base font-bold text-[#092652] sm:text-lg">{title}</h2>
              <p className="col-start-2 text-pretty text-sm leading-6 text-[#173866] sm:text-base">{text}</p>
              {index < focusCards.length - 1 && <span className="col-span-2 my-3 h-px bg-[#8ea2bd] lg:hidden" />}
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-[1180px] gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[0.85fr_2.15fr] lg:gap-14 lg:py-20 xl:px-0">
        <div className="min-w-0 text-center [animation:planning-fade-up_0.58s_ease_0.18s_both] lg:text-left">
          <p className="mb-4 text-sm font-bold uppercase tracking-wide text-[#2454ff] sm:text-base">Our Story</p>
          <h2 className="text-balance text-2xl font-extrabold leading-tight text-[#092652] sm:text-3xl lg:text-4xl">
            From an Idea to a Powerful Platform
          </h2>
          <p className="mt-4 text-pretty text-base leading-7 text-[#173866] sm:text-lg">
            Founded in 2015, Stackly began with a simple goal: to help people create professional websites without technical barriers. What started as a small idea has grown into a powerful platform trusted by thousands of users worldwide.
          </p>
          <p className="mt-4 text-pretty text-base leading-7 text-[#173866] sm:text-lg">
            Today, we continue to innovate and expand our features to deliver the best website building experience possible.
          </p>
          <Link
            href="/landing#features"
            aria-label="Explore Stackly features"
            className="mx-auto mt-5 inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-[#2454ff] transition duration-300 hover:translate-x-1 hover:bg-blue-100 lg:mx-0"
          >
            <FaArrowRight className="text-base" />
          </Link>
        </div>

        <div className="grid min-w-0 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {timelineCards.map(({ year, title, text, icon: Icon }, index) => (
            <article
              key={`${year}-${title}`}
              className={`group flex min-h-[280px] min-w-0 flex-col items-center justify-start rounded-2xl border border-[#9aaac0] bg-white px-5 py-6 text-center shadow-[0_4px_6px_rgba(6,34,76,0.22)] transition duration-300 hover:-translate-y-2 hover:border-[#2454ff]/50 hover:shadow-[0_16px_32px_rgba(6,34,76,0.18)] sm:min-h-[300px] sm:px-6 sm:py-7 ${timelineAnimationClasses[index]}`}
            >
              <span className="mb-8 flex h-16 w-16 items-center justify-center rounded-md bg-[#e0ecff] text-[#092652] transition duration-300 group-hover:-translate-y-1 group-hover:scale-105 group-hover:bg-[#06285b] group-hover:text-white sm:h-[74px] sm:w-[74px]">
                <Icon className="text-xl sm:text-2xl" />
              </span>
              <h3 className="text-base font-extrabold leading-tight text-[#092652] sm:text-lg">
                {year}
                <br />
                {title}
              </h3>
              <p className="mt-3 text-pretty text-sm leading-6 text-[#173866] sm:text-base">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1180px] px-5 pb-12 sm:px-8 lg:pb-16 xl:px-0">
        <div className="grid gap-4 rounded-2xl bg-[#06285b] px-5 py-8 text-white shadow-[0_4px_8px_rgba(6,34,76,0.25)] [animation:planning-panel-in_0.62s_ease_0.22s_both] sm:grid-cols-2 sm:px-8 sm:py-9 lg:grid-cols-4 lg:gap-0 lg:px-10">
          {stats.map(({ value, label, icon: Icon }) => (
            <article
              key={label}
              className="group flex min-w-0 items-center justify-center gap-4 rounded-xl px-3 py-4 text-center transition duration-300 hover:bg-white/10 sm:justify-start sm:text-left lg:justify-center lg:border-r lg:border-white/40 lg:px-6 lg:last:border-r-0"
            >
              <Icon className="shrink-0 text-4xl text-white transition duration-300 group-hover:scale-110 sm:text-5xl" />
              <div className="min-w-0">
                <p className="text-pretty text-xl font-semibold leading-tight sm:text-2xl">{value}</p>
                <p className="mt-1 text-sm leading-tight text-white/90 sm:text-base">{label}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
