import { PageHeaderSkeleton } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div role="status" aria-label="Cargando ranking">
      <PageHeaderSkeleton withControls />
      <section className="border-t border-white/5 bg-noche-950 pb-14 sm:pb-20">
        <Container className="grid gap-4 pt-10 sm:grid-cols-2 sm:pt-14 lg:min-h-[560px] lg:grid-cols-[1fr_340px_1fr] lg:grid-rows-2 lg:items-center lg:gap-x-10 lg:gap-y-16">
          {[
            "lg:col-start-1",
            "lg:col-start-3",
            "lg:col-start-1",
            "lg:col-start-3",
          ].map((place, index) => (
            <Skeleton
              key={index}
              className={`h-36 rounded-card bg-white/10 ${place}`}
            />
          ))}
        </Container>
      </section>
      <Container className="py-10 sm:py-14">
        <Skeleton className="h-8 w-56" />
        <Card className="mt-4 divide-y divide-border">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="flex items-center gap-4 px-4 py-3">
              <Skeleton className="size-7" />
              <Skeleton className="size-10 rounded-full" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-6 w-16" />
            </div>
          ))}
        </Card>
      </Container>
    </div>
  );
}
