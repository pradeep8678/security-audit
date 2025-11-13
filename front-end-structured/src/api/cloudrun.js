import client from "./client";

export const checkCloudFunctionsAndRuns = async (file) => {
  const formData = new FormData();
  formData.append("keyFile", file);

  const response = await client.post("/scan-cloudrun-function", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return response.data;
};
