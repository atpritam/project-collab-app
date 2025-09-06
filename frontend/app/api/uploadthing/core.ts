import { createUploadthing, type FileRouter } from "uploadthing/next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/auth-options";

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
      console.log("Profile image uploaded for userId:", metadata.userId);

      // Use a consistent property name for the URL
      const fileUrl = file.ufsUrl;
      console.log("File URL:", fileUrl);

      return {
        uploadedBy: metadata.userId,
        fileUrl: fileUrl,
      };
    }),

  projectFile: f({
    image: { maxFileSize: "2MB" },
    pdf: { maxFileSize: "2MB" },
    text: { maxFileSize: "2MB" },
    audio: { maxFileSize: "2MB" },
    video: { maxFileSize: "8MB" },
  })
    .middleware(async ({ req }) => {
      const session = await getServerSession(authOptions);
      if (!session || !session.user.id) throw new Error("Unauthorized");
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Project file uploaded for userId:", metadata.userId);
      const fileUrl = file.ufsUrl;
      return {
        uploadedBy: metadata.userId,
        url: fileUrl,
        name: file.name,
        size: file.size,
        type: file.type,
        key: file.key,
      };
    }),

  taskAttachment: f({
    image: { maxFileSize: "2MB" },
    pdf: { maxFileSize: "2MB" },
    text: { maxFileSize: "2MB" },
    audio: { maxFileSize: "2MB" },
    video: { maxFileSize: "8MB" },
  })
    .middleware(async ({ req }) => {
      const session = await getServerSession(authOptions);
      if (!session || !session.user.id) throw new Error("Unauthorized");
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Task attachment uploaded for userId:", metadata.userId);
      const fileUrl = file.ufsUrl;
      return {
        uploadedBy: metadata.userId,
        url: fileUrl,
        name: file.name,
        size: file.size,
        type: file.type,
        key: file.key,
      };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
