import { mkdir } from "node:fs/promises";
import path from "node:path";
import QRCode from "qrcode";
import { buildShortUrl } from "@/lib/base-url";

const QR_CODE_DIR = path.join(process.cwd(), "public", "qrcodes");
const QR_CODE_PUBLIC_PATH = "/qrcodes";

export class QrCodeService {

    async generateForShortCode(linkShort: string) {
        await mkdir(QR_CODE_DIR, { recursive: true });

        const fileName = `${linkShort}.png`;
        const shortUrl = buildShortUrl(linkShort);

        await QRCode.toFile(path.join(QR_CODE_DIR, fileName), shortUrl, {
            width: 320,
            margin: 2,
        });

        return `${QR_CODE_PUBLIC_PATH}/${fileName}`;
    }

}
