import { and, desc, eq } from "drizzle-orm";
import { DbClient } from "@/db";
import { linksShorted } from "@/db/schema";
import { redis } from "@/lib/redis";

type NewLink = typeof linksShorted.$inferInsert;
type UpdateLink = Partial<NewLink>;
type LinkRow = typeof linksShorted.$inferSelect;

const CACHE_TTL_SECONDS = 200;

function cacheKeyById(id: number) {
    return `link:id:${id}`;
}

function cacheKeyByShortCode(linkShort: string) {
    return `link:short:${linkShort}`;
}

function cacheKeyByUser(userId: number) {
    return `link:by-user:${userId}`;
}

function reviveDates(link: LinkRow): LinkRow {
    return {
        ...link,
        created: new Date(link.created),
        maxTimeValid: link.maxTimeValid ? new Date(link.maxTimeValid) : null,
    };
}


export class LinkRepository {

    constructor(private client: DbClient) { }

    async getLinksByUser(userId: number) {
        const key = cacheKeyByUser(userId);
        const cached = await redis.get(key);

        if (cached) {
            return (JSON.parse(cached) as LinkRow[]).map(reviveDates);
        }

        const links = await this.client
            .select()
            .from(linksShorted)
            .where(eq(linksShorted.createdBy, userId))
            .orderBy(desc(linksShorted.created), desc(linksShorted.id));

        await redis.set(key, JSON.stringify(links), "EX", CACHE_TTL_SECONDS);

        return links;
    }

    async getLinkById(id: number) {
        const key = cacheKeyById(id);
        const cached = await redis.get(key);

        if (cached) {
            return reviveDates(JSON.parse(cached));
        }

        const [link] = await this.client.select()
            .from(linksShorted)
            .where(eq(linksShorted.id, id));

        if (link) {
            await redis.set(key, JSON.stringify(link), "EX", CACHE_TTL_SECONDS);
        }

        return link;
    }

    async getLinkByShortCode(linkShort: string) {
        const key = cacheKeyByShortCode(linkShort);
        const cached = await redis.get(key);

        if (cached) {
            return reviveDates(JSON.parse(cached));
        }

        const [link] = await this.client.select()
            .from(linksShorted)
            .where(eq(linksShorted.linkShort, linkShort));

        if (link) {
            await redis.set(key, JSON.stringify(link), "EX", CACHE_TTL_SECONDS);
        }

        return link;
    }

    async createLink(data: NewLink) {
        const [created] = await this.client.insert(linksShorted).values(data).returning();

        if (created) {
            await redis.del(cacheKeyByUser(created.createdBy));
        }

        return created;
    }

    async updateLink(id: number, userId: number, data: UpdateLink) {
        const [updated] = await this.client
            .update(linksShorted)
            .set(data)
            .where(and(eq(linksShorted.id, id), eq(linksShorted.createdBy, userId)))
            .returning();

        if (updated) {
            await this.invalidateCache(updated);
        }

        return updated;
    }

    async deleteLink(id: number, userId: number) {
        const [deleted] = await this.client
            .delete(linksShorted)
            .where(and(eq(linksShorted.id, id), eq(linksShorted.createdBy, userId)))
            .returning();

        if (deleted) {
            await this.invalidateCache(deleted);
        }

        return deleted;
    }

    // The FK already cascades when a user is removed, but deleting the links
    // here first lets their cached entries be dropped too; otherwise a cached
    // short code would keep redirecting to a link that no longer exists.
    async deleteLinksByUser(userId: number) {
        const deleted = await this.client
            .delete(linksShorted)
            .where(eq(linksShorted.createdBy, userId))
            .returning();

        await Promise.all(deleted.map((link) => this.invalidateCache(link)));

        return deleted;
    }

    private async invalidateCache(link: LinkRow) {
        await redis.del(
            cacheKeyById(link.id),
            cacheKeyByShortCode(link.linkShort),
            cacheKeyByUser(link.createdBy),
        );
    }

}
