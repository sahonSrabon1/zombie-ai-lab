import { NextResponse } from "next/server";
import { invalidateSessionByCookie } from "@/lib/auth";
import { getIdentityHeader } from "@/lib/identity";

const headers = { "X-Powered-By": getIdentityHeader() };

export async function POST() {
  try {
    await invalidateSessionByCookie();
    return NextResponse.json(
      { success: true, data: { loggedOut: true }, timestamp: new Date().toISOString() },
      { status: 200, headers },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Logout failed",
        timestamp: new Date().toISOString(),
      },
      { status: 500, headers },
    );
  }
}
