import { notFound } from "next/navigation";
import { dbAdmin } from "@/lib/firebase-admin";
import { docToTaller } from "@/lib/talleres/firestore";
import TallerDetailClient from "./TallerDetailClient";

export const dynamic = "force-dynamic";

interface TallerDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function TallerDetailPage({ params }: TallerDetailPageProps) {
  const { id } = await params;
  if (!dbAdmin) notFound();

  const snap = await dbAdmin.collection("talleres").doc(id).get();
  if (!snap.exists) notFound();

  const taller = docToTaller(snap);
  return <TallerDetailClient taller={taller} />;
}
