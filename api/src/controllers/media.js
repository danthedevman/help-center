import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "node:crypto";

function getR2Client() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error("Missing R2 credentials");
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

function getPublicUrl(key) {
  const bucketPublicUrl = process.env.R2_PUBLIC_URL;
  if (bucketPublicUrl) return `${bucketPublicUrl.replace(/\/$/, "")}/${key}`;
  const accountId = process.env.R2_ACCOUNT_ID;
  const bucket = process.env.R2_BUCKET;
  return `https://pub-${accountId}.r2.dev/${bucket}/${key}`;
}

async function uploadFileToR2({ workspaceId, file, folder }) {
  const bucket = process.env.R2_BUCKET;
  if (!bucket) {
    const err = new Error("R2 bucket is not configured");
    err.status = 500;
    throw err;
  }

  const ext = (file.originalname.split(".").pop() || "png").toLowerCase();
  const key = `workspaces/${workspaceId}/${folder}/${Date.now()}-${randomUUID()}.${ext}`;

  const client = getR2Client();
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype || "application/octet-stream",
    }),
  );

  return { key, url: getPublicUrl(key) };
}

export async function uploadImage(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: "Image file is required" });
  }

  try {
    const workspaceId = req.params.workspace;
    const upload = await uploadFileToR2({
      workspaceId,
      file: req.file,
      folder: "images",
    });

    return res.status(201).json({ ok: true, ...upload });
  } catch (error) {
    return res.status(error.status || 500).json({ error: error.message || "Failed to upload image" });
  }
}
