import { NextResponse } from "next/server";
import { mouse1, TriageInput } from "@/lib/mouse1";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as TriageInput;
    if (!body.title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const result = await mouse1.predictTriage(body);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Mouse-1 Triage Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error during triage" },
      { status: 500 }
    );
  }
}
