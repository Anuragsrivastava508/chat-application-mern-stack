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
// mergeRemoteTrack
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
// normalizeIceCandidate
function normalizeIceCandidate(candidate) {
  if (!candidate) return null;
  return candidate instanceof RTCIceCandidate
    ? candidate
    : new RTCIceCandidate(candidate);
}
// getLocalVideoConstraints
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
// getCallMediaStream

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

// useChatStore 
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

