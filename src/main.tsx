import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./App.css";
import { I18nProvider } from "./i18n/I18nContext";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <I18nProvider>
      <App />
    </I18nProvider>
  </React.StrictMode>
);
