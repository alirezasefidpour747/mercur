import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@mercurjs/vendor/index.css";
import "./didar.css";
import App from "@mercurjs/vendor";
import { bootstrapDidarVendor } from "./didar-bootstrap";

bootstrapDidarVendor();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
