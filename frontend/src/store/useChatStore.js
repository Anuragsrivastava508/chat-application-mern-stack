import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

/* ================= WEBRTC ================= */
const createPeerConnection = () =>
  new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  });

export const useChatStore = create((set, get) => ({
  users: [],
  messages: [],
  selectedUser: null,

  outgoingCall: null,
  incomingCall: null,
  isCalling: false,
  callWith: null,

  pc: null,
  localStream: null,
  remoteStream: null,

  isMicOn: true,
  isCameraOn: true,

  /* ================= SOCKET CALLS ================= */
  subscribeToCalls: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.off("incoming-call");
    socket.off("webrtc-offer");
    socket.off("webrtc-answer");
    socket.off("webrtc-ice");

    /* 🔔 INCOMING CALL */
    socket.on("incoming-call", ({ from, callType }) => {
      set({
        incomingCall: { from, callType },
        callWith: from,
      });
    });

    /* 🔵 RECEIVE OFFER */
    socket.on("webrtc-offer", async ({ from, offer }) => {
      const pc = createPeerConnection();

      await pc.setRemoteDescription(offer);

      /* 🔥 RECEIVE STREAM */
      pc.ontrack = (e) => {
        console.log("REMOTE RECEIVED:", e.streams[0]);
        set({ remoteStream: e.streams[0] });
      };

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          socket.emit("webrtc-ice", {
            to: from,
            candidate: e.candidate,
          });
        }
      };

      set({ pc });
    });

    /* 🔵 RECEIVE ANSWER */
    socket.on("webrtc-answer", async ({ answer }) => {
      const { pc } = get();
      if (pc) {
        await pc.setRemoteDescription(answer);
      }
    });

    /* 🔵 ICE */
    socket.on("webrtc-ice", async ({ candidate }) => {
      const { pc } = get();
      if (pc && candidate) {
        await pc.addIceCandidate(candidate);
      }
    });
  },

  /* ================= START CALL (CALLER) ================= */
  startCall: async (callType) => {
    const socket = useAuthStore.getState().socket;
    const { selectedUser } = get();

    if (!socket || !selectedUser) return;

    const pc = createPeerConnection();

    const stream = await navigator.mediaDevices.getUserMedia({
      video: callType === "video",
      audio: true,
    });

    stream.getTracks().forEach((t) => pc.addTrack(t, stream));

    pc.ontrack = (e) => {
      console.log("CALLER GOT STREAM:", e.streams[0]);
      set({ remoteStream: e.streams[0] });
    };

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit("webrtc-ice", {
          to: selectedUser._id,
          candidate: e.candidate,
        });
      }
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    socket.emit("webrtc-offer", {
      to: selectedUser._id,
      offer,
    });

    set({
      pc,
      localStream: stream,
      isCalling: true,
      callWith: selectedUser._id,
    });
  },

  /* ================= ACCEPT CALL (RECEIVER) ================= */
  acceptCall: async () => {
    const socket = useAuthStore.getState().socket;
    const { incomingCall, pc } = get();

    if (!socket || !incomingCall || !pc) return;

    const stream = await navigator.mediaDevices.getUserMedia({
      video: incomingCall.callType === "video",
      audio: true,
    });

    stream.getTracks().forEach((t) => pc.addTrack(t, stream));

    pc.ontrack = (e) => {
      console.log("RECEIVER GOT STREAM:", e.streams[0]);
      set({ remoteStream: e.streams[0] });
    };

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    socket.emit("webrtc-answer", {
      to: incomingCall.from,
      answer,
    });

    set({
      localStream: stream,
      isCalling: true,
      incomingCall: null,
    });
  },

  /* ================= END CALL ================= */
  endCall: () => {
    const socket = useAuthStore.getState().socket;
    const { pc, localStream, callWith } = get();

    localStream?.getTracks().forEach((t) => t.stop());
    pc?.close();

    if (socket && callWith) {
      socket.emit("end-call", { to: callWith });
    }

    set({
      pc: null,
      localStream: null,
      remoteStream: null,
      incomingCall: null,
      outgoingCall: null,
      callWith: null,
      isCalling: false,
    });
  },

  toggleMic: () => {
    const { localStream, isMicOn } = get();
    localStream?.getAudioTracks().forEach((t) => {
      t.enabled = !isMicOn;
    });
    set({ isMicOn: !isMicOn });
  },

  toggleCamera: () => {
    const { localStream, isCameraOn } = get();
    localStream?.getVideoTracks().forEach((t) => {
      t.enabled = !isCameraOn;
    });
    set({ isCameraOn: !isCameraOn });
  },

  setSelectedUser: (u) =>
    set({
      selectedUser: u,
      messages: [],
    }),
}));

// import { create } from "zustand";
// import { axiosInstance } from "../lib/axios";
// import { useAuthStore } from "./useAuthStore";

