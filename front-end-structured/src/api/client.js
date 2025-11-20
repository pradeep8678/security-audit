import axios from "axios";

const api = axios.create({
  baseURL: "https://gcp-security-audit-1-196053730058.asia-south1.run.app/api",
  timeout: 300000
});

export default api;