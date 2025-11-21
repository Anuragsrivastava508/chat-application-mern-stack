import axios from "axios";

export const axiosInstance = axios.create({
  //baseURL: import.meta.env.MODE === "development" ? "http://localhost:5001/api" : "/api",

  // useAuthStore.js
baseURL: import.meta.env.MODE === "development" ? "http://localhost:3001" : "/api",

  withCredentials: true,
});


// import axios from "axios";

// export const axiosInstance = axios.create({
//   baseURL: "http://localhost:3001/api", // matches your backend mount
//   withCredentials: true,
// });
