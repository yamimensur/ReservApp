import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  titulo: string;
  detalle: string;
}

/** Lugar reservado para las pantallas de los otros flujos mientras se construyen. */
export function EnConstruccionPage({ titulo, detalle }: Props) {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">{titulo}</h1>
      <Card>
        <CardHeader>
          <CardTitle>Pantalla en construcción</CardTitle>
          <CardDescription>{detalle}</CardDescription>
        </CardHeader>
        <CardContent />
      </Card>
    </section>
  );
}
