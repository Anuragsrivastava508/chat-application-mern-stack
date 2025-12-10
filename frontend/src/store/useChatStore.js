import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";
import toast from "react-hot-toast";

export const useChatStore = create((set, get) => ({
  users: [],
  messages: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (data) => {
    const { selectedUser, messages } = get();
    try {
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, data);
      set({ messages: [...messages, res.data] });
    } catch {
      toast.error("Failed to send message");
    }
  },

  subscribeToMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.off("newMessage");
    socket.on("newMessage", (msg) => {
      const { selectedUser, messages } = get();
      const myId = useAuthStore.getState().authUser._id;

      const shouldAdd =
        (msg.senderId === selectedUser?._id && msg.receiverId === myId) ||
        (msg.senderId === myId && msg.receiverId === selectedUser?._id);

      if (shouldAdd) {
        set({ messages: [...messages, msg] });
      }
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket?.off("newMessage");
  },

  setSelectedUser: (user) => {
    set({ selectedUser: user, messages: [] });
  },
}));

// import { create } from "zustand";
// import toast from "react-hot-toast";
// import { axiosInstance } from "../lib/axios";
// import { useAuthStore } from "./useAuthStore";

// export const useChatStore = create((set, get) => ({
//   messages: [],
//   users: [],
//   selectedUser: null,
//   isUsersLoading: false,
//   isMessagesLoading: false,

//   getUsers: async () => {
//     set({ isUsersLoading: true });
//     try {
//       const res = await axiosInstance.get("/messages/users");
//       set({ users: res.data || [] });
//     } catch (error) {
//       console.error("getUsers error:", error);
//       toast.error(error?.response?.data?.message || "Failed to load users");
//     } finally {
//       set({ isUsersLoading: false });
//     }
//   },

//   getMessages: async (userId) => {
//     set({ isMessagesLoading: true });
//     try {
//       const res = await axiosInstance.get(`/messages/${userId}`);
//       set({ messages: res.data || [] });
//     } catch (error) {
//       console.error("getMessages error:", error);
//       toast.error(error?.response?.data?.message || "Failed to load messages");
//     } finally {
//       set({ isMessagesLoading: false });
//     }
//   },

//   sendMessage: async (messageData) => {
//     const { selectedUser, messages } = get();
//     if (!selectedUser) {
//       toast.error("No user selected");
//       return;
//     }
//     try {
//       const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
//       // append to local messages for sender
//       if (res?.data) set({ messages: [...messages, res.data] });
//     } catch (error) {
//       console.error("sendMessage error:", error);
//       toast.error(error?.response?.data?.message || "Failed to send message");
//     }
//   },

//   // subscribe to 'newMessage' events. This function attaches one handler per selectedUser
//   // if socket is not available yet, it waits for it via useAuthStore.onSocket
//   subscribeToMessages: () => {
//     // helper to attach listener for current selectedUser
//     const attach = (socket) => {
//       // remove any previous handler first to avoid duplicates
//       socket.off("newMessage", handleNewMessage);

//       socket.on("newMessage", handleNewMessage);
//     };

//     // define handler here so we can remove it later
//     function handleNewMessage(newMessage) {
//       const authUser = useAuthStore.getState().authUser;
//       const { selectedUser } = get();

//       if (!authUser || !selectedUser) return;

//       // message is for me (receiver) and sent by the selected user
//       const isForMe = newMessage.receiverId === String(authUser._id);
//       const isFromSelected = newMessage.senderId === String(selectedUser._id);

//       // OR message was sent by me and receiver is selected (this case normally handled locally after send,
//       // but covering for cases where server also emits back)
//       const isFromMeToSelected =
//         newMessage.senderId === String(authUser._id) &&
//         newMessage.receiverId === String(selectedUser._id);

//       if ((isForMe && isFromSelected) || isFromMeToSelected) {
//         set({ messages: [...get().messages, newMessage] });
//       }
//     }

//     const socket = useAuthStore.getState().socket;
//     if (socket) {
//       attach(socket);
//       return;
//     }

//     // wait for socket to become available
//     useAuthStore.getState().onSocket((skt) => {
//       if (skt) attach(skt);
//     });
//   },

//   unsubscribeFromMessages: () => {
//     const socket = useAuthStore.getState().socket;
//     if (socket) socket.off("newMessage");
//   },

//   setSelectedUser: (selectedUser) => {
//     // clear messages and then load messages for new selected user
//     set({ selectedUser, messages: [] });
//   },
// }));
