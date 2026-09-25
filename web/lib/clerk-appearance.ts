/**
 * Clerk's sign-in and sign-up in the Instrument theme. The values are the CSS
 * variables from app/globals.css, so the theme still has one source. Clerk
 * accepts CSS variables here (its appearance "variables" docs); the full
 * Stitch restyle of the auth pages is V3.
 */
export const clerkAppearance = {
  variables: {
    colorPrimary: "var(--amber)",
    colorPrimaryForeground: "var(--bg)",
    colorBackground: "var(--panel)",
    colorForeground: "var(--text)",
    colorMutedForeground: "var(--dim)",
    colorInput: "var(--bg)",
    colorInputForeground: "var(--text)",
    colorBorder: "var(--line)",
    colorRing: "var(--amber)",
    colorModalBackdrop: "var(--bg)",
    borderRadius: "var(--radius)",
    fontFamily: "var(--font-sans)",
    fontFamilyButtons: "var(--font-sans)",
    fontFamilyMono: "var(--font-mono)",
  },
};
