import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogLandingPage } from "@/components/CatalogLandingPage";
import { institutionStaticParams } from "@/lib/catalog-routes";
import { institutionLanding, landingMetadata } from "@/lib/landing-pages";

export const dynamicParams = false;

export function generateStaticParams() {
  return institutionStaticParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const landing = institutionLanding(id);
  if (!landing) return { title: "מוסד" };
  return landingMetadata(landing);
}

export default async function InstitutionCollectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const landing = institutionLanding(id);
  if (!landing || landing.scholarships.length === 0) notFound();
  return <CatalogLandingPage landing={landing} />;
}
