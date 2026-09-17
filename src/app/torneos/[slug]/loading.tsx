import { Container } from "@/components/ui/container";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div role="status" aria-label="Cargando el torneo">
      <section className="bg-noche-950">
        <Container className="py-10 sm:py-14">
          <Skeleton className="h-4 w-36 bg-white/10" />
          <Skeleton className="mt-6 h-6 w-48 bg-white/10" />
          <Skeleton className="mt-4 h-12 w-3/4 bg-white/10" />
          <Skeleton className="mt-4 h-5 w-2/3 bg-white/10" />
        </Container>
      </section>
      <Container className="grid gap-8 py-8 sm:py-12 lg:grid-cols-12 lg:gap-12">
        <div className="space-y-5 lg:col-span-5">
          <Skeleton className="aspect-[4/5] rounded-card" />
          <Skeleton className="h-64 rounded-card" />
        </div>
        <div className="space-y-6 lg:col-span-7">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-28" />
          <Skeleton className="h-48 rounded-card" />
        </div>
      </Container>
    </div>
  );
}
