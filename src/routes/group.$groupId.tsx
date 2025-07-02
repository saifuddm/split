import { createFileRoute, redirect } from "@tanstack/react-router";
import { useAuthStore } from "../data/useAuthStore";

export const Route = createFileRoute("/group/$groupId")({
  beforeLoad: async ({ params }) => {
    const { groupId } = params;
    const { groups } = useAuthStore();
    const group = groups.find((g) => g.details.id === Number(groupId));
    if (!group) {
      throw redirect({ to: "/dashboard" });
    }
    return { group };
  },
  component: GroupDetailPage,
});

function GroupDetailPage() {
  const { groupId } = Route.useParams();
  const { groups } = useAuthStore();
  return (
    <div>
      Hello {groups.find((g) => g.details.id === Number(groupId))?.details.name}
      !
    </div>
  );
}
