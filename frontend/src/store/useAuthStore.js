import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

// Backend root for Socket.IO (without /api)
const SOCKET_URL = import.meta.env.MODE === "development" ? "http://localhost:3001" : "/";

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  onlineUsers: [],
  socket: null,

  // Check if user is logged in
  checkAuth: async () => {
    set({ isCheckingAuth: true });
    try {
      const res = await axiosInstance.get("/auth/check");
      set({ authUser: res.data });
      get().connectSocket();
      return true;
    } catch (error) {
      const message = error?.response?.data?.message || error.message || "Authentication failed";
      toast.error(message);
      set({ authUser: null });
      return false;
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  // Signup
  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup", data);
      set({ authUser: res.data });
      toast.success("Account created successfully");
      get().connectSocket();
    } catch (error) {
      const message = error?.response?.data?.message || error.message || "Signup failed";
      toast.error(message);
    } finally {
      set({ isSigningUp: false });
    }
  },

  // Login
  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      set({ authUser: res.data });
      toast.success("Logged in successfully");
      get().connectSocket();
    } catch (error) {
      const message = error?.response?.data?.message || error.message || "Login failed";
      toast.error(message);
    } finally {
      set({ isLoggingIn: false });
    }
  },

  // Logout
  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      set({ authUser: null });
      toast.success("Logged out successfully");
      get().disconnectSocket();
    } catch (error) {
      const message = error?.response?.data?.message || error.message || "Logout failed";
      toast.error(message);
    }
  },

  // Update profile
  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await axiosInstance.put("/auth/update-profile", data);
      set({ authUser: res.data });
      toast.success("Profile updated successfully");
    } catch (error) {
      const message = error?.response?.data?.message || error.message || "Profile update failed";
      toast.error(message);
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  // Connect Socket.IO


connectSocket: () => {
  const { authUser, socket } = get();
  if (!authUser || socket) return;

  const newSocket = io("http://localhost:3001", {
    auth: { userId: authUser._id },
    transports: ["websocket"]
  });

  set({ socket: newSocket });

  newSocket.emit("join", authUser._id);

  newSocket.on("getOnlineUsers", (userIds) => {
    set({ onlineUsers: userIds });
  });

  newSocket.on("newMessage", (msg) => {
    console.log("New message received:", msg);
  });
},


  // Disconnect Socket.IO
  disconnectSocket: () => {
    const socket = get().socket;
    if (socket) {
      socket.off("getOnlineUsers");
      socket.disconnect();
      set({ socket: null });
    }
  },
}));






















// import { create } from "zustand";
// import { axiosInstance } from "../lib/axios.js";
// import toast from "react-hot-toast";
// import { io } from "socket.io-client";

// //const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

// // useAuthStore.js
// const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:3001" : "/";


// export const useAuthStore = create((set, get) => ({
//   authUser: null,
//   isSigningUp: false,
//   isLoggingIn: false,
//   isUpdatingProfile: false,
//   isCheckingAuth: true,
//   onlineUsers: [],
//   socket: null,

//   checkAuth: async () => {
//     set({ isCheckingAuth: true });
//     try {
//       const res = await axiosInstance.get("/auth/check");
//       set({ authUser: res.data });
//       get().connectSocket();
//       return true;
//     } catch (error) {
//       const message = error?.response?.data?.message || error.message || "Authentication failed";
//       toast.error(message);
//       set({ authUser: null });
//       return false;
//     } finally {
//       set({ isCheckingAuth: false });
//     }
//   },

//   signup: async (data) => {
//     set({ isSigningUp: true });
//     try {
//       const res = await axiosInstance.post("/auth/signup", data);
//       set({ authUser: res.data });
//       toast.success("Account created successfully");
//       get().connectSocket();
//     } catch (error) {
//       const message = error?.response?.data?.message || error.message || "Signup failed";
//       toast.error(message);
//     } finally {
//       set({ isSigningUp: false });
//     }
//   },

//   login: async (data) => {
//     set({ isLoggingIn: true });
//     try {
//       const res = await axiosInstance.post("/auth/login", data);
//       set({ authUser: res.data });
//       toast.success("Logged in successfully");
//       get().connectSocket();
//     } catch (error) {
//       const message = error?.response?.data?.message || error.message || "Login failed";
//       toast.error(message);
//     } finally {
//       set({ isLoggingIn: false });
//     }
//   },

