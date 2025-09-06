import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";

// DELETE /api/projects/[id]/members - Remove a project member
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const projectId = resolvedParams.id;
    const memberId = request.headers.get("x-member-id");
    const userId = session.user.id;

    if (!memberId) {
      return NextResponse.json(
        { message: "Member ID is required" },
        { status: 400 }
      );
    }

    // Backend Service API call
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/projects/${projectId}/members/remove`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
          "x-member-id": memberId,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { message: errorData.message || "Failed to remove member" },
        { status: response.status }
      );
    }

    return NextResponse.json({ message: "Member removed successfully" });
  } catch (error) {
    console.error("Error removing project member:", error);
    return NextResponse.json(
      { message: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
