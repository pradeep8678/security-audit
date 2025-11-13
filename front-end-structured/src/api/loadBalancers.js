import client from "./client";

// ✅ POST /api/scan-lb
export const checkLoadBalancers = async (keyFile) => {
  const formData = new FormData();
  formData.append("keyFile", keyFile);

  const response = await client.post("/scan-lb", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return response.data;
};
