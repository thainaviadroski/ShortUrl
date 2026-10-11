import { NextRequest } from "next/server";
import { notFound } from "next/navigation";
import { QrCodeService } from "@/service/QrCodeService";

const qrCodeService = new QrCodeService();

// Short codes are 3-10 characters (see createLinkSchema), which also bounds
// the work done for arbitrary requests to this public route.
const QR_CODE_FILE_NAME = /^(.{3,10})\.png$/;

type RouteParams = { params: Promise<{ fileName: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
    const { fileName } = await params;
    const match = QR_CODE_FILE_NAME.exec(fileName);

    if (!match) {
        notFound();
    }

    const png = await qrCodeService.renderPng(match[1]);

    return new Response(new Uint8Array(png), {
        headers: {
            "Content-Type": "image/png",
            "Cache-Control": "public, max-age=86400",
        },
    });
}
