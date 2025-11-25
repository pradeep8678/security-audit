import axios from "axios";

const api = axios.create({
  baseURL: "https://gcp-security-audit-1-196053730058.asia-south1.run.app/api",
  baseURL: "http://localhost:8080/api/",

  timeout: 300000
});

export default api;