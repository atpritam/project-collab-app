import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/auth-options";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const searchParams = new URL(req.url).searchParams;
    const limit = searchParams.get("limit");

    const backendUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://backend-service:4000";
    const url = new URL(`${backendUrl}/api/dashboard/projects`);

    if (limit) {
      url.searchParams.append("limit", limit);
    }

    const response = await fetch(url.toString(), {
      headers: {
        "Content-Type": "application/json",
        "x-user-id": userId,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      console.error(
        "Failed to fetch projects data from backend:",
        await response.text()
      );
      return NextResponse.json(
        { message: "Failed to fetch projects data" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Projects fetch error:", error);
    return NextResponse.json(
      { message: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
