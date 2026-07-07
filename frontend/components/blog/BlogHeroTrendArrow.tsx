import { assetPath } from "@/lib/paths";

/** Hero trend arrow — user-provided asset (black bg removed via blend on hero) */
export default function BlogHeroTrendArrow() {
  return (
    <img
      src={assetPath("/blog/hero-trend-arrow.png")}
      alt=""
      width={56}
      height={44}
      className="blog-hero-arrow-img"
      decoding="async"
    />
  );
}
