import api from "./client";

export async function listPublicVMs(file) {
  const fd = new FormData();
  fd.append("keyFile", file);
  const { data } = await api.post("/list-vms", fd);
  return data;
}