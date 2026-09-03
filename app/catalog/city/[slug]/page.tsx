import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogLandingPage } from "@/components/CatalogLandingPage";
import { cityFromSlug, cityStaticParams } from "@/lib/catalog-routes";
import { cityLanding, landingMetadata } from "@/lib/landing-pages";
import { decodeRouteParam } from "@/lib/route-params";

export const dynamicParams = false;

export function generateStaticParams() {
  return cityStaticParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const city = cityFromSlug(decodeRouteParam(slug));
  if (!city) return { title: "עיר" };
  return landingMetadata(cityLanding(city));
}

export default async function CityCollectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const city = cityFromSlug(decodeRouteParam(slug));
  if (!city) notFound();
  const landing = cityLanding(city);
  if (!landing.scholarships.length) notFound();
  return <CatalogLandingPage landing={landing} />;
}
