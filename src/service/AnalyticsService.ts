import { AnalyticsRepository } from "@/repository/AnalyticsRepository";

type OverviewOptions = {
    days?: number;
    months?: number;
    topLinksLimit?: number;
    topCitiesLimit?: number;
};

export class AnalyticsService {

    constructor(private repository: AnalyticsRepository) { }

    async getOverview({
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
            this.repository.getTotalClicks(),
            this.repository.getTotalLinks(),
            this.repository.getClicksByDay(days),
            this.repository.getClicksByMonth(months),
            this.repository.getTopLinks(topLinksLimit),
            this.repository.getTopCities(topCitiesLimit),
            this.repository.getBreakdownByBrowser(),
            this.repository.getBreakdownByOs(),
            this.repository.getBreakdownByDevice(),
            this.repository.getBreakdownByCountry(),
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
