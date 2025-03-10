import { Menu } from "lucide-react";
import { useState, useEffect } from "react";

export default function MobileNavButton({ onOpenModal }) {
  const [mounted, setMounted] = useState(false);

  // Ensure the component is mounted before rendering the button
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const handleClick = (e) => {
    e.preventDefault();
    console.log("Mobile button clicked directly");
    if (onOpenModal) {
      onOpenModal();
    }
  };

  if (!mounted) return null;

  return (
    <div
      className="fixed bottom-6 right-6 z-[9999]"
      style={{
        touchAction: "manipulation",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      <button
        type="button"
        className="w-16 h-16 bg-blue-600 rounded-full shadow-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
        onClick={handleClick}
        aria-label="Open navigator"
      >
        <Menu size={28} className="text-white" />
      </button>
    </div>
  );
}
