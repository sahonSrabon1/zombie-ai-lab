import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createAuthSession, hashPassword, setAuthCookie } from "@/lib/auth";
import { getIdentityHeader } from "@/lib/identity";

const headers = { "X-Powered-By": getIdentityHeader() };

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      name?: string;
      email?: string;
      password?: string;
    };

    const name = body.name?.trim() || "";
    const email = body.email?.trim().toLowerCase() || "";
    const password = body.password || "";

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: "name, email, password are required", timestamp: new Date().toISOString() },
        { status: 400, headers },
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 6 characters", timestamp: new Date().toISOString() },
        { status: 400, headers },
      );
    }

    const existing = await db.authUser.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "User already exists", timestamp: new Date().toISOString() },
        { status: 409, headers },
      );
    }

    const passwordHash = await hashPassword(password);
    const user = await db.authUser.create({
      data: { name, email, passwordHash },
      select: { id: true, name: true, email: true, createdAt: true },
    });

    const { token, expiresAt } = await createAuthSession(user.id);
    await setAuthCookie(token, expiresAt);

    return NextResponse.json(
      { success: true, data: { user }, timestamp: new Date().toISOString() },
      { status: 201, headers },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Register failed",
        timestamp: new Date().toISOString(),
      },
      { status: 500, headers },
    );
  }
}
