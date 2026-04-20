import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createAuthSession, setAuthCookie, verifyPassword } from "@/lib/auth";
import { getIdentityHeader } from "@/lib/identity";

const headers = { "X-Powered-By": getIdentityHeader() };

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
    };

    const email = body.email?.trim().toLowerCase() || "";
    const password = body.password || "";

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "email and password are required", timestamp: new Date().toISOString() },
        { status: 400, headers },
      );
    }

    const user = await db.authUser.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password", timestamp: new Date().toISOString() },
        { status: 401, headers },
      );
    }

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password", timestamp: new Date().toISOString() },
        { status: 401, headers },
      );
    }

    const { token, expiresAt } = await createAuthSession(user.id);
    await setAuthCookie(token, expiresAt);

    return NextResponse.json(
      {
        success: true,
        data: {
          user: { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt },
        },
        timestamp: new Date().toISOString(),
      },
      { status: 200, headers },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Login failed",
        timestamp: new Date().toISOString(),
      },
      { status: 500, headers },
    );
  }
}
