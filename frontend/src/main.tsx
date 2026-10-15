import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router";
import { SesionProvider } from "@/components/SesionProvider";
import { rutas } from "@/router";
import "./index.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("No se encontró el elemento raíz de la aplicación");
}

const router = createBrowserRouter(rutas);

createRoot(root).render(
  <StrictMode>
    <SesionProvider>
      <RouterProvider router={router} />
    </SesionProvider>
  </StrictMode>,
);
