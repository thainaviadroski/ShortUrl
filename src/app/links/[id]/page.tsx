import NextLink from "next/link";
import { notFound } from "next/navigation";
import {
  CaretLeftIcon,
  PencilSimpleIcon,
} from "@phosphor-icons/react/dist/ssr";
import { db } from "@/db";
import { LinkRepository } from "@/repository/LinkRepository";
import { LinkService } from "@/service/LinkService";
import { QrCodeService } from "@/service/QrCodeService";
import { LinkClickRepository } from "@/repository/LinkClickRepository";
import { LinkClickService } from "@/service/LinkClickService";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LinkFormDialog } from "@/components/links/link-form-dialog";
import { QrCodePanel } from "@/components/links/qr-code-panel";
import { FormattedDate } from "@/components/formatted-date";
import { PaginationControl } from "@/components/pagination-control";
import { PageSizeSelect } from "@/components/page-size-select";

import { PAGE_SIZE_OPTIONS } from "@/lib/constratins";

const linkService = new LinkService(new LinkRepository(db), new QrCodeService());
const linkClickService = new LinkClickService(
  new LinkClickRepository(db),
  new LinkRepository(db),
);

export default async function LinkDetailPage({
  params,
  searchParams,
}: PageProps<"/links/[id]">) {
  const { id } = await params;
  const link = await linkService.getLinkById(Number(id));

  if (!link) notFound();

  const { page: pageParam, pageSize: pageSizeParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const pageSize = PAGE_SIZE_OPTIONS.includes(Number(pageSizeParam))
    ? Number(pageSizeParam)
    : PAGE_SIZE_OPTIONS[0];

  const allClicks = await linkClickService.listClicksByLink(link.id);
  const totalPages = Math.max(1, Math.ceil(allClicks.length / pageSize));
  const start = (page - 1) * pageSize;
  const pageClicks = allClicks.slice(start, start + pageSize);

  const basePath = `/links/${link.id}`;
  const shortUrl = `https://ex.io/${link.linkShort}`;

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Back to links"
          nativeButton={false}
          render={<NextLink href="/links" />}
        >
          <CaretLeftIcon className="size-4" />
        </Button>
        <h1 className="text-lg font-semibold">{link.linkShort}</h1>
        <Badge
          className="rounded"
          variant={link.isActive ? "default" : "outline"}
        >
          {link.isActive ? "Active" : "Inactive"}
        </Badge>
        <div className="ml-auto">
          <LinkFormDialog
            link={link}
            triggerVariant="outline"
            triggerSize="sm"
            triggerLabel={
              <>
                <PencilSimpleIcon className="size-4" />
                Edit
              </>
            }
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div>
          {link.qrCodeUrl ? (
            <QrCodePanel
              qrCodeUrl={link.qrCodeUrl}
              fileName={`${link.linkShort}.png`}
              alt={`QR code for ${shortUrl}`}
            />
          ) : (
            <div className="flex h-full items-center justify-center border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
              No QR code generated yet.
            </div>
          )}
        </div>

        <dl className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <dt className="text-xs text-muted-foreground">Short URL</dt>
            <dd>
              <a
                href={shortUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                {shortUrl}
              </a>
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-xs text-muted-foreground">Original URL</dt>
            <dd className="truncate" title={link.linkOriginal}>
              {link.linkOriginal}
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-xs text-muted-foreground">Description</dt>
            <dd>{link.description || "—"}</dd>
          </div>
        </dl>

        <dl className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <dt className="text-xs text-muted-foreground">Created</dt>
            <dd>
              <FormattedDate date={new Date(link.created)} />
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-xs text-muted-foreground">Expires</dt>
            <dd>
              {link.maxTimeValid ? (
                <FormattedDate date={new Date(link.maxTimeValid)} />
              ) : (
                "Never"
              )}
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-xs text-muted-foreground">Total clicks</dt>
            <dd>{allClicks.length}</dd>
          </div>
        </dl>
      </div>

      <h2 className="text-sm font-semibold">Clicks</h2>

      {allClicks.length === 0 ? (
        <p className="py-10 text-center text-xs text-muted-foreground">
          No clicks recorded yet.
        </p>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Browser</TableHead>
                <TableHead>OS</TableHead>
                <TableHead>Device</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Referer</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageClicks.map((click) => (
                <TableRow key={click.id}>
                  <TableCell>
                    <FormattedDate date={new Date(click.clickedAt)} />
                  </TableCell>
                  <TableCell>{click.browser ?? "—"}</TableCell>
                  <TableCell>{click.os ?? "—"}</TableCell>
                  <TableCell>{click.device ?? "—"}</TableCell>
                  <TableCell>{click.country ?? "—"}</TableCell>
                  <TableCell
                    className="max-w-xs truncate"
                    title={click.referer ?? undefined}
                  >
                    {click.referer ?? "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between">
            <PageSizeSelect
              basePath={basePath}
              pageSize={pageSize}
              options={PAGE_SIZE_OPTIONS}
            />
            <PaginationControl
              page={page}
              totalPages={totalPages}
              buildHref={(targetPage) =>
                `${basePath}?page=${targetPage}&pageSize=${pageSize}`
              }
            />
          </div>
        </>
      )}
    </div>
  );
}
