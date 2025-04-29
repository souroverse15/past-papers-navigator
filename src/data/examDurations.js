export const examDurations = {
  IAL: {
    Mathematics: {
      P1: 1,
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
      Paper1: 120,
      Paper1R: 120,
      Paper2: 75,
      Paper2R: 75,
    },
    Physics: {
      Paper1: 120,
      Paper1R: 120,
      Paper2: 75,
      Paper2R: 75,
    },
    "Mathematics B": {
      Paper1: 90,
      Paper1R: 90,
      Paper2: 150,
      Paper2R: 150,
    },
    "Further Pure Mathematics": {
      Paper1: 120,
      Paper1R: 120,
      Paper2: 120,
      Paper2R: 120,
    },
    "Mathematics A": {
      Paper1: 120,
      Paper1R: 120,
      Paper2: 120,
      Paper2R: 120,
    },
  },
};

// Helper function to get the duration for a specific paper
export function getPaperDuration(paperPath, paperName) {
  console.log(
    `Getting duration for paperPath: ${paperPath}, paperName: ${paperName}`
  );

  if (!paperPath || !paperName) {
    console.log("Missing paperPath or paperName, returning default 90");
    return 90; // Default duration
  }

  const pathParts = paperPath.split("/").filter(Boolean);
  console.log("Path parts:", pathParts);

  // Extract exam board (IAL or IGCSE)
  const examBoard = pathParts[0];
  console.log("Exam board:", examBoard);

  if (!examDurations[examBoard]) {
    console.log(
      `Exam board ${examBoard} not found in examDurations, returning default 90`
    );
    return 90;
  }

  // Extract subject
  const subject = pathParts[1];
  console.log("Subject:", subject);

  if (!examDurations[examBoard][subject]) {
    console.log(
      `Subject ${subject} not found in examDurations[${examBoard}], returning default 90`
    );
    return 90;
  }

  // Try direct lookup first
  if (examDurations[examBoard][subject][paperName]) {
    console.log(
      `Found exact match for ${paperName}, returning ${examDurations[examBoard][subject][paperName]}`
    );
    return examDurations[examBoard][subject][paperName];
  }

  // If direct lookup fails, try to standardize the paper name
  let standardizedPaperName = paperName;

  // For IGCSE papers, handle different naming conventions
  if (examBoard === "IGCSE") {
    // Convert between "Paper1" and "P1" formats
    if (paperName.startsWith("Paper")) {
      // Convert from "Paper1" to "P1"
      standardizedPaperName = paperName.replace("Paper", "P");
    } else if (paperName.match(/^P\d/)) {
      // Convert from "P1" to "Paper1"
      standardizedPaperName = "Paper" + paperName.substring(1);
    }
  }

  console.log(`Standardized paper name: ${standardizedPaperName}`);

  // Try lookup with standardized name
  if (examDurations[examBoard][subject][standardizedPaperName]) {
    console.log(
      `Found match for standardized name ${standardizedPaperName}, returning ${examDurations[examBoard][subject][standardizedPaperName]}`
    );
    return examDurations[examBoard][subject][standardizedPaperName];
  }

  // If still no match, try to extract the paper type from the name
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
    "Paper1",
    "Paper1R",
    "Paper2",
    "Paper2R",
  ];

  // Try to match with any paper type
  for (const type of paperTypes) {
    // Check if the paper name contains the type (case insensitive)
    if (paperName.toUpperCase().includes(type.toUpperCase())) {
      // Try both the original type and the standardized version
      if (examDurations[examBoard][subject][type]) {
        console.log(
          `Found duration ${examDurations[examBoard][subject][type]} for paper type ${type}`
        );
        return examDurations[examBoard][subject][type];
      }

      // For IGCSE, try the alternative format
      if (examBoard === "IGCSE") {
        const altType = type.startsWith("Paper")
          ? type.replace("Paper", "P")
          : type.match(/^P\d/)
          ? "Paper" + type.substring(1)
          : null;

        if (altType && examDurations[examBoard][subject][altType]) {
          console.log(
            `Found duration ${examDurations[examBoard][subject][altType]} for alternative paper type ${altType}`
          );
          return examDurations[examBoard][subject][altType];
        }
      }
    }
  }

  // If all else fails, return the default duration
  console.log("No matching paper type found, returning default 90");
  return 90;
}
