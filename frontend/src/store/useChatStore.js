
//latest

import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";
import toast from "react-hot-toast";

export const useChatStore = create((set, get) => ({
  /* ================= STATE ================= */
  users: [],
  messages: [],
  selectedUser: null,

  isUsersLoading: false,
  isMessagesLoading: false,

  // 📞 CALL STATE
  incomingCall: null, // { from, callType }
  isCalling: false,

  // 🎥 MEDIA
  localStream: null,

  /* ================= USERS ================= */
  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } finally {
      set({ isUsersLoading: false });
    }
  },

  /* ================= MESSAGES ================= */
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
    if (!selectedUser) return;

    try {
      const res = await axiosInstance.post(
        `/messages/send/${selectedUser._id}`,
        data
      );
      set({ messages: [...messages, res.data] });
    } catch {
      toast.error("Failed to send message");
    }
  },

  /* ================= MESSAGE SOCKET ================= */
  subscribeToMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.off("newMessage");
    socket.on("newMessage", (msg) => {
      const { selectedUser } = get();
      const myId = useAuthStore.getState().authUser._id;

      const shouldAdd =
        (msg.senderId === selectedUser?._id && msg.receiverId === myId) ||
        (msg.senderId === myId && msg.receiverId === selectedUser?._id);

      if (shouldAdd) {
        set((state) => ({ messages: [...state.messages, msg] }));
      }
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket?.off("newMessage");
  },

  /* ================= CALL SOCKET ================= */
  subscribeToCalls: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.off("incoming-call");
    socket.off("call-accepted");
    socket.off("call-rejected");

    socket.on("incoming-call", ({ from, callType }) => {
      set({ incomingCall: { from, callType } });
    });

    socket.on("call-accepted", () => {
      toast.success("Call accepted");
    });

    socket.on("call-rejected", () => {
      toast.error("Call rejected");
      set({ incomingCall: null, isCalling: false });
    });
  },

  /* ================= CALL ACTIONS ================= */
 startCall: (callType) => {
  const socket = useAuthStore.getState().socket;
  const { selectedUser } = get();
  if (!socket || !selectedUser) return;

  // ✅ yahan camera start NAHI hoga
  socket.emit("call-user", {
    to: selectedUser._id,
    callType,
  });
},



  
  acceptCall: async () => {
    const socket = useAuthStore.getState().socket;
    const { incomingCall } = get();
    if (!socket || !incomingCall) return;

    // 🔥 START CAMERA + MIC (RECEIVER)
    const stream = await navigator.mediaDevices.getUserMedia({
      video: incomingCall.callType === "video",
      audio: true,
    });

    set({
      localStream: stream,
      incomingCall: null,
      isCalling: true,
    });

    socket.emit("accept-call", {
      to: incomingCall.from,
    });
  },

  rejectCall: () => {
    const socket = useAuthStore.getState().socket;
    const { incomingCall } = get();
    if (!socket || !incomingCall) return;

    socket.emit("reject-call", {
      to: incomingCall.from,
    });

    set({ incomingCall: null, isCalling: false });
  },

   
  // 🔴 END CALL (IMPORTANT)
  endCall: () => {
    const { localStream, pc } = get();

    // stop camera & mic
    localStream?.getTracks().forEach((t) => t.stop());

    // close webrtc connection
    pc?.close();

    set({
      localStream: null,
      remoteStream: null,
      pc: null,
      isCalling: false,
      incomingCall: null,
    });
  },

  /* ================= UI ================= */
  setSelectedUser: (user) => {
    set({ selectedUser: user, messages: [] });
  },

}));







// import { create } from "zustand";
// import { axiosInstance } from "../lib/axios";
// import { useAuthStore } from "./useAuthStore";
// import toast from "react-hot-toast";

// export const useChatStore = create((set, get) => ({
//   /* ================= STATE ================= */
//   users: [],
//   messages: [],
//   selectedUser: null,

//   isUsersLoading: false,
//   isMessagesLoading: false,

//   // 📞 CALL STATES
//   incomingCall: null, // { from, callType }
//   isCalling: false,

