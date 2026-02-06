// Social platforms
export * from "./social";

// Dev platforms
export * from "./dev";

// Re-export for convenience
export { scanFacebook, scanInstagram, scanX, scanPinterest } from "./social";
export { scanGitHub } from "./dev";
