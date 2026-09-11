import { NextRequest, NextResponse } from "next/server";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { LinkClickRepository } from "@/repository/LinkClickRepository";
import { LinkRepository } from "@/repository/LinkRepository";
import { LinkClickService } from "@/service/LinkClickService";
import { LinkService } from "@/service/LinkService";
import { QrCodeService } from "@/service/QrCodeService";

const linkService = new LinkService(new LinkRepository(db), new QrCodeService());
const linkClickService = new LinkClickService(new LinkClickRepository(db), new LinkRepository(db));

type RouteParams = { params: Promise<{ linkShort: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
    const { linkShort } = await params;
    const link = await linkService.getLinkByShortCode(linkShort);
    const isExpired = link?.maxTimeValid != null && link.maxTimeValid.getTime() <= Date.now();

    if (!link || isExpired) {
        notFound();
    }

    const forwardedFor = request.headers.get("x-forwarded-for");

    await linkClickService.registerClick({
        linkId: link.id,
        userAgent: request.headers.get("user-agent"),
        ipAddress: forwardedFor?.split(",")[0]?.trim() ?? null,
        referer: request.headers.get("referer"),
        country: request.headers.get("x-vercel-ip-country"),
        city: request.headers.get("x-vercel-ip-city"),
    });

    return NextResponse.redirect(link.linkOriginal);
}
