import axios from "axios";

const api = axios.create({
  baseURL: "http://192.168.10.17:8000",
  timeout: 10000,
});

export default api;
