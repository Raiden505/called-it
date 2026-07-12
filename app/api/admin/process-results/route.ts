import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { processMatchResult } from "@/lib/scoring/process-result";
import { resultProcessingInputSchema } from "@/lib/validation/result";
import { revalidatePath } from "next/cache";

export async function POST(request: Request) {
  const expectedSecret = process.env.ADMIN_SYNC_SECRET;
  const providedSecret = request.headers.get("x-admin-sync-secret");

  if (!expectedSecret || !providedSecret || !secretsMatch(providedSecret, expectedSecret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsedBody = resultProcessingInputSchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json({ error: parsedBody.error.issues[0]?.message ?? "Invalid result" }, { status: 400 });
  }

  try {
    const summary = await processMatchResult(createAdminClient(), parsedBody.data);
    revalidatePath("/matches");
    revalidatePath("/dashboard");
    return NextResponse.json(summary);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Result processing failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

function secretsMatch(providedSecret: string, expectedSecret: string): boolean {
  const providedBuffer = Buffer.from(providedSecret);
  const expectedBuffer = Buffer.from(expectedSecret);
  return providedBuffer.length === expectedBuffer.length && timingSafeEqual(providedBuffer, expectedBuffer);
}
