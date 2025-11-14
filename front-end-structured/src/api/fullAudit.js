import client from "./client";

export const runFullAudit = async (file) => {
  const formData = new FormData();
  formData.append("keyFile", file); // 👈 must match multer's field name in backend

  const response = await client.post("/full-audit", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return response.data;
};