//   /* ================= USERS ================= */
//   getUsers: async () => {
//     set({ isUsersLoading: true });
//     try {
//       const res = await axiosInstance.get("/messages/users");
//       set({ users: res.data });
//     } finally {
//       set({ isUsersLoading: false });
//     }
//   },

//   /* ================= MESSAGES ================= */
//   getMessages: async (userId) => {
//     set({ isMessagesLoading: true });
//     try {
//       const res = await axiosInstance.get(`/messages/${userId}`);
//       set({ messages: res.data });
//     } finally {
//       set({ isMessagesLoading: false });
//     }
//   },

//   sendMessage: async (data) => {
//     const { selectedUser, messages } = get();
//     if (!selectedUser) return;

//     try {
//       const res = await axiosInstance.post(
//         `/messages/send/${selectedUser._id}`,
//         data
//       );
//       set({ messages: [...messages, res.data] });
//     } catch {
//       toast.error("Failed to send message");
//     }
//   },

//   /* ================= MESSAGE SOCKET ================= */
//   subscribeToMessages: () => {
//     const socket = useAuthStore.getState().socket;
//     if (!socket) return;

//     socket.off("newMessage");

//     socket.on("newMessage", (msg) => {
//       const { selectedUser, messages } = get();
//       const myId = useAuthStore.getState().authUser._id;

//       const shouldAdd =
//         (msg.senderId === selectedUser?._id && msg.receiverId === myId) ||
//         (msg.senderId === myId && msg.receiverId === selectedUser?._id);

//       if (shouldAdd) {
//         set({ messages: [...messages, msg] });
//       }
//     });
//   },

//   unsubscribeFromMessages: () => {
//     const socket = useAuthStore.getState().socket;
//     socket?.off("newMessage");
//   },

//   /* ================= CALL SOCKET ================= */
//   subscribeToCalls: () => {
//     const socket = useAuthStore.getState().socket;
//     if (!socket) return;

//     socket.off("incoming-call");
//     socket.off("call-accepted");
//     socket.off("call-rejected");

//     socket.on("incoming-call", ({ from, callType }) => {
//       set({
//         incomingCall: { from, callType },
//       });
//     });

//     socket.on("call-accepted", () => {
//       toast.success("Call accepted");
//       set({ isCalling: true });
//     });

//     socket.on("call-rejected", () => {
//       toast.error("Call rejected");
//       set({ incomingCall: null, isCalling: false });
//     });
//   },

//   /* ================= CALL ACTIONS ================= */
//   // startCall: (callType) => {
//   //   const socket = useAuthStore.getState().socket;
//   //   const { selectedUser } = get();

//   //   if (!socket || !selectedUser) return;

//   //   set({ isCalling: true });

//   //   socket.emit("call-user", {
//   //     to: selectedUser._id,
//   //     callType, // "audio" | "video"
//   //   });
//   // },

//   startCall: (callType) => {
//   const socket = useAuthStore.getState().socket;
//   const { selectedUser } = get();

//   console.log("📞 START CALL CLICKED", {
//     callType,
//     socketExists: !!socket,
//     selectedUser,
//   });

//   if (!socket) {
//     console.log("❌ socket missing");
//     return;
//   }

//   if (!selectedUser) {
//     console.log("❌ selectedUser missing");
//     return;
//   }

//   socket.emit("call-user", {
//     to: selectedUser._id,
//     callType,
//   });

//   console.log("✅ call-user emitted");
// },

//   acceptCall: () => {
//     const socket = useAuthStore.getState().socket;
//     const { incomingCall } = get();

//     if (!socket || !incomingCall) return;

//     socket.emit("accept-call", {
//       to: incomingCall.from,
//     });

//     set({ incomingCall: null, isCalling: true });
//   },

//   rejectCall: () => {
//     const socket = useAuthStore.getState().socket;
//     const { incomingCall } = get();

//     if (!socket || !incomingCall) return;

//     socket.emit("reject-call", {
//       to: incomingCall.from,
//     });

//     set({ incomingCall: null, isCalling: false });
//   },

//   /* ================= UI ================= */
//   setSelectedUser: (user) => {
//     set({ selectedUser: user, messages: [] });
//   },
// }));


