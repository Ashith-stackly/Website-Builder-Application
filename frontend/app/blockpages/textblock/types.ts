export type TextEditorTarget = 'main' | 'text' | 'header' | 'footer';
export type TextTemplateType = 'ecommerce' | 'portfolio';
 
export interface TextStyles {
  color: string;
  fontSize: string;
  fontFamily: string;
  lineHeight?: string;
  letterSpacing?: string;
  fontWeight?: string;
  textAlign?: string;
}
 
export interface TextSectionProps {
  alignment: 'left' | 'center' | 'right';
  backgroundColor: string;
  gradientBackground?: string;
  backgroundImage?: string;
  paddingTop?: string;
  paddingRight?: string;
  paddingBottom?: string;
  paddingLeft?: string;
  marginTop?: string;
  marginRight?: string;
  marginBottom?: string;
  marginLeft?: string;
  sectionFontFamily?: string;
  sectionFontSize?: string;
  sectionTextColor?: string;
  sectionLetterSpacing?: string;
  headerBg: string;
  headerText: string;
  headerFontSize?: string;
  headerFontFamily?: string;
  headerFontWeight?: string;
  headerLineHeight?: string;
  headerLetterSpacing?: string;
  footerBg: string;
  footerText: string;
  shadow: boolean;
}
 
export interface SectionStyleConfig {
  backgroundColor?: string;
  gradientBackground?: string;
  backgroundImage?: string;
}
 
export interface TextBlockState {
  section: TextSectionProps;
  textStyles: TextStyles;
  selectedTarget: TextEditorTarget;
  isTextEditable: boolean;
  activeSectionId?: string;
  sectionStyles?: Record<string, SectionStyleConfig>;
}