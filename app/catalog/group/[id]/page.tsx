import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogLandingPage } from "@/components/CatalogLandingPage";
import { groupStaticParams, isSearchGroupId } from "@/lib/catalog-groups";
import { groupLanding, landingMetadata } from "@/lib/landing-pages";
import { HE } from "@/lib/i18n/he";
import { decodeRouteParam } from "@/lib/route-params";

export const dynamicParams = false;

export function generateStaticParams() {
  return groupStaticParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const groupId = decodeRouteParam(id);
  if (!isSearchGroupId(groupId)) return { title: HE.nav.catalog };
  return landingMetadata(groupLanding(groupId));
}

export default async function GroupCollectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const groupId = decodeRouteParam(id);
  if (!isSearchGroupId(groupId)) notFound();
  const landing = groupLanding(groupId);
  if (!landing.scholarships.length) notFound();
  return <CatalogLandingPage landing={landing} />;
}
