import { ActivityOverview } from "@/app/components/activity-overview";
import {
  getCommitTimingHeatmap,
  getContributionDays,
  getIssueFlowHealth,
  getPullRequestHealth,
} from "@/lib/github";

export const metadata = {
  title: "Activity",
};

export const revalidate = 300;

export default async function ActivityPage() {
  const [days, prHealthData, issueFlowData, commitTimingHeatmap] =
    await Promise.all([
      getContributionDays(),
      getPullRequestHealth(),
      getIssueFlowHealth(),
      getCommitTimingHeatmap(),
    ]);

  return (
    <ActivityOverview
      days={days}
      prHealthData={prHealthData}
      issueFlowData={issueFlowData}
      commitTimingHeatmap={commitTimingHeatmap}
    />
  );
}
