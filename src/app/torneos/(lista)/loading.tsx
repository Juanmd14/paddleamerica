import { PageHeaderSkeleton } from "@/components/page-header";
import { Container } from "@/components/ui/container";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div role="status" aria-label="Cargando torneos">
      <PageHeaderSkeleton />
      <Container className="py-12 sm:py-16">
        <Skeleton className="h-9 w-40" />
        <div className="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index}>
              <Skeleton className="aspect-[4/5] rounded-card" />
              <Skeleton className="mt-4 h-3 w-24" />
              <Skeleton className="mt-2 h-6 w-3/4" />
              <Skeleton className="mt-3 h-4 w-2/3" />
            </div>
          ))}
        </div>
      </Container>
    </div>
  );
}
