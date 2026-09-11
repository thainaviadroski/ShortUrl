import { db } from "@/db";
import { AnalyticsRepository } from "@/repository/AnalyticsRepository";
import { AnalyticsService } from "@/service/AnalyticsService";
import { StatTile } from "@/components/analytics/stat-tile";
import { RankedBarList } from "@/components/analytics/ranked-bar-list";
import { ClicksTrendChart } from "@/components/analytics/clicks-trend-chart";
import { formatCompactNumber } from "@/lib/format";

const analyticsService = new AnalyticsService(new AnalyticsRepository(db));

export default async function AnalyticsPage() {
  const overview = await analyticsService.getOverview();

  const topLink = overview.topLinks[0];
  const topBrowser = overview.breakdown.browser[0];
  const topOs = overview.breakdown.os[0];

  return (
    <div className="flex flex-col gap-6 p-6">
      <h1 className="text-lg font-semibold">Analytics</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatTile label="Total clicks" value={formatCompactNumber(overview.totalClicks)} />
        <StatTile label="Total links" value={formatCompactNumber(overview.totalLinks)} />
        <StatTile
          label="Top link"
          value={topLink && topLink.clicks > 0 ? topLink.linkShort : "—"}
          hint={
            topLink && topLink.clicks > 0
              ? `${formatCompactNumber(topLink.clicks)} clicks`
              : "No clicks yet"
          }
        />
        <StatTile
          label="Top browser"
          value={topBrowser && topBrowser.count > 0 ? topBrowser.label : "—"}
          hint={
            topBrowser && topBrowser.count > 0
              ? `${formatCompactNumber(topBrowser.count)} clicks`
              : undefined
          }
        />
        <StatTile
          label="Top OS"
          value={topOs && topOs.count > 0 ? topOs.label : "—"}
          hint={
            topOs && topOs.count > 0 ? `${formatCompactNumber(topOs.count)} clicks` : undefined
          }
        />
      </div>

      <ClicksTrendChart daily={overview.clicksByDay} monthly={overview.clicksByMonth} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RankedBarList
          title="Top links"
          emptyLabel="No clicks yet"
          items={overview.topLinks
            .filter((link) => link.clicks > 0)
            .map((link) => ({
              label: link.linkShort,
              value: link.clicks,
              href: `/links/${link.linkId}`,
            }))}
        />
        <RankedBarList
          title="Top 5 cities"
          emptyLabel="No location data yet"
          items={overview.topCities
            .filter((city) => city.count > 0)
            .map((city) => ({ label: city.label, value: city.count }))}
        />
        <RankedBarList
          title="Browsers"
          items={overview.breakdown.browser
            .filter((browser) => browser.count > 0)
            .map((browser) => ({ label: browser.label, value: browser.count }))}
        />
        <RankedBarList
          title="Operating systems"
          items={overview.breakdown.os
            .filter((os) => os.count > 0)
            .map((os) => ({ label: os.label, value: os.count }))}
        />
      </div>
    </div>
  );
}
