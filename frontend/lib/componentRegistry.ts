import type { ComponentType, BuilderComponent } from "@/types/builder";
import NavigationComponent from "@/components/draggable/NavigationComponent";
import HeroComponent from "@/components/draggable/HeroComponent";
import HeadingComponent from "@/components/draggable/HeadingComponent";
import TextComponent from "@/components/draggable/TextComponent";
import ButtonComponent from "@/components/draggable/ButtonComponent";
import ImageComponent from "@/components/draggable/ImageComponent";
import InputComponent from "@/components/draggable/InputComponent";
import DividerComponent from "@/components/draggable/DividerComponent";
import FeaturesComponent from "@/components/draggable/FeaturesComponent";
import GalleryComponent from "@/components/draggable/GalleryComponent";
import ContactComponent from "@/components/draggable/ContactComponent";
import ContainerComponent from "@/components/draggable/ContainerComponent";
import IconComponent from "@/components/draggable/IconComponent";
import FeatureItemComponent from "@/components/draggable/FeatureItemComponent";
import ColumnsComponent from "@/components/draggable/ColumnsComponent";
import VideoComponent from "@/components/draggable/VideoComponent";
import MapComponent from "@/components/draggable/MapComponent";
import AccordionComponent from "@/components/draggable/AccordionComponent";
import TabsComponent from "@/components/draggable/TabsComponent";
import SpacerComponent from "@/components/draggable/SpacerComponent";
import SocialLinksComponent from "@/components/draggable/SocialLinksComponent";
import CountdownComponent from "@/components/draggable/CountdownComponent";
import PricingTableComponent from "@/components/draggable/PricingTableComponent";
import ProductCollectionComponent from "@/components/draggable/ProductCollectionComponent";
import TestimonialComponent from "@/components/draggable/TestimonialComponent";
import FooterComponent from "@/components/draggable/FooterComponent";
import FormComponent from "@/components/draggable/FormComponent";
import RowComponent from "@/components/draggable/RowComponent";

export type BuilderRenderer = (props: {
  component: BuilderComponent;
  children?: React.ReactNode;
  isEditing?: boolean;
  /** Legacy: write back the pipe-delimited `content` string. Kept for non-migrated blocks. */
  onUpdate?: (content: string | null) => void;
  /**
   * Typed patch callback. Typed blocks (`hero`, `feature-item`, ...) should use this
   * instead of `onUpdate` so they can write structured `props` updates while
   * preserving inline editing on the canvas. The store shallow-merges `props`
   * and `styles`, so callers patch a single field at a time.
   */
  onPatch?: (patch: Partial<BuilderComponent>) => void;
}) => React.ReactNode;

export const componentRegistry: Record<ComponentType, BuilderRenderer> = {
  navigation: NavigationComponent,
  hero: HeroComponent,
  heading: HeadingComponent,
  text: TextComponent,
  button: ButtonComponent,
  icon: IconComponent,
  "feature-item": FeatureItemComponent,
  columns: ColumnsComponent,
  image: ImageComponent,
  input: InputComponent,
  divider: DividerComponent,
  features: FeaturesComponent,
  gallery: GalleryComponent,
  contact: ContactComponent,
  container: ContainerComponent,
  video: VideoComponent,
  map: MapComponent,
  accordion: AccordionComponent,
  tabs: TabsComponent,
  spacer: SpacerComponent,
  "social-links": SocialLinksComponent,
  countdown: CountdownComponent,
  "pricing-table": PricingTableComponent,
  "product-collection": ProductCollectionComponent,
  testimonial: TestimonialComponent,
  footer: FooterComponent,
  form: FormComponent,
  row: RowComponent,
};

