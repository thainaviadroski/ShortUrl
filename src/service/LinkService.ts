import { customAlphabet } from "nanoid";
import { CreateLinkInput, UpdateLinkInput } from "@/lib/models/link-shorted";
import { LinkRepository } from "@/repository/LinkRepository";
import { QrCodeService } from "@/service/QrCodeService";

const generateShortCode = customAlphabet(
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
    7,
);

export class LinkService {

    constructor(
        private repository: LinkRepository,
        private qrCodeService: QrCodeService,
    ) { }

    async listLinks() {
        return await this.repository.getAllLinks();
    }

    async getLinkById(id: number) {
        return await this.repository.getLinkById(id);
    }

    async getLinkByShortCode(linkShort: string) {
        return await this.repository.getLinkByShortCode(linkShort);
    }

    async createLink(input: CreateLinkInput) {
        const { linkShort, ...data } = input;
        const shortCode = linkShort ?? generateShortCode();
        const qrCodeUrl = await this.qrCodeService.generateForShortCode(shortCode);

        return await this.repository.createLink({
            ...data,
            linkShort: shortCode,
            qrCodeUrl,
        });
    }

    async updateLink(id: number, input: UpdateLinkInput) {
        const data: UpdateLinkInput & { qrCodeUrl?: string } = { ...input };

        if (data.linkShort) {
            data.qrCodeUrl = await this.qrCodeService.generateForShortCode(data.linkShort);
        }

        return await this.repository.updateLink(id, data);
    }

    async deleteLink(id: number) {
        return await this.repository.deleteLink(id);
    }

}
