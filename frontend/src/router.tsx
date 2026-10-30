import type { RouteObject } from "react-router";
import { AppLayout } from "@/components/AppLayout";
import { PublicLayout } from "@/components/PublicLayout";
import { RutaProtegida } from "@/components/RutaProtegida";
import { EnConstruccionPage } from "@/pages/EnConstruccionPage";
import { InicioPage } from "@/pages/InicioPage";
import { LoginPage } from "@/pages/LoginPage";
import { MenuPage } from "@/pages/MenuPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { SistemaPage } from "@/pages/SistemaPage";

/** Mapa de rutas. Las públicas van sin sesión; el resto pasa por RutaProtegida. */
export const rutas: RouteObject[] = [
  {
    element: <PublicLayout />,
    children: [{ path: "/ingresar", element: <LoginPage /> }],
  },
  {
    element: <RutaProtegida />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: "/", element: <InicioPage /> },
          { path: "/sistema", element: <SistemaPage /> },
          {
            element: <RutaProtegida roles={["EMPLEADO", "TERCERIZADO"]} />,
            children: [
              { path: "/menu", element: <MenuPage /> },
              { path: "/mis-reservas", element: <EnConstruccionPage titulo="Mis reservas" detalle="Flujo 3: historial, modificar y cancelar." /> },
            ],
          },
          {
            element: <RutaProtegida roles={["ADMINISTRADOR"]} />,
            children: [
              { path: "/reservas-del-dia", element: <EnConstruccionPage titulo="Reservas del día" detalle="Flujo 4: control de asistencia." /> },
            ],
          },
          {
            element: <RutaProtegida roles={["RRHH"]} />,
            children: [
              { path: "/sin-pantallas", element: <EnConstruccionPage titulo="Inicio" detalle="Las pantallas de RR. HH. (liquidaciones) no forman parte de esta versión." /> },
            ],
          },
          { path: "*", element: <NotFoundPage /> },
        ],
      },
    ],
  },
];
