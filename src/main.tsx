import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router";

import "./index.css";

import App from "./App";
import Home from "./pages/Home";
import Podcast from "./pages/Podcast";
import Tienda from "./pages/Tienda";
import SobreMi from "./pages/SobreMi";
import PoliticaPrivacidad from "./pages/PoliticaPrivacidad";
import TerminosServicio from "./pages/TerminosServicio";

const router = createBrowserRouter([
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

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
