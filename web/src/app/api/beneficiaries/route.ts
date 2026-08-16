import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const beneficiaries = await prisma.beneficiary.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  // unique by phone+network
  const seen = new Set<string>();
  const unique = beneficiaries.filter((b) => {
    const key = `${b.phone}:${b.network}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return NextResponse.json(unique);
}
