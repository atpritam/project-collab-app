// project-collab-app/frontend/app/api/messages/mark-read/[userId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const currentUserId = session.user.id;
    const otherUserId = request.headers.get("x-other-user-id");
    if (!otherUserId) {
      return NextResponse.json(
        { message: "Missing other user ID" },
        { status: 400 }
      );
    }

    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://backend-service:4000";

    // Request to the backend service
    const response = await fetch(`${apiUrl}/api/messages/mark-read`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": currentUserId,
        "x-other-user-id": otherUserId,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { message: errorData.message || "Failed to mark messages as read" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error marking messages as read:", error);
    return NextResponse.json(
      { message: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
