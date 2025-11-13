import client from "./client";

// POST /api/check-owner-service-accounts
export const checkOwnerServiceAccounts = async (keyFile) => {
  const formData = new FormData();
  formData.append("keyFile", keyFile);

  const response = await client.post("/scan-sa", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return response.data;
};
