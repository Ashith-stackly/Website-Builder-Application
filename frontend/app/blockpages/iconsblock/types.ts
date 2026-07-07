export type IconType =
  | "user"
  | "search"
  | "download"
  | "copy"
  | "cloud"
  | "clock"
  | "cancel"
  | "camera"
  | "heart";
 
export interface IconBlockProps {
  iconType: IconType;
  color: string;
  size: string;
  thickness: number;
  pageLabel: string;
  customIconUrl?: string;
}
 
export interface IconBlockData {
  id: string;
  type: "icons";
  props: IconBlockProps;
}
 
export const ICON_OPTIONS: { id: IconType; label: string }[] = [
  { id: "user", label: "User" },
  { id: "search", label: "Search" },
  { id: "download", label: "Download" },
  { id: "copy", label: "Copy" },
  { id: "cloud", label: "Cloud" },
  { id: "clock", label: "Clock" },
  { id: "cancel", label: "Cancel" },
  { id: "camera", label: "Camera" },
  { id: "heart", label: "Heart" },
];
 
export const defaultIconProps: IconBlockProps = {
  iconType: "user",
  color: "#EAB308",
  size: "48",
  thickness: 2,
  pageLabel: "Portfolio page",
};