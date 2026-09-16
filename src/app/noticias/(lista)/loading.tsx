import { PageHeaderSkeleton } from "@/components/page-header";
import { Container } from "@/components/ui/container";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div role="status" aria-label="Cargando noticias">
      <PageHeaderSkeleton />
      <Container className="py-12 sm:py-16">
        <div className="lg:grid lg:grid-cols-2 lg:items-center lg:gap-10">
          <Skeleton className="aspect-video rounded-card" />
          <div className="mt-4 lg:mt-0">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="mt-4 h-9 w-full" />
            <Skeleton className="mt-3 h-5 w-2/3" />
          </div>
        </div>
        <div className="mt-16 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index}>
              <Skeleton className="aspect-video rounded-card" />
              <Skeleton className="mt-4 h-5 w-32" />
              <Skeleton className="mt-3 h-6 w-full" />
            </div>
          ))}
        </div>
      </Container>
    </div>
  );
}