// import { create } from "zustand";
// import { axiosInstance } from "../lib/axios";
// import { useAuthStore } from "./useAuthStore";
// import toast from "react-hot-toast";

// export const useChatStore = create((set, get) => ({
//   users: [],
//   messages: [],
//   selectedUser: null,
//   isUsersLoading: false,
//   isMessagesLoading: false,

//   getUsers: async () => {
//     set({ isUsersLoading: true });
//     try {
//       const res = await axiosInstance.get("/messages/users");
//       set({ users: res.data });
//     } finally {
//       set({ isUsersLoading: false });
//     }
//   },

//   getMessages: async (userId) => {
//     set({ isMessagesLoading: true });
//     try {
//       const res = await axiosInstance.get(`/messages/${userId}`);
//       set({ messages: res.data });
//     } finally {
//       set({ isMessagesLoading: false });
//     }
//   },

//   sendMessage: async (data) => {
//     const { selectedUser, messages } = get();
//     try {
//       const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, data);
//       set({ messages: [...messages, res.data] });
//     } catch {
//       toast.error("Failed to send message");
//     }
//   },

//   subscribeToMessages: () => {
//     const socket = useAuthStore.getState().socket;
//     if (!socket) return;

//     socket.off("newMessage");
//     socket.on("newMessage", (msg) => {
//       const { selectedUser, messages } = get();
//       const myId = useAuthStore.getState().authUser._id;

//       const shouldAdd =
//         (msg.senderId === selectedUser?._id && msg.receiverId === myId) ||
//         (msg.senderId === myId && msg.receiverId === selectedUser?._id);

//       if (shouldAdd) {
//         set({ messages: [...messages, msg] });
//       }
//     });
//   },

//   unsubscribeFromMessages: () => {
//     const socket = useAuthStore.getState().socket;
//     socket?.off("newMessage");
//   },

//   setSelectedUser: (user) => {
//     set({ selectedUser: user, messages: [] });
//   },
// }));

// // import { create } from "zustand";
// // import toast from "react-hot-toast";
// // import { axiosInstance } from "../lib/axios";
// // import { useAuthStore } from "./useAuthStore";

// // export const useChatStore = create((set, get) => ({
// //   messages: [],
// //   users: [],
// //   selectedUser: null,
// //   isUsersLoading: false,
// //   isMessagesLoading: false,

// //   getUsers: async () => {
// //     set({ isUsersLoading: true });
// //     try {
// //       const res = await axiosInstance.get("/messages/users");
// //       set({ users: res.data || [] });
// //     } catch (error) {
// //       console.error("getUsers error:", error);
// //       toast.error(error?.response?.data?.message || "Failed to load users");
// //     } finally {
// //       set({ isUsersLoading: false });
// //     }
// //   },

// //   getMessages: async (userId) => {
// //     set({ isMessagesLoading: true });
// //     try {
// //       const res = await axiosInstance.get(`/messages/${userId}`);
// //       set({ messages: res.data || [] });
// //     } catch (error) {
// //       console.error("getMessages error:", error);
// //       toast.error(error?.response?.data?.message || "Failed to load messages");
// //     } finally {
// //       set({ isMessagesLoading: false });
// //     }
// //   },

// //   sendMessage: async (messageData) => {
// //     const { selectedUser, messages } = get();
// //     if (!selectedUser) {
// //       toast.error("No user selected");
// //       return;
// //     }
// //     try {
// //       const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
// //       // append to local messages for sender
// //       if (res?.data) set({ messages: [...messages, res.data] });
// //     } catch (error) {
// //       console.error("sendMessage error:", error);
// //       toast.error(error?.response?.data?.message || "Failed to send message");
// //     }
// //   },

// //   // subscribe to 'newMessage' events. This function attaches one handler per selectedUser
// //   // if socket is not available yet, it waits for it via useAuthStore.onSocket
// //   subscribeToMessages: () => {
// //     // helper to attach listener for current selectedUser
// //     const attach = (socket) => {
// //       // remove any previous handler first to avoid duplicates
// //       socket.off("newMessage", handleNewMessage);

// //       socket.on("newMessage", handleNewMessage);
// //     };

// //     // define handler here so we can remove it later
// //     function handleNewMessage(newMessage) {
// //       const authUser = useAuthStore.getState().authUser;
// //       const { selectedUser } = get();

