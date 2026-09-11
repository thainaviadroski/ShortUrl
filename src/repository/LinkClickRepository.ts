import { desc, eq } from "drizzle-orm";
import { DbClient } from "@/db";
import { linkClicks } from "@/db/schema";
import { redis } from "@/lib/redis";

type NewLinkClick = typeof linkClicks.$inferInsert;
type LinkClickRow = typeof linkClicks.$inferSelect;

const CACHE_TTL_SECONDS = 300;

function cacheKeyByLinkId(linkId: number) {
    return `link-click:by-link:${linkId}`;
}

function reviveDates(click: LinkClickRow): LinkClickRow {
    return {
        ...click,
        clickedAt: new Date(click.clickedAt),
    };
}

export class LinkClickRepository {

    constructor(private client: DbClient) { }

    async getClicksByLinkId(linkId: number) {
        const key = cacheKeyByLinkId(linkId);
        const cached = await redis.get(key);

        if (cached) {
            return (JSON.parse(cached) as LinkClickRow[]).map(reviveDates);
        }

        const clicks = await this.client
            .select()
            .from(linkClicks)
            .where(eq(linkClicks.linkId, linkId))
            .orderBy(desc(linkClicks.clickedAt));

        await redis.set(key, JSON.stringify(clicks), "EX", CACHE_TTL_SECONDS);

        return clicks;
    }

    async createClick(data: NewLinkClick) {
        const [created] = await this.client.insert(linkClicks).values(data).returning();

        if (created) {
            await redis.del(cacheKeyByLinkId(created.linkId));
        }

        return created;
    }

}
