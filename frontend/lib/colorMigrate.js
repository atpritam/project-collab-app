/**
 * Utility script to help migrate hardcoded color classes to theme-aware variables
 */

// Color mapping from hardcoded to theme variables
const colorMap = {
  "bg-white": "bg-background",
  "bg-gray-50": "bg-muted",
  "bg-gray-100": "bg-muted",
  "bg-gray-200": "bg-muted",
  "hover:bg-gray-50": "hover:bg-muted",
  "hover:bg-gray-100": "hover:bg-muted",

  "text-gray-900": "text-foreground",
  "text-gray-800": "text-foreground",
  "text-gray-700": "text-foreground",
  "text-gray-600": "text-muted-foreground",
  "text-gray-500": "text-muted-foreground",
  "text-gray-400": "text-muted-foreground/70",

  "border-gray-300": "border-border",
  "border-gray-200": "border-border",
  "border-gray-100": "border-border/70",

  "focus:ring-violet-500": "focus:ring-ring",
  "focus:border-violet-500": "focus:border-ring",

  "bg-white shadow": "bg-card text-card-foreground shadow-sm dark:shadow-none",
};

const darkModeAdditions = {
  "bg-violet-50": "dark:bg-violet-900/20",
  "bg-violet-100": "dark:bg-violet-900/30",
  "hover:bg-violet-50": "dark:hover:bg-violet-900/30",
  "hover:bg-violet-100": "dark:hover:bg-violet-900/40",
  "text-violet-900": "dark:text-violet-300",
  "text-violet-700": "dark:text-violet-400",
  "text-violet-600": "dark:text-violet-400",
  "border-violet-200": "dark:border-violet-800",
  "border-violet-100": "dark:border-violet-900/30",

  "bg-red-50": "dark:bg-red-900/20",
  "bg-green-50": "dark:bg-green-900/20",
  "bg-yellow-50": "dark:bg-yellow-900/20",
  "text-red-600": "dark:text-red-400",
  "text-green-600": "dark:text-green-400",
};

/**
 * Analyzes a className string and suggests theme-aware replacements
 * @param {string} classNames - The className string to analyze
 * @return {object} Object with suggestions and modified classNames
 */
function analyzeClasses(classNames) {
  if (!classNames || typeof classNames !== "string") {
    return {
      original: "",
      suggestions: [],
      migrated: "",
    };
  }

  const classes = classNames.split(" ");
  const suggestions = [];
  const migratedClasses = [...classes];

  classes.forEach((cls, index) => {
    if (colorMap[cls]) {
      suggestions.push({
        original: cls,
        suggested: colorMap[cls],
        type: "replacement",
      });
      migratedClasses[index] = colorMap[cls];
    }
  });

  classes.forEach((cls) => {
    if (
      darkModeAdditions[cls] &&
      !migratedClasses.includes(darkModeAdditions[cls])
    ) {
      suggestions.push({
        original: cls,
        suggested: darkModeAdditions[cls],
        type: "addition",
      });
      migratedClasses.push(darkModeAdditions[cls]);
    }
  });

  return {
    original: classNames,
    suggestions: suggestions,
    migrated: migratedClasses.join(" "),
  };
}

/**
 * Migrates an entire component's JSX by looking for className props
 * @param {string} jsx - JSX code to analyze
 * @return {string} Updated JSX with migrated classNames
 */
function migrateComponent(jsx) {
  const classNameRegex = /className="([^"]*)"/g;

  return jsx.replace(classNameRegex, (match, capturedClasses) => {
    const result = analyzeClasses(capturedClasses);
    return `className="${result.migrated}"`;
  });
}

// Function to test in browser console
function testClass(className) {
  console.log("Original:", className);
  const result = analyzeClasses(className);
  console.log("Suggestions:", result.suggestions);
  console.log("Migrated:", result.migrated);
  return result;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    analyzeClasses,
    migrateComponent,
    colorMap,
    darkModeAdditions,
  };
}
