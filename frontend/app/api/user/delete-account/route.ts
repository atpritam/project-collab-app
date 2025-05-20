import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/auth-options";

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();

    // request to the backend service
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/user/delete`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
        body: JSON.stringify({
          password: body.password,
          verificationCode: body.verificationCode,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Backend delete account error:", response.status, data);
      return NextResponse.json(
        { message: data.message || "Failed to delete account" },
        { status: response.status }
      );
    }
    return NextResponse.json(data);
  } catch (error) {
    console.error("Account deletion error:", error);
    return NextResponse.json(
      { message: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