// /* ================= WEBRTC ================= */
// const createPeerConnection = () =>
//   new RTCPeerConnection({
//     iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
//   });

// export const useChatStore = create((set, get) => ({
//   /* ================= STATE ================= */
//   users: [],
//   messages: [],
//   selectedUser: null,

//   outgoingCall: null,
//   incomingCall: null,
//   isCalling: false,

//   callWith: null, // 🔥 FIX

//   pc: null,
//   localStream: null,
//   remoteStream: null,

//   isMicOn: true,
//   isCameraOn: true,

//   /* ================= USERS ================= */
//   getUsers: async () => {
//     const res = await axiosInstance.get("/messages/users");
//     set({ users: res.data });
//   },

//   /* ================= MESSAGES ================= */
//   getMessages: async (id) => {
//     const res = await axiosInstance.get(`/messages/${id}`);
//     set({ messages: res.data });
//   },

//   sendMessage: async (data) => {
//     const { selectedUser } = get();
//     if (!selectedUser) return;

//     await axiosInstance.post(
//       `/messages/send/${selectedUser._id}`,
//       data
//     );

//     // ❌ DON'T add locally
//   },

//   /* ================= SOCKET (MESSAGES) ================= */
//   subscribeToMessages: () => {
//     const socket = useAuthStore.getState().socket;
//     if (!socket) return;

//     socket.off("newMessage");

//     socket.on("newMessage", (msg) => {
//       set((s) => {
//         if (s.messages.some((m) => m._id === msg._id)) {
//           return s;
//         }
//         return { messages: [...s.messages, msg] };
//       });
//     });
//   },

//   unsubscribeFromMessages: () => {
//     useAuthStore.getState().socket?.off("newMessage");
//   },

//   /* ================= SOCKET (CALLS) ================= */
//   subscribeToCalls: () => {
//     const socket = useAuthStore.getState().socket;
//     if (!socket) return;

//     socket.off("incoming-call");
//     socket.off("webrtc-offer");
//     socket.off("webrtc-answer");
//     socket.off("webrtc-ice");
//     socket.off("call-ended");

//     /* 🔔 INCOMING CALL */
//     socket.on("incoming-call", ({ from, callType }) => {
//       set({
//         incomingCall: { from, callType },
//         callWith: from, // 🔥 IMPORTANT
//         isCalling: false,
//       });
//     });

//     /* 🔴 CALL ENDED */
//     socket.on("call-ended", () => {
//       console.log("🔥 CALL ENDED RECEIVED");
//       get().endCall(false);
//     });

//     /* 🔵 OFFER */
//     socket.on("webrtc-offer", async ({ from, offer }) => {
//       const socket = useAuthStore.getState().socket;

//       const pc = createPeerConnection();

//       const stream = await navigator.mediaDevices.getUserMedia({
//         video: true,
//         audio: true,
//       });

//       stream.getTracks().forEach((t) => pc.addTrack(t, stream));

//       const remoteStream = new MediaStream();

//       pc.ontrack = (e) => {
//         e.streams[0].getTracks().forEach((t) => {
//           remoteStream.addTrack(t);
//         });
//         set({ remoteStream });
//       };

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

//       socket.emit("webrtc-answer", { to: from, answer });

//       set({
//         pc,
//         localStream: stream,
//         remoteStream,
//         isCalling: true,
//         incomingCall: null,
//       });
//     });

//     /* 🔵 ANSWER */
//     socket.on("webrtc-answer", async ({ answer }) => {
//       const { pc } = get();
//       if (pc) await pc.setRemoteDescription(answer);

//       set({
//         isCalling: true,
//         outgoingCall: null,
//       });
//     });

//     /* 🔵 ICE */
//     socket.on("webrtc-ice", async ({ candidate }) => {
//       const { pc } = get();
//       if (pc && candidate) {
//         await pc.addIceCandidate(candidate);
//       }
//     });
//   },

//   /* ================= START CALL ================= */
//   startCall: (callType) => {
//     const socket = useAuthStore.getState().socket;
//     const { selectedUser } = get();

//     if (!socket || !selectedUser) return;

//     socket.emit("call-user", {
//       to: selectedUser._id,
//       callType,
//     });

//     set({
//       outgoingCall: {
//         to: selectedUser._id,
//         callType,
//       },
//       callWith: selectedUser._id, // 🔥 IMPORTANT
//     });
//   },

//   /* ================= ACCEPT CALL ================= */
//   acceptCall: async () => {
//     const socket = useAuthStore.getState().socket;
//     const { incomingCall } = get();

//     if (!socket || !incomingCall) return;

//     const pc = createPeerConnection();

//     const stream = await navigator.mediaDevices.getUserMedia({
//       video: incomingCall.callType === "video",
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
//       isCalling: true,
//       incomingCall: null,
//     });
//   },

//   /* ================= REJECT ================= */
//   rejectCall: () => {
//     const socket = useAuthStore.getState().socket;
//     const { incomingCall } = get();

