import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Sector } from "@/lib/types";
import { SECTORS } from "@/lib/types";
import { CatalogLandingPage } from "@/components/CatalogLandingPage";
import { sectorStaticParams } from "@/lib/catalog-routes";
import { landingMetadata, sectorLanding } from "@/lib/landing-pages";
import { decodeRouteParam } from "@/lib/route-params";

export const dynamicParams = false;

export function generateStaticParams() {
  return sectorStaticParams();
}

function asSector(id: string): Sector | undefined {
  return SECTORS.find((s) => s === id);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const sector = asSector(decodeRouteParam(id));
  if (!sector) return { title: "מגזר" };
  return landingMetadata(sectorLanding(sector));
}

export default async function SectorCollectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sector = asSector(decodeRouteParam(id));
  if (!sector) notFound();
  const landing = sectorLanding(sector);
  if (!landing.scholarships.length) notFound();
  return <CatalogLandingPage landing={landing} />;
}
