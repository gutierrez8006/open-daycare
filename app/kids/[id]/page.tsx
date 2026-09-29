import { notFound } from "next/navigation";
import { getChild } from "@/data/children";
import KidProfile from "@/components/kid-profile";

export default async function KidProfilePage({
  params,
}: PageProps<"/kids/[id]">) {
  const { id } = await params;
  const child = getChild(id);

  if (!child) notFound();

  return <KidProfile child={child} />;
}