//     if (socket && incomingCall) {
//       socket.emit("end-call", { to: incomingCall.from });
//     }

//     set({
//       incomingCall: null,
//       callWith: null,
//       isCalling: false,
//     });
//   },

//   /* ================= CANCEL ================= */
//   cancelOutgoingCall: () => {
//     const socket = useAuthStore.getState().socket;
//     const { outgoingCall } = get();

//     if (socket && outgoingCall) {
//       socket.emit("end-call", { to: outgoingCall.to });
//     }

//     set({
//       outgoingCall: null,
//       callWith: null,
//       isCalling: false,
//     });
//   },

//   /* ================= END CALL ================= */
//   endCall: (notify = true) => {
//     const socket = useAuthStore.getState().socket;
//     const { pc, localStream, callWith } = get();

//     if (localStream) {
//       localStream.getTracks().forEach((t) => t.stop());
//     }

//     if (pc) pc.close();

//     if (notify && socket && callWith) {
//       socket.emit("end-call", { to: callWith });
//     }

//     set({
//       pc: null,
//       localStream: null,
//       remoteStream: null,
//       incomingCall: null,
//       outgoingCall: null,
//       callWith: null,
//       isCalling: false,
//       isMicOn: true,
//       isCameraOn: true,
//     });
//   },

//   /* ================= MIC ================= */
//   toggleMic: () => {
//     const { localStream, isMicOn } = get();
//     localStream?.getAudioTracks().forEach((t) => {
//       t.enabled = !isMicOn;
//     });
//     set({ isMicOn: !isMicOn });
//   },

//   /* ================= CAMERA ================= */
//   toggleCamera: () => {
//     const { localStream, isCameraOn } = get();
//     localStream?.getVideoTracks().forEach((t) => {
//       t.enabled = !isCameraOn;
//     });
//     set({ isCameraOn: !isCameraOn });
//   },

//   setSelectedUser: (u) =>
//     set({
//       selectedUser: u,
//       messages: [],
//     }),
// }));


// //import { create } from "zustand";
// import { axiosInstance } from "../lib/axios";
// import { useAuthStore } from "./useAuthStore";

// /* ================= WEBRTC ================= */
// const createPeerConnection = () =>
//   new RTCPeerConnection({
//     iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
//   });

// export const useChatStore = create((set, get) => ({
//   /* ================= STATE ================= */
//   users: [],
//   messages: [],
//   selectedUser: null,

//   outgoingCall: null,
//   incomingCall: null,
//   isCalling: false,

//   pc: null,
//   localStream: null,
//   remoteStream: null,

//   isMicOn: true,
//   isCameraOn: true,

//   /* ================= USERS ================= */
//   getUsers: async () => {
//     const res = await axiosInstance.get("/messages/users");
//     set({ users: res.data });
//   },

//   /* ================= MESSAGES ================= */
//   getMessages: async (id) => {
//     const res = await axiosInstance.get(`/messages/${id}`);
//     set({ messages: res.data });
//   },

// sendMessage: async (data) => {
//   const { selectedUser } = get();
//   if (!selectedUser) return;

//   await axiosInstance.post(
//     `/messages/send/${selectedUser._id}`,
//     data
//   );

//   // ❌ DON'T add message here
//   // socket already karega
// },


//   /* ================= SOCKET (MESSAGES) ================= */
// subscribeToMessages: () => {
//   const socket = useAuthStore.getState().socket;
//   if (!socket) return;

//   socket.off("newMessage");

//   socket.on("newMessage", (msg) => {
//     console.log("📩 MESSAGE:", msg._id);

//     set((s) => {
//       // ✅ HARD duplicate check
//       if (s.messages.some((m) => m._id === msg._id)) {
//         console.log("🚫 DUPLICATE BLOCKED:", msg._id);
//         return s;
//       }

//       return {
//         messages: [...s.messages, msg],
//       };
//     });
//   });
// },
//   unsubscribeFromMessages: () => {
//     useAuthStore.getState().socket?.off("newMessage");
//   },

//   /* ================= SOCKET (CALLS) ================= */
//   // subscribeToCalls: () => {
//   //   const socket = useAuthStore.getState().socket;
//   //   if (!socket) return;

//   //   socket.off("incoming-call");
//   //   socket.off("webrtc-offer");
//   //   socket.off("webrtc-answer");
//   //   socket.off("webrtc-ice");
//   //   socket.off("call-ended");

//   //   /* 🔔 INCOMING CALL */
//   //   socket.on("incoming-call", ({ from, callType }) => {
//   //     set({
//   //       incomingCall: { from, callType },
//   //       isCalling: false, // ringing
//   //     });
//   //   });

//   //   /* 🔴 CALL ENDED */
//   //   socket.on("call-ended", () => {
//   //     get().endCall(false);
//   //   });

