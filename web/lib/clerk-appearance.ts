/**
 * Clerk's widgets (SignIn, SignUp, UserButton) in the Instrument theme (#28).
 *
 * - `variables` are hex/rgba, not CSS variables: Clerk derives hover and
 *   border shades from them, which it can't do from `var(--…)`. They must
 *   equal the tokens in app/globals.css (test/auth-pages.test.tsx checks).
 * - `elements` are Tailwind classes on Clerk's stable `cl-*` elements.
 *   `cssLayerName: "clerk"` plus the `@layer … clerk …` order at the top of
 *   globals.css lets these utilities win over Clerk's own styles.
 * - Amber only on the primary button (and the focus ring); 48 px inputs and
 *   buttons; mono labels. The font is inherited from the page (font-sans).
 */
export const clerkAppearance = {
  cssLayerName: "clerk",
  variables: {
    colorPrimary: "#ef9a57",
    colorPrimaryForeground: "#050609",
    colorBackground: "#0b0d12",
    colorForeground: "#f2f4f7",
    colorMutedForeground: "rgba(242, 244, 247, 0.55)",
    colorNeutral: "#f2f4f7",
    colorInput: "#050609",
    colorInputForeground: "#f2f4f7",
    colorBorder: "rgba(242, 244, 247, 0.1)",
    colorRing: "#ef9a57",
    colorModalBackdrop: "rgba(5, 6, 9, 0.8)",
    borderRadius: "0.25rem",
  },
  elements: {
    rootBox: "w-full font-sans",
    cardBox: "w-full max-w-none rounded border border-line shadow-none",
    card: "rounded-none bg-panel p-5 shadow-none sm:p-6",
    // The page draws its own heading (Stitch), so Clerk's header is hidden.
    header: "hidden",
    socialButtonsBlockButton: "h-12 rounded-full border border-line bg-background text-foreground hover:bg-accent",
    socialButtonsBlockButtonText: "text-sm font-medium",
    dividerLine: "bg-line",
    dividerText: "font-mono text-xs tracking-widest text-foreground/60 uppercase",
    formFieldLabel: "font-mono text-xs tracking-widest text-foreground/75 uppercase",
    // Clerk caps its input with max-height: 2.25rem; lift the cap for 48 px.
    formFieldInput: "h-12 max-h-none rounded border border-line bg-background text-base text-foreground",
    formButtonPrimary:
      "h-12 rounded-full bg-primary text-xs font-bold tracking-wider text-primary-foreground uppercase shadow-none hover:brightness-110",
    footer: "bg-panel bg-none",
    footerActionText: "text-foreground/75",
    footerActionLink: "font-semibold text-foreground underline underline-offset-4 hover:text-foreground",
  },
};
