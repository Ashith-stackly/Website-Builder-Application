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

export type BuilderRenderer = (props: { component: BuilderComponent }) => React.ReactNode;

export const componentRegistry: Record<ComponentType, BuilderRenderer> = {
  navigation: NavigationComponent,
  hero: HeroComponent,
  heading: HeadingComponent,
  text: TextComponent,
  button: ButtonComponent,
  image: ImageComponent,
  input: InputComponent,
  divider: DividerComponent,
  features: FeaturesComponent,
  gallery: GalleryComponent,
  contact: ContactComponent,
  container: ContainerComponent,
};
