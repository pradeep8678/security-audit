import client from "./client";

export const scanFirewall = async (keyFile) => {
  const formData = new FormData();
  formData.append("keyFile", keyFile); // must match backend multer field name

  const response = await client.post("/scan-firewall", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return response.data;
};
