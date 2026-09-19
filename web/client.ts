// Import CSS files here for hot module reloading to work.
import "./assets/styles.css";

// worker.js reloads a page from an earlier deploy once per session; a page that loaded this build's scripts resets it.
try {
  sessionStorage.removeItem("plw-reloaded");
} catch {
  // storage blocked
}
