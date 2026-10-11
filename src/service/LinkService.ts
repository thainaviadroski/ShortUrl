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

    async listLinks(userId: number) {
        return await this.repository.getLinksByUser(userId);
    }

    // Only returns the link to the user who created it, so callers can treat
    // someone else's link exactly like a missing one (404).
    async getLinkById(id: number, userId: number) {
        const link = await this.repository.getLinkById(id);
        return link?.createdBy === userId ? link : undefined;
    }

    async getLinkByShortCode(linkShort: string) {
        return await this.repository.getLinkByShortCode(linkShort);
    }

    async createLink(input: CreateLinkInput, userId: number) {
        const { linkShort, ...data } = input;
        const shortCode = linkShort ?? generateShortCode();
        const qrCodeUrl = await this.qrCodeService.generateForShortCode(shortCode);

        return await this.repository.createLink({
            ...data,
            linkShort: shortCode,
            qrCodeUrl,
            createdBy: userId,
        });
    }

    async updateLink(id: number, userId: number, input: UpdateLinkInput) {
        const data: UpdateLinkInput & { qrCodeUrl?: string } = { ...input };

        if (data.linkShort) {
            data.qrCodeUrl = await this.qrCodeService.generateForShortCode(data.linkShort);
        }

        return await this.repository.updateLink(id, userId, data);
    }

    async deleteLink(id: number, userId: number) {
        return await this.repository.deleteLink(id, userId);
    }

}
