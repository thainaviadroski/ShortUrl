import { and, desc, eq, gte, sql } from "drizzle-orm";
import { DbClient } from "@/db";
import { linkClicks, linksShorted } from "@/db/schema";

// Every query is scoped to the links created by `userId`; clicks are reached
// through their link, so they are joined to links_shorted first.
function ownedBy(userId: number) {
    return eq(linksShorted.createdBy, userId);
}

export class AnalyticsRepository {

    constructor(private client: DbClient) { }

    async getTotalClicks(userId: number) {
        const [{ count }] = await this.client
            .select({ count: sql<number>`count(*)::int` })
            .from(linkClicks)
            .innerJoin(linksShorted, eq(linkClicks.linkId, linksShorted.id))
            .where(ownedBy(userId));
        return count;
    }

    async getTotalLinks(userId: number) {
        const [{ count }] = await this.client
            .select({ count: sql<number>`count(*)::int` })
            .from(linksShorted)
            .where(ownedBy(userId));
        return count;
    }

    async getClicksByDay(userId: number, days: number) {
        const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

        return await this.client
            .select({
                date: sql<string>`to_char(date_trunc('day', ${linkClicks.clickedAt}), 'YYYY-MM-DD')`.as("date"),
                count: sql<number>`count(*)::int`.as("count"),
            })
            .from(linkClicks)
            .innerJoin(linksShorted, eq(linkClicks.linkId, linksShorted.id))
            .where(and(ownedBy(userId), gte(linkClicks.clickedAt, since)))
            .groupBy(sql`date_trunc('day', ${linkClicks.clickedAt})`)
            .orderBy(sql`date_trunc('day', ${linkClicks.clickedAt})`);
    }

    async getClicksByMonth(userId: number, months: number) {
        const since = new Date();
        since.setMonth(since.getMonth() - months);

        return await this.client
            .select({
                month: sql<string>`to_char(date_trunc('month', ${linkClicks.clickedAt}), 'YYYY-MM')`.as("month"),
                count: sql<number>`count(*)::int`.as("count"),
            })
            .from(linkClicks)
            .innerJoin(linksShorted, eq(linkClicks.linkId, linksShorted.id))
            .where(and(ownedBy(userId), gte(linkClicks.clickedAt, since)))
            .groupBy(sql`date_trunc('month', ${linkClicks.clickedAt})`)
            .orderBy(sql`date_trunc('month', ${linkClicks.clickedAt})`);
    }

    async getTopLinks(userId: number, limit: number) {
        return await this.client
            .select({
                linkId: linksShorted.id,
                linkShort: linksShorted.linkShort,
                linkOriginal: linksShorted.linkOriginal,
                clicks: sql<number>`count(${linkClicks.id})::int`.as("clicks"),
            })
            .from(linksShorted)
            .leftJoin(linkClicks, eq(linkClicks.linkId, linksShorted.id))
            .where(ownedBy(userId))
            .groupBy(linksShorted.id)
            .orderBy(desc(sql`count(${linkClicks.id})`))
            .limit(limit);
    }

    async getBreakdownByBrowser(userId: number) {
        return await this.client
            .select({
                label: sql<string>`coalesce(${linkClicks.browser}, 'unknown')`.as("label"),
                count: sql<number>`count(*)::int`.as("count"),
            })
            .from(linkClicks)
            .innerJoin(linksShorted, eq(linkClicks.linkId, linksShorted.id))
            .where(ownedBy(userId))
            .groupBy(linkClicks.browser)
            .orderBy(desc(sql`count(*)`));
    }

    async getBreakdownByOs(userId: number) {
        return await this.client
            .select({
                label: sql<string>`coalesce(${linkClicks.os}, 'unknown')`.as("label"),
                count: sql<number>`count(*)::int`.as("count"),
            })
            .from(linkClicks)
            .innerJoin(linksShorted, eq(linkClicks.linkId, linksShorted.id))
            .where(ownedBy(userId))
            .groupBy(linkClicks.os)
            .orderBy(desc(sql`count(*)`));
    }

    async getBreakdownByDevice(userId: number) {
        return await this.client
            .select({
                label: sql<string>`coalesce(${linkClicks.device}, 'unknown')`.as("label"),
                count: sql<number>`count(*)::int`.as("count"),
            })
            .from(linkClicks)
            .innerJoin(linksShorted, eq(linkClicks.linkId, linksShorted.id))
            .where(ownedBy(userId))
            .groupBy(linkClicks.device)
            .orderBy(desc(sql`count(*)`));
    }

    async getBreakdownByCountry(userId: number) {
        return await this.client
            .select({
                label: sql<string>`coalesce(${linkClicks.country}, 'unknown')`.as("label"),
                count: sql<number>`count(*)::int`.as("count"),
            })
            .from(linkClicks)
            .innerJoin(linksShorted, eq(linkClicks.linkId, linksShorted.id))
            .where(ownedBy(userId))
            .groupBy(linkClicks.country)
            .orderBy(desc(sql`count(*)`));
    }

    async getTopCities(userId: number, limit: number) {
        return await this.client
            .select({
                label: sql<string>`coalesce(${linkClicks.city}, 'Unknown') || coalesce(', ' || nullif(${linkClicks.country}, ''), '')`.as("label"),
                count: sql<number>`count(*)::int`.as("count"),
            })
            .from(linkClicks)
            .innerJoin(linksShorted, eq(linkClicks.linkId, linksShorted.id))
            .where(ownedBy(userId))
            .groupBy(linkClicks.city, linkClicks.country)
            .orderBy(desc(sql`count(*)`))
            .limit(limit);
    }

}
