import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";

export async function PATCH(
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
    const { role } = await request.json();

    // Validate role
    if (!role || !["ADMIN", "EDITOR", "MEMBER"].includes(role)) {
      return NextResponse.json({ message: "Invalid role" }, { status: 400 });
    }

    if (!memberId) {
      return NextResponse.json(
        { message: "Member ID is required" },
        { status: 400 }
      );
    }

    // Backend Service API call
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/projects/${projectId}/members/role`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
          "x-member-id": memberId,
        },
        body: JSON.stringify({ role }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { message: errorData.message || "Failed to update member role" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error updating member role:", error);
    return NextResponse.json(
      { message: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
