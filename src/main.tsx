import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "sonner";
import { App } from "./App";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        theme="light"
        position="bottom-center"
        toastOptions={{
          className:
            "!bg-white !text-slate-900 !border-slate-200 !shadow-lg",
        }}
      />
    </BrowserRouter>
  </StrictMode>,
);
