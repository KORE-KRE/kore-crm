// Loads the Google Maps JS API (Places library) once and reuses the same
// promise for every subsequent caller, so multiple address fields on the
// same page don't each inject their own <script> tag.
let loadPromise = null;

export function loadGoogleMaps() {
  if (loadPromise) return loadPromise;
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!key) return Promise.reject(new Error("Google Maps isn't configured yet (missing VITE_GOOGLE_MAPS_API_KEY)."));

  loadPromise = new Promise((resolve, reject) => {
    if (window.google?.maps?.places) {
      resolve(window.google);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://maps.googleapis.com/maps/api/js?key=" + encodeURIComponent(key) + "&libraries=places";
    script.async = true;
    script.onload = () => resolve(window.google);
    script.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(script);
  });
  return loadPromise;
}
