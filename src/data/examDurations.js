export const examDurations = {
  IAL: {
    Mathematics: {
      P1: 90,
      P2: 90,
      P3: 90,
      P4: 90,
      M1: 90,
      S1: 90,
      C12: 150,
      C34: 150,
    },
  },
  IGCSE: {
    Chemistry: {
      P1: 120,
      P1R: 120,
      P2: 75,
      P2R: 75,
    },
    Physics: {
      P1: 120,
      P1R: 120,
      P2: 75,
      P2R: 75,
    },
    "Mathematics B": {
      P1: 90,
      P1R: 90,
      P2: 150,
      P2R: 150,
    },
    "Pure Mathematics": {
      P1: 120,
      P1R: 120,
      P2: 120,
      P2R: 120,
    },
    "Mathematics A": {
      P1: 120,
      P1R: 120,
      P2: 120,
      P2R: 120,
    },
  },
};

// Helper function to get the duration for a specific paper
export function getPaperDuration(paperPath, paperName) {
  if (!paperPath || !paperName) return 90; // Default duration

  const pathParts = paperPath.split("/").filter(Boolean);

  // Extract exam board (IAL or IGCSE)
  const examBoard = pathParts[0];
  if (!examDurations[examBoard]) return 90;

  // Extract subject
  const subject = pathParts[1];
  if (!examDurations[examBoard][subject]) return 90;

  // Extract paper type (P1, P2, etc.)
  // The paperName might be in format like "P1" or contain it
  let paperType = paperName;

  // Common paper types to check for
  const paperTypes = [
    "P1",
    "P1R",
    "P2",
    "P2R",
    "P3",
    "P4",
    "M1",
    "S1",
    "C12",
    "C34",
  ];

  for (const type of paperTypes) {
    if (paperName.includes(type)) {
      paperType = type;
      break;
    }
  }

  return examDurations[examBoard][subject][paperType] || 90;
}
