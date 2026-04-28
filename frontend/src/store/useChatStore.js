

import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

/* ================= WEBRTC ================= */

function createPeerConnection() {
  return new RTCPeerConnection({
    iceServers: [
      { urls: "stun:bn-turn2.xirsys.com" },
      {
        username: "AuE3lrc4GsAXUBJMY_T206wG0iaf0E-dYgG87eaPoYjGnlv82V4uPX4bjQ7TuewDAAAAAGnu8QRBbnVyYWcwNg==",
        credential: "26c1b0e4-41f8-11f1-b981-0242ac140004",
        urls: [
          "turn:bn-turn2.xirsys.com:80?transport=udp",
          "turn:bn-turn2.xirsys.com:3478?transport=udp",
          "turn:bn-turn2.xirsys.com:80?transport=tcp",
          "turn:bn-turn2.xirsys.com:3478?transport=tcp",
          "turns:bn-turn2.xirsys.com:443?transport=tcp",
          "turns:bn-turn2.xirsys.com:5349?transport=tcp",
        ],
      },
    ],
    iceCandidatePoolSize: 10,
  });
}

function mergeRemoteTrack(get, set, e) {
  console.log("[ontrack] fired", e.track?.kind, "streams:", e.streams?.length);
  let tracks = [];
  if (e.streams && e.streams[0]) {
    tracks = e.streams[0].getTracks();
  } else if (e.track) {
    const prev = get().remoteStream;
    const existing = prev ? prev.getTracks() : [];
    tracks = [...existing.filter((t) => t.id !== e.track.id), e.track];
  }
  if (tracks.length === 0) return;
  const newStream = new MediaStream(tracks);
  console.log("[ontrack] setting remoteStream tracks:", tracks.map((t) => t.kind));
  set({ remoteStream: newStream });
}

function normalizeIceCandidate(candidate) {
  if (!candidate) return null;
  return candidate instanceof RTCIceCandidate
    ? candidate
    : new RTCIceCandidate(candidate);
}

function getLocalVideoConstraints() {
  const portrait =
    typeof window !== "undefined" &&
    window.matchMedia?.("(orientation: portrait)")?.matches;
  return {
    facingMode: "user",
    ...(portrait
      ? { width: { ideal: 720 }, height: { ideal: 1280 } }
      : { width: { ideal: 1280 }, height: { ideal: 720 } }),
  };
}

async function getCallMediaStream(callType) {
  try {
    return await navigator.mediaDevices.getUserMedia({
      video: callType === "video" ? getLocalVideoConstraints() : false,
      audio: true,
    });
  } catch (firstErr) {
    console.warn("getUserMedia (ideal) failed, retrying basic:", firstErr);
    return await navigator.mediaDevices.getUserMedia({
      video: callType === "video",
      audio: true,
    });
  }
}

