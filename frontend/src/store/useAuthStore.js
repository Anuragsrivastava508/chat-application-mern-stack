import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";
import { useChatStore } from "./useChatStore";

const SOCKET_URL =
  import.meta.env.MODE === "production"
    ? "https://chatify-n6jt.onrender.com"
    : "http://localhost:5001";

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,

  onlineUsers: [],
  socket: null,

  /* ================= AUTH ================= */

  checkAuth: async () => {
    set({ isCheckingAuth: true });
    try {
      const res = await axiosInstance.get("/auth/check");
      set({ authUser: res.data });
      get().connectSocket(); // 🔥 IMPORTANT
      return true;
    } catch {
      set({ authUser: null });
      return false;
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup", data);
      set({ authUser: res.data });
      toast.success("Account created successfully");
      get().connectSocket();
    } catch (error) {
      toast.error(error?.response?.data?.message ?? "Signup failed");
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      set({ authUser: res.data });
      toast.success("Logged in successfully");
      get().connectSocket();
    } catch (error) {
      toast.error(error?.response?.data?.message ?? "Login failed");
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      get().disconnectSocket();
      set({ authUser: null, onlineUsers: [] });
      toast.success("Logged out successfully");
    } catch {
      toast.error("Logout failed");
    }
  },

  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await axiosInstance.put("/auth/update-profile", data);
      set({ authUser: res.data });
      toast.success("Profile updated successfully");
    } catch {
      toast.error("Profile update failed");
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  /* ================= SOCKET ================= */

  connectSocket: () => {
    const { authUser, socket } = get();
    if (!authUser) return;
    if (socket?.connected) return;

    const newSocket = io(SOCKET_URL, {
      query: { userId: String(authUser._id) }, // 🔥 MOST IMPORTANT
      withCredentials: true,
      transports: ["websocket"], // 🔥 FIX
    });

    newSocket.on("connect", () => {
      console.log("🔥 Socket connected:", newSocket.id);

      // 🔥 ATTACH CHAT LISTENERS HERE (FINAL FIX)
      // const chatStore =
      //   require("./useChatStore").useChatStore.getState();
     
       

const chatStore = useChatStore.getState();

      chatStore.subscribeToMessages();
      chatStore.subscribeToCalls();
    });

    newSocket.on("getOnlineUsers", (users) => {
      console.log("📡 Online users:", users);
      set({ onlineUsers: users });
    });

    newSocket.on("disconnect", () => {
      console.log("❌ Socket disconnected");
      set({ onlineUsers: [] });
    });

    set({ socket: newSocket });
  },

  disconnectSocket: () => {
    const { socket } = get();
    if (socket?.connected) socket.disconnect();
    set({ socket: null, onlineUsers: [] });
  },
}));

