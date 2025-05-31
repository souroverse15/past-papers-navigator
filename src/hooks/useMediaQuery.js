import { useState, useEffect } from "react";

/**
 * Custom hook for detecting CSS media queries in React components
 * @param {string} query - CSS media query string (e.g. '(max-width: 768px)')
 * @returns {boolean} Whether the media query matches or not
 */
export const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);

    // Set initial value
    setMatches(media.matches);

    // Create event listener
    const listener = (event) => {
      setMatches(event.matches);
    };

    // Add listener
    media.addEventListener("change", listener);

    // Cleanup
    return () => media.removeEventListener("change", listener);
  }, [query]);

  return matches;
};

// Predefined breakpoint hooks for convenience
export const useIsMobile = () => useMediaQuery("(max-width: 768px)");
export const useIsTablet = () =>
  useMediaQuery("(min-width: 769px) and (max-width: 1024px)");
export const useIsDesktop = () => useMediaQuery("(min-width: 1025px)");
export const useIsSmallScreen = () => useMediaQuery("(max-width: 1024px)");
