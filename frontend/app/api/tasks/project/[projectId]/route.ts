import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";

// GET /api/tasks/project/[projectId] - Get tasks for a specific project
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ projectId: string }> }
): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const params = await context.params;
    const id = params.projectId;

    // Request to the backend service
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/tasks/project/${id}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
      }
    );

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const errorData = await response.json();
        return NextResponse.json(
          { message: errorData.message || "Failed to fetch tasks" },
          { status: response.status }
        );
      } else {
        const errorText = await response.text();
        return NextResponse.json(
          { message: "Failed to fetch tasks" },
          { status: response.status }
        );
      }
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Tasks fetch error:", error);
    return NextResponse.json(
      { message: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
