import React from "react";
import { createBrowserRouter } from "react-router";
import MainLayout from "../layouts/MainLayout";

// Lazy-loaded components
const Home = React.lazy(() => import("../views/Home"));
const Podcast = React.lazy(() => import("../views/Podcast"));
const Tienda = React.lazy(() => import("../views/Tienda"));
const SobreMi = React.lazy(() => import("../views/SobreMi"));
const PoliticaPrivacidad = React.lazy(
  () => import("../views/PoliticaPrivacidad")
);
const TerminosServicio = React.lazy(
  () => import("../views/TerminosServicio")
);
const LinkInBioPage = React.lazy(() => import("../views/LinkInBioPage"));

export const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
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
  {
    path: "/links",
    element: <LinkInBioPage />,
  },
]);
