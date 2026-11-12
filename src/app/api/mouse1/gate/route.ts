import { NextResponse } from "next/server";
import { mouse1, TransitionGateInput } from "@/lib/mouse1";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as TransitionGateInput;
    if (!body.toStatus) {
      return NextResponse.json({ error: "toStatus is required" }, { status: 400 });
    }

    const result = await mouse1.evaluateTransitionGate(body);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Mouse-1 Gate Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error during transition evaluation" },
      { status: 500 }
    );
  }
}
