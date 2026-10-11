import QRCode from "qrcode";
import { buildShortUrl } from "@/lib/base-url";

const QR_CODE_PUBLIC_PATH = "/qrcodes";

// QR codes are rendered on request by src/app/qrcodes/[fileName]/route.ts
// instead of being written to public/: in production Next only serves the
// public/ files that existed at startup, and Railway wipes the container
// filesystem on every deploy.
export class QrCodeService {

    async generateForShortCode(linkShort: string) {
        return `${QR_CODE_PUBLIC_PATH}/${linkShort}.png`;
    }

    async renderPng(linkShort: string) {
        return await QRCode.toBuffer(buildShortUrl(linkShort), {
            width: 320,
            margin: 2,
        });
    }

}
