import { debugLog } from "@/lib/utils";
import { NextRequest } from "next/server";

/**
 * Socket.io pass-through proxy
 * Passes all WebSocket/polling requests to the backend Socket.io server,
 */
export async function GET(request: NextRequest) {
  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL || "http://backend-service:4000";
  const socketUrl = `${apiUrl}/socket.io/`;

  const searchParams = request.nextUrl.searchParams;
  const queryString = searchParams.toString();

  try {
    const response = await fetch(`${socketUrl}?${queryString}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    return response;
  } catch (error) {
    console.error("Socket proxy error (GET):", error);
    return new Response("Socket proxy error", { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL || "http://backend-service:4000";
  const socketUrl = `${apiUrl}/socket.io/`;

  const searchParams = request.nextUrl.searchParams;
  const queryString = searchParams.toString();

  try {
    const body = await request.text();

    try {
      const jsonBody = JSON.parse(body);
      if (
        jsonBody.name === "send_team_message" ||
        jsonBody.name === "join_team_chat" ||
        jsonBody.name === "leave_team_chat"
      ) {
        debugLog(`Socket proxy forwarding team chat event: ${jsonBody.name}`);
      }
    } catch (e) {}

    const response = await fetch(`${socketUrl}?${queryString}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body,
    });

    return response;
  } catch (error) {
    console.error("Socket proxy error (POST):", error);
    return new Response("Socket proxy error", { status: 500 });
  }
}
