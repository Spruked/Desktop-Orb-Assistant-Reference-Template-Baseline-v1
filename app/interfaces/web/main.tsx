
  import { createRoot } from "react-dom/client";
  import App from "./App.tsx";
  import "./styles/index.css";

  // Electron API types
  declare global {
    interface Window {
      electronAPI: {
        send: (channel: string, data: any) => void;
        on: (channel: string, func: (...args: any[]) => void) => void;
        once: (channel: string, func: (...args: any[]) => void) => void;
      };
    }
  }

  createRoot(document.getElementById("root")!).render(<App />);
  