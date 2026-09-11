import Link from "next/link";
import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from "@/components/ui/pagination";

interface PaginationControlProps {
  page: number;
  totalPages: number;
  buildHref: (page: number) => string;
}

function getPageRange(page: number, totalPages: number) {
  const pages = new Set([1, totalPages, page - 1, page, page + 1]);
  const sorted = [...pages]
    .filter((p) => p >= 1 && p <= totalPages)
    .sort((a, b) => a - b);

  const range: (number | "ellipsis")[] = [];
  let previous = 0;
  for (const p of sorted) {
    if (previous && p - previous > 1) range.push("ellipsis");
    range.push(p);
    previous = p;
  }
  return range;
}

export function PaginationControl({
  page,
  totalPages,
  buildHref,
}: PaginationControlProps) {
  if (totalPages <= 1) return null;

  const hasPrevious = page > 1;
  const hasNext = page < totalPages;

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <Button
            variant="ghost"
            size="default"
            aria-label="Go to previous page"
            aria-disabled={!hasPrevious}
            nativeButton={false}
            className={cn(
              "pl-1.5!",
              !hasPrevious && "pointer-events-none opacity-50"
            )}
            render={<Link href={buildHref(Math.max(1, page - 1))} />}
          >
            <CaretLeftIcon data-icon="inline-start" />
            <span className="hidden sm:block">Previous</span>
          </Button>
        </PaginationItem>

        {getPageRange(page, totalPages).map((item, index) =>
          item === "ellipsis" ? (
            <PaginationItem key={`ellipsis-${index}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={item}>
              <Button
                variant={item === page ? "outline" : "ghost"}
                size="icon"
                aria-current={item === page ? "page" : undefined}
                nativeButton={false}
                render={<Link href={buildHref(item)} />}
              >
                {item}
              </Button>
            </PaginationItem>
          )
        )}

        <PaginationItem>
          <Button
            variant="ghost"
            size="default"
            aria-label="Go to next page"
            aria-disabled={!hasNext}
            nativeButton={false}
            className={cn(
              "pr-1.5!",
              !hasNext && "pointer-events-none opacity-50"
            )}
            render={<Link href={buildHref(Math.min(totalPages, page + 1))} />}
          >
            <span className="hidden sm:block">Next</span>
            <CaretRightIcon data-icon="inline-end" />
          </Button>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