export const useChatStore = create((set, get) => ({
  users: [],
  messages: [],
  selectedUser: null,
  isMessagesLoading: false,
  isUsersLoading: false,

  outgoingCall: null,
  incomingCall: null,
  pendingOffer: null,
  iceCandidateQueue: [],
  isCalling: false,
  callActive: false, // ✅ NEW: true hote hi koi bhi naya offer/reset block hoga

  callWith: null,
  pc: null,
  localStream: null,
  remoteStream: null,
  isMicOn: true,
  isCameraOn: true,

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (e) { console.error(e); }
    finally { set({ isUsersLoading: false }); }
  },

  getMessages: async (id) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${id}`);
      set({ messages: res.data });
    } catch (e) { console.error(e); }
    finally { set({ isMessagesLoading: false }); }
  },

  sendMessage: async (data) => {
    const { selectedUser } = get();
    if (!selectedUser) return;
    await axiosInstance.post(`/messages/send/${selectedUser._id}`, data);
  },

  subscribeToMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;
    socket.off("newMessage");
    socket.on("newMessage", (msg) => {
      set((state) => {
        if (state.messages.some((m) => m._id === msg._id)) return state;
        return { messages: [...state.messages, msg] };
      });
    });
  },

  unsubscribeFromMessages: () => {
    useAuthStore.getState().socket?.off("newMessage");
  },

  subscribeToCalls: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.off("incoming-call");
    socket.off("webrtc-offer");
    socket.off("webrtc-answer");
    socket.off("webrtc-ice");
    socket.off("call-ended");

    socket.on("incoming-call", ({ from, callType }) => {
      if (get().callActive) return; // ignore if already in call
      set({ incomingCall: { from, callType }, callWith: from });
    });

    socket.on("call-ended", () => {
      get().endCall(false);
    });

    /* ===== RECEIVER ===== */
    socket.on("webrtc-offer", async ({ from, offer, callType }) => {
      const resolvedType = callType || "video";
      const state = get();

      // ✅ BLOCK if already in active call
      if (state.callActive) {
        console.log("[webrtc-offer] BLOCKED — callActive true");
        return;
      }
      // ✅ BLOCK duplicate from same caller
      if (state.pendingOffer && state.pendingOffer.from === from) {
        console.log("[webrtc-offer] BLOCKED — duplicate from same caller");
        return;
      }
      // ✅ BLOCK if pc already connected
      if (state.pc && ["connected", "connecting"].includes(state.pc.connectionState)) {
        console.log("[webrtc-offer] BLOCKED — pc already", state.pc.connectionState);
        return;
      }

      if (state.pc) { try { state.pc.close(); } catch {} }

      const pc = createPeerConnection();
      pc.ontrack = (e) => mergeRemoteTrack(get, set, e);
      pc.onicecandidate = (e) => {
        if (!e.candidate) return;
        socket.emit("webrtc-ice", {
          to: from,
          candidate: e.candidate.toJSON ? e.candidate.toJSON() : e.candidate,
        });
      };
      pc.onconnectionstatechange = () =>
        console.log("[Receiver] Connection state:", pc.connectionState);
      pc.onicegatheringstatechange = () =>
        console.log("[Receiver] ICE gathering:", pc.iceGatheringState);

      try {
        await pc.setRemoteDescription(
          offer instanceof RTCSessionDescription ? offer : new RTCSessionDescription(offer)
        );
      } catch (e) {
        console.error("setRemoteDescription failed:", e);
        try { pc.close(); } catch {}
        return;
      }

      set({
        pc,
        remoteStream: null,
        localStream: null,
        incomingCall: { from, callType: resolvedType },
        pendingOffer: { from, callType: resolvedType },
        iceCandidateQueue: [],
        outgoingCall: null,
        callWith: from,
        isCalling: false,
        callActive: false,
        isMicOn: true,
        isCameraOn: resolvedType === "video",
      });
    });

    /* ===== CALLER ===== */
    socket.on("webrtc-answer", async ({ answer }) => {
      const { pc, callActive } = get();
      if (!pc) return;
      if (callActive) {
        console.log("[webrtc-answer] BLOCKED — callActive true");
        return;
      }
      if (pc.signalingState === "stable" && pc.remoteDescription) return;
      if (pc.signalingState !== "have-local-offer") return;

      try {
        await pc.setRemoteDescription(
          answer instanceof RTCSessionDescription ? answer : new RTCSessionDescription(answer)
        );
      } catch (e) {
        if (e?.name === "InvalidStateError" && pc.signalingState === "stable") return;
        console.error("webrtc-answer failed:", e);
        return;
      }

      // ✅ callActive = true — ab kuch bhi reset nahi karega
      set({ isCalling: true, callActive: true, outgoingCall: null });
    });

    socket.on("webrtc-ice", async ({ candidate }) => {
      const ci = normalizeIceCandidate(candidate);
      if (!ci) return;
      const { pc } = get();
      if (pc && pc.remoteDescription) {
        try { await pc.addIceCandidate(ci); }
        catch (e) { console.warn("ICE add error:", e); }
      } else {
        set((s) => ({ iceCandidateQueue: [...(s.iceCandidateQueue || []), ci] }));
      }
    });
  },

  startCall: async (callType = "video") => {
    const socket = useAuthStore.getState().socket;
    const { selectedUser } = get();
    if (!socket || !selectedUser) return;

    if (get().callActive) {
      console.log("[startCall] BLOCKED — callActive true");
      return;
    }

    if (get().pc || get().localStream) get().endCall(false);
    set({ remoteStream: null, isMicOn: true, isCameraOn: callType === "video" });

    const pc = createPeerConnection();
    let stream;
    try {
      stream = await getCallMediaStream(callType);
    } catch (e) {
      console.error("getUserMedia failed:", e);
      pc.close();
      return;
    }

    stream.getTracks().forEach((t) => pc.addTrack(t, stream));
    pc.ontrack = (e) => mergeRemoteTrack(get, set, e);
    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit("webrtc-ice", {
          to: selectedUser._id,
          candidate: e.candidate.toJSON ? e.candidate.toJSON() : e.candidate,
        });
      }
    };
    pc.onconnectionstatechange = () =>
      console.log("[Caller] Connection state:", pc.connectionState);
    pc.onicegatheringstatechange = () =>
      console.log("[Caller] ICE gathering:", pc.iceGatheringState);

    const offer = await pc.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: callType === "video",
    });
    await pc.setLocalDescription(offer);

    set({
      pc, localStream: stream, remoteStream: null,
      outgoingCall: { to: selectedUser._id, callType },
      callWith: selectedUser._id,
    });

    socket.emit("call-user", { to: selectedUser._id, callType });
    socket.emit("webrtc-offer", {
      to: selectedUser._id,
      offer: { type: offer.type, sdp: offer.sdp },
      callType,
    });
  },

  acceptCall: async () => {
    const socket = useAuthStore.getState().socket;
    const { pendingOffer, incomingCall, pc: existingPc } = get();

    if (!socket || !pendingOffer) {
      set({ incomingCall: null, pendingOffer: null });
      return;
    }

    const { from } = pendingOffer;
    const callType = incomingCall?.callType ?? pendingOffer.callType ?? "video";
    const pc = existingPc || createPeerConnection();
    if (!existingPc) set({ pc });

    let stream;
    try {
      stream = await getCallMediaStream(callType);
    } catch (e) {
      console.error("getUserMedia failed on acceptCall:", e);
      try { pc.close(); } catch {}
      get().rejectCall();
      return;
    }

    stream.getTracks().forEach((t) => pc.addTrack(t, stream));

    try {
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("webrtc-answer", {
        to: from,
        answer: { type: answer.type, sdp: answer.sdp },
      });

      const queued = get().iceCandidateQueue || [];
      for (const c of queued) {
        try { await pc.addIceCandidate(normalizeIceCandidate(c)); }
        catch (e) { console.warn("ICE flush error:", e); }
      }
    } catch (e) {
      console.error("acceptCall createAnswer failed:", e);
      get().rejectCall();
      return;
    }

    // ✅ callActive = true — receiver side par bhi lock ho gaya
    set({
      pc, localStream: stream,
      isCalling: true, callActive: true,
      incomingCall: null, pendingOffer: null,
      iceCandidateQueue: [], callWith: from, outgoingCall: null,
    });
  },

  rejectCall: () => {
    const socket = useAuthStore.getState().socket;
    const { incomingCall, pendingOffer, pc, localStream } = get();
    const target = incomingCall?.from ?? pendingOffer?.from;
    if (socket && target) socket.emit("end-call", { to: target });
    if (localStream) localStream.getTracks().forEach((t) => t.stop());
    if (pc) { try { pc.close(); } catch {} }
    set({
      pc: null, localStream: null, remoteStream: null,
      incomingCall: null, pendingOffer: null, iceCandidateQueue: [],
      outgoingCall: null, callWith: null, isCalling: false, callActive: false,
    });
  },

  cancelOutgoingCall: () => get().endCall(true),

  endCall: (notify = true) => {
    const socket = useAuthStore.getState().socket;
    const { pc, localStream, callWith } = get();
    if (localStream) localStream.getTracks().forEach((t) => t.stop());
    if (pc) { try { pc.close(); } catch {} }
    if (notify && socket && callWith) socket.emit("end-call", { to: callWith });
    set({
      pc: null, localStream: null, remoteStream: null,
      incomingCall: null, pendingOffer: null, iceCandidateQueue: [],
      outgoingCall: null, callWith: null,
      isCalling: false, callActive: false,
      isMicOn: true, isCameraOn: true,
    });
  },

  toggleMic: () => {
    const { localStream, isMicOn } = get();
    localStream?.getAudioTracks().forEach((t) => { t.enabled = !isMicOn; });
    set({ isMicOn: !isMicOn });
  },

  toggleCamera: () => {
    const { localStream, isCameraOn } = get();
    localStream?.getVideoTracks().forEach((t) => { t.enabled = !isCameraOn; });
    set({ isCameraOn: !isCameraOn });
  },

  setSelectedUser: (u) => set({ selectedUser: u, messages: [] }),
}));










// import { create } from "zustand";
// import { axiosInstance } from "../lib/axios";
// import { useAuthStore } from "./useAuthStore";

// /* ================= WEBRTC ================= */

// /**
//  * ✅ FIXED: Xirsys TURN server — reliable, free, no credit card
//  */
// function createPeerConnection() {
//   return new RTCPeerConnection({
//     iceServers: [
//       // STUN
//       { urls: "stun:bn-turn2.xirsys.com" },
//       // TURN — Xirsys credentials
//       {
//         username: "AuE3lrc4GsAXUBJMY_T206wG0iaf0E-dYgG87eaPoYjGnlv82V4uPX4bjQ7TuewDAAAAAGnu8QRBbnVyYWcwNg==",
//         credential: "26c1b0e4-41f8-11f1-b981-0242ac140004",
//         urls: [
//           "turn:bn-turn2.xirsys.com:80?transport=udp",
//           "turn:bn-turn2.xirsys.com:3478?transport=udp",
//           "turn:bn-turn2.xirsys.com:80?transport=tcp",
//           "turn:bn-turn2.xirsys.com:3478?transport=tcp",
//           "turns:bn-turn2.xirsys.com:443?transport=tcp",
//           "turns:bn-turn2.xirsys.com:5349?transport=tcp",
//         ],
//       },
//     ],
//     iceCandidatePoolSize: 10,
//   });
// }

// /**
//  * ✅ FIXED: Use e.streams[0] directly instead of manually merging tracks.
//  * This is more reliable and works correctly on mobile browsers.
//  */
// function mergeRemoteTrack(get, set, e) {
//   if (e.streams && e.streams[0]) {
//     // Best case: full stream already available
//     set({ remoteStream: e.streams[0] });
//   } else if (e.track) {
//     // Fallback: build stream from individual tracks
//     const prev = get().remoteStream;
//     const existing = prev ? prev.getTracks() : [];
//     const tracks = [...existing.filter((t) => t.id !== e.track.id), e.track];
//     set({ remoteStream: new MediaStream(tracks) });
//   }
// }

// function normalizeIceCandidate(candidate) {
//   if (!candidate) return null;
//   return candidate instanceof RTCIceCandidate
//     ? candidate
//     : new RTCIceCandidate(candidate);
// }

// /** Prefer portrait capture on phones so remote desktop does not show a sideways frame. */
// function getLocalVideoConstraints() {
//   const portrait =
//     typeof window !== "undefined" &&
//     window.matchMedia?.("(orientation: portrait)")?.matches;
//   return {
//     facingMode: "user",
//     ...(portrait
//       ? { width: { ideal: 720 }, height: { ideal: 1280 } }
//       : { width: { ideal: 1280 }, height: { ideal: 720 } }),
//   };
// }

// /** Retry with simple constraints if ideal width/height fails on some devices. */
// async function getCallMediaStream(callType) {
//   try {
//     return await navigator.mediaDevices.getUserMedia({
//       video: callType === "video" ? getLocalVideoConstraints() : false,
//       audio: true,
//     });
//   } catch (firstErr) {
//     console.warn("getUserMedia (ideal) failed, retrying basic:", firstErr);
//     return await navigator.mediaDevices.getUserMedia({
//       video: callType === "video",
//       audio: true,
//     });
//   }
// }

// export const useChatStore = create((set, get) => ({
//   /* ================= STATE ================= */
//   users: [],
//   messages: [],
//   selectedUser: null,
//   isMessagesLoading: false,
//   isUsersLoading: false,

//   outgoingCall: null,
//   incomingCall: null,
//   pendingOffer: null,
//   iceCandidateQueue: [],
//   isCalling: false,

//   callWith: null,

//   pc: null,
//   localStream: null,
//   remoteStream: null,

//   isMicOn: true,
//   isCameraOn: true,

//   /* ================= USERS ================= */
//   getUsers: async () => {
//     set({ isUsersLoading: true });
//     try {
//       const res = await axiosInstance.get("/messages/users");
//       set({ users: res.data });
//     } catch (e) {
//       console.error(e);
//     } finally {
//       set({ isUsersLoading: false });
//     }
//   },

//   /* ================= MESSAGES ================= */
//   getMessages: async (id) => {
//     set({ isMessagesLoading: true });
//     try {
//       const res = await axiosInstance.get(`/messages/${id}`);
//       set({ messages: res.data });
//     } catch (e) {
//       console.error(e);
//     } finally {
//       set({ isMessagesLoading: false });
//     }
//   },

//   sendMessage: async (data) => {
//     const { selectedUser } = get();
//     if (!selectedUser) return;
//     await axiosInstance.post(`/messages/send/${selectedUser._id}`, data);
//   },

//   /* ================= SOCKET (MESSAGES) ================= */
//   subscribeToMessages: () => {
//     const socket = useAuthStore.getState().socket;
//     if (!socket) return;

//     socket.off("newMessage");

//     socket.on("newMessage", (msg) => {
//       set((state) => {
//         if (state.messages.some((m) => m._id === msg._id)) return state;
//         return { messages: [...state.messages, msg] };
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

//     /* 🔔 INCOMING CALL RING */
//     socket.on("incoming-call", ({ from, callType }) => {
//       set({
//         incomingCall: { from, callType },
//         callWith: from,
//       });
//     });

//     /* 🔴 CALL ENDED */
//     socket.on("call-ended", () => {
//       get().endCall(false);
//     });

//     /*
//      * ✅ FIXED RECEIVER FLOW:
//      * - Create pc immediately when offer arrives
//      * - Wire ontrack and onicecandidate before setRemoteDescription
//      * - Queue any ICE candidates that arrive before acceptCall
//      */
//     socket.on("webrtc-offer", async ({ from, offer, callType }) => {
//       const resolvedType = callType || "video";

//       // Clean up any old peer connection
//       const prev = get();
//       if (prev.pc) {
//         try { prev.pc.close(); } catch {}
//       }

//       const pc = createPeerConnection();

//       // ✅ Wire ontrack BEFORE setRemoteDescription
//       pc.ontrack = (e) => mergeRemoteTrack(get, set, e);

//       // ✅ Wire ICE candidate sending
//       pc.onicecandidate = (e) => {
//         if (!e.candidate) return;
//         socket.emit("webrtc-ice", {
//           to: from,
//           candidate: e.candidate.toJSON ? e.candidate.toJSON() : e.candidate,
//         });
//       };

//       // ✅ Log connection state changes for debugging
//       pc.onconnectionstatechange = () => {
//         console.log("[Receiver] Connection state:", pc.connectionState);
//       };
//       pc.onicegatheringstatechange = () => {
//         console.log("[Receiver] ICE gathering:", pc.iceGatheringState);
//       };

//       try {
//         const offerDesc =
//           offer instanceof RTCSessionDescription
//             ? offer
//             : new RTCSessionDescription(offer);
//         await pc.setRemoteDescription(offerDesc);
//       } catch (e) {
//         console.error("setRemoteDescription failed (receiver):", e);
//         try { pc.close(); } catch {}
//         return;
//       }

//       set({
//         pc,
//         remoteStream: null,
//         localStream: null,
//         incomingCall: { from, callType: resolvedType },
//         pendingOffer: { from, callType: resolvedType },
//         iceCandidateQueue: [],
//         outgoingCall: null,
//         callWith: from,
//         isCalling: false,
//         isMicOn: true,
//         isCameraOn: resolvedType === "video",
//       });
//     });

//     /* ================= CALLER: handle answer ================= */
//     socket.on("webrtc-answer", async ({ answer }) => {
//       const { pc } = get();
//       if (!pc) return;

//       if (pc.signalingState === "stable" && pc.remoteDescription) return;
//       if (pc.signalingState !== "have-local-offer") return;

//       const desc =
//         answer instanceof RTCSessionDescription
//           ? answer
//           : new RTCSessionDescription(answer);

//       try {
//         await pc.setRemoteDescription(desc);
//       } catch (e) {
//         if (e?.name === "InvalidStateError" && pc.signalingState === "stable") return;
//         console.error("webrtc-answer failed:", e);
//         return;
//       }

//       set({ isCalling: true, outgoingCall: null });
//     });

//     /* ✅ FIXED: ICE candidate handling with queue flush */
//     socket.on("webrtc-ice", async ({ candidate }) => {
//       const ci = normalizeIceCandidate(candidate);
//       if (!ci) return;
//       const { pc } = get();
//       if (pc && pc.remoteDescription) {
//         try {
//           await pc.addIceCandidate(ci);
//         } catch (e) {
//           console.warn("ICE add error:", e);
//         }
//       } else {
//         // Queue it — pc not ready yet
//         set((s) => ({
//           iceCandidateQueue: [...(s.iceCandidateQueue || []), ci],
//         }));
//       }
//     });
//   },

//   /* ================= START CALL (CALLER) ================= */
//   startCall: async (callType = "video") => {
//     const socket = useAuthStore.getState().socket;
//     const { selectedUser } = get();
//     if (!socket || !selectedUser) return;

//     // Clean up any previous call
//     if (get().pc || get().localStream) {
//       get().endCall(false);
//     }

//     set({ remoteStream: null, isMicOn: true, isCameraOn: callType === "video" });

//     const pc = createPeerConnection();

//     let stream;
//     try {
//       stream = await getCallMediaStream(callType);
//     } catch (e) {
//       console.error("getUserMedia failed:", e);
//       pc.close();
//       return;
//     }

//     // ✅ Add tracks BEFORE creating offer
//     stream.getTracks().forEach((t) => pc.addTrack(t, stream));

//     // ✅ Wire ontrack for receiving remote stream
//     pc.ontrack = (e) => mergeRemoteTrack(get, set, e);

//     pc.onicecandidate = (e) => {
//       if (e.candidate) {
//         socket.emit("webrtc-ice", {
//           to: selectedUser._id,
//           candidate: e.candidate.toJSON ? e.candidate.toJSON() : e.candidate,
//         });
//       }
//     };

//     // ✅ Log connection state changes for debugging
//     pc.onconnectionstatechange = () => {
//       console.log("[Caller] Connection state:", pc.connectionState);
//     };
//     pc.onicegatheringstatechange = () => {
//       console.log("[Caller] ICE gathering:", pc.iceGatheringState);
//     };

//     const offer = await pc.createOffer({
//       offerToReceiveAudio: true,
//       offerToReceiveVideo: callType === "video",
//     });
//     await pc.setLocalDescription(offer);

//     // ✅ Register pc BEFORE emitting signal (so answer handler never sees null pc)
//     set({
//       pc,
//       localStream: stream,
//       remoteStream: null,
//       outgoingCall: { to: selectedUser._id, callType },
//       callWith: selectedUser._id,
//     });

//     socket.emit("call-user", { to: selectedUser._id, callType });
//     socket.emit("webrtc-offer", {
//       to: selectedUser._id,
//       offer: { type: offer.type, sdp: offer.sdp },
//       callType,
//     });
//   },

//   /* ================= ACCEPT CALL (RECEIVER) ================= */
//   acceptCall: async () => {
//     const socket = useAuthStore.getState().socket;
//     const { pendingOffer, incomingCall, pc: existingPc } = get();

//     if (!socket || !pendingOffer) {
//       set({ incomingCall: null, pendingOffer: null });
//       return;
//     }

//     const { from } = pendingOffer;
//     const callType = incomingCall?.callType ?? pendingOffer.callType ?? "video";

//     const pc = existingPc || createPeerConnection();
//     if (!existingPc) set({ pc });

//     let stream;
//     try {
//       stream = await getCallMediaStream(callType);
//     } catch (e) {
//       console.error("getUserMedia failed on acceptCall:", e);
//       try { pc.close(); } catch {}
//       get().rejectCall();
//       return;
//     }

//     // ✅ Add local tracks so caller can see/hear us
//     stream.getTracks().forEach((t) => pc.addTrack(t, stream));

//     try {
//       const answer = await pc.createAnswer();
//       await pc.setLocalDescription(answer);

//       socket.emit("webrtc-answer", {
//         to: from,
//         answer: { type: answer.type, sdp: answer.sdp },
//       });

//       // ✅ Flush queued ICE candidates AFTER setLocalDescription
//       const queued = get().iceCandidateQueue || [];
//       for (const c of queued) {
//         try {
//           await pc.addIceCandidate(normalizeIceCandidate(c));
//         } catch (e) {
//           console.warn("ICE flush error:", e);
//         }
//       }
//     } catch (e) {
//       console.error("acceptCall createAnswer failed:", e);
//       get().rejectCall();
//       return;
//     }

//     set({
//       pc,
//       localStream: stream,
//       isCalling: true,
//       incomingCall: null,
//       pendingOffer: null,
//       iceCandidateQueue: [],
//       callWith: from,
//       outgoingCall: null,
//     });
//   },

//   /* ================= REJECT CALL ================= */
//   rejectCall: () => {
//     const socket = useAuthStore.getState().socket;
//     const { incomingCall, pendingOffer, pc, localStream } = get();
//     const target = incomingCall?.from ?? pendingOffer?.from;

//     if (socket && target) socket.emit("end-call", { to: target });
//     if (localStream) localStream.getTracks().forEach((t) => t.stop());
//     if (pc) { try { pc.close(); } catch {} }

//     set({
//       pc: null,
//       localStream: null,
//       remoteStream: null,
//       incomingCall: null,
//       pendingOffer: null,
//       iceCandidateQueue: [],
//       outgoingCall: null,
//       callWith: null,
//       isCalling: false,
//     });
//   },

//   cancelOutgoingCall: () => get().endCall(true),

//   /* ================= END CALL ================= */
//   endCall: (notify = true) => {
//     const socket = useAuthStore.getState().socket;
//     const { pc, localStream, callWith } = get();

//     if (localStream) localStream.getTracks().forEach((t) => t.stop());
//     if (pc) { try { pc.close(); } catch {} }
//     if (notify && socket && callWith) socket.emit("end-call", { to: callWith });

//     set({
//       pc: null,
//       localStream: null,
//       remoteStream: null,
//       incomingCall: null,
//       pendingOffer: null,
//       iceCandidateQueue: [],
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
//     localStream?.getAudioTracks().forEach((t) => { t.enabled = !isMicOn; });
//     set({ isMicOn: !isMicOn });
//   },

//   /* ================= CAMERA ================= */
//   toggleCamera: () => {
//     const { localStream, isCameraOn } = get();
//     localStream?.getVideoTracks().forEach((t) => { t.enabled = !isCameraOn; });
//     set({ isCameraOn: !isCameraOn });
//   },

//   setSelectedUser: (u) => set({ selectedUser: u, messages: [] }),
// }));





// // import { create } from "zustand";
// // import { axiosInstance } from "../lib/axios";
// // import { useAuthStore } from "./useAuthStore";

// // /* ================= WEBRTC ================= */
// // /** One TURN URL per entry avoids parser quirks; fallback to STUN-only if anything throws. */
// // function createPeerConnection() {
// //   const withTurn = {
// //     iceServers: [
// //       { urls: "stun:stun.l.google.com:19302" },
// //       { urls: "stun:stun1.l.google.com:19302" },
// //       {
// //         urls: "turn:openrelay.metered.ca:80",
// //         username: "openrelayproject",
// //         credential: "openrelayproject",
// //       },
// //       {
// //         urls: "turn:openrelay.metered.ca:443?transport=tcp",
// //         username: "openrelayproject",
// //         credential: "openrelayproject",
// //       },
// //     ],
// //   };
// //   const stunOnly = {
// //     iceServers: [
// //       { urls: "stun:stun.l.google.com:19302" },
// //       { urls: "stun:stun1.l.google.com:19302" },
// //     ],
// //   };
// //   try {
// //     return new RTCPeerConnection(withTurn);
// //   } catch (e) {
// //     console.warn("RTCPeerConnection (STUN+TURN) failed, using STUN only:", e);
// //     try {
// //       return new RTCPeerConnection(stunOnly);
// //     } catch (e2) {
// //       console.warn("RTCPeerConnection (dual STUN) failed:", e2);
// //       return new RTCPeerConnection({
// //         iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
// //       });
// //     }
// //   }
// // }

// // /** New MediaStream each time so Zustand + React see a new reference when tracks arrive. */
// // function mergeRemoteTrack(get, set, e) {
// //   const track = e.track;
// //   if (!track) return;
// //   const prev = get().remoteStream;
// //   const existing = prev ? [...prev.getTracks()] : [];
// //   const merged = [...existing.filter((t) => t.id !== track.id), track];
// //   set({ remoteStream: new MediaStream(merged) });
// // }

// // function normalizeIceCandidate(candidate) {
// //   if (!candidate) return null;
// //   return candidate instanceof RTCIceCandidate
// //     ? candidate
// //     : new RTCIceCandidate(candidate);
// // }

// // /** Prefer portrait capture on phones so remote desktop does not show a sideways frame. */
// // function getLocalVideoConstraints() {
// //   const portrait =
// //     typeof window !== "undefined" &&
// //     window.matchMedia?.("(orientation: portrait)")?.matches;
// //   return {
// //     facingMode: "user",
// //     ...(portrait
// //       ? { width: { ideal: 720 }, height: { ideal: 1280 } }
// //       : { width: { ideal: 1280 }, height: { ideal: 720 } }),
// //   };
// // }

// // /** Retry with simple constraints if ideal width/height fails on some devices. */
// // async function getCallMediaStream(callType) {
// //   try {
// //     return await navigator.mediaDevices.getUserMedia({
// //       video: callType === "video" ? getLocalVideoConstraints() : false,
// //       audio: true,
// //     });
// //   } catch (firstErr) {
// //     console.warn("getUserMedia (ideal) failed, retrying basic:", firstErr);
// //     return await navigator.mediaDevices.getUserMedia({
// //       video: callType === "video",
// //       audio: true,
// //     });
// //   }
// // }

// // export const useChatStore = create((set, get) => ({
// //   /* ================= STATE ================= */
// //   users: [],
// //   messages: [],
// //   selectedUser: null,
// //   isMessagesLoading: false,
// //   isUsersLoading: false,

// //   outgoingCall: null,
// //   incomingCall: null,
// //   pendingOffer: null,
// //   iceCandidateQueue: [],
// //   isCalling: false,

// //   callWith: null,

// //   pc: null,
// //   localStream: null,
// //   remoteStream: null,

// //   isMicOn: true,
// //   isCameraOn: true,

// //   /* ================= USERS ================= */
// //   getUsers: async () => {
// //     set({ isUsersLoading: true });
// //     try {
// //       const res = await axiosInstance.get("/messages/users");
// //       set({ users: res.data });
// //     } catch (e) {
// //       console.error(e);
// //     } finally {
// //       set({ isUsersLoading: false });
// //     }
// //   },

// //   /* ================= MESSAGES ================= */
// //   getMessages: async (id) => {
// //     set({ isMessagesLoading: true });
// //     try {
// //       const res = await axiosInstance.get(`/messages/${id}`);
// //       set({ messages: res.data });
// //     } catch (e) {
// //       console.error(e);
// //     } finally {
// //       set({ isMessagesLoading: false });
// //     }
// //   },

// //   sendMessage: async (data) => {
// //     const { selectedUser } = get();
// //     if (!selectedUser) return;

// //     await axiosInstance.post(
// //       `/messages/send/${selectedUser._id}`,
// //       data
// //     );
// //   },

// //   /* ================= SOCKET (MESSAGES) ================= */
// //   subscribeToMessages: () => {
// //     const socket = useAuthStore.getState().socket;
// //     if (!socket) return;

// //     socket.off("newMessage");

// //     socket.on("newMessage", (msg) => {
// //       set((state) => {
// //         if (state.messages.some((m) => m._id === msg._id)) {
// //           return state;
// //         }
// //         return { messages: [...state.messages, msg] };
// //       });
// //     });
// //   },

// //   unsubscribeFromMessages: () => {
// //     useAuthStore.getState().socket?.off("newMessage");
// //   },

// //   /* ================= SOCKET (CALLS) ================= */
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
// //         callWith: from,
// //       });
// //     });

// //     /* 🔴 CALL ENDED */
// //     socket.on("call-ended", () => {
// //       get().endCall(false);
// //     });

// //     /* ================= RECEIVER =================
// //        Critical: pc must be created as soon as webrtc-offer arrives.
// //        Otherwise the callee can end up with "remote black screen" because tracks/ICE arrive
// //        before the peer connection + ontrack wiring is ready.
// //     */
// //     socket.on("webrtc-offer", async ({ from, offer, callType }) => {
// //       const resolvedType = callType || "video";

// //       // Clean old call state if any
// //       const prev = get();
// //       if (prev.pc) {
// //         try {
// //           prev.pc.close();
// //         } catch {}
// //       }

// //       const pc = createPeerConnection();

// //       // Attach remote tracks immediately (so we can render even before "Accept")
// //       pc.ontrack = (e) => mergeRemoteTrack(get, set, e);

// //       // Send ICE candidates back to caller
// //       pc.onicecandidate = (e) => {
// //         if (!e.candidate) return;
// //         socket.emit("webrtc-ice", {
// //           to: from,
// //           candidate: e.candidate.toJSON ? e.candidate.toJSON() : e.candidate,
// //         });
// //       };

// //       try {
// //         const offerDesc =
// //           offer instanceof RTCSessionDescription
// //             ? offer
// //             : new RTCSessionDescription(offer);
// //         await pc.setRemoteDescription(offerDesc);
// //       } catch (e) {
// //         console.error("setRemoteDescription failed (receiver):", e);
// //         try {
// //           pc.close();
// //         } catch {}
// //         return;
// //       }

// //       set({
// //         pc,
// //         remoteStream: null,
// //         localStream: null,
// //         incomingCall: { from, callType: resolvedType },
// //         pendingOffer: { from, callType: resolvedType },
// //         iceCandidateQueue: [],
// //         outgoingCall: null,
// //         callWith: from,
// //         isCalling: false,
// //         isMicOn: true,
// //         isCameraOn: resolvedType === "video",
// //       });
// //     });

// //     /* ================= CALLER ================= */
// //     socket.on("webrtc-answer", async ({ answer }) => {
// //       const { pc } = get();
// //       if (!pc) return;

// //       if (pc.signalingState === "stable" && pc.remoteDescription) {
// //         return;
// //       }

// //       if (pc.signalingState !== "have-local-offer") {
// //         return;
// //       }

// //       const desc =
// //         answer instanceof RTCSessionDescription
// //           ? answer
// //           : new RTCSessionDescription(answer);

// //       try {
// //         await pc.setRemoteDescription(desc);
// //       } catch (e) {
// //         if (
// //           e?.name === "InvalidStateError" &&
// //           pc.signalingState === "stable"
// //         ) {
// //           return;
// //         }
// //         console.error("webrtc-answer failed:", e);
// //         return;
// //       }

// //       set({
// //         isCalling: true,
// //         outgoingCall: null,
// //       });
// //     });

// //     socket.on("webrtc-ice", async ({ candidate }) => {
// //       const ci = normalizeIceCandidate(candidate);
// //       if (!ci) return;
// //       const { pc } = get();
// //       if (pc) {
// //         try {
// //           await pc.addIceCandidate(ci);
// //         } catch (e) {
// //           console.log("ICE add error", e);
// //         }
// //       } else {
// //         set((s) => ({
// //           iceCandidateQueue: [...(s.iceCandidateQueue || []), ci],
// //         }));
// //       }
// //     });
// //   },

// //   /* ================= START CALL ================= */
// //   startCall: async (callType = "video") => {
// //     const socket = useAuthStore.getState().socket;
// //     const { selectedUser } = get();

// //     if (!socket || !selectedUser) return;

// //     if (get().pc || get().localStream) {
// //       get().endCall(false);
// //     }

// //     set({
// //       remoteStream: null,
// //       isMicOn: true,
// //       isCameraOn: callType === "video",
// //     });

// //     const pc = createPeerConnection();

// //     let stream;
// //     try {
// //       stream = await getCallMediaStream(callType);
// //     } catch (e) {
// //       console.error(e);
// //       pc.close();
// //       return;
// //     }

// //     stream.getTracks().forEach((t) => pc.addTrack(t, stream));

// //     pc.ontrack = (e) => mergeRemoteTrack(get, set, e);

// //     pc.onicecandidate = (e) => {
// //       if (e.candidate) {
// //         socket.emit("webrtc-ice", {
// //           to: selectedUser._id,
// //           candidate: e.candidate.toJSON
// //             ? e.candidate.toJSON()
// //             : e.candidate,
// //         });
// //       }
// //     };

// //     const offer = await pc.createOffer({
// //       offerToReceiveAudio: true,
// //       offerToReceiveVideo: callType === "video",
// //     });
// //     await pc.setLocalDescription(offer);

// //     /* Register pc in store BEFORE signaling so webrtc-answer never runs with pc === null */
// //     set({
// //       pc,
// //       localStream: stream,
// //       remoteStream: null,
// //       outgoingCall: {
// //         to: selectedUser._id,
// //         callType,
// //       },
// //       callWith: selectedUser._id,
// //     });

// //     socket.emit("call-user", {
// //       to: selectedUser._id,
// //       callType,
// //     });

// //     socket.emit("webrtc-offer", {
// //       to: selectedUser._id,
// //       offer: { type: offer.type, sdp: offer.sdp },
// //       callType,
// //     });
// //   },

// //   /* ================= ACCEPT CALL ================= */
// //   acceptCall: async () => {
// //     const socket = useAuthStore.getState().socket;
// //     const { pendingOffer, incomingCall, pc: existingPc } = get();

// //     if (!socket || !pendingOffer) {
// //       set({ incomingCall: null, pendingOffer: null });
// //       return;
// //     }

// //     const { from } = pendingOffer;
// //     const callType =
// //       incomingCall?.callType ?? pendingOffer.callType ?? "video";

// //     // If we somehow don't have the receiver pc yet, create it (fallback)
// //     const pc = existingPc || createPeerConnection();

// //     if (!existingPc && pc) {
// //       // In fallback mode, we rely on startCall/createOffer flow to re-send offer soon.
// //       // But for normal flow, receiver pc is already created in webrtc-offer handler.
// //       set({ pc });
// //     }

// //     let stream;
// //     try {
// //       stream = await getCallMediaStream(callType);
// //     } catch (e) {
// //       console.error(e);
// //       try {
// //         pc.close();
// //       } catch {}
// //       get().rejectCall();
// //       return;
// //     }

// //     // Attach local tracks now that we're accepting
// //     stream.getTracks().forEach((t) => pc.addTrack(t, stream));

// //     try {
// //       const answer = await pc.createAnswer();
// //       await pc.setLocalDescription(answer);

// //       socket.emit("webrtc-answer", {
// //         to: from,
// //         answer: {
// //           type: answer.type,
// //           sdp: answer.sdp,
// //         },
// //       });

// //       // Flush any queued ICE candidates (should be rare now)
// //       const queued = get().iceCandidateQueue || [];
// //       for (const c of queued) {
// //         try {
// //           await pc.addIceCandidate(normalizeIceCandidate(c));
// //         } catch (e) {
// //           console.log("ICE flush error", e);
// //         }
// //       }
// //     } catch (e) {
// //       console.error("acceptCall failed:", e);
// //       get().rejectCall();
// //       return;
// //     }

// //     set({
// //       pc,
// //       localStream: stream,
// //       isCalling: true,
// //       incomingCall: null,
// //       pendingOffer: null,
// //       iceCandidateQueue: [],
// //       callWith: from,
// //       outgoingCall: null,
// //     });
// //   },

// //   rejectCall: () => {
// //     const socket = useAuthStore.getState().socket;
// //     const { incomingCall, pendingOffer, pc, localStream } = get();
// //     const target = incomingCall?.from ?? pendingOffer?.from;
// //     if (socket && target) {
// //       socket.emit("end-call", { to: target });
// //     }

// //     if (localStream) {
// //       localStream.getTracks().forEach((t) => t.stop());
// //     }
// //     if (pc) {
// //       try {
// //         pc.close();
// //       } catch {}
// //     }

// //     set({
// //       pc: null,
// //       localStream: null,
// //       remoteStream: null,
// //       incomingCall: null,
// //       pendingOffer: null,
// //       iceCandidateQueue: [],
// //       outgoingCall: null,
// //       callWith: null,
// //       isCalling: false,
// //     });
// //   },

// //   cancelOutgoingCall: () => {
// //     get().endCall(true);
// //   },

// //   /* ================= END CALL ================= */
// //   endCall: (notify = true) => {
// //     const socket = useAuthStore.getState().socket;
// //     const { pc, localStream, callWith } = get();

// //     if (localStream) {
// //       localStream.getTracks().forEach((t) => t.stop());
// //     }

// //     if (pc) pc.close();

// //     if (notify && socket && callWith) {
// //       socket.emit("end-call", { to: callWith });
// //     }

// //     set({
// //       pc: null,
// //       localStream: null,
// //       remoteStream: null,
// //       incomingCall: null,
// //       pendingOffer: null,
// //       iceCandidateQueue: [],
// //       outgoingCall: null,
// //       callWith: null,
// //       isCalling: false,
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

// //   setSelectedUser: (u) =>
// //     set({
// //       selectedUser: u,
// //       messages: [],
// //     }),
// // }));

// // import { create } from "zustand";
// // import { axiosInstance } from "../lib/axios";
// // import { useAuthStore } from "./useAuthStore";

// // /* ================= WEBRTC ================= */
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

// //   callWith: null, // 🔥 FIX

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

// //     await axiosInstance.post(
// //       `/messages/send/${selectedUser._id}`,
// //       data
// //     );

// //     // ❌ DON'T add locally
// //   },

// //   /* ================= SOCKET (MESSAGES) ================= */
// //   subscribeToMessages: () => {
// //     const socket = useAuthStore.getState().socket;
// //     if (!socket) return;

// //     socket.off("newMessage");

// //     socket.on("newMessage", (msg) => {
// //       set((s) => {
// //         if (s.messages.some((m) => m._id === msg._id)) {
// //           return s;
// //         }
// //         return { messages: [...s.messages, msg] };
// //       });
// //     });
// //   },

// //   unsubscribeFromMessages: () => {
// //     useAuthStore.getState().socket?.off("newMessage");
// //   },

// //   /* ================= SOCKET (CALLS) ================= */
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
// //         callWith: from, // 🔥 IMPORTANT
// //         isCalling: false,
// //       });
// //     });

// //     /* 🔴 CALL ENDED */
// //     socket.on("call-ended", () => {
// //       console.log("🔥 CALL ENDED RECEIVED");
// //       get().endCall(false);
// //     });

// //     /* 🔵 OFFER */
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
// //         e.streams[0].getTracks().forEach((t) => {
// //           remoteStream.addTrack(t);
// //         });
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

// //     socket.emit("call-user", {
// //       to: selectedUser._id,
// //       callType,
// //     });

// //     set({
// //       outgoingCall: {
// //         to: selectedUser._id,
// //         callType,
// //       },
// //       callWith: selectedUser._id, // 🔥 IMPORTANT
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
// //       isCalling: true,
// //       incomingCall: null,
// //     });
// //   },

// //   /* ================= REJECT ================= */
// //   rejectCall: () => {
// //     const socket = useAuthStore.getState().socket;
// //     const { incomingCall } = get();

// //     if (socket && incomingCall) {
// //       socket.emit("end-call", { to: incomingCall.from });
// //     }

// //     set({
// //       incomingCall: null,
// //       callWith: null,
// //       isCalling: false,
// //     });
// //   },

// //   /* ================= CANCEL ================= */
// //   cancelOutgoingCall: () => {
// //     const socket = useAuthStore.getState().socket;
// //     const { outgoingCall } = get();

// //     if (socket && outgoingCall) {
// //       socket.emit("end-call", { to: outgoingCall.to });
// //     }

// //     set({
// //       outgoingCall: null,
// //       callWith: null,
// //       isCalling: false,
// //     });
// //   },

// //   /* ================= END CALL ================= */
// //   endCall: (notify = true) => {
// //     const socket = useAuthStore.getState().socket;
// //     const { pc, localStream, callWith } = get();

// //     if (localStream) {
// //       localStream.getTracks().forEach((t) => t.stop());
// //     }

// //     if (pc) pc.close();

// //     if (notify && socket && callWith) {
// //       socket.emit("end-call", { to: callWith });
// //     }

// //     set({
// //       pc: null,
// //       localStream: null,
// //       remoteStream: null,
// //       incomingCall: null,
// //       outgoingCall: null,
// //       callWith: null,
// //       isCalling: false,
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

// //   setSelectedUser: (u) =>
// //     set({
// //       selectedUser: u,
// //       messages: [],
// //     }),
// // }));


// // //import { create } from "zustand";
// // import { axiosInstance } from "../lib/axios";
// // import { useAuthStore } from "./useAuthStore";

// // /* ================= WEBRTC ================= */
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

// // sendMessage: async (data) => {
// //   const { selectedUser } = get();
// //   if (!selectedUser) return;

// //   await axiosInstance.post(
// //     `/messages/send/${selectedUser._id}`,
// //     data
// //   );

// //   // ❌ DON'T add message here
// //   // socket already karega
// // },


// //   /* ================= SOCKET (MESSAGES) ================= */
// // subscribeToMessages: () => {
// //   const socket = useAuthStore.getState().socket;
// //   if (!socket) return;

// //   socket.off("newMessage");

// //   socket.on("newMessage", (msg) => {
// //     console.log("📩 MESSAGE:", msg._id);

// //     set((s) => {
// //       // ✅ HARD duplicate check
// //       if (s.messages.some((m) => m._id === msg._id)) {
// //         console.log("🚫 DUPLICATE BLOCKED:", msg._id);
// //         return s;
// //       }

// //       return {
// //         messages: [...s.messages, msg],
// //       };
// //     });
// //   });
// // },
// //   unsubscribeFromMessages: () => {
// //     useAuthStore.getState().socket?.off("newMessage");
// //   },

// //   /* ================= SOCKET (CALLS) ================= */
// //   // subscribeToCalls: () => {
// //   //   const socket = useAuthStore.getState().socket;
// //   //   if (!socket) return;

// //   //   socket.off("incoming-call");
// //   //   socket.off("webrtc-offer");
// //   //   socket.off("webrtc-answer");
// //   //   socket.off("webrtc-ice");
// //   //   socket.off("call-ended");

// //   //   /* 🔔 INCOMING CALL */
// //   //   socket.on("incoming-call", ({ from, callType }) => {
// //   //     set({
// //   //       incomingCall: { from, callType },
// //   //       isCalling: false, // ringing
// //   //     });
// //   //   });

// //   //   /* 🔴 CALL ENDED */
// //   //   socket.on("call-ended", () => {
// //   //     get().endCall(false);
// //   //   });

// //   //   /* 🔵 OFFER RECEIVED (receiver side) */
// //   //   socket.on("webrtc-offer", async ({ from, offer }) => {
// //   //     const socket = useAuthStore.getState().socket;

// //   //     const pc = createPeerConnection();

// //   //     const stream = await navigator.mediaDevices.getUserMedia({
// //   //       video: true,
// //   //       audio: true,
// //   //     });

// //   //     stream.getTracks().forEach((t) => pc.addTrack(t, stream));

// //   //     const remoteStream = new MediaStream();

// //   //     pc.ontrack = (e) => {
// //   //       e.streams[0].getTracks().forEach((t) => remoteStream.addTrack(t));
// //   //       set({ remoteStream });
// //   //     };

// //   //     pc.onicecandidate = (e) => {
// //   //       if (e.candidate) {
// //   //         socket.emit("webrtc-ice", {
// //   //           to: from,
// //   //           candidate: e.candidate,
// //   //         });
// //   //       }
// //   //     };

// //   //     await pc.setRemoteDescription(offer);

// //   //     const answer = await pc.createAnswer();
// //   //     await pc.setLocalDescription(answer);

// //   //     socket.emit("webrtc-answer", { to: from, answer });

// //   //     set({
// //   //       pc,
// //   //       localStream: stream,
// //   //       remoteStream,
// //   //       isCalling: true,
// //   //       incomingCall: null,
// //   //       outgoingCall: null,
// //   //     });
// //   //   });

// //   //   /* 🔵 ANSWER RECEIVED (caller side) */
// //   //   socket.on("webrtc-answer", async ({ answer }) => {
// //   //     const { pc } = get();
// //   //     if (pc) await pc.setRemoteDescription(answer);

// //   //     set({
// //   //       isCalling: true,
// //   //       outgoingCall: null,
// //   //     });
// //   //   });

// //   //   /* 🔵 ICE */
// //   //   socket.on("webrtc-ice", async ({ candidate }) => {
// //   //     const { pc } = get();
// //   //     if (pc && candidate) {
// //   //       await pc.addIceCandidate(candidate);
// //   //     }
// //   //   });
// //   // },
// //  subscribeToCalls: () => {
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
// //    socket.on("call-ended", () => {
// //   console.log("🔥 CALL ENDED RECEIVED ON B");
// //   get().endCall(false);
// // });
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
// //   // startCall: async (callType) => {
// //   //   const socket = useAuthStore.getState().socket;
// //   //   const { selectedUser } = get();

// //   //   if (!socket || !selectedUser) return;

// //   //   const pc = createPeerConnection();

// //   //   const stream = await navigator.mediaDevices.getUserMedia({
// //   //     video: callType === "video",
// //   //     audio: true,
// //   //   });

// //   //   stream.getTracks().forEach((t) => pc.addTrack(t, stream));

// //   //   const remoteStream = new MediaStream();

// //   //   pc.ontrack = (e) => {
// //   //     e.streams[0].getTracks().forEach((t) => remoteStream.addTrack(t));
// //   //     set({ remoteStream });
// //   //   };

// //   //   pc.onicecandidate = (e) => {
// //   //     if (e.candidate) {
// //   //       socket.emit("webrtc-ice", {
// //   //         to: selectedUser._id,
// //   //         candidate: e.candidate,
// //   //       });
// //   //     }
// //   //   };

// //   //   // ✅ OFFER FROM CALLER
// //   //   const offer = await pc.createOffer();
// //   //   await pc.setLocalDescription(offer);

// //   //   socket.emit("webrtc-offer", {
// //   //     to: selectedUser._id,
// //   //     offer,
// //   //   });

// //   //   socket.emit("call-user", {
// //   //     to: selectedUser._id,
// //   //     callType,
// //   //   });

// //   //   set({
// //   //     pc,
// //   //     localStream: stream,
// //   //     remoteStream,
// //   //     outgoingCall: {
// //   //       to: selectedUser._id,
// //   //       callType,
// //   //     },
// //   //   });
// //   // },

// //   // /* ================= ACCEPT CALL ================= */
// //   // acceptCall: () => {
// //   //   set({
// //   //     incomingCall: null,
// //   //     isCalling: true,
// //   //   });
// //   // },
// // /* ================= START CALL ================= */
// //  startCall: (callType) => {
// //   const socket = useAuthStore.getState().socket;
// //   const { selectedUser } = get();

// //   if (!socket || !selectedUser) return;

// //   socket.emit("call-user", {
// //     to: selectedUser._id,
// //     callType,
// //   });

// //   set({
// //     outgoingCall: {
// //       to: selectedUser._id,
// //       callType,
// //     },
// //   });
// // },

// //   /* ================= ACCEPT CALL ================= */
// //  acceptCall: async () => {
// //   const socket = useAuthStore.getState().socket;
// //   const { incomingCall } = get();

// //   if (!socket || !incomingCall) return;

// //   const pc = createPeerConnection();

// //   const stream = await navigator.mediaDevices.getUserMedia({
// //     video: incomingCall.callType === "video",
// //     audio: true,
// //   });

// //   stream.getTracks().forEach((t) => pc.addTrack(t, stream));

// //   pc.onicecandidate = (e) => {
// //     if (e.candidate) {
// //       socket.emit("webrtc-ice", {
// //         to: incomingCall.from,
// //         candidate: e.candidate,
// //       });
// //     }
// //   };

// //   // ✅ OFFER ONLY HERE
// //   const offer = await pc.createOffer();
// //   await pc.setLocalDescription(offer);

// //   socket.emit("webrtc-offer", {
// //     to: incomingCall.from,
// //     offer,
// //   });

// //   set({
// //     pc,
// //     localStream: stream,
// //     isCalling: true,
// //     incomingCall: null,
// //   });
// // },
  
 
// //   /* ================= REJECT ================= */
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

// //   /* ================= CANCEL ================= */
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
// //   // endCall: (notify = true) => {
// //   //   const socket = useAuthStore.getState().socket;
// //   //   const { localStream, pc, selectedUser, incomingCall, outgoingCall } = get();

// //   //   if (localStream) {
// //   //     localStream.getTracks().forEach((t) => t.stop());
// //   //   }

// //   //   if (pc) pc.close();

// //   //   const targetUser =
// //   //     selectedUser?._id ||
// //   //     incomingCall?.from ||
// //   //     outgoingCall?.to;

// //   //   if (notify && socket && targetUser) {
// //   //     socket.emit("end-call", { to: targetUser });
// //   //   }

// //   //   set({
// //   //     localStream: null,
// //   //     remoteStream: null,
// //   //     pc: null,
// //   //     isCalling: false,
// //   //     incomingCall: null,
// //   //     outgoingCall: null,
// //   //     isMicOn: true,
// //   //     isCameraOn: true,
// //   //   });
// //   // },
// // endCall: (notify = true) => {
// //   const socket = useAuthStore.getState().socket;
// //   const { pc, localStream, incomingCall, outgoingCall } = get();

// //   // stop media
// //   if (localStream) {
// //     localStream.getTracks().forEach((t) => t.stop());
// //   }

// //   // close peer
// //   if (pc) {
// //     pc.close();
// //   }

// //   // notify other user
// //   const target =
// //     incomingCall?.from ||
// //     outgoingCall?.to;

// //   if (notify && socket && target) {
// //     socket.emit("end-call", { to: target });
// //   }

// //   // 🔥 VERY IMPORTANT RESET
// //   set({
// //     pc: null,
// //     localStream: null,
// //     remoteStream: null,
// //     incomingCall: null,
// //     outgoingCall: null,
// //     isCalling: false,
// //   });
// // },
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



// // /* ================= WEBRTC ================= */

// // // export const useChatStore = create((set, get) => ({
// // //   users: [],
// // //   messages: [],
// // //   selectedUser: null,

// // //   outgoingCall: null,
// // //   incomingCall: null,
// // //   isCalling: false,

// // //   pc: null,
// // //   localStream: null,
// // //   remoteStream: null,

// // //   /* ================= SOCKET ================= */
// // //   subscribeToCalls: () => {
// // //     const socket = useAuthStore.getState().socket;
// // //     if (!socket) return;

// // //     socket.off("incoming-call");
// // //     socket.off("webrtc-offer");
// // //     socket.off("webrtc-answer");
// // //     socket.off("webrtc-ice");
// // //     socket.off("call-ended");

// // //     /* 🔔 INCOMING */
// // //     socket.on("incoming-call", ({ from, callType }) => {
// // //       set({
// // //         incomingCall: { from, callType },
// // //         isCalling: false,
// // //       });
// // //     });

// // //     /* 🔴 END */
// // //     socket.on("call-ended", () => {
// // //       get().endCall(false);
// // //     });

// // //     /* 🔵 OFFER RECEIVE */
// // //     socket.on("webrtc-offer", async ({ from, offer }) => {
// // //       const socket = useAuthStore.getState().socket;

// // //       const pc = createPeerConnection();

// // //       const stream = await navigator.mediaDevices.getUserMedia({
// // //         video: true,
// // //         audio: true,
// // //       });

// // //       stream.getTracks().forEach((t) => pc.addTrack(t, stream));

// // //       const remoteStream = new MediaStream();

// // //       pc.ontrack = (e) => {
// // //         e.streams[0].getTracks().forEach((t) => remoteStream.addTrack(t));
// // //         set({ remoteStream });
// // //       };

// // //       pc.onicecandidate = (e) => {
// // //         if (e.candidate) {
// // //           socket.emit("webrtc-ice", {
// // //             to: from,
// // //             candidate: e.candidate,
// // //           });
// // //         }
// // //       };

// // //       await pc.setRemoteDescription(offer);

// // //       const answer = await pc.createAnswer();
// // //       await pc.setLocalDescription(answer);

// // //       socket.emit("webrtc-answer", { to: from, answer });

// // //       set({
// // //         pc,
// // //         localStream: stream,
// // //         remoteStream,
// // //         isCalling: true,
// // //         incomingCall: null,
// // //       });
// // //     });

// // //     /* 🔵 ANSWER */
// // //     socket.on("webrtc-answer", async ({ answer }) => {
// // //       const { pc } = get();
// // //       if (pc) await pc.setRemoteDescription(answer);

// // //       set({
// // //         isCalling: true,
// // //         outgoingCall: null,
// // //       });
// // //     });

// // //     /* 🔵 ICE */
// // //     socket.on("webrtc-ice", async ({ candidate }) => {
// // //       const { pc } = get();
// // //       if (pc && candidate) {
// // //         await pc.addIceCandidate(candidate);
// // //       }
// // //     });
// // //   },

// // //   /* ================= START CALL ================= */
// // //   startCall: (callType) => {
// // //     const socket = useAuthStore.getState().socket;
// // //     const { selectedUser } = get();

// // //     if (!socket || !selectedUser) return;

// // //     // ❌ NO OFFER HERE

// // //     socket.emit("call-user", {
// // //       to: selectedUser._id,
// // //       callType,
// // //     });

// // //     set({
// // //       outgoingCall: {
// // //         to: selectedUser._id,
// // //         callType,
// // //       },
// // //     });
// // //   },

// // //   /* ================= ACCEPT CALL ================= */
// // //   acceptCall: async () => {
// // //     const socket = useAuthStore.getState().socket;
// // //     const { incomingCall } = get();

// // //     if (!socket || !incomingCall) return;

// // //     const pc = createPeerConnection();

// // //     const stream = await navigator.mediaDevices.getUserMedia({
// // //       video: incomingCall.callType === "video",
// // //       audio: true,
// // //     });

// // //     stream.getTracks().forEach((t) => pc.addTrack(t, stream));

// // //     const remoteStream = new MediaStream();

// // //     pc.ontrack = (e) => {
// // //       e.streams[0].getTracks().forEach((t) => remoteStream.addTrack(t));
// // //       set({ remoteStream });
// // //     };

// // //     pc.onicecandidate = (e) => {
// // //       if (e.candidate) {
// // //         socket.emit("webrtc-ice", {
// // //           to: incomingCall.from,
// // //           candidate: e.candidate,
// // //         });
// // //       }
// // //     };

// // //     // ✅ OFFER ONLY HERE
// // //     const offer = await pc.createOffer();
// // //     await pc.setLocalDescription(offer);

// // //     socket.emit("webrtc-offer", {
// // //       to: incomingCall.from,
// // //       offer,
// // //     });

// // //     set({
// // //       pc,
// // //       localStream: stream,
// // //       remoteStream,
// // //       isCalling: true,
// // //       incomingCall: null,
// // //     });
// // //   },

// // //   /* ================= END ================= */
// // //   endCall: (notify = true) => {
// // //     const socket = useAuthStore.getState().socket;
// // //     const { pc, localStream, incomingCall, outgoingCall } = get();

// // //     localStream?.getTracks().forEach((t) => t.stop());
// // //     pc?.close();

// // //     const target =
// // //       incomingCall?.from ||
// // //       outgoingCall?.to;

// // //     if (notify && socket && target) {
// // //       socket.emit("end-call", { to: target });
// // //     }

// // //     set({
// // //       pc: null,
// // //       localStream: null,
// // //       remoteStream: null,
// // //       isCalling: false,
// // //       incomingCall: null,
// // //       outgoingCall: null,
// // //     });
// // //   },
// // // }));



// // // import { create } from "zustand";
// // // import { axiosInstance } from "../lib/axios";
// // // import { useAuthStore } from "./useAuthStore";

// // // /* ================= WEBRTC HELPER ================= */
// // // const createPeerConnection = () =>
// // //   new RTCPeerConnection({
// // //     iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
// // //   });

// // // export const useChatStore = create((set, get) => ({
// // //   /* ================= STATE ================= */
// // //   users: [],
// // //   messages: [],
// // //   selectedUser: null,

// // //   outgoingCall: null,
// // //   incomingCall: null,
// // //   isCalling: false,

// // //   pc: null,
// // //   localStream: null,
// // //   remoteStream: null,

// // //   isMicOn: true,
// // //   isCameraOn: true,

// // //   /* ================= USERS ================= */
// // //   getUsers: async () => {
// // //     const res = await axiosInstance.get("/messages/users");
// // //     set({ users: res.data });
// // //   },

// // //   /* ================= MESSAGES ================= */
// // //   getMessages: async (id) => {
// // //     const res = await axiosInstance.get(`/messages/${id}`);
// // //     set({ messages: res.data });
// // //   },

// // //   sendMessage: async (data) => {
// // //     const { selectedUser } = get();
// // //     if (!selectedUser) return;

// // //     const res = await axiosInstance.post(
// // //       `/messages/send/${selectedUser._id}`,
// // //       data
// // //     );

// // //     set((s) => ({ messages: [...s.messages, res.data] }));
// // //   },

// // //   /* ================= MESSAGE SOCKET ================= */
// // //   subscribeToMessages: () => {
// // //     const socket = useAuthStore.getState().socket;
// // //     if (!socket) return;

// // //     socket.off("newMessage");

// // //     socket.on("newMessage", (msg) => {
// // //       set((s) => ({ messages: [...s.messages, msg] }));
// // //     });
// // //   },

// // //   unsubscribeFromMessages: () => {
// // //     useAuthStore.getState().socket?.off("newMessage");
// // //   },

// // //   /* ================= CALL SOCKET ================= */
// // //   subscribeToCalls: () => {
// // //     const socket = useAuthStore.getState().socket;
// // //     if (!socket) return;

// // //     socket.off("incoming-call");
// // //     socket.off("webrtc-offer");
// // //     socket.off("webrtc-answer");
// // //     socket.off("webrtc-ice");
// // //     socket.off("call-ended");

// // //     /* 🔔 INCOMING CALL */
// // //     socket.on("incoming-call", ({ from, callType }) => {
// // //       set({
// // //         incomingCall: { from, callType },
// // //         isCalling: true,
// // //       });
// // //     });

// // //     /* 🔴 CALL ENDED */
// // //     socket.on("call-ended", () => {
// // //       get().endCall(false);
// // //     });

// // //     /* 🔵 OFFER */
// // //     socket.on("webrtc-offer", async ({ from, offer }) => {
// // //       const pc = createPeerConnection();

// // //       const stream = await navigator.mediaDevices.getUserMedia({
// // //         video: true,
// // //         audio: true,
// // //       });

// // //       stream.getTracks().forEach((t) => pc.addTrack(t, stream));

// // //       const remoteStream = new MediaStream();

// // //       pc.ontrack = (e) => {
// // //         e.streams[0].getTracks().forEach((t) => remoteStream.addTrack(t));
// // //         set({ remoteStream });
// // //       };

// // //       pc.onicecandidate = (e) => {
// // //         if (e.candidate) {
// // //           socket.emit("webrtc-ice", {
// // //             to: from,
// // //             candidate: e.candidate,
// // //           });
// // //         }
// // //       };

// // //       await pc.setRemoteDescription(offer);

// // //       const answer = await pc.createAnswer();
// // //       await pc.setLocalDescription(answer);

// // //       socket.emit("webrtc-answer", { to: from, answer });

// // //       set({
// // //         pc,
// // //         localStream: stream,
// // //         remoteStream,
// // //         isCalling: true,
// // //         incomingCall: null,
// // //         outgoingCall: null,
// // //       });
// // //     });

// // //     /* 🔵 ANSWER */
// // //     socket.on("webrtc-answer", async ({ answer }) => {
// // //       const { pc } = get();
// // //       if (pc) await pc.setRemoteDescription(answer);

// // //       set({
// // //         outgoingCall: null,
// // //         isCalling: true,
// // //       });
// // //     });

// // //     /* 🔵 ICE */
// // //     socket.on("webrtc-ice", async ({ candidate }) => {
// // //       const { pc } = get();
// // //       if (pc && candidate) {
// // //         await pc.addIceCandidate(candidate);
// // //       }
// // //     });
// // //   },

// // //   /* ================= START CALL ================= */
// // //   startCall: (callType) => {
// // //     const socket = useAuthStore.getState().socket;
// // //     const { selectedUser } = get();

// // //     if (!socket || !selectedUser) return;

// // //     socket.emit("call-user", {
// // //       to: selectedUser._id,
// // //       callType,
// // //     });

// // //     set({
// // //       outgoingCall: {
// // //         to: selectedUser._id,
// // //         callType,
// // //       },
      
// // //     });
// // //   },

// // //   /* ================= ACCEPT CALL ================= */
// // //   acceptCall: async () => {
// // //     const socket = useAuthStore.getState().socket;
// // //     const { incomingCall } = get();

// // //     if (!socket || !incomingCall) return;

// // //     const pc = createPeerConnection();

// // //     const stream = await navigator.mediaDevices.getUserMedia({
// // //       video: incomingCall.callType === "video",
// // //       audio: true,
// // //     });

// // //     stream.getTracks().forEach((t) => pc.addTrack(t, stream));

// // //     const remoteStream = new MediaStream();

// // //     pc.ontrack = (e) => {
// // //       e.streams[0].getTracks().forEach((t) => remoteStream.addTrack(t));
// // //       set({ remoteStream });
// // //     };

// // //     pc.onicecandidate = (e) => {
// // //       if (e.candidate) {
// // //         socket.emit("webrtc-ice", {
// // //           to: incomingCall.from,
// // //           candidate: e.candidate,
// // //         });
// // //       }
// // //     };

// // //     const offer = await pc.createOffer();
// // //     await pc.setLocalDescription(offer);

// // //     socket.emit("webrtc-offer", {
// // //       to: incomingCall.from,
// // //       offer,
// // //     });

// // //     set({
// // //       pc,
// // //       localStream: stream,
// // //       remoteStream,
// // //       isCalling: true,
// // //       incomingCall: null,
// // //       outgoingCall: null,
// // //     });
// // //   },

// // //   /* ================= REJECT CALL ================= */
// // //   rejectCall: () => {
// // //     const socket = useAuthStore.getState().socket;
// // //     const { incomingCall } = get();

// // //     if (socket && incomingCall) {
// // //       socket.emit("end-call", { to: incomingCall.from });
// // //     }

// // //     set({
// // //       incomingCall: null,
// // //       isCalling: false,
// // //     });
// // //   },

// // //   /* ================= CANCEL OUTGOING CALL ================= */
// // //   cancelOutgoingCall: () => {
// // //     const socket = useAuthStore.getState().socket;
// // //     const { outgoingCall } = get();

// // //     if (socket && outgoingCall) {
// // //       socket.emit("end-call", { to: outgoingCall.to });
// // //     }

// // //     set({
// // //       outgoingCall: null,
// // //       isCalling: false,
// // //     });
// // //   },

// // //   /* ================= END CALL ================= */
// // //   endCall: (notify = true) => {
// // //     const socket = useAuthStore.getState().socket;
// // //     const { localStream, pc, selectedUser, incomingCall, outgoingCall } = get();

// // //     if (localStream) {
// // //       localStream.getTracks().forEach((t) => t.stop());
// // //     }

// // //     if (pc) {
// // //       pc.close();
// // //     }

// // //     const targetUser =
// // //       selectedUser?._id ||
// // //       incomingCall?.from ||
// // //       outgoingCall?.to;

// // //     if (notify && socket && targetUser) {
// // //       socket.emit("end-call", { to: targetUser });
// // //     }

// // //     set({
// // //       localStream: null,
// // //       remoteStream: null,
// // //       pc: null,
// // //       isCalling: false,
// // //       incomingCall: null,
// // //       outgoingCall: null,
// // //       isMicOn: true,
// // //       isCameraOn: true,
// // //     });
// // //   },

// // //   /* ================= MIC ================= */
// // //   toggleMic: () => {
// // //     const { localStream, isMicOn } = get();
// // //     localStream?.getAudioTracks().forEach((t) => {
// // //       t.enabled = !isMicOn;
// // //     });
// // //     set({ isMicOn: !isMicOn });
// // //   },

// // //   /* ================= CAMERA ================= */
// // //   toggleCamera: () => {
// // //     const { localStream, isCameraOn } = get();
// // //     localStream?.getVideoTracks().forEach((t) => {
// // //       t.enabled = !isCameraOn;
// // //     });
// // //     set({ isCameraOn: !isCameraOn });
// // //   },

// // //   setSelectedUser: (u) => set({ selectedUser: u, messages: [] }),
// // // }));
