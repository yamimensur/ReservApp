import { EstadoReserva } from "@/components/EstadoReserva";
import { SinDatos } from "@/components/SinDatos";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

const TEXTO_LARGO =
  "Ensalada de estación con hojas verdes, tomates cherry, zanahoria rallada, semillas de girasol y aderezo de limón, acompañada de pan integral sin TACC y una porción de fruta de estación cortada en cubos.";

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold">{titulo}</h2>
      {children}
    </section>
  );
}

/** Catálogo de componentes con todos sus estados (clase 10): se revisa sin depender de datos reales. */
export function SistemaPage() {
  return (
    <div className="space-y-10">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold">Sistema de diseño</h1>
        <p className="text-muted-foreground">Componentes compartidos de ReservApp y sus estados.</p>
      </header>

      <Seccion titulo="Botones">
        <div className="flex flex-wrap gap-3">
          <Button>Reservar</Button>
          <Button variant="outline">Modificar</Button>
          <Button variant="secondary">Secundario</Button>
          <Button variant="destructive">Cancelar reserva</Button>
          <Button variant="link">Volver</Button>
          <Button disabled>Reservando…</Button>
        </div>
        <p className="text-sm text-muted-foreground">Usá Tab para ver el anillo de foco en cada botón.</p>
      </Seccion>

      <Seccion titulo="Estados de reserva">
        <div className="flex flex-wrap gap-3">
          <EstadoReserva estado="ACTIVA" />
          <EstadoReserva estado="CANCELADA" />
          <Badge className="bg-aviso-fondo text-aviso">! Sin comprobante</Badge>
          <Badge variant="destructive">✕ Error</Badge>
        </div>
      </Seccion>

      <Seccion titulo="Campos">
        <div className="grid max-w-md gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="demo-normal">Correo electrónico</Label>
            <Input id="demo-normal" placeholder="nombre@empresa.com" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="demo-error">Contraseña</Label>
            <Input id="demo-error" type="password" aria-invalid aria-describedby="demo-error-msg" />
            <p id="demo-error-msg" className="text-sm text-destructive">Ingresá tu contraseña.</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="demo-disabled">Campo deshabilitado</Label>
            <Input id="demo-disabled" disabled value="No editable" readOnly />
          </div>
        </div>
      </Seccion>

      <Seccion titulo="Avisos">
        <div className="grid gap-3">
          <Alert variant="exito">
            <AlertTitle>Reserva confirmada</AlertTitle>
            <AlertDescription>Te esperamos el jueves 15.</AlertDescription>
          </Alert>
          <Alert variant="aviso">
            <AlertTitle>No pudimos enviarte el comprobante</AlertTitle>
            <AlertDescription>La reserva quedó hecha igual.</AlertDescription>
          </Alert>
          <Alert variant="destructive">
            <AlertTitle>No pudimos guardar los cambios</AlertTitle>
            <AlertDescription>Revisá tu conexión y probá de nuevo.</AlertDescription>
          </Alert>
        </div>
      </Seccion>

      <Seccion titulo="Tarjeta con texto largo">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Jueves 15 de octubre</CardTitle>
            <CardDescription>{TEXTO_LARGO}</CardDescription>
          </CardHeader>
          <CardContent>
            <EstadoReserva estado="ACTIVA" />
          </CardContent>
        </Card>
      </Seccion>

      <Seccion titulo="Cargando">
        <div className="max-w-md space-y-3" aria-hidden="true">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-20 w-full" />
        </div>
      </Seccion>

      <Seccion titulo="Vacío y sin resultados">
        <div className="grid gap-4 md:grid-cols-2">
          <SinDatos
            titulo="Todavía no tenés reservas"
            detalle="Cuando reserves tu almuerzo, lo vas a ver acá."
            accion={<Button>Reservar mi almuerzo</Button>}
          />
          <SinDatos
            titulo="Ninguna reserva coincide con la búsqueda"
            detalle="Probá con otro nombre o borrá el filtro."
          />
        </div>
      </Seccion>
    </div>
  );
}