//   //   /* 🔵 OFFER RECEIVED (receiver side) */
//   //   socket.on("webrtc-offer", async ({ from, offer }) => {
//   //     const socket = useAuthStore.getState().socket;

//   //     const pc = createPeerConnection();

//   //     const stream = await navigator.mediaDevices.getUserMedia({
//   //       video: true,
//   //       audio: true,
//   //     });

//   //     stream.getTracks().forEach((t) => pc.addTrack(t, stream));

//   //     const remoteStream = new MediaStream();

//   //     pc.ontrack = (e) => {
//   //       e.streams[0].getTracks().forEach((t) => remoteStream.addTrack(t));
//   //       set({ remoteStream });
//   //     };

//   //     pc.onicecandidate = (e) => {
//   //       if (e.candidate) {
//   //         socket.emit("webrtc-ice", {
//   //           to: from,
//   //           candidate: e.candidate,
//   //         });
//   //       }
//   //     };

//   //     await pc.setRemoteDescription(offer);

//   //     const answer = await pc.createAnswer();
//   //     await pc.setLocalDescription(answer);

//   //     socket.emit("webrtc-answer", { to: from, answer });

//   //     set({
//   //       pc,
//   //       localStream: stream,
//   //       remoteStream,
//   //       isCalling: true,
//   //       incomingCall: null,
//   //       outgoingCall: null,
//   //     });
//   //   });

//   //   /* 🔵 ANSWER RECEIVED (caller side) */
//   //   socket.on("webrtc-answer", async ({ answer }) => {
//   //     const { pc } = get();
//   //     if (pc) await pc.setRemoteDescription(answer);

//   //     set({
//   //       isCalling: true,
//   //       outgoingCall: null,
//   //     });
//   //   });

//   //   /* 🔵 ICE */
//   //   socket.on("webrtc-ice", async ({ candidate }) => {
//   //     const { pc } = get();
//   //     if (pc && candidate) {
//   //       await pc.addIceCandidate(candidate);
//   //     }
//   //   });
//   // },
//  subscribeToCalls: () => {
//     const socket = useAuthStore.getState().socket;
//     if (!socket) return;

//     socket.off("incoming-call");
//     socket.off("webrtc-offer");
//     socket.off("webrtc-answer");
//     socket.off("webrtc-ice");
//     socket.off("call-ended");

//     /* 🔔 INCOMING */
//     socket.on("incoming-call", ({ from, callType }) => {
//       set({
//         incomingCall: { from, callType },
//         isCalling: false,
//       });
//     });

//     /* 🔴 END */
//    socket.on("call-ended", () => {
//   console.log("🔥 CALL ENDED RECEIVED ON B");
//   get().endCall(false);
// });
//     /* 🔵 OFFER RECEIVE */
//     socket.on("webrtc-offer", async ({ from, offer }) => {
//       const socket = useAuthStore.getState().socket;

//       const pc = createPeerConnection();

//       const stream = await navigator.mediaDevices.getUserMedia({
//         video: true,
//         audio: true,
//       });

//       stream.getTracks().forEach((t) => pc.addTrack(t, stream));

//       const remoteStream = new MediaStream();

//       pc.ontrack = (e) => {
//         e.streams[0].getTracks().forEach((t) => remoteStream.addTrack(t));
//         set({ remoteStream });
//       };

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

//       socket.emit("webrtc-answer", { to: from, answer });

//       set({
//         pc,
//         localStream: stream,
//         remoteStream,
//         isCalling: true,
//         incomingCall: null,
//       });
//     });

//     /* 🔵 ANSWER */
//     socket.on("webrtc-answer", async ({ answer }) => {
//       const { pc } = get();
//       if (pc) await pc.setRemoteDescription(answer);

//       set({
//         isCalling: true,
//         outgoingCall: null,
//       });
//     });

//     /* 🔵 ICE */
//     socket.on("webrtc-ice", async ({ candidate }) => {
//       const { pc } = get();
//       if (pc && candidate) {
//         await pc.addIceCandidate(candidate);
//       }
//     });
//   },
//   /* ================= START CALL ================= */
//   // startCall: async (callType) => {
//   //   const socket = useAuthStore.getState().socket;
//   //   const { selectedUser } = get();

//   //   if (!socket || !selectedUser) return;

//   //   const pc = createPeerConnection();

//   //   const stream = await navigator.mediaDevices.getUserMedia({
//   //     video: callType === "video",
//   //     audio: true,
//   //   });

//   //   stream.getTracks().forEach((t) => pc.addTrack(t, stream));

//   //   const remoteStream = new MediaStream();

//   //   pc.ontrack = (e) => {
//   //     e.streams[0].getTracks().forEach((t) => remoteStream.addTrack(t));
//   //     set({ remoteStream });
//   //   };

//   //   pc.onicecandidate = (e) => {
//   //     if (e.candidate) {
//   //       socket.emit("webrtc-ice", {
//   //         to: selectedUser._id,
//   //         candidate: e.candidate,
//   //       });
//   //     }
//   //   };

