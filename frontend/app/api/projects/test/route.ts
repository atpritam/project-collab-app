import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || "anonymous";

    const url = new URL(`${process.env.NEXT_PUBLIC_API_URL}/api/projects/test`);
    url.searchParams.append("userId", userId);

    console.log(`Testing backend connection to: ${url.toString()}`);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json(
        {
          error: text,
          status: response.status,
          url: url.toString(),
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({
      message: "Backend connection successful",
      backendResponse: data,
      environment: {
        apiUrl: process.env.NEXT_PUBLIC_API_URL,
      },
      url: url.toString(),
    });
  } catch (error: any) {
    console.error("Test error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
