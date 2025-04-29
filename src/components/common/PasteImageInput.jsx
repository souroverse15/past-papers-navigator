import React, { useState, useRef, useEffect } from "react";
import { Image, X } from "lucide-react";

/**
 * A reusable component for handling image paste (Ctrl+V) from clipboard
 * Use this in announcement form, assignment form, etc.
 */
const PasteImageInput = ({
  onImagePaste,
  existingAttachments = [],
  onRemoveAttachment,
}) => {
  const [pasteHintVisible, setPasteHintVisible] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    const handlePaste = (e) => {
      // Check if the active element is within our component
      if (!inputRef.current?.contains(document.activeElement)) {
        return;
      }

      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            // Create a preview URL
            const imageUrl = URL.createObjectURL(file);

            // Create a metadata object
            const imageAttachment = {
              name: `Pasted image ${new Date().toLocaleTimeString()}`,
              type: "image",
              size: `${Math.round(file.size / 1024)} KB`,
              url: imageUrl,
              file: file, // Include the actual file for upload
              source: "paste",
            };

            // Pass the attachment to parent component
            onImagePaste(imageAttachment);

            // Hide paste hint after successful paste
            setPasteHintVisible(false);

            // Prevent default paste behavior
            e.preventDefault();
            return;
          }
        }
      }
    };

    // Listen for paste events
    document.addEventListener("paste", handlePaste);

    return () => {
      document.removeEventListener("paste", handlePaste);
    };
  }, [onImagePaste]);

  const handleFocus = () => {
    if (existingAttachments.length === 0) {
      setPasteHintVisible(true);
    }
  };

  const handleBlur = () => {
    setPasteHintVisible(false);
  };

  return (
    <div ref={inputRef} className="relative">
      {/* Paste hint overlay */}
      {pasteHintVisible && (
        <div className="absolute right-3 top-3 bg-blue-50 text-blue-600 px-3 py-1 rounded-md text-sm flex items-center">
          <Image size={14} className="mr-1" />
          Press Ctrl+V to paste an image
        </div>
      )}

      {/* Existing attachments display */}
      {existingAttachments.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {existingAttachments.map(
            (attachment, index) =>
              attachment.type === "image" && (
                <div
                  key={index}
                  className="relative group border rounded-md overflow-hidden"
                  style={{ width: "100px", height: "100px" }}
                >
                  <img
                    src={attachment.url}
                    alt={attachment.name}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => onRemoveAttachment(index)}
                    className="absolute top-1 right-1 bg-red-100 text-red-500 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={14} />
                  </button>
                </div>
              )
          )}
        </div>
      )}
    </div>
  );
};

export default PasteImageInput;
