import { listPosts } from "@/lib/social/store";
import { getWorkspace } from "@/lib/data/workspace";
import { PageHeader } from "@/components/dashboard/page-header";
import { GridPlanner, type GridTile } from "@/components/social/grid-planner";

export default async function GridPage() {
  const [posts, workspace] = await Promise.all([listPosts(), getWorkspace()]);

  const tiles: GridTile[] = posts.map((p) => ({
    id: p.id,
    caption: p.caption,
    status: p.status,
    pillar: p.pillar,
  }));
  const published = posts.filter((p) => p.status === "published").length;

  return (
    <div>
      <PageHeader
        title="Grid"
        description="Plan how your feed will look before anything goes live. Arrange tiles, then turn each into a scheduled post."
      />
      <div className="mx-auto max-w-6xl p-6">
        <GridPlanner brand={workspace.name} tiles={tiles} published={published} />
      </div>
    </div>
  );
}