//   logout: async () => {
//     try {
//       await axiosInstance.post("/auth/logout");
//       set({ authUser: null });
//       toast.success("Logged out successfully");
//       get().disconnectSocket();
//     } catch (error) {
//       const message = error?.response?.data?.message || error.message || "Logout failed";
//       toast.error(message);
//     }
//   },

//   updateProfile: async (data) => {
//     set({ isUpdatingProfile: true });
//     try {
//       const res = await axiosInstance.put("/auth/update-profile", data);
//       set({ authUser: res.data });
//       toast.success("Profile updated successfully");
//     } catch (error) {
//       const message = error?.response?.data?.message || error.message || "Profile update failed";
//       toast.error(message);
//     } finally {
//       set({ isUpdatingProfile: false });
//     }
//   },

//   connectSocket: () => {
//     const { authUser, socket } = get();
//     if (!authUser || socket) return;

//     const newSocket = io(BASE_URL, {
//       auth: { userId: authUser._id }
//     });

//     set({ socket: newSocket });

//     newSocket.on("getOnlineUsers", (userIds) => {
//       set({ onlineUsers: userIds });
//     });
//   },

//   disconnectSocket: () => {
//     const socket = get().socket;
//     if (socket) {
//       socket.off("getOnlineUsers");
//       socket.disconnect();
//       set({ socket: null });
//     }
//   },
// }));





// // import { create } from "zustand";
// // import { axiosInstance } from "../lib/axios.js";
// // import toast from "react-hot-toast";
// // import { io } from "socket.io-client";

// // const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:5001" : "/";

// // export const useAuthStore = create((set, get) => ({
// //   authUser: null,
// //   isSigningUp: false,
// //   isLoggingIn: false,
// //   isUpdatingProfile: false,
// //   isCheckingAuth: true,
// //   onlineUsers: [],
// //   socket: null,

// // checkAuth: async () => {
// //   set({ isCheckingAuth: true });   // IMPORTANT (Start loading)

// //   try {
// //     const res = await axiosInstance.get("/auth/check");

// //     set({ authUser: res.data });
// //     get().connectSocket();
// //     return true;
// //   } catch (error) {
// //     toast.error(error?.response?.data?.message || "Authentication failed");
// //     set({ authUser: null });
// //     return false;
// //   } finally {
// //     set({ isCheckingAuth: false });   // IMPORTANT (Stop loading)
// //   }
// // },


// //   signup: async (data) => {
// //     set({ isSigningUp: true });
// //     try {
// //       const res = await axiosInstance.post("/auth/signup", data);
// //       set({ authUser: res.data });
// //       toast.success("Account created successfully");
// //       get().connectSocket();
// //     } catch (error) {
  
// //     toast.error(error?.response?.data?.message || "Signup failed");
// //     } finally {
// //       set({ isSigningUp: false });
// //     }
// //   },

// //   login: async (data) => {
// //     set({ isLoggingIn: true });
// //     try {
// //       const res = await axiosInstance.post("/auth/login", data);
// //       set({ authUser: res.data });
// //       toast.success("Logged in successfully");

// //       get().connectSocket();
// //     } catch (error) {
// //     toast.error(error?.response?.data?.message || "logining failed");
// //     } finally {
// //       set({ isLoggingIn: false });
// //     }
// //   },

// //   logout: async () => {
// //     try {
// //       await axiosInstance.post("/auth/logout");
// //       set({ authUser: null });
// //       toast.success("Logged out successfully");
// //       get().disconnectSocket();
// //     } catch (error) {
// //     toast.error(error?.response?.data?.message || "logout failed");
// //     }
// //   },

// //   updateProfile: async (data) => {
// //     set({ isUpdatingProfile: true });
// //     try {
// //       const res = await axiosInstance.put("/auth/update-profile", data);
// //       set({ authUser: res.data });
// //       toast.success("Profile updated successfully");
// //     } catch (error) {
// //     toast.error(error?.response?.data?.message || "Signup failed");
// //     } finally {
// //       set({ isUpdatingProfile: false });
// //     }
// //   },

// //   connectSocket: () => {
// //     const { authUser } = get();
// //     if (!authUser || get().socket?.connected) return;

// //     const socket = io(BASE_URL, {
// //       query: {
// //         userId: authUser._id,
// //       },
// //     });
// //     socket.connect();

// //     set({ socket: socket });

// //     socket.on("getOnlineUsers", (userIds) => {
// //       set({ onlineUsers: userIds });
// //     });
// //   },
// //   disconnectSocket: () => {
// //     if (get().socket?.connected) get().socket.disconnect();
// //   },
// // }));