//   //   // ✅ OFFER FROM CALLER
//   //   const offer = await pc.createOffer();
//   //   await pc.setLocalDescription(offer);

//   //   socket.emit("webrtc-offer", {
//   //     to: selectedUser._id,
//   //     offer,
//   //   });

//   //   socket.emit("call-user", {
//   //     to: selectedUser._id,
//   //     callType,
//   //   });

//   //   set({
//   //     pc,
//   //     localStream: stream,
//   //     remoteStream,
//   //     outgoingCall: {
//   //       to: selectedUser._id,
//   //       callType,
//   //     },
//   //   });
//   // },

//   // /* ================= ACCEPT CALL ================= */
//   // acceptCall: () => {
//   //   set({
//   //     incomingCall: null,
//   //     isCalling: true,
//   //   });
//   // },
// /* ================= START CALL ================= */
//  startCall: (callType) => {
//   const socket = useAuthStore.getState().socket;
//   const { selectedUser } = get();

//   if (!socket || !selectedUser) return;

//   socket.emit("call-user", {
//     to: selectedUser._id,
//     callType,
//   });

//   set({
//     outgoingCall: {
//       to: selectedUser._id,
//       callType,
//     },
//   });
// },

//   /* ================= ACCEPT CALL ================= */
//  acceptCall: async () => {
//   const socket = useAuthStore.getState().socket;
//   const { incomingCall } = get();

//   if (!socket || !incomingCall) return;

//   const pc = createPeerConnection();

//   const stream = await navigator.mediaDevices.getUserMedia({
//     video: incomingCall.callType === "video",
//     audio: true,
//   });

//   stream.getTracks().forEach((t) => pc.addTrack(t, stream));

//   pc.onicecandidate = (e) => {
//     if (e.candidate) {
//       socket.emit("webrtc-ice", {
//         to: incomingCall.from,
//         candidate: e.candidate,
//       });
//     }
//   };

//   // ✅ OFFER ONLY HERE
//   const offer = await pc.createOffer();
//   await pc.setLocalDescription(offer);

//   socket.emit("webrtc-offer", {
//     to: incomingCall.from,
//     offer,
//   });

//   set({
//     pc,
//     localStream: stream,
//     isCalling: true,
//     incomingCall: null,
//   });
// },
  
 
//   /* ================= REJECT ================= */
//   rejectCall: () => {
//     const socket = useAuthStore.getState().socket;
//     const { incomingCall } = get();

//     if (socket && incomingCall) {
//       socket.emit("end-call", { to: incomingCall.from });
//     }

//     set({
//       incomingCall: null,
//       isCalling: false,
//     });
//   },

//   /* ================= CANCEL ================= */
//   cancelOutgoingCall: () => {
//     const socket = useAuthStore.getState().socket;
//     const { outgoingCall } = get();

//     if (socket && outgoingCall) {
//       socket.emit("end-call", { to: outgoingCall.to });
//     }

//     set({
//       outgoingCall: null,
//       isCalling: false,
//     });
//   },

//   /* ================= END CALL ================= */
//   // endCall: (notify = true) => {
//   //   const socket = useAuthStore.getState().socket;
//   //   const { localStream, pc, selectedUser, incomingCall, outgoingCall } = get();

//   //   if (localStream) {
//   //     localStream.getTracks().forEach((t) => t.stop());
//   //   }

//   //   if (pc) pc.close();

//   //   const targetUser =
//   //     selectedUser?._id ||
//   //     incomingCall?.from ||
//   //     outgoingCall?.to;

//   //   if (notify && socket && targetUser) {
//   //     socket.emit("end-call", { to: targetUser });
//   //   }

//   //   set({
//   //     localStream: null,
//   //     remoteStream: null,
//   //     pc: null,
//   //     isCalling: false,
//   //     incomingCall: null,
//   //     outgoingCall: null,
//   //     isMicOn: true,
//   //     isCameraOn: true,
//   //   });
//   // },
// endCall: (notify = true) => {
//   const socket = useAuthStore.getState().socket;
//   const { pc, localStream, incomingCall, outgoingCall } = get();

//   // stop media
//   if (localStream) {
//     localStream.getTracks().forEach((t) => t.stop());
//   }

//   // close peer
//   if (pc) {
//     pc.close();
//   }

//   // notify other user
//   const target =
//     incomingCall?.from ||
//     outgoingCall?.to;

//   if (notify && socket && target) {
//     socket.emit("end-call", { to: target });
//   }

//   // 🔥 VERY IMPORTANT RESET
//   set({
//     pc: null,
//     localStream: null,
//     remoteStream: null,
//     incomingCall: null,
//     outgoingCall: null,
//     isCalling: false,
//   });
// },
//   /* ================= MIC ================= */
//   toggleMic: () => {
//     const { localStream, isMicOn } = get();
//     localStream?.getAudioTracks().forEach((t) => {
//       t.enabled = !isMicOn;
//     });
//     set({ isMicOn: !isMicOn });
//   },

