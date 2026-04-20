import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getIdentityHeader } from "@/lib/identity";

const headers = { "X-Powered-By": getIdentityHeader() };

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized", timestamp: new Date().toISOString() },
        { status: 401, headers },
      );
    }

    return NextResponse.json(
      { success: true, data: { user }, timestamp: new Date().toISOString() },
      { status: 200, headers },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Auth check failed",
        timestamp: new Date().toISOString(),
      },
      { status: 500, headers },
    );
  }
}