// //       if (!authUser || !selectedUser) return;

// //       // message is for me (receiver) and sent by the selected user
// //       const isForMe = newMessage.receiverId === String(authUser._id);
// //       const isFromSelected = newMessage.senderId === String(selectedUser._id);

// //       // OR message was sent by me and receiver is selected (this case normally handled locally after send,
// //       // but covering for cases where server also emits back)
// //       const isFromMeToSelected =
// //         newMessage.senderId === String(authUser._id) &&
// //         newMessage.receiverId === String(selectedUser._id);

// //       if ((isForMe && isFromSelected) || isFromMeToSelected) {
// //         set({ messages: [...get().messages, newMessage] });
// //       }
// //     }

// //     const socket = useAuthStore.getState().socket;
// //     if (socket) {
// //       attach(socket);
// //       return;
// //     }

// //     // wait for socket to become available
// //     useAuthStore.getState().onSocket((skt) => {
// //       if (skt) attach(skt);
// //     });
// //   },

// //   unsubscribeFromMessages: () => {
// //     const socket = useAuthStore.getState().socket;
// //     if (socket) socket.off("newMessage");
// //   },

// //   setSelectedUser: (selectedUser) => {
// //     // clear messages and then load messages for new selected user
// //     set({ selectedUser, messages: [] });
// //   },
// // }));







// import { create } from "zustand";
// import { axiosInstance } from "../lib/axios";
// import { useAuthStore } from "./useAuthStore";
// import toast from "react-hot-toast";

// /* ================= WEBRTC HELPER ================= */
// const createPeerConnection = () =>
//   new RTCPeerConnection({
//     iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
//   });

// export const useChatStore = create((set, get) => ({
//   /* ================= STATE ================= */
//   users: [],
//   messages: [],
//   selectedUser: null,

//   isUsersLoading: false,
//   isMessagesLoading: false,

//   // 📞 CALL STATE
//   incomingCall: null, // { from, callType }
//   isCalling: false,

//   // 🎥 MEDIA STATE
//   pc: null,
//   localStream: null,
//   isMicOn: true,
//   isCameraOn: true,

//   /* ================= USERS ================= */
//   getUsers: async () => {
//     set({ isUsersLoading: true });
//     try {
//       const res = await axiosInstance.get("/messages/users");
//       set({ users: res.data });
//     } finally {
//       set({ isUsersLoading: false });
//     }
//   },

//   /* ================= MESSAGES ================= */
//   getMessages: async (userId) => {
//     set({ isMessagesLoading: true });
//     try {
//       const res = await axiosInstance.get(`/messages/${userId}`);
//       set({ messages: res.data });
//     } finally {
//       set({ isMessagesLoading: false });
//     }
//   },

//   sendMessage: async (data) => {
//     const { selectedUser, messages } = get();
//     if (!selectedUser) return;

//     try {
//       const res = await axiosInstance.post(
//         `/messages/send/${selectedUser._id}`,
//         data
//       );
//       set({ messages: [...messages, res.data] });
//     } catch {
//       toast.error("Failed to send message");
//     }
//   },

//   /* ================= MESSAGE SOCKET ================= */
//   subscribeToMessages: () => {
//     const socket = useAuthStore.getState().socket;
//     if (!socket) return;

//     socket.off("newMessage");

//     socket.on("newMessage", (msg) => {
//       const { selectedUser, messages } = get();
//       const myId = useAuthStore.getState().authUser._id;

//       const shouldAdd =
//         (msg.senderId === selectedUser?._id && msg.receiverId === myId) ||
//         (msg.senderId === myId && msg.receiverId === selectedUser?._id);

//       if (shouldAdd) {
//         set({ messages: [...messages, msg] });
//       }
//     });
//   },

//   unsubscribeFromMessages: () => {
//     const socket = useAuthStore.getState().socket;
//     if (!socket) return;
//     socket.off("newMessage");
//   },

//   /* ================= CALL SOCKET ================= */
//   subscribeToCalls: () => {
//     const socket = useAuthStore.getState().socket;
//     if (!socket) return;

