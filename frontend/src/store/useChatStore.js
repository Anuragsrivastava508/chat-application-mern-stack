import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

/* ================= WEBRTC HELPER ================= */
const createPeerConnection = () =>
  new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  });

export const useChatStore = create((set, get) => ({
  /* ================= STATE ================= */
  users: [],
  messages: [],
  selectedUser: null,

  outgoingCall: null,
  incomingCall: null,
  isCalling: false,

  pc: null,
  localStream: null,
  remoteStream: null,

  isMicOn: true,
  isCameraOn: true,

  /* ================= USERS ================= */
  getUsers: async () => {
    const res = await axiosInstance.get("/messages/users");
    set({ users: res.data });
  },

  /* ================= MESSAGES ================= */
  getMessages: async (id) => {
    const res = await axiosInstance.get(`/messages/${id}`);
    set({ messages: res.data });
  },

  sendMessage: async (data) => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const res = await axiosInstance.post(
      `/messages/send/${selectedUser._id}`,
      data
    );

    set((s) => ({ messages: [...s.messages, res.data] }));
  },

  /* ================= MESSAGE SOCKET ================= */
  subscribeToMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.off("newMessage");

    socket.on("newMessage", (msg) => {
      set((s) => ({ messages: [...s.messages, msg] }));
    });
  },

  unsubscribeFromMessages: () => {
    useAuthStore.getState().socket?.off("newMessage");
  },

  /* ================= CALL SOCKET ================= */
  subscribeToCalls: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.off("incoming-call");
    socket.off("webrtc-offer");
    socket.off("webrtc-answer");
    socket.off("webrtc-ice");
    socket.off("call-ended");

    /* 🔔 INCOMING CALL */
    socket.on("incoming-call", ({ from, callType }) => {
      set({
        incomingCall: { from, callType },
        isCalling: true,
      });
    });

    /* 🔴 CALL ENDED */
    socket.on("call-ended", () => {
      get().endCall(false);
    });

    /* 🔵 OFFER */
    socket.on("webrtc-offer", async ({ from, offer }) => {
      const pc = createPeerConnection();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      stream.getTracks().forEach((t) => pc.addTrack(t, stream));

      const remoteStream = new MediaStream();

      pc.ontrack = (e) => {
        e.streams[0].getTracks().forEach((t) => remoteStream.addTrack(t));
        set({ remoteStream });
      };

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          socket.emit("webrtc-ice", {
            to: from,
            candidate: e.candidate,
          });
        }
      };

      await pc.setRemoteDescription(offer);

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit("webrtc-answer", { to: from, answer });

      set({
        pc,
        localStream: stream,
        remoteStream,
        isCalling: true,
        incomingCall: null,
        outgoingCall: null,
      });
    });

    /* 🔵 ANSWER */
    socket.on("webrtc-answer", async ({ answer }) => {
      const { pc } = get();
      if (pc) await pc.setRemoteDescription(answer);

      set({
        outgoingCall: null,
        isCalling: true,
      });
    });

    /* 🔵 ICE */
    socket.on("webrtc-ice", async ({ candidate }) => {
      const { pc } = get();
      if (pc && candidate) {
        await pc.addIceCandidate(candidate);
      }
    });
  },

  /* ================= START CALL ================= */
  startCall: (callType) => {
    const socket = useAuthStore.getState().socket;
    const { selectedUser } = get();

    if (!socket || !selectedUser) return;

    socket.emit("call-user", {
      to: selectedUser._id,
      callType,
    });

    set({
      outgoingCall: {
        to: selectedUser._id,
        callType,
      },
      
    });
  },

  /* ================= ACCEPT CALL ================= */
  acceptCall: async () => {
    const socket = useAuthStore.getState().socket;
    const { incomingCall } = get();

    if (!socket || !incomingCall) return;

    const pc = createPeerConnection();

    const stream = await navigator.mediaDevices.getUserMedia({
      video: incomingCall.callType === "video",
      audio: true,
    });

    stream.getTracks().forEach((t) => pc.addTrack(t, stream));

    const remoteStream = new MediaStream();

    pc.ontrack = (e) => {
      e.streams[0].getTracks().forEach((t) => remoteStream.addTrack(t));
      set({ remoteStream });
    };

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit("webrtc-ice", {
          to: incomingCall.from,
          candidate: e.candidate,
        });
      }
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    socket.emit("webrtc-offer", {
      to: incomingCall.from,
      offer,
    });

    set({
      pc,
      localStream: stream,
      remoteStream,
      isCalling: true,
      incomingCall: null,
      outgoingCall: null,
    });
  },

  /* ================= REJECT CALL ================= */
  rejectCall: () => {
    const socket = useAuthStore.getState().socket;
    const { incomingCall } = get();

    if (socket && incomingCall) {
      socket.emit("end-call", { to: incomingCall.from });
    }

    set({
      incomingCall: null,
      isCalling: false,
    });
  },

  /* ================= CANCEL OUTGOING CALL ================= */
  cancelOutgoingCall: () => {
    const socket = useAuthStore.getState().socket;
    const { outgoingCall } = get();

    if (socket && outgoingCall) {
      socket.emit("end-call", { to: outgoingCall.to });
    }

    set({
      outgoingCall: null,
      isCalling: false,
    });
  },

  /* ================= END CALL ================= */
  endCall: (notify = true) => {
    const socket = useAuthStore.getState().socket;
    const { localStream, pc, selectedUser, incomingCall, outgoingCall } = get();

    if (localStream) {
      localStream.getTracks().forEach((t) => t.stop());
    }

    if (pc) {
      pc.close();
    }

    const targetUser =
      selectedUser?._id ||
      incomingCall?.from ||
      outgoingCall?.to;

    if (notify && socket && targetUser) {
      socket.emit("end-call", { to: targetUser });
    }

    set({
      localStream: null,
      remoteStream: null,
      pc: null,
      isCalling: false,
      incomingCall: null,
      outgoingCall: null,
      isMicOn: true,
      isCameraOn: true,
    });
  },

  /* ================= MIC ================= */
  toggleMic: () => {
    const { localStream, isMicOn } = get();
    localStream?.getAudioTracks().forEach((t) => {
      t.enabled = !isMicOn;
    });
    set({ isMicOn: !isMicOn });
  },

  /* ================= CAMERA ================= */
  toggleCamera: () => {
    const { localStream, isCameraOn } = get();
    localStream?.getVideoTracks().forEach((t) => {
      t.enabled = !isCameraOn;
    });
    set({ isCameraOn: !isCameraOn });
  },

  setSelectedUser: (u) => set({ selectedUser: u, messages: [] }),
}));
