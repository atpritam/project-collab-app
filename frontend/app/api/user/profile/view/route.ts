import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://backend-service:4000";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { message: "Email parameter is required" },
        { status: 400 }
      );
    }

    if (session.user.email === email) {
      return NextResponse.json(
        {
          message: "Use /profile for your own profile",
        },
        { status: 400 }
      );
    }

    // target user's basic info
    const userResponse = await fetch(
      `${API_BASE_URL}/api/user/byEmail?email=${encodeURIComponent(email)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": session.user.id,
        },
      }
    );

    if (userResponse.status === 404) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    if (!userResponse.ok) {
      console.error("Failed to fetch user:", userResponse.statusText);
      return NextResponse.json(
        { message: "Failed to fetch user data" },
        { status: 500 }
      );
    }

    const userData = await userResponse.json();

    // target user's profile info
    const profileResponse = await fetch(`${API_BASE_URL}/api/user/profile`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": userData.id,
      },
    });

    let profileData = null;
    if (profileResponse.ok) {
      profileData = await profileResponse.json();
    }

    // shared projects (projects where both users are members)
    const sharedProjectsResponse = await fetch(
      `${API_BASE_URL}/api/collaborators/shared-projects?targetUserId=${userData.id}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": session.user.id,
        },
      }
    );

    let sharedProjects = [];
    if (sharedProjectsResponse.ok) {
      const sharedProjectsData = await sharedProjectsResponse.json();
      sharedProjects = sharedProjectsData.projects || [];
    }

    // data
    const userProfile = {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      image: userData.image,
      createdAt: userData.createdAt,
      profile: profileData?.profile || {},
      projectsCount: profileData?.memberProjectsCount || 0,
      publicProjects: sharedProjects,
    };

    return NextResponse.json(userProfile);
  } catch (error) {
    console.error("Error in profile view API:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
