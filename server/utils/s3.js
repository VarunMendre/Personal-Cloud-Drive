import {
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export const createUploadSignedUrl = async ({key, contentType}) => {
    const command = new PutObjectCommand({
      Bucket: "varun-personal-stuff",
      Key: key,
      ContentType: contentType,
    });

    const url = await getSignedUrl(s3Client, command, {
      expiresIn: 300,
      signableHeaders: new Set(["content-type"]),
    });
}

export const completeUploadCheck = async ({ filename }) => {
  const command = new ListObjectsV2Command({
    Bucket: "varun-personal-stuff",
    Prefix: filename, // This will only return files starting with this name
    MaxKeys: 1,
  });

  const result = await s3Client.send(command);
  const resultFile = result.Contents[0].Size;

  return resultFile
};