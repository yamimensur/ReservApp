import { useEffect, useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSesion } from "@/hooks/useSesion";
import { destinoAlIngresar } from "@/lib/roles";
import { ErrorApi } from "@/services/apiClient";

interface ErroresCampos {
  correo?: string;
  password?: string;
}

/** Si el login tarda más que esto, avisamos que el servidor gratuito se está despertando. */
const AVISO_SERVIDOR_MS = 5000;

function validar(correo: string, password: string): ErroresCampos {
  const errores: ErroresCampos = {};
  if (!correo.trim()) errores.correo = "Ingresá tu correo.";
  else if (!/^\S+@\S+\.\S+$/.test(correo.trim())) errores.correo = "Revisá el formato del correo.";
  if (!password) errores.password = "Ingresá tu contraseña.";
  return errores;
}

/** CU0014 del TP: iniciar sesión y entrar a la pantalla principal según el rol. */
export function LoginPage() {
  const { sesion, ingresar } = useSesion();
  const navigate = useNavigate();
  const location = useLocation();
  const desde = (location.state as { desde?: string } | null)?.desde ?? "/";

  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [errores, setErrores] = useState<ErroresCampos>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [servidorLento, setServidorLento] = useState(false);

  // Render (plan gratuito) duerme el backend: el primer pedido puede tardar cerca de un minuto.
  useEffect(() => {
    if (!enviando) return;
    const temporizador = setTimeout(() => setServidorLento(true), AVISO_SERVIDOR_MS);
    return () => {
      clearTimeout(temporizador);
      setServidorLento(false);
    };
  }, [enviando]);

  // Quien ya tiene sesión no necesita ver el login.
  if (sesion.estado === "autenticado") {
    return <Navigate to={destinoAlIngresar(sesion.usuario.rol, desde)} replace />;
  }

  const alEnviar = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    setErrorGeneral(null);
    const nuevosErrores = validar(correo, password);
    setErrores(nuevosErrores);
    if (nuevosErrores.correo || nuevosErrores.password) return;

    setEnviando(true);
    try {
      const usuario = await ingresar({ correo: correo.trim(), password });
      navigate(destinoAlIngresar(usuario.rol, desde), { replace: true });
    } catch (error) {
      setErrorGeneral(error instanceof ErrorApi ? error.message : "Ocurrió un error inesperado. Probá de nuevo.");
      setEnviando(false);
    }
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="items-center text-center">
        <img src="/reservapp-simbolo.png" alt="" width={96} height={96} className="mx-auto size-24" />
        <h1 className="mt-2 text-2xl font-bold">Ingresar</h1>
        <CardDescription>Usá tu correo corporativo y tu contraseña.</CardDescription>
      </CardHeader>
      <CardContent>
        <form noValidate onSubmit={alEnviar} className="space-y-4">
          {errorGeneral && (
            <Alert variant="destructive">
              <AlertTitle>No pudimos iniciar sesión</AlertTitle>
              <AlertDescription>{errorGeneral}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="correo">Correo electrónico</Label>
            <Input
              id="correo"
              type="email"
              autoComplete="username"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              aria-invalid={errores.correo ? true : undefined}
              aria-describedby={errores.correo ? "correo-error" : undefined}
              disabled={enviando}
            />
            {errores.correo && <p id="correo-error" className="text-sm text-destructive">{errores.correo}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={errores.password ? true : undefined}
              aria-describedby={errores.password ? "password-error" : undefined}
              disabled={enviando}
            />
            {errores.password && <p id="password-error" className="text-sm text-destructive">{errores.password}</p>}
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={enviando}>
            {enviando ? "Ingresando…" : "Ingresar"}
          </Button>

          {servidorLento && (
            <p role="status" className="text-center text-sm text-muted-foreground">
              Estamos despertando el servidor. Puede tardar hasta un minuto.
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
