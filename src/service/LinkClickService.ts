import UAParser from "ua-parser-js";
import { LinkClickRepository } from "@/repository/LinkClickRepository";
import { LinkRepository } from "@/repository/LinkRepository";

type RegisterClickInput = {
    linkId: number;
    userAgent?: string | null;
    ipAddress?: string | null;
    referer?: string | null;
    country?: string | null;
    city?: string | null;
};

export class LinkClickService {

    constructor(
        private repository: LinkClickRepository,
        private linkRepository: LinkRepository,
    ) { }

    async listClicksByLink(linkId: number) {
        return await this.repository.getClicksByLinkId(linkId);
    }

    async registerClick(input: RegisterClickInput) {
        const link = await this.linkRepository.getLinkById(input.linkId);

        if (!link) {
            return undefined;
        }

        const { browser, os, device } = input.userAgent
            ? new UAParser(input.userAgent).getResult()
            : { browser: undefined, os: undefined, device: undefined };

        return await this.repository.createClick({
            linkId: input.linkId,
            userAgent: input.userAgent ?? null,
            ipAddress: input.ipAddress ?? null,
            referer: input.referer ?? null,
            country: input.country ?? null,
            city: input.city ?? null,
            browser: browser?.name ?? null,
            os: os?.name ?? null,
            device: device?.type ?? "desktop",
        });
    }

}
