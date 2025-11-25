// src/api/aws.js
import client from "./client";

export const runAwsFullAudit = async (accessKeyId, secretAccessKey) => {
  try {
    const res = await client.post("/aws-full-audit", {
      accessKeyId,
      secretAccessKey,
    });

    return res.data;
  } catch (err) {
    console.error("AWS Audit API Error:", err);
    throw err;
  }
};
