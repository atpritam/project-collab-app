import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    const currentUserId = session?.user?.id;

    if (!currentUserId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const otherUserId = request.headers.get("x-other-user-id");
    if (!otherUserId) {
      return NextResponse.json(
        { message: "Missing other user ID" },
        { status: 400 }
      );
    }

    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://backend-service:4000";
    const response = await fetch(`${apiUrl}/api/messages/direct`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": currentUserId,
        "x-other-user-id": otherUserId,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { message: errorData.message || "Failed to fetch messages" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { message: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
