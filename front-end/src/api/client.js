import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8080/api",
  timeout: 180000
});

export default api;