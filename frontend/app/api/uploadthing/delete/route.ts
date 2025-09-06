import { NextRequest, NextResponse } from "next/server";
import { UTApi } from "uploadthing/server";

const utapi = new UTApi();

// This route handler deletes a file from UploadThing
export async function POST(request: NextRequest) {
  try {
    const { fileKey } = await request.json();

    // fileKey is required to identify the file to delete
    if (!fileKey) {
      return NextResponse.json(
        { message: "File key is required" },
        { status: 400 }
      );
    }

    // file deletion
    await utapi.deleteFiles(fileKey);

    return NextResponse.json(
      { message: "File deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting file:", error);
    return NextResponse.json(
      { message: "Failed to delete file" },
      { status: 500 }
    );
  }
}