//     socket.off("incoming-call");
//     socket.off("call-rejected");
//     socket.off("webrtc-offer");
//     socket.off("webrtc-answer");
//     socket.off("webrtc-ice");

//     socket.on("incoming-call", ({ from, callType }) => {
//       set({ incomingCall: { from, callType } });
//     });

//     socket.on("call-rejected", () => {
//       toast.error("Call rejected");
//       set({ incomingCall: null, isCalling: false });
//     });

//     // 🔥 OFFER RECEIVED
//     socket.on("webrtc-offer", async ({ from, offer }) => {
//       const pc = createPeerConnection();

//       const stream = await navigator.mediaDevices.getUserMedia({
//         video: true,
//         audio: true,
//       });

//       stream.getTracks().forEach((t) => pc.addTrack(t, stream));

//       pc.onicecandidate = (e) => {
//         if (e.candidate) {
//           socket.emit("webrtc-ice", {
//             to: from,
//             candidate: e.candidate,
//           });
//         }
//       };

//       await pc.setRemoteDescription(offer);
//       const answer = await pc.createAnswer();
//       await pc.setLocalDescription(answer);

//       socket.emit("webrtc-answer", {
//         to: from,
//         answer,
//       });

//       set({
//         pc,
//         localStream: stream,
//         isCalling: true,
//         incomingCall: null,
//         isMicOn: true,
//         isCameraOn: true,
//       });
//     });

//     socket.on("webrtc-answer", async ({ answer }) => {
//       const { pc } = get();
//       if (pc) await pc.setRemoteDescription(answer);
//     });

//     socket.on("webrtc-ice", async ({ candidate }) => {
//       const { pc } = get();
//       if (pc && candidate) await pc.addIceCandidate(candidate);
//     });
//   },

//   /* ================= CALL ACTIONS ================= */
//   startCall: (callType) => {
//     const socket = useAuthStore.getState().socket;
//     const { selectedUser } = get();
//     if (!socket || !selectedUser) return;

//     socket.emit("call-user", {
//       to: selectedUser._id,
//       callType,
//     });
//   },

//   acceptCall: async () => {
//     const socket = useAuthStore.getState().socket;
//     const { incomingCall } = get();
//     if (!socket || !incomingCall) return;

//     const pc = createPeerConnection();

//     const stream = await navigator.mediaDevices.getUserMedia({
//       video: true,
//       audio: true,
//     });

//     stream.getTracks().forEach((t) => pc.addTrack(t, stream));

//     pc.onicecandidate = (e) => {
//       if (e.candidate) {
//         socket.emit("webrtc-ice", {
//           to: incomingCall.from,
//           candidate: e.candidate,
//         });
//       }
//     };

//     const offer = await pc.createOffer();
//     await pc.setLocalDescription(offer);

//     socket.emit("webrtc-offer", {
//       to: incomingCall.from,
//       offer,
//     });

//     set({
//       pc,
//       localStream: stream,
//       incomingCall: null,
//       isCalling: true,
//       isMicOn: true,
//       isCameraOn: true,
//     });
//   },

//   rejectCall: () => {
//     const socket = useAuthStore.getState().socket;
//     const { incomingCall } = get();
//     if (!socket || !incomingCall) return;

//     socket.emit("reject-call", { to: incomingCall.from });
//     set({ incomingCall: null });
//   },

//   endCall: () => {
//     const { pc, localStream } = get();

//     localStream?.getTracks().forEach((t) => t.stop());
//     pc?.close();

//     set({
//       pc: null,
//       localStream: null,
//       isCalling: false,
//       incomingCall: null,
//     });
//   },

//   toggleMic: () => {
//     const { localStream, isMicOn } = get();
//     localStream?.getAudioTracks().forEach((t) => (t.enabled = !isMicOn));
//     set({ isMicOn: !isMicOn });
//   },

//   toggleCamera: () => {
//     const { localStream, isCameraOn } = get();
//     localStream?.getVideoTracks().forEach((t) => (t.enabled = !isCameraOn));
//     set({ isCameraOn: !isCameraOn });
//   },

//   /* ================= UI ================= */
//   setSelectedUser: (user) => {
//     set({ selectedUser: user, messages: [] });
//   },
// }));
