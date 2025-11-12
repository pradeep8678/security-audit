import api from "./client";

export async function listPublicBuckets(file) {
  const fd = new FormData();
  fd.append("keyFile", file);

  const { data } = await api.post("/list-buckets", fd);
  return data;
}
