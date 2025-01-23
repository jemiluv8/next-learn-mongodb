"use server"

/** THis CORS POLICY IS REQUIRED
 * [
    {
        "AllowedHeaders": [
            "*"
        ],
        "AllowedMethods": [
            "PUT",
            "GET"
        ],
        "AllowedOrigins": [
            "*"
        ],
        "ExposeHeaders": [],
        "MaxAgeSeconds": 3000
    }
]
 */

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

import crypto from "crypto"
import { Attachment } from "../models/attachments"
import mongooseConnect from "../mongodb/mongoose"

const allowedFileTypes = [
  "image/jpeg",
  "image/png",
  "video/mp4",
  "video/quicktime",
  "application/pdf",
]

const maxFileSize = 1048576 * 10 // 1 MB

const generateFileName = (bytes = 32) => crypto.randomBytes(bytes).toString("hex")

type SignedURLResponse = Promise<
  | { error?: undefined; data: { url: string; id: number } }
  | { error: string; data?: undefined }
>

export type GetSignedURLParams = {
  type: string
  size: number
  record_id?: string;
  name: string;
  checksum: string;
}
export const getSignedURL = async ({
  type,
  size,
  record_id,
  checksum,
  name
}: GetSignedURLParams): SignedURLResponse => {
  await mongooseConnect();

  if (!allowedFileTypes.includes(type)) {
    return { error: "File type not allowed" }
  }

  if (size > maxFileSize) {
    return { error: "File size too large" }
  }

  const awsKey = generateFileName()

  const putObjectCommand = new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME!,
    Key: awsKey,
    ContentType: type,
    ContentLength: size,
    ChecksumSHA256: checksum,
  })

  const url = await getSignedUrl(
    s3Client,
    putObjectCommand,
    { expiresIn: 60 } // 60 seconds
  )

  const attachment = await Attachment.create({
    key: `${process.env.AWS_BUCKET_BASE_URL}/${awsKey}`,
    service_name: "s3",
    file_name: name,
    content_type: type,
    byte_size: size,
    checksum: checksum,
    record_type: "media",
    ...(record_id ? { record_id: record_id } : {})
  });

  return { data: { url, id: attachment._id } }
}
