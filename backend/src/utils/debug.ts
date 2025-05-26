const debugLog = (...args: any[]): void => {
  if (process.env.NODE_ENV !== "production") {
    console.log(...args);
  }
};

const debugError = (...args: any[]): void => {
  if (process.env.NODE_ENV !== "production") {
    console.error(...args);
  }
};

export { debugLog, debugError };
