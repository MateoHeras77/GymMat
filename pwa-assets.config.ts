import {
  defineConfig,
  minimal2023Preset,
  combinePresetAndAppleSplashScreens,
} from "@vite-pwa/assets-generator/config"

// Generates PWA icons (incl. a maskable with safe-zone), a proper 180x180
// apple-touch-icon, and the full set of iOS apple-touch-startup-image splash
// screens — eliminating the white flash when launching from the Home Screen.
// The matching <link> tags are injected automatically by vite-plugin-pwa.
export default defineConfig({
  headLinkOptions: {
    preset: "2023",
  },
  preset: combinePresetAndAppleSplashScreens(minimal2023Preset, {
    // Splash background matches the app's dark background_color.
    padding: 0.3,
    resizeOptions: { background: "#09090b", fit: "contain" },
    darkResizeOptions: { background: "#09090b", fit: "contain" },
    linkMediaOptions: { log: true, addMediaScreen: true, basePath: "/" },
  }),
  // Source lives at the public root so every generated asset (icons, maskable,
  // apple-touch-icon, splash screens) resolves from "/" with no basePath juggling.
  images: ["public/pwa-source.png"],
})
