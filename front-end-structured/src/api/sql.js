import client from "./client";

// POST key file to backend
export const checkPublicSql = async (file) => {
  const formData = new FormData();
  formData.append("keyFile", file); // ✅ must match upload.single("file")

  const res = await client.post("/scan-sql", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data;
};