//   /* ================= CAMERA ================= */
//   toggleCamera: () => {
//     const { localStream, isCameraOn } = get();
//     localStream?.getVideoTracks().forEach((t) => {
//       t.enabled = !isCameraOn;
//     });
//     set({ isCameraOn: !isCameraOn });
//   },

//   setSelectedUser: (u) => set({ selectedUser: u, messages: [] }),
// }));



// /* ================= WEBRTC ================= */

// // export const useChatStore = create((set, get) => ({
// //   users: [],
// //   messages: [],
// //   selectedUser: null,

// //   outgoingCall: null,
// //   incomingCall: null,
// //   isCalling: false,

// //   pc: null,
// //   localStream: null,
// //   remoteStream: null,

// //   /* ================= SOCKET ================= */
// //   subscribeToCalls: () => {
// //     const socket = useAuthStore.getState().socket;
// //     if (!socket) return;

// //     socket.off("incoming-call");
// //     socket.off("webrtc-offer");
// //     socket.off("webrtc-answer");
// //     socket.off("webrtc-ice");
// //     socket.off("call-ended");

// //     /* 🔔 INCOMING */
// //     socket.on("incoming-call", ({ from, callType }) => {
// //       set({
// //         incomingCall: { from, callType },
// //         isCalling: false,
// //       });
// //     });

// //     /* 🔴 END */
// //     socket.on("call-ended", () => {
// //       get().endCall(false);
// //     });

// //     /* 🔵 OFFER RECEIVE */
// //     socket.on("webrtc-offer", async ({ from, offer }) => {
// //       const socket = useAuthStore.getState().socket;

// //       const pc = createPeerConnection();

// //       const stream = await navigator.mediaDevices.getUserMedia({
// //         video: true,
// //         audio: true,
// //       });

// //       stream.getTracks().forEach((t) => pc.addTrack(t, stream));

// //       const remoteStream = new MediaStream();

// //       pc.ontrack = (e) => {
// //         e.streams[0].getTracks().forEach((t) => remoteStream.addTrack(t));
// //         set({ remoteStream });
// //       };

// //       pc.onicecandidate = (e) => {
// //         if (e.candidate) {
// //           socket.emit("webrtc-ice", {
// //             to: from,
// //             candidate: e.candidate,
// //           });
// //         }
// //       };

// //       await pc.setRemoteDescription(offer);

// //       const answer = await pc.createAnswer();
// //       await pc.setLocalDescription(answer);

// //       socket.emit("webrtc-answer", { to: from, answer });

// //       set({
// //         pc,
// //         localStream: stream,
// //         remoteStream,
// //         isCalling: true,
// //         incomingCall: null,
// //       });
// //     });

// //     /* 🔵 ANSWER */
// //     socket.on("webrtc-answer", async ({ answer }) => {
// //       const { pc } = get();
// //       if (pc) await pc.setRemoteDescription(answer);

// //       set({
// //         isCalling: true,
// //         outgoingCall: null,
// //       });
// //     });

// //     /* 🔵 ICE */
// //     socket.on("webrtc-ice", async ({ candidate }) => {
// //       const { pc } = get();
// //       if (pc && candidate) {
// //         await pc.addIceCandidate(candidate);
// //       }
// //     });
// //   },

// //   /* ================= START CALL ================= */
// //   startCall: (callType) => {
// //     const socket = useAuthStore.getState().socket;
// //     const { selectedUser } = get();

// //     if (!socket || !selectedUser) return;

// //     // ❌ NO OFFER HERE

// //     socket.emit("call-user", {
// //       to: selectedUser._id,
// //       callType,
// //     });

// //     set({
// //       outgoingCall: {
// //         to: selectedUser._id,
// //         callType,
// //       },
// //     });
// //   },

// //   /* ================= ACCEPT CALL ================= */
// //   acceptCall: async () => {
// //     const socket = useAuthStore.getState().socket;
// //     const { incomingCall } = get();

// //     if (!socket || !incomingCall) return;

// //     const pc = createPeerConnection();

// //     const stream = await navigator.mediaDevices.getUserMedia({
// //       video: incomingCall.callType === "video",
// //       audio: true,
// //     });

// //     stream.getTracks().forEach((t) => pc.addTrack(t, stream));

// //     const remoteStream = new MediaStream();

// //     pc.ontrack = (e) => {
// //       e.streams[0].getTracks().forEach((t) => remoteStream.addTrack(t));
// //       set({ remoteStream });
// //     };

// //     pc.onicecandidate = (e) => {
// //       if (e.candidate) {
// //         socket.emit("webrtc-ice", {
// //           to: incomingCall.from,
// //           candidate: e.candidate,
// //         });
// //       }
// //     };

