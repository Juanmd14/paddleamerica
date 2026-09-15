import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export default function NotFound() {
  return (
    <Container className="flex flex-1 flex-col items-center justify-center py-24 text-center">
      <p className="font-display text-9xl leading-none font-bold text-oro-400">
        404
      </p>
      <h1 className="mt-4 font-display text-4xl font-bold uppercase">
        Pelota afuera
      </h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        La página que buscás no existe o se movió.
      </p>
      <ButtonLink href="/" className="mt-8">
        Volver al inicio
      </ButtonLink>
    </Container>
  );
}
