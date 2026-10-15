import { Link } from "react-router";
import { buttonVariants } from "@/components/ui/button";

/** Mismo texto para "no existe" y para "no es para tu usuario": no revela qué existe. */
export function NotFoundPage() {
  return (
    <section className="mx-auto max-w-md space-y-4 py-10 text-center">
      <h1 className="text-2xl font-bold">No encontramos esta página</h1>
      <p className="text-muted-foreground">
        La dirección no existe o no está disponible para tu usuario.
      </p>
      <Link to="/" className={buttonVariants()}>Volver al inicio</Link>
    </section>
  );
}