// //     // ✅ OFFER ONLY HERE
// //     const offer = await pc.createOffer();
// //     await pc.setLocalDescription(offer);

// //     socket.emit("webrtc-offer", {
// //       to: incomingCall.from,
// //       offer,
// //     });

// //     set({
// //       pc,
// //       localStream: stream,
// //       remoteStream,
// //       isCalling: true,
// //       incomingCall: null,
// //     });
// //   },

// //   /* ================= END ================= */
// //   endCall: (notify = true) => {
// //     const socket = useAuthStore.getState().socket;
// //     const { pc, localStream, incomingCall, outgoingCall } = get();

// //     localStream?.getTracks().forEach((t) => t.stop());
// //     pc?.close();

// //     const target =
// //       incomingCall?.from ||
// //       outgoingCall?.to;

// //     if (notify && socket && target) {
// //       socket.emit("end-call", { to: target });
// //     }

// //     set({
// //       pc: null,
// //       localStream: null,
// //       remoteStream: null,
// //       isCalling: false,
// //       incomingCall: null,
// //       outgoingCall: null,
// //     });
// //   },
// // }));



// // import { create } from "zustand";
// // import { axiosInstance } from "../lib/axios";
// // import { useAuthStore } from "./useAuthStore";

// // /* ================= WEBRTC HELPER ================= */
// // const createPeerConnection = () =>
// //   new RTCPeerConnection({
// //     iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
// //   });

// // export const useChatStore = create((set, get) => ({
// //   /* ================= STATE ================= */
// //   users: [],
// //   messages: [],
// //   selectedUser: null,

// //   outgoingCall: null,
// //   incomingCall: null,
// //   isCalling: false,

// //   pc: null,
// //   localStream: null,
// //   remoteStream: null,

// //   isMicOn: true,
// //   isCameraOn: true,

// //   /* ================= USERS ================= */
// //   getUsers: async () => {
// //     const res = await axiosInstance.get("/messages/users");
// //     set({ users: res.data });
// //   },

// //   /* ================= MESSAGES ================= */
// //   getMessages: async (id) => {
// //     const res = await axiosInstance.get(`/messages/${id}`);
// //     set({ messages: res.data });
// //   },

// //   sendMessage: async (data) => {
// //     const { selectedUser } = get();
// //     if (!selectedUser) return;

// //     const res = await axiosInstance.post(
// //       `/messages/send/${selectedUser._id}`,
// //       data
// //     );

// //     set((s) => ({ messages: [...s.messages, res.data] }));
// //   },

// //   /* ================= MESSAGE SOCKET ================= */
// //   subscribeToMessages: () => {
// //     const socket = useAuthStore.getState().socket;
// //     if (!socket) return;

// //     socket.off("newMessage");

// //     socket.on("newMessage", (msg) => {
// //       set((s) => ({ messages: [...s.messages, msg] }));
// //     });
// //   },

// //   unsubscribeFromMessages: () => {
// //     useAuthStore.getState().socket?.off("newMessage");
// //   },

// //   /* ================= CALL SOCKET ================= */
// //   subscribeToCalls: () => {
// //     const socket = useAuthStore.getState().socket;
// //     if (!socket) return;

// //     socket.off("incoming-call");
// //     socket.off("webrtc-offer");
// //     socket.off("webrtc-answer");
// //     socket.off("webrtc-ice");
// //     socket.off("call-ended");

// //     /* 🔔 INCOMING CALL */
// //     socket.on("incoming-call", ({ from, callType }) => {
// //       set({
// //         incomingCall: { from, callType },
// //         isCalling: true,
// //       });
// //     });

// //     /* 🔴 CALL ENDED */
// //     socket.on("call-ended", () => {
// //       get().endCall(false);
// //     });

// //     /* 🔵 OFFER */
// //     socket.on("webrtc-offer", async ({ from, offer }) => {
// //       const pc = createPeerConnection();

// //       const stream = await navigator.mediaDevices.getUserMedia({
// //         video: true,
// //         audio: true,
// //       });

// //       stream.getTracks().forEach((t) => pc.addTrack(t, stream));

// //       const remoteStream = new MediaStream();

// //       pc.ontrack = (e) => {
// //         e.streams[0].getTracks().forEach((t) => remoteStream.addTrack(t));
// //         set({ remoteStream });
// //       };

// //       pc.onicecandidate = (e) => {
// //         if (e.candidate) {
// //           socket.emit("webrtc-ice", {
// //             to: from,
// //             candidate: e.candidate,
// //           });
// //         }
// //       };

// //       await pc.setRemoteDescription(offer);

// //       const answer = await pc.createAnswer();
// //       await pc.setLocalDescription(answer);

// //       socket.emit("webrtc-answer", { to: from, answer });

// //       set({
// //         pc,
// //         localStream: stream,
// //         remoteStream,
// //         isCalling: true,
// //         incomingCall: null,
// //         outgoingCall: null,
// //       });
// //     });

