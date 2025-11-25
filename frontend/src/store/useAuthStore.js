import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

// use the frontend .env variable VITE_SOCKET_URL
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5001";

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  onlineUsers: [],
  socket: null,

  // helper: run callback when socket becomes available (immediate if exists)
  onSocket: (cb) => {
    const socket = get().socket;
    if (socket) return cb(socket);
    // subscribe to socket changes and call cb once it exists
    const unsub = useAuthStore.subscribe(
      (s) => s.socket,
      (skt) => {
        if (skt) {
          cb(skt);
          unsub();
        }
      }
    );
  },

  checkAuth: async () => {
    set({ isCheckingAuth: true });
    try {
      const res = await axiosInstance.get("/auth/check");
      if (!res || !res.data) throw new Error("Invalid server response");

      set({ authUser: res.data });
      get().connectSocket();
      return true;
    } catch (error) {
      if (error?.response?.status !== 401) {
        console.error("checkAuth error:", error?.response?.data || error.message);
      }
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
      if (res?.data) {
        set({ authUser: res.data });
        toast.success("Account created successfully");
        get().connectSocket();
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Signup failed");
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      if (res?.data) {
        set({ authUser: res.data });
        toast.success("Logged in successfully");
        get().connectSocket();
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Login failed");
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
    } catch (error) {
      toast.error(error?.response?.data?.message || "Logout failed");
    }
  },

  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await axiosInstance.put("/auth/update-profile", data);
      if (res?.data) set({ authUser: res.data });
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Profile update failed");
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  connectSocket: () => {
    const { authUser, socket } = get();
    if (!authUser) return; // must be logged in

    // Prevent duplicate
    if (socket && socket.connected) return;

    // Use SOCKET_URL from env
    const newSocket = io(SOCKET_URL, {
      // sending userId so server can map socket -> user
      query: { userId: String(authUser._id) },
      autoConnect: true,
      withCredentials: true,
    });

    newSocket.on("connect", () => {
      console.log("Socket connected:", newSocket.id);
    });

    newSocket.on("getOnlineUsers", (users) => {
      set({ onlineUsers: users });
    });

    newSocket.on("disconnect", () => {
      console.log("Socket disconnected");
      set({ onlineUsers: [] });
    });

    // save socket
    set({ socket: newSocket });
  },

  disconnectSocket: () => {
    const { socket } = get();
    if (socket && socket.connected) socket.disconnect();
    set({ socket: null, onlineUsers: [] });
  },
}));
