import { desc, eq, gte, sql } from "drizzle-orm";
import { DbClient } from "@/db";
import { linkClicks, linksShorted } from "@/db/schema";

export class AnalyticsRepository {

    constructor(private client: DbClient) { }

    async getTotalClicks() {
        const [{ count }] = await this.client
            .select({ count: sql<number>`count(*)::int` })
            .from(linkClicks);
        return count;
    }

    async getTotalLinks() {
        const [{ count }] = await this.client
            .select({ count: sql<number>`count(*)::int` })
            .from(linksShorted);
        return count;
    }

    async getClicksByDay(days: number) {
        const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

        return await this.client
            .select({
                date: sql<string>`to_char(date_trunc('day', ${linkClicks.clickedAt}), 'YYYY-MM-DD')`.as("date"),
                count: sql<number>`count(*)::int`.as("count"),
            })
            .from(linkClicks)
            .where(gte(linkClicks.clickedAt, since))
            .groupBy(sql`date_trunc('day', ${linkClicks.clickedAt})`)
            .orderBy(sql`date_trunc('day', ${linkClicks.clickedAt})`);
    }

    async getClicksByMonth(months: number) {
        const since = new Date();
        since.setMonth(since.getMonth() - months);

        return await this.client
            .select({
                month: sql<string>`to_char(date_trunc('month', ${linkClicks.clickedAt}), 'YYYY-MM')`.as("month"),
                count: sql<number>`count(*)::int`.as("count"),
            })
            .from(linkClicks)
            .where(gte(linkClicks.clickedAt, since))
            .groupBy(sql`date_trunc('month', ${linkClicks.clickedAt})`)
            .orderBy(sql`date_trunc('month', ${linkClicks.clickedAt})`);
    }

    async getTopLinks(limit: number) {
        return await this.client
            .select({
                linkId: linksShorted.id,
                linkShort: linksShorted.linkShort,
                linkOriginal: linksShorted.linkOriginal,
                clicks: sql<number>`count(${linkClicks.id})::int`.as("clicks"),
            })
            .from(linksShorted)
            .leftJoin(linkClicks, eq(linkClicks.linkId, linksShorted.id))
            .groupBy(linksShorted.id)
            .orderBy(desc(sql`count(${linkClicks.id})`))
            .limit(limit);
    }

    async getBreakdownByBrowser() {
        return await this.client
            .select({
                label: sql<string>`coalesce(${linkClicks.browser}, 'unknown')`.as("label"),
                count: sql<number>`count(*)::int`.as("count"),
            })
            .from(linkClicks)
            .groupBy(linkClicks.browser)
            .orderBy(desc(sql`count(*)`));
    }

    async getBreakdownByOs() {
        return await this.client
            .select({
                label: sql<string>`coalesce(${linkClicks.os}, 'unknown')`.as("label"),
                count: sql<number>`count(*)::int`.as("count"),
            })
            .from(linkClicks)
            .groupBy(linkClicks.os)
            .orderBy(desc(sql`count(*)`));
    }

    async getBreakdownByDevice() {
        return await this.client
            .select({
                label: sql<string>`coalesce(${linkClicks.device}, 'unknown')`.as("label"),
                count: sql<number>`count(*)::int`.as("count"),
            })
            .from(linkClicks)
            .groupBy(linkClicks.device)
            .orderBy(desc(sql`count(*)`));
    }

    async getBreakdownByCountry() {
        return await this.client
            .select({
                label: sql<string>`coalesce(${linkClicks.country}, 'unknown')`.as("label"),
                count: sql<number>`count(*)::int`.as("count"),
            })
            .from(linkClicks)
            .groupBy(linkClicks.country)
            .orderBy(desc(sql`count(*)`));
    }

    async getTopCities(limit: number) {
        return await this.client
            .select({
                label: sql<string>`coalesce(${linkClicks.city}, 'Unknown') || coalesce(', ' || nullif(${linkClicks.country}, ''), '')`.as("label"),
                count: sql<number>`count(*)::int`.as("count"),
            })
            .from(linkClicks)
            .groupBy(linkClicks.city, linkClicks.country)
            .orderBy(desc(sql`count(*)`))
            .limit(limit);
    }

}