// //     /* 🔵 ANSWER */
// //     socket.on("webrtc-answer", async ({ answer }) => {
// //       const { pc } = get();
// //       if (pc) await pc.setRemoteDescription(answer);

// //       set({
// //         outgoingCall: null,
// //         isCalling: true,
// //       });
// //     });

// //     /* 🔵 ICE */
// //     socket.on("webrtc-ice", async ({ candidate }) => {
// //       const { pc } = get();
// //       if (pc && candidate) {
// //         await pc.addIceCandidate(candidate);
// //       }
// //     });
// //   },

// //   /* ================= START CALL ================= */
// //   startCall: (callType) => {
// //     const socket = useAuthStore.getState().socket;
// //     const { selectedUser } = get();

// //     if (!socket || !selectedUser) return;

// //     socket.emit("call-user", {
// //       to: selectedUser._id,
// //       callType,
// //     });

// //     set({
// //       outgoingCall: {
// //         to: selectedUser._id,
// //         callType,
// //       },
      
// //     });
// //   },

// //   /* ================= ACCEPT CALL ================= */
// //   acceptCall: async () => {
// //     const socket = useAuthStore.getState().socket;
// //     const { incomingCall } = get();

// //     if (!socket || !incomingCall) return;

// //     const pc = createPeerConnection();

// //     const stream = await navigator.mediaDevices.getUserMedia({
// //       video: incomingCall.callType === "video",
// //       audio: true,
// //     });

// //     stream.getTracks().forEach((t) => pc.addTrack(t, stream));

// //     const remoteStream = new MediaStream();

// //     pc.ontrack = (e) => {
// //       e.streams[0].getTracks().forEach((t) => remoteStream.addTrack(t));
// //       set({ remoteStream });
// //     };

// //     pc.onicecandidate = (e) => {
// //       if (e.candidate) {
// //         socket.emit("webrtc-ice", {
// //           to: incomingCall.from,
// //           candidate: e.candidate,
// //         });
// //       }
// //     };

// //     const offer = await pc.createOffer();
// //     await pc.setLocalDescription(offer);

// //     socket.emit("webrtc-offer", {
// //       to: incomingCall.from,
// //       offer,
// //     });

// //     set({
// //       pc,
// //       localStream: stream,
// //       remoteStream,
// //       isCalling: true,
// //       incomingCall: null,
// //       outgoingCall: null,
// //     });
// //   },

// //   /* ================= REJECT CALL ================= */
// //   rejectCall: () => {
// //     const socket = useAuthStore.getState().socket;
// //     const { incomingCall } = get();

// //     if (socket && incomingCall) {
// //       socket.emit("end-call", { to: incomingCall.from });
// //     }

// //     set({
// //       incomingCall: null,
// //       isCalling: false,
// //     });
// //   },

// //   /* ================= CANCEL OUTGOING CALL ================= */
// //   cancelOutgoingCall: () => {
// //     const socket = useAuthStore.getState().socket;
// //     const { outgoingCall } = get();

// //     if (socket && outgoingCall) {
// //       socket.emit("end-call", { to: outgoingCall.to });
// //     }

// //     set({
// //       outgoingCall: null,
// //       isCalling: false,
// //     });
// //   },

// //   /* ================= END CALL ================= */
// //   endCall: (notify = true) => {
// //     const socket = useAuthStore.getState().socket;
// //     const { localStream, pc, selectedUser, incomingCall, outgoingCall } = get();

// //     if (localStream) {
// //       localStream.getTracks().forEach((t) => t.stop());
// //     }

// //     if (pc) {
// //       pc.close();
// //     }

// //     const targetUser =
// //       selectedUser?._id ||
// //       incomingCall?.from ||
// //       outgoingCall?.to;

// //     if (notify && socket && targetUser) {
// //       socket.emit("end-call", { to: targetUser });
// //     }

// //     set({
// //       localStream: null,
// //       remoteStream: null,
// //       pc: null,
// //       isCalling: false,
// //       incomingCall: null,
// //       outgoingCall: null,
// //       isMicOn: true,
// //       isCameraOn: true,
// //     });
// //   },

// //   /* ================= MIC ================= */
// //   toggleMic: () => {
// //     const { localStream, isMicOn } = get();
// //     localStream?.getAudioTracks().forEach((t) => {
// //       t.enabled = !isMicOn;
// //     });
// //     set({ isMicOn: !isMicOn });
// //   },

// //   /* ================= CAMERA ================= */
// //   toggleCamera: () => {
// //     const { localStream, isCameraOn } = get();
// //     localStream?.getVideoTracks().forEach((t) => {
// //       t.enabled = !isCameraOn;
// //     });
// //     set({ isCameraOn: !isCameraOn });
// //   },

// //   setSelectedUser: (u) => set({ selectedUser: u, messages: [] }),
// // }));
