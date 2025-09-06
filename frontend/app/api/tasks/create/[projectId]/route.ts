import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";

// POST /api/tasks/create/[projectId] - Create a new task in a project
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ projectId: string }> }
): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const params = await context.params;
    const projectId = params.projectId;
    const body = await request.json();

    const { files, ...taskData } = body;

    // Request to the backend service
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/tasks/create/${projectId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...taskData,
          creatorId: session.user.id,
          projectId,
          files,
        }),
      }
    );

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const errorData = await response.json();
        return NextResponse.json(
          { message: errorData.message || "Failed to create task" },
          { status: response.status }
        );
      } else {
        const errorText = await response.text();
        return NextResponse.json(
          { message: "Failed to create task" },
          { status: response.status }
        );
      }
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Task creation error:", error);
    return NextResponse.json(
      { message: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
