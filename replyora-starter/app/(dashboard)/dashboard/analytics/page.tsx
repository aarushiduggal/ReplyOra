import { Clock, MoonStar, TrendingUp, UserCheck } from "lucide-react";

import { getAnalytics } from "@/lib/data/analytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import {
  ChartLegend,
  Funnel,
  HBars,
  TrendBars,
} from "@/components/dashboard/charts";

export default async function AnalyticsPage() {
  const a = await getAnalytics();

  return (
    <div>
      <PageHeader
        title="Analytics"
        description="Visitor → lead → booking funnel, response time and after-hours capture."
      />
      <div className="space-y-6 p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Conversion rate"
            value={`${Math.round(a.conversionRate * 100)}%`}
            hint="chats → leads"
            icon={UserCheck}
          />
          <StatCard
            label="Booking rate"
            value={`${Math.round(a.bookingRate * 100)}%`}
            hint="leads → booked"
            icon={TrendingUp}
          />
          <StatCard
            label="Avg response"
            value={`${a.avgResponseSeconds}s`}
            hint="time to first reply"
            icon={Clock}
          />
          <StatCard
            label="After-hours leads"
            value={`${Math.round(a.afterHoursPct * 100)}%`}
            hint={`${a.afterHoursLeads} captured out of hours`}
            icon={MoonStar}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Conversion funnel</CardTitle>
            </CardHeader>
            <CardContent>
              <Funnel
                stages={[
                  { label: "Visitors", value: a.funnel.visitors },
                  { label: "Conversations", value: a.funnel.conversations },
                  { label: "Leads", value: a.funnel.leads },
                  { label: "Booked", value: a.funnel.booked },
                ]}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Last 7 days</CardTitle>
              <ChartLegend
                items={[
                  { label: "Conversations", className: "bg-oxblood" },
                  { label: "Leads", className: "bg-rose" },
                ]}
              />
            </CardHeader>
            <CardContent>
              <TrendBars data={a.trend} />
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Top pages</CardTitle>
            </CardHeader>
            <CardContent>
              {a.topPages.length > 0 ? (
                <HBars
                  data={a.topPages.map((p) => ({
                    label: p.label,
                    value: p.conversations,
                    sub: `${p.leads} leads`,
                  }))}
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  No conversations yet — install the widget to start seeing which
                  pages drive the most chats.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Metrics are computed from the mock data. // TODO: replace with Supabase
          aggregates / a metrics rollup.
        </p>
      </div>
    </div>
  );
}
