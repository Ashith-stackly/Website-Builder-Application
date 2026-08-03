/** Invisible marker for block-pages divider placement and preview section boundaries. */
export default function BlockpagesSectionEnd({ sectionId }: { sectionId: string }) {
  return <div data-blockpages-section-end={sectionId} className="h-0 w-full" aria-hidden="true" />;
}
