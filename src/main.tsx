import React from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter } from "react-router";
import Root from "./Root"; // Import the Root component

import "./index.css";

// Lazy-loaded components
const App = React.lazy(() => import("./App"));
const Home = React.lazy(() => import("./pages/Home"));
const Podcast = React.lazy(() => import("./pages/Podcast"));
const Tienda = React.lazy(() => import("./pages/Tienda"));
const SobreMi = React.lazy(() => import("./pages/SobreMi"));
const PoliticaPrivacidad = React.lazy(
  () => import("./pages/PoliticaPrivacidad")
);
const TerminosServicio = React.lazy(() => import("./pages/TerminosServicio"));

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: "podcast",
        element: <Podcast />,
      },
      {
        path: "tienda",
        element: <Tienda />,
      },
      {
        path: "sobre-mi",
        element: <SobreMi />,
      },
      {
        path: "politica-privacidad",
        element: <PoliticaPrivacidad />,
      },
      {
        path: "terminos-servicio",
        element: <TerminosServicio />,
      },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(<Root />);