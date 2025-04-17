import { createUploadthing, type FileRouter } from "uploadthing/next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";

const f = createUploadthing();

export const ourFileRouter = {
  // route for profile image uploads
  profileImage: f({ image: { maxFileSize: "1MB", maxFileCount: 1 } })
    .middleware(async ({ req }) => {
      const session = await getServerSession(authOptions);

      // authentication check
      if (!session || !session.user.id) throw new Error("Unauthorized");

      // Return user ID to be used in onUploadComplete
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code runs on your server after upload
      console.log("Profile image uploaded for userId:", metadata.userId);

      // Use a consistent property name for the URL
      const fileUrl = file.ufsUrl;
      console.log("File URL:", fileUrl);

      return {
        uploadedBy: metadata.userId,
        fileUrl: fileUrl,
      };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
