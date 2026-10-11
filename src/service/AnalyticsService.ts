import { AnalyticsRepository } from "@/repository/AnalyticsRepository";

type OverviewOptions = {
    days?: number;
    months?: number;
    topLinksLimit?: number;
    topCitiesLimit?: number;
};

export class AnalyticsService {

    constructor(private repository: AnalyticsRepository) { }

    async getOverview(userId: number, {
        days = 30,
        months = 12,
        topLinksLimit = 5,
        topCitiesLimit = 5,
    }: OverviewOptions = {}) {
        const [
            totalClicks,
            totalLinks,
            clicksByDay,
            clicksByMonth,
            topLinks,
            topCities,
            browser,
            os,
            device,
            country,
        ] = await Promise.all([
            this.repository.getTotalClicks(userId),
            this.repository.getTotalLinks(userId),
            this.repository.getClicksByDay(userId, days),
            this.repository.getClicksByMonth(userId, months),
            this.repository.getTopLinks(userId, topLinksLimit),
            this.repository.getTopCities(userId, topCitiesLimit),
            this.repository.getBreakdownByBrowser(userId),
            this.repository.getBreakdownByOs(userId),
            this.repository.getBreakdownByDevice(userId),
            this.repository.getBreakdownByCountry(userId),
        ]);

        return {
            totalClicks,
            totalLinks,
            clicksByDay,
            clicksByMonth,
            topLinks,
            topCities,
            breakdown: { browser, os, device, country },
        };
    }

}
