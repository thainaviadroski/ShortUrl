import { PlusIcon } from "@phosphor-icons/react/dist/ssr";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { getCurrentUserId } from "@/lib/session";
import { LinkRepository } from "@/repository/LinkRepository";
import { LinkService } from "@/service/LinkService";
import { QrCodeService } from "@/service/QrCodeService";
import { LinkFormDialog } from "@/components/links/link-form-dialog";
import { LinksTable } from "@/components/links/links-table";
import { PaginationControl } from "@/components/pagination-control";
import { PageSizeSelect } from "@/components/page-size-select";

import { PAGE_SIZE_OPTIONS } from "@/lib/constratins";
import { getBaseUrl } from "@/lib/base-url";

const linkService = new LinkService(new LinkRepository(db), new QrCodeService());

export default async function LinksPage({ searchParams }: PageProps<"/links">) {
  const { page: pageParam, pageSize: pageSizeParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const pageSize = PAGE_SIZE_OPTIONS.includes(Number(pageSizeParam))
    ? Number(pageSizeParam)
    : PAGE_SIZE_OPTIONS[1];

  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  const allLinks = await linkService.listLinks(userId);
  const totalPages = Math.max(1, Math.ceil(allLinks.length / pageSize));
  const start = (page - 1) * pageSize;
  const pageLinks = allLinks.slice(start, start + pageSize);

  return (
    <div className="flex flex-col gap-4 p-6 mx-auto w-full max-w-7xl">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Links</h1>
        <LinkFormDialog
          triggerLabel={
            <>
              <PlusIcon className="size-4" />
              New link
            </>
          }
        />
      </div>

      <LinksTable links={pageLinks} baseUrl={getBaseUrl()} />

      <div className="flex items-center justify-between">
        <PageSizeSelect
          basePath="/links"
          pageSize={pageSize}
          options={PAGE_SIZE_OPTIONS}
        />
        <PaginationControl
          page={page}
          totalPages={totalPages}
          buildHref={(targetPage) =>
            `/links?page=${targetPage}&pageSize=${pageSize}`
          }
        />
      </div>
    </div>
  );
}
