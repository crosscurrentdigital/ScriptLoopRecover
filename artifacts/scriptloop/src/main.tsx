import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@neondatabase/auth/ui/css";
import "./index.css";
import App from "./App";
import { initSentry } from "./lib/sentry";
import { initPlausible } from "./lib/plausible";

initSentry();
initPlausible();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
