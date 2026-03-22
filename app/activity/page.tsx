import { ActivityOverview } from "@/app/components/activity-overview";
import { getContributionDays } from "@/lib/github";

export const metadata = {
  title: "Activity",
};

export const dynamic = "force-dynamic";

export default async function ActivityPage() {
  const days = await getContributionDays();

  return <ActivityOverview days={days} />;
}
