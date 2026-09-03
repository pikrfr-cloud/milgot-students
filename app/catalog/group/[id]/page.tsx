import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogLandingPage } from "@/components/CatalogLandingPage";
import { groupStaticParams, isSearchGroupId } from "@/lib/catalog-groups";
import { groupLanding, landingMetadata } from "@/lib/landing-pages";
import { HE } from "@/lib/i18n/he";

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
  if (!isSearchGroupId(id)) return { title: HE.nav.catalog };
  return landingMetadata(groupLanding(id));
}

export default async function GroupCollectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!isSearchGroupId(id)) notFound();
  const landing = groupLanding(id);
  if (!landing.scholarships.length) notFound();
  return <CatalogLandingPage landing={landing} />;
}
