import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const uri =
      process.env.NEXT_PUBLIC_API_URL || "http://backend-service:4000";
    const response = await fetch(`${uri}/api/dashboard/activity`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": userId,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      console.error(
        "Failed to fetch activity data from backend:",
        await response.text()
      );
      return NextResponse.json(
        { message: "Failed to fetch activity data" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in activity route:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
