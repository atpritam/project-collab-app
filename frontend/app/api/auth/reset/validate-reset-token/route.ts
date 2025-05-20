import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/auth/validate-reset-token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();

    if (!response.ok || !data.valid) {
      return NextResponse.json(
        {
          message:
            data.message ||
            "This password reset link is invalid or has expired",
        },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Password reset error:", error);
    return NextResponse.json(
      { message: "Failed to validate reset token" },
      { status: 500 }
    );
  }
}
