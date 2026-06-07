

import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, RotateCw, Video, VideoOff, Phone, PhoneOff, FileText } from "lucide-react";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import TypingIndicator from "./TypingIndicator";
import { formatMessageTime } from "../lib/utils";

const ChatContainer = ({ onBack }) => {
  const {
    messages, getMessages, isMessagesLoading, selectedUser,
    subscribeToMessages, unsubscribeFromMessages,
    subscribeToTyping, unsubscribeFromTyping,
    isCalling, outgoingCall, endCall,
    localStream, remoteStream,
    toggleMic, toggleCamera, isMicOn, isCameraOn,
    typingUser,
  } = useChatStore();

  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const [remoteViewRotate, setRemoteViewRotate] = useState(0);
  const [callDuration, setCallDuration] = useState(0);

  useEffect(() => {
    if (!selectedUser?._id) return;
    getMessages(selectedUser._id);
    subscribeToMessages();
    subscribeToTyping();
    return () => {
      unsubscribeFromMessages();
      unsubscribeFromTyping();
    };
  }, [selectedUser?._id, subscribeToMessages, unsubscribeFromMessages, subscribeToTyping, unsubscribeFromTyping]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUser]);

  // Call duration timer
  useEffect(() => {
    if (!isCalling) { setCallDuration(0); return; }
    const t = setInterval(() => setCallDuration((d) => d + 1), 1000);
    return () => clearInterval(t);
  }, [isCalling]);

  const formatDuration = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const ss = (s % 60).toString().padStart(2, "0");
    return `${m}:${ss}`;
  };

  /* LOCAL VIDEO */
  useEffect(() => {
    const video = localVideoRef.current;
    if (!video) return;
    if (!localStream) { video.srcObject = null; return; }
    video.srcObject = localStream;
    video.muted = true;
    video.playsInline = true;
    video.play().catch(() => {});
  }, [localStream]);

  useEffect(() => {
    if (!remoteStream) setRemoteViewRotate(0);
  }, [remoteStream]);

  /* REMOTE VIDEO + AUDIO */
  useEffect(() => {
    const video = remoteVideoRef.current;
    const audio = remoteAudioRef.current;
    if (!video || !audio) return;

    if (!remoteStream) {
      video.srcObject = null;
      audio.srcObject = null;
      video.style.transform = "";
      video.style.objectFit = "";
      return;
    }

    video.srcObject = null;
    audio.srcObject = null;

    const vtrack = remoteStream.getVideoTracks()[0];
    const settings = vtrack?.getSettings?.() ?? {};
    const metaRot = typeof settings.rotation === "number" ? settings.rotation : 0;
    const totalDeg = ((metaRot + remoteViewRotate) % 360 + 360) % 360;

    video.srcObject = remoteStream;
    video.setAttribute("playsinline", "");
    video.playsInline = true;
    video.muted = true;

    if (totalDeg !== 0) {
      video.style.transform = `rotate(${totalDeg}deg)`;
      video.style.objectFit = "contain";
    } else {
      video.style.transform = "";
      video.style.objectFit = "cover";
    }

    const atracks = remoteStream.getAudioTracks();
    if (atracks.length > 0) {
      audio.srcObject = new MediaStream(atracks);
      audio.muted = false;
    }

    const playVideo = async () => { try { await video.play(); } catch {} };
    const playAudio = async () => { try { audio.muted = false; await audio.play(); } catch {} };

    vtrack?.addEventListener("unmute", playVideo);
    atracks.forEach((t) => t.addEventListener("unmute", playAudio));
    video.onloadedmetadata = () => void playVideo();
    video.oncanplay = () => void playVideo();
    audio.oncanplay = () => void playAudio();
    void playVideo();
    void playAudio();

    return () => {
      vtrack?.removeEventListener("unmute", playVideo);
      atracks.forEach((t) => t.removeEventListener("unmute", playAudio));
      video.onloadedmetadata = null;
      video.oncanplay = null;
      audio.oncanplay = null;
    };
  }, [remoteStream, remoteViewRotate]);

  if (isMessagesLoading) {
    return (
      <div className="flex flex-col h-full">
        <ChatHeader onBack={onBack} />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  const inCall = isCalling || outgoingCall;

  return (
    <div className="flex flex-col h-full overflow-hidden relative">
      <ChatHeader onBack={onBack} />

      {/* ===== VIDEO CALL OVERLAY ===== */}
      {inCall && (
        <div className="absolute inset-0 z-50 flex flex-col bg-black">

          {/* REMOTE VIDEO (full screen) */}
          <div className="relative flex-1 min-h-0 bg-neutral-900 overflow-hidden">
            <video
              ref={remoteVideoRef}
              autoPlay playsInline muted
              className="absolute inset-0 w-full h-full object-cover"
            />
            <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />

            {/* Connecting overlay */}
            {!remoteStream && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                <div className="relative">
                  <img
                    src={selectedUser?.profilePic || "/avatar.png"}
                    className="w-24 h-24 rounded-full object-cover ring-4 ring-white/20"
                    alt=""
                  />
                  {/* Pulse rings */}
                  <span className="absolute inset-0 rounded-full animate-ping bg-white/10" />
                </div>
                <p className="text-white text-xl font-semibold">{selectedUser?.fullName}</p>
                <p className="text-white/60 text-sm animate-pulse">
                  {outgoingCall ? "Calling…" : "Connecting…"}
                </p>
              </div>
            )}

            {/* Duration badge */}
            {isCalling && remoteStream && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm text-white text-sm px-3 py-1 rounded-full">
                {formatDuration(callDuration)}
              </div>
            )}

            {/* LOCAL video (PiP) */}
            <div className="absolute bottom-4 right-4 w-28 h-36 sm:w-36 sm:h-48 rounded-2xl overflow-hidden border-2 border-white/30 shadow-2xl bg-neutral-800">
              <video
                ref={localVideoRef}
                autoPlay muted playsInline
                className="w-full h-full object-cover"
              />
              {!isCameraOn && (
                <div className="absolute inset-0 flex items-center justify-center bg-neutral-800">
                  <VideoOff className="text-white/50 w-6 h-6" />
                </div>
              )}
            </div>
          </div>

          {/* CALL CONTROLS */}
          <div className="shrink-0 flex justify-center items-center gap-5 py-5 px-4 bg-gradient-to-t from-black to-black/80">

            {/* Mic */}
            <button
              type="button"
              onClick={toggleMic}
              className={`flex h-14 w-14 items-center justify-center rounded-full transition-all ${
                isMicOn ? "bg-neutral-700 hover:bg-neutral-600" : "bg-red-500 hover:bg-red-600"
              }`}
            >
              {isMicOn ? <Mic className="h-6 w-6 text-white" /> : <MicOff className="h-6 w-6 text-white" />}
            </button>

            {/* End call (center, bigger) */}
            <button
              type="button"
              onClick={() => endCall()}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/40 transition-all"
            >
              <PhoneOff className="h-7 w-7 text-white" />
            </button>

            {/* Camera */}
            <button
              type="button"
              onClick={toggleCamera}
              className={`flex h-14 w-14 items-center justify-center rounded-full transition-all ${
                isCameraOn ? "bg-neutral-700 hover:bg-neutral-600" : "bg-red-500 hover:bg-red-600"
              }`}
            >
              {isCameraOn ? <Video className="h-6 w-6 text-white" /> : <VideoOff className="h-6 w-6 text-white" />}
            </button>

            {/* Rotate */}
            <button
              type="button"
              onClick={() => setRemoteViewRotate((d) => (d + 90) % 360)}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-neutral-700 hover:bg-neutral-600 transition-all"
            >
              <RotateCw className="h-6 w-6 text-white" />
            </button>
          </div>
        </div>
      )}

      {/* ===== MESSAGES ===== */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1 bg-base-200"
        style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(0,0,0,0.04) 1px, transparent 0)", backgroundSize: "24px 24px" }}>

        {messages.map((msg, i) => {
          const isMine = msg.senderId === authUser._id;
          const prevMsg = messages[i - 1];
          const showAvatar = !isMine && prevMsg?.senderId !== msg.senderId;

          return (
            <div
              key={msg._id}
              className={`flex items-end gap-2 ${isMine ? "flex-row-reverse" : "flex-row"}`}
            >
              {/* Avatar — only for received messages, only when sender changes */}
              {!isMine && (
                <div className="w-7 h-7 flex-shrink-0 self-end mb-1">
                  {showAvatar ? (
                    <img
                      src={selectedUser?.profilePic || "/avatar.png"}
                      className="w-7 h-7 rounded-full object-cover"
                      alt=""
                    />
                  ) : (
                    <div className="w-7 h-7" />
                  )}
                </div>
              )}

              {/* Bubble */}
              <div className={`max-w-[72%] sm:max-w-[60%] flex flex-col ${isMine ? "items-end" : "items-start"}`}>

                {/* Image */}
                {msg.image && (
                  <div className={`mb-1 rounded-2xl overflow-hidden shadow-sm ${isMine ? "rounded-br-sm" : "rounded-bl-sm"}`}>
                    <img
                      src={msg.image}
                      alt="sent"
                      className="max-w-[220px] sm:max-w-[260px] max-h-[320px] object-cover cursor-pointer"
                      onClick={() => window.open(msg.image, "_blank")}
                    />
                  </div>
                )}

                {/* Document */}
                {msg.document && (
                  <div className={`mb-1 px-3 py-2 rounded-2xl shadow-sm flex items-center gap-2 ${isMine ? "bg-emerald-500 rounded-br-sm" : "bg-base-100 rounded-bl-sm"}`}>
                    <FileText className={`${isMine ? "text-white" : "text-emerald-500"} w-5 h-5 flex-shrink-0`} />
                    <a
                      href={msg.document.base64}
                      download={msg.document.name}
                      className={`text-sm font-medium truncate max-w-[150px] ${isMine ? "text-white underline" : "text-base-content underline"}`}
                    >
                      {msg.document.name}
                    </a>
                  </div>
                )}

                {/* Text bubble */}
                {msg.text && (
                  <div
                    className={`px-3 py-2 rounded-2xl text-sm leading-relaxed shadow-sm ${
                      isMine
                        ? "bg-emerald-500 text-white rounded-br-sm"
                        : "bg-base-100 text-base-content rounded-bl-sm"
                    }`}
                  >
                    {msg.text}
                    {/* Timestamp inside bubble */}
                    <span className={`text-[10px] ml-2 align-bottom ${isMine ? "text-white/60" : "text-base-content/40"}`}>
                      {formatMessageTime(msg.createdAt)}
                    </span>
                  </div>
                )}

                {/* Timestamp below image or document (if no text) */}
                {(msg.image || msg.document) && !msg.text && (
                  <span className={`text-[10px] mt-0.5 ${isMine ? "text-base-content/40 text-right" : "text-base-content/40"}`}>
                    {formatMessageTime(msg.createdAt)}
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {typingUser && (
          <div className="flex items-end gap-2 py-2">
            <div className="w-7 h-7 flex-shrink-0 self-end mb-1">
              <img
                src={selectedUser?.profilePic || "/avatar.png"}
                className="w-7 h-7 rounded-full object-cover"
                alt=""
              />
            </div>
            <TypingIndicator userName={typingUser.name} />
          </div>
        )}

        <div ref={messageEndRef} />
      </div>

      <MessageInput />
    </div>
  );
};

export default ChatContainer;















// import { useChatStore } from "../store/useChatStore";
// import { useAuthStore } from "../store/useAuthStore";
// import { useEffect, useRef, useState } from "react";
// import { Mic, MicOff, RotateCw, Video, VideoOff } from "lucide-react";
// import ChatHeader from "./ChatHeader";
// import MessageInput from "./MessageInput";
// import MessageSkeleton from "./skeletons/MessageSkeleton";
// import { formatMessageTime } from "../lib/utils";

// const ChatContainer = ({ onBack }) => {
//   const {
//     messages, getMessages, isMessagesLoading, selectedUser,
//     subscribeToMessages, unsubscribeFromMessages,
//     isCalling, outgoingCall, endCall,
//     localStream, remoteStream,
//     toggleMic, toggleCamera, isMicOn, isCameraOn,
//   } = useChatStore();

//   const { authUser } = useAuthStore();
//   const messageEndRef = useRef(null);
//   const localVideoRef = useRef(null);
//   const remoteVideoRef = useRef(null);
//   const remoteAudioRef = useRef(null);
//   const [remoteViewRotate, setRemoteViewRotate] = useState(0);

//   useEffect(() => {
//     if (!selectedUser?._id) return;
//     getMessages(selectedUser._id);
//     subscribeToMessages();
//     return () => unsubscribeFromMessages();
//   }, [selectedUser?._id]);

//   useEffect(() => {
//     messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages]);

//   /* 🎥 LOCAL VIDEO */
//   useEffect(() => {
//     const video = localVideoRef.current;
//     if (!video) return;
//     if (!localStream) { video.srcObject = null; return; }
//     video.srcObject = localStream;
//     video.muted = true;
//     video.playsInline = true;
//     video.play().catch(() => {});
//   }, [localStream]);

//   useEffect(() => {
//     if (!remoteStream) setRemoteViewRotate(0);
//   }, [remoteStream]);

//   /* 🎥 REMOTE VIDEO + AUDIO */
//   useEffect(() => {
//     const video = remoteVideoRef.current;
//     const audio = remoteAudioRef.current;
//     console.log("[ChatContainer] remoteStream effect:", remoteStream?.getTracks().map(t => t.kind));

//     if (!video || !audio) return;

//     if (!remoteStream) {
//       video.srcObject = null;
//       audio.srcObject = null;
//       video.style.transform = "";
//       video.style.objectFit = "";
//       return;
//     }

//     // Force reassign
//     video.srcObject = null;
//     audio.srcObject = null;

//     const vtrack = remoteStream.getVideoTracks()[0];
//     const settings = vtrack?.getSettings?.() ?? {};
//     const metaRot = typeof settings.rotation === "number" ? settings.rotation : 0;
//     const totalDeg = ((metaRot + remoteViewRotate) % 360 + 360) % 360;

//     video.srcObject = remoteStream;
//     video.setAttribute("playsinline", "");
//     video.setAttribute("webkit-playsinline", "true");
//     video.playsInline = true;
//     video.muted = true;
//     video.controls = false;

//     if (totalDeg !== 0) {
//       video.style.transform = `rotate(${totalDeg}deg)`;
//       video.style.objectFit = "contain";
//     } else {
//       video.style.transform = "";
//       video.style.objectFit = "cover";
//     }

//     const atracks = remoteStream.getAudioTracks();
//     if (atracks.length > 0) {
//       audio.srcObject = new MediaStream(atracks);
//       audio.muted = false;
//       audio.playsInline = true;
//     }

//     const playVideo = async () => { try { await video.play(); } catch {} };
//     const playAudio = async () => { try { audio.muted = false; await audio.play(); } catch {} };

//     const onVideoUnmute = () => void playVideo();
//     const onAudioUnmute = () => void playAudio();

//     vtrack?.addEventListener("unmute", onVideoUnmute);
//     atracks.forEach((t) => t.addEventListener("unmute", onAudioUnmute));
//     video.onloadedmetadata = () => void playVideo();
//     video.oncanplay = () => void playVideo();
//     audio.oncanplay = () => void playAudio();

//     void playVideo();
//     void playAudio();

//     return () => {
//       vtrack?.removeEventListener("unmute", onVideoUnmute);
//       atracks.forEach((t) => t.removeEventListener("unmute", onAudioUnmute));
//       video.onloadedmetadata = null;
//       video.oncanplay = null;
//       audio.oncanplay = null;
//       video.style.transform = "";
//       video.style.objectFit = "";
//     };
//   }, [remoteStream, remoteStream?.getTracks().length, remoteViewRotate]);

//   if (isMessagesLoading) {
//     return (
//       <div className="flex flex-col h-full">
//         <ChatHeader onBack={onBack} />
//         <MessageSkeleton />
//         <MessageInput />
//       </div>
//     );
//   }

//   return (
//     <div className="flex flex-col h-full overflow-hidden relative">
//       <ChatHeader onBack={onBack} />

//       {(isCalling || outgoingCall) && (
//         <div className="absolute inset-0 z-50 flex flex-col bg-black">
//           <div className="relative flex flex-1 min-h-0 items-center justify-center overflow-hidden bg-neutral-900">

//             <video
//               ref={remoteVideoRef}
//               autoPlay playsInline muted
//               className="h-full w-full object-cover bg-neutral-900"
//             />
//             <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />

//             <video
//               ref={localVideoRef}
//               autoPlay muted playsInline
//               className="absolute bottom-20 right-4 w-40 h-28 sm:w-44 sm:h-32 rounded-xl border-2 border-white/90 shadow-lg object-cover bg-neutral-800"
//             />

//             {!remoteStream && (
//               <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
//                 <p className="text-white/60 text-sm animate-pulse">
//                   {outgoingCall ? "Calling…" : "Connecting…"}
//                 </p>
//               </div>
//             )}
//           </div>

//           <div className="shrink-0 flex justify-center gap-4 pb-6 pt-3 bg-gradient-to-t from-black/80 to-transparent">
//             <button type="button" onClick={toggleMic}
//               className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-700 text-white hover:bg-neutral-600">
//               {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
//             </button>

//             <button type="button" onClick={toggleCamera}
//               className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-700 text-white hover:bg-neutral-600">
//               {isCameraOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
//             </button>

//             <button type="button" onClick={() => setRemoteViewRotate((d) => (d + 90) % 360)}
//               className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-700 text-white hover:bg-neutral-600">
//               <RotateCw className="h-5 w-5" />
//             </button>

//             <button type="button" onClick={() => endCall()}
//               className="rounded-full bg-red-600 px-8 py-3 text-sm font-semibold text-white hover:bg-red-700">
//               End
//             </button>
//           </div>
//         </div>
//       )}

//       <div className="flex-1 overflow-y-auto p-4 space-y-4">
//         {messages.map((msg) => (
//           <div key={msg._id}
//             className={`chat ${msg.senderId === authUser._id ? "chat-end" : "chat-start"}`}>
//             <div className="chat-image avatar">
//               <div className="size-10 rounded-full border">
//                 <img src={msg.senderId === authUser._id
//                   ? authUser.profilePic || "/avatar.png"
//                   : selectedUser.profilePic || "/avatar.png"} />
//               </div>
//             </div>
//             <div className="chat-header mb-1">
//               <time className="text-xs opacity-50 ml-1">{formatMessageTime(msg.createdAt)}</time>
//             </div>
//             <div className="chat-bubble max-w-xs">{msg.text}</div>
//           </div>
//         ))}
//         <div ref={messageEndRef} />
//       </div>

//       <MessageInput />
//     </div>
//   );
// };

// export default ChatContainer;




// import { useChatStore } from "../store/useChatStore";
// import { useAuthStore } from "../store/useAuthStore";
// import { useEffect, useRef, useState } from "react";

// import { Mic, MicOff, RotateCw, Video, VideoOff } from "lucide-react";
// import ChatHeader from "./ChatHeader";
// import MessageInput from "./MessageInput";
// import MessageSkeleton from "./skeletons/MessageSkeleton";
// import { formatMessageTime } from "../lib/utils";

// const ChatContainer = ({ onBack }) => {
//   const {
//     messages,
//     getMessages,
//     isMessagesLoading,
//     selectedUser,
//     subscribeToMessages,
//     unsubscribeFromMessages,

//     /* CALL STATE */
//     isCalling,
//     outgoingCall,
//     endCall,

//     localStream,
//     remoteStream,

//     toggleMic,
//     toggleCamera,
//     isMicOn,
//     isCameraOn,
//   } = useChatStore();

//   const { authUser } = useAuthStore();

//   const messageEndRef = useRef(null);
//   const localVideoRef = useRef(null);
//   const remoteVideoRef = useRef(null);
//   const remoteAudioRef = useRef(null);
//   const [remoteViewRotate, setRemoteViewRotate] = useState(0);

//   /* 🔥 MESSAGE SOCKET */
//   useEffect(() => {
//     if (!selectedUser?._id) return;
//     getMessages(selectedUser._id);
//     subscribeToMessages();
//     return () => unsubscribeFromMessages();
//   }, [selectedUser?._id]);

//   /* 🔽 AUTO SCROLL */
//   useEffect(() => {
//     messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages]);

//   /* 🎥 LOCAL VIDEO */
//   useEffect(() => {
//     const video = localVideoRef.current;
//     if (!video) return;
//     if (!localStream) {
//       video.srcObject = null;
//       return;
//     }
//     video.srcObject = localStream;
//     video.muted = true;
//     video.playsInline = true;
//     video.play().catch(() => {});
//   }, [localStream]);

//   /* Reset rotation when call ends */
//   useEffect(() => {
//     if (!remoteStream) setRemoteViewRotate(0);
//   }, [remoteStream]);

//   /* 🎥 REMOTE VIDEO + AUDIO
//      ✅ FIX 1: video is muted (prevents autoplay block), audio plays from separate <audio> element
//      ✅ FIX 2: playsinline set both as attribute and property (mobile Safari fix)
//      ✅ FIX 3: play() called on every remoteStream change + on loadedmetadata
//   */
//   useEffect(() => {
//     const video = remoteVideoRef.current;
//     const audio = remoteAudioRef.current;
//     console.log("[ChatContainer] remoteStream effect fired:", remoteStream?.getTracks().map(t=>t.kind));
//     if (!video || !audio) return;

//     if (!remoteStream) {
//       video.srcObject = null;
//       audio.srcObject = null;
//       video.style.transform = "";
//       video.style.objectFit = "";
//       return;
//     }

//     // ✅ Force srcObject reassign even if same stream
//     video.srcObject = null;
//     audio.srcObject = null;

//     // --- Rotation ---
//     const vtrack = remoteStream.getVideoTracks()[0];
//     const settings = vtrack?.getSettings?.() ?? {};
//     const metaRot = typeof settings.rotation === "number" ? settings.rotation : 0;
//     const totalDeg = ((metaRot + remoteViewRotate) % 360 + 360) % 360;

//     // --- Attach video stream (muted for reliable autoplay) ---
//     video.srcObject = remoteStream;
//     video.setAttribute("playsinline", "");
//     video.setAttribute("webkit-playsinline", "true");
//     video.playsInline = true;
//     video.muted = true;
//     video.controls = false;

//     if (totalDeg !== 0) {
//       video.style.transform = `rotate(${totalDeg}deg)`;
//       video.style.objectFit = "contain";
//     } else {
//       video.style.transform = "";
//       video.style.objectFit = "cover";
//     }

//     // --- Attach ONLY audio tracks to <audio> element ---
//     const atracks = remoteStream.getAudioTracks();
//     if (atracks.length > 0) {
//       const aStream = new MediaStream(atracks);
//       audio.srcObject = aStream;
//       audio.muted = false;
//       audio.playsInline = true;
//     }

//     const playVideo = async () => {
//       try {
//         await video.play();
//       } catch (e) {
//         // muted video — autoplay should always succeed; ignore if not
//       }
//     };

//     const playAudio = async () => {
//       try {
//         audio.muted = false;
//         await audio.play();
//       } catch (e) {
//         // Will retry on next user interaction or unmute event
//       }
//     };

//     // ✅ FIX: Retry play on track unmute (mobile sometimes mutes tracks initially)
//     const onVideoUnmute = () => void playVideo();
//     const onAudioUnmute = () => void playAudio();

//     vtrack?.addEventListener("unmute", onVideoUnmute);
//     atracks.forEach((t) => t.addEventListener("unmute", onAudioUnmute));

//     video.onloadedmetadata = () => void playVideo();
//     video.oncanplay = () => void playVideo();
//     audio.oncanplay = () => void playAudio();

//     // ✅ FIX: Also try immediately
//     void playVideo();
//     void playAudio();

//     return () => {
//       vtrack?.removeEventListener("unmute", onVideoUnmute);
//       atracks.forEach((t) => t.removeEventListener("unmute", onAudioUnmute));
//       video.onloadedmetadata = null;
//       video.oncanplay = null;
//       audio.oncanplay = null;
//       video.style.transform = "";
//       video.style.objectFit = "";
//     };
//   }, [remoteStream, remoteStream?.getTracks().length, remoteViewRotate]);

//   /* ================= LOADING ================= */
//   if (isMessagesLoading) {
//     return (
//       <div className="flex flex-col h-full">
//         <ChatHeader onBack={onBack} />
//         <MessageSkeleton />
//         <MessageInput />
//       </div>
//     );
//   }

//   return (
//     <div className="flex flex-col h-full overflow-hidden relative">
//       <ChatHeader onBack={onBack} />

//       {/* ====== ACTIVE CALL UI ====== */}
//       {(isCalling || outgoingCall) && (
//         <div className="absolute inset-0 z-50 flex flex-col bg-black">

//           {/* VIDEO AREA */}
//           <div className="relative flex flex-1 min-h-0 items-center justify-center overflow-hidden bg-neutral-900">

//             {/* REMOTE VIDEO — full screen, muted (audio plays from <audio> below) */}
//             <video
//               ref={remoteVideoRef}
//               autoPlay
//               playsInline
//               muted
//               className="h-full w-full object-cover bg-neutral-900"
//             />

//             {/* REMOTE AUDIO — separate element so it's never blocked by video.muted */}
//             {/* ✅ FIX: autoPlay + playsInline on audio element */}
//             <audio
//               ref={remoteAudioRef}
//               autoPlay
//               playsInline
//               className="hidden"
//             />

//             {/* LOCAL VIDEO — picture-in-picture */}
//             <video
//               ref={localVideoRef}
//               autoPlay
//               muted
//               playsInline
//               className="absolute bottom-20 right-4 w-40 h-28 sm:w-44 sm:h-32 rounded-xl border-2 border-white/90 shadow-lg object-cover bg-neutral-800"
//             />

//             {/* Waiting label when remote not connected yet */}
//             {!remoteStream && (
//               <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
//                 <p className="text-white/60 text-sm animate-pulse">
//                   {outgoingCall ? "Calling…" : "Connecting…"}
//                 </p>
//               </div>
//             )}
//           </div>

//           {/* CONTROLS */}
//           <div className="shrink-0 flex justify-center gap-4 pb-6 pt-3 bg-gradient-to-t from-black/80 to-transparent">

//             {/* MIC */}
//             <button
//               type="button"
//               onClick={toggleMic}
//               className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-700 text-white hover:bg-neutral-600"
//               title={isMicOn ? "Mute" : "Unmute"}
//             >
//               {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
//             </button>

//             {/* CAMERA */}
//             <button
//               type="button"
//               onClick={toggleCamera}
//               className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-700 text-white hover:bg-neutral-600"
//               title={isCameraOn ? "Camera off" : "Camera on"}
//             >
//               {isCameraOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
//             </button>

//             {/* ROTATE (fix sideways remote video) */}
//             <button
//               type="button"
//               onClick={() => setRemoteViewRotate((d) => (d + 90) % 360)}
//               className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-700 text-white hover:bg-neutral-600"
//               title="Rotate remote view"
//             >
//               <RotateCw className="h-5 w-5" />
//             </button>

//             {/* END */}
//             <button
//               type="button"
//               onClick={() => endCall()}
//               className="rounded-full bg-red-600 px-8 py-3 text-sm font-semibold text-white hover:bg-red-700"
//             >
//               End
//             </button>
//           </div>
//         </div>
//       )}

//       {/* 💬 MESSAGES */}
//       <div className="flex-1 overflow-y-auto p-4 space-y-4">
//         {messages.map((msg) => (
//           <div
//             key={msg._id}
//             className={`chat ${msg.senderId === authUser._id ? "chat-end" : "chat-start"}`}
//           >
//             <div className="chat-image avatar">
//               <div className="size-10 rounded-full border">
//                 <img
//                   src={
//                     msg.senderId === authUser._id
//                       ? authUser.profilePic || "/avatar.png"
//                       : selectedUser.profilePic || "/avatar.png"
//                   }
//                 />
//               </div>
//             </div>
//             <div className="chat-header mb-1">
//               <time className="text-xs opacity-50 ml-1">
//                 {formatMessageTime(msg.createdAt)}
//               </time>
//             </div>
//             <div className="chat-bubble max-w-xs">{msg.text}</div>
//           </div>
//         ))}
//         <div ref={messageEndRef} />
//       </div>

//       <MessageInput />
//     </div>
//   );
// };

// export default ChatContainer;







// import { useChatStore } from "../store/useChatStore";
// import { useAuthStore } from "../store/useAuthStore";
// import { useEffect, useRef, useState } from "react";

// import { Mic, MicOff, RotateCw, Video, VideoOff } from "lucide-react";
// import ChatHeader from "./ChatHeader";
// import MessageInput from "./MessageInput";
// import MessageSkeleton from "./skeletons/MessageSkeleton";
// import { formatMessageTime } from "../lib/utils";

// const ChatContainer = ({ onBack }) => {
//   const {
//     messages,
//     getMessages,
//     isMessagesLoading,
//     selectedUser,
//     subscribeToMessages,
//     unsubscribeFromMessages,

//     /* CALL STATE */
//     isCalling,
//     outgoingCall,
//     endCall,

//     localStream,
//     remoteStream,

//     toggleMic,
//     toggleCamera,
//     isMicOn,
//     isCameraOn,
//   } = useChatStore();

//   const { authUser } = useAuthStore();

//   const messageEndRef = useRef(null);
//   const localVideoRef = useRef(null);
//   const remoteVideoRef = useRef(null);
//   const remoteAudioRef = useRef(null);
//   const [remoteViewRotate, setRemoteViewRotate] = useState(0);

//   /* 🔥 MESSAGE SOCKET */
//   useEffect(() => {
//     if (!selectedUser?._id) return;
//     getMessages(selectedUser._id);
//     subscribeToMessages();
//     return () => unsubscribeFromMessages();
//   }, [selectedUser?._id]);

//   /* 🔽 AUTO SCROLL */
//   useEffect(() => {
//     messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages]);

//   /* 🎥 LOCAL VIDEO */
//   useEffect(() => {
//     const video = localVideoRef.current;
//     if (!video) return;
//     if (!localStream) {
//       video.srcObject = null;
//       return;
//     }
//     video.srcObject = localStream;
//     video.muted = true;
//     video.playsInline = true;
//     video.play().catch(() => {});
//   }, [localStream]);

//   /* Reset rotation when call ends */
//   useEffect(() => {
//     if (!remoteStream) setRemoteViewRotate(0);
//   }, [remoteStream]);

//   /* 🎥 REMOTE VIDEO + AUDIO
//      ✅ FIX 1: video is muted (prevents autoplay block), audio plays from separate <audio> element
//      ✅ FIX 2: playsinline set both as attribute and property (mobile Safari fix)
//      ✅ FIX 3: play() called on every remoteStream change + on loadedmetadata
//   */
//   useEffect(() => {
//     const video = remoteVideoRef.current;
//     const audio = remoteAudioRef.current;
//     if (!video || !audio) return;

//     if (!remoteStream) {
//       video.srcObject = null;
//       audio.srcObject = null;
//       video.style.transform = "";
//       video.style.objectFit = "";
//       return;
//     }

//     // --- Rotation ---
//     const vtrack = remoteStream.getVideoTracks()[0];
//     const settings = vtrack?.getSettings?.() ?? {};
//     const metaRot = typeof settings.rotation === "number" ? settings.rotation : 0;
//     const totalDeg = ((metaRot + remoteViewRotate) % 360 + 360) % 360;

//     // --- Attach video stream (muted for reliable autoplay) ---
//     video.srcObject = remoteStream;
//     video.setAttribute("playsinline", "");
//     video.setAttribute("webkit-playsinline", "true");
//     video.playsInline = true;
//     video.muted = true;
//     video.controls = false;

//     if (totalDeg !== 0) {
//       video.style.transform = `rotate(${totalDeg}deg)`;
//       video.style.objectFit = "contain";
//     } else {
//       video.style.transform = "";
//       video.style.objectFit = "cover";
//     }

//     // --- Attach ONLY audio tracks to <audio> element ---
//     const atracks = remoteStream.getAudioTracks();
//     if (atracks.length > 0) {
//       const aStream = new MediaStream(atracks);
//       audio.srcObject = aStream;
//       audio.muted = false;
//       audio.playsInline = true;
//     }

//     const playVideo = async () => {
//       try {
//         await video.play();
//       } catch (e) {
//         // muted video — autoplay should always succeed; ignore if not
//       }
//     };

//     const playAudio = async () => {
//       try {
//         audio.muted = false;
//         await audio.play();
//       } catch (e) {
//         // Will retry on next user interaction or unmute event
//       }
//     };

//     // ✅ FIX: Retry play on track unmute (mobile sometimes mutes tracks initially)
//     const onVideoUnmute = () => void playVideo();
//     const onAudioUnmute = () => void playAudio();

//     vtrack?.addEventListener("unmute", onVideoUnmute);
//     atracks.forEach((t) => t.addEventListener("unmute", onAudioUnmute));

//     video.onloadedmetadata = () => void playVideo();
//     video.oncanplay = () => void playVideo();
//     audio.oncanplay = () => void playAudio();

//     // ✅ FIX: Also try immediately
//     void playVideo();
//     void playAudio();

//     return () => {
//       vtrack?.removeEventListener("unmute", onVideoUnmute);
//       atracks.forEach((t) => t.removeEventListener("unmute", onAudioUnmute));
//       video.onloadedmetadata = null;
//       video.oncanplay = null;
//       audio.oncanplay = null;
//       video.style.transform = "";
//       video.style.objectFit = "";
//     };
//   }, [remoteStream, remoteStream?.getTracks().length, remoteViewRotate]);

//   /* ================= LOADING ================= */
//   if (isMessagesLoading) {
//     return (
//       <div className="flex flex-col h-full">
//         <ChatHeader onBack={onBack} />
//         <MessageSkeleton />
//         <MessageInput />
//       </div>
//     );
//   }

//   return (
//     <div className="flex flex-col h-full overflow-hidden relative">
//       <ChatHeader onBack={onBack} />

//       {/* ====== ACTIVE CALL UI ====== */}
//       {(isCalling || outgoingCall) && (
//         <div className="absolute inset-0 z-50 flex flex-col bg-black">

//           {/* VIDEO AREA */}
//           <div className="relative flex flex-1 min-h-0 items-center justify-center overflow-hidden bg-neutral-900">

//             {/* REMOTE VIDEO — full screen, muted (audio plays from <audio> below) */}
//             <video
//               ref={remoteVideoRef}
//               autoPlay
//               playsInline
//               muted
//               className="h-full w-full object-cover bg-neutral-900"
//             />

//             {/* REMOTE AUDIO — separate element so it's never blocked by video.muted */}
//             {/* ✅ FIX: autoPlay + playsInline on audio element */}
//             <audio
//               ref={remoteAudioRef}
//               autoPlay
//               playsInline
//               className="hidden"
//             />

//             {/* LOCAL VIDEO — picture-in-picture */}
//             <video
//               ref={localVideoRef}
//               autoPlay
//               muted
//               playsInline
//               className="absolute bottom-20 right-4 w-40 h-28 sm:w-44 sm:h-32 rounded-xl border-2 border-white/90 shadow-lg object-cover bg-neutral-800"
//             />

//             {/* Waiting label when remote not connected yet */}
//             {!remoteStream && (
//               <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
//                 <p className="text-white/60 text-sm animate-pulse">
//                   {outgoingCall ? "Calling…" : "Connecting…"}
//                 </p>
//               </div>
//             )}
//           </div>

//           {/* CONTROLS */}
//           <div className="shrink-0 flex justify-center gap-4 pb-6 pt-3 bg-gradient-to-t from-black/80 to-transparent">

//             {/* MIC */}
//             <button
//               type="button"
//               onClick={toggleMic}
//               className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-700 text-white hover:bg-neutral-600"
//               title={isMicOn ? "Mute" : "Unmute"}
//             >
//               {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
//             </button>

//             {/* CAMERA */}
//             <button
//               type="button"
//               onClick={toggleCamera}
//               className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-700 text-white hover:bg-neutral-600"
//               title={isCameraOn ? "Camera off" : "Camera on"}
//             >
//               {isCameraOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
//             </button>

//             {/* ROTATE (fix sideways remote video) */}
//             <button
//               type="button"
//               onClick={() => setRemoteViewRotate((d) => (d + 90) % 360)}
//               className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-700 text-white hover:bg-neutral-600"
//               title="Rotate remote view"
//             >
//               <RotateCw className="h-5 w-5" />
//             </button>

//             {/* END */}
//             <button
//               type="button"
//               onClick={() => endCall()}
//               className="rounded-full bg-red-600 px-8 py-3 text-sm font-semibold text-white hover:bg-red-700"
//             >
//               End
//             </button>
//           </div>
//         </div>
//       )}

//       {/* 💬 MESSAGES */}
//       <div className="flex-1 overflow-y-auto p-4 space-y-4">
//         {messages.map((msg) => (
//           <div
//             key={msg._id}
//             className={`chat ${msg.senderId === authUser._id ? "chat-end" : "chat-start"}`}
//           >
//             <div className="chat-image avatar">
//               <div className="size-10 rounded-full border">
//                 <img
//                   src={
//                     msg.senderId === authUser._id
//                       ? authUser.profilePic || "/avatar.png"
//                       : selectedUser.profilePic || "/avatar.png"
//                   }
//                 />
//               </div>
//             </div>
//             <div className="chat-header mb-1">
//               <time className="text-xs opacity-50 ml-1">
//                 {formatMessageTime(msg.createdAt)}
//               </time>
//             </div>
//             <div className="chat-bubble max-w-xs">{msg.text}</div>
//           </div>
//         ))}
//         <div ref={messageEndRef} />
//       </div>

//       <MessageInput />
//     </div>
//   );
// };

// export default ChatContainer;



// import { useChatStore } from "../store/useChatStore";
// import { useAuthStore } from "../store/useAuthStore";
// import { useEffect, useRef, useState } from "react";

// import { Mic, MicOff, RotateCw, Video, VideoOff } from "lucide-react";
// import ChatHeader from "./ChatHeader";
// import MessageInput from "./MessageInput";
// import MessageSkeleton from "./skeletons/MessageSkeleton";
// import { formatMessageTime } from "../lib/utils";

// const ChatContainer = ({ onBack }) => {
//   const {
//     messages,
//     getMessages,
//     isMessagesLoading,
//     selectedUser,
//     subscribeToMessages,
//     unsubscribeFromMessages,

//     /* CALL STATE */
//     isCalling,
//     outgoingCall,
//     endCall,

//     localStream,
//     remoteStream,

//     toggleMic,
//     toggleCamera,
//     isMicOn,
//     isCameraOn,
//   } = useChatStore();

//   const { authUser } = useAuthStore();

//   const messageEndRef = useRef(null);
//   const localVideoRef = useRef(null);
//   const remoteVideoRef = useRef(null);
//   /** Remote audio plays from a dedicated element so autoplay never blocks it. */
//   const remoteAudioRef = useRef(null);
//   /** Manual fix when remote looks sideways (phone → laptop). Cycles 0° → 90° → … */
//   const [remoteViewRotate, setRemoteViewRotate] = useState(0);

//   /* Call listeners are registered once in App when the user logs in */

//   /* 🔥 MESSAGE SOCKET */
//   useEffect(() => {
//     if (!selectedUser?._id) return;

//     getMessages(selectedUser._id);
//     subscribeToMessages();

//     return () => unsubscribeFromMessages();
//   }, [selectedUser?._id]);

//   /* 🔽 AUTO SCROLL */
//   useEffect(() => {
//     messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages]);

//   /* 🎥 LOCAL VIDEO */
//   useEffect(() => {
//     const video = localVideoRef.current;
//     if (!video) return;
//     if (!localStream) {
//       video.srcObject = null;
//       return;
//     }
//     video.srcObject = localStream;
//     video.muted = true;
//     video.playsInline = true;
//     video.play().catch(() => {});
//   }, [localStream]);

//   useEffect(() => {
//     if (!remoteStream) setRemoteViewRotate(0);
//   }, [remoteStream]);

//   /* 🎥 REMOTE:
//      - Video stays muted (for stable autoplay + black-screen prevention)
//      - Audio plays from a separate <audio> element (so it never depends on video.muted)
//   */
//   useEffect(() => {
//     const video = remoteVideoRef.current;
//     const audio = remoteAudioRef.current;
//     if (!video || !audio) return;

//     if (!remoteStream) {
//       video.srcObject = null;
//       audio.srcObject = null;
//       video.style.transform = "";
//       video.style.objectFit = "";
//       return;
//     }

//     const vtrack = remoteStream.getVideoTracks()[0];
//     const settings = vtrack?.getSettings?.() ?? {};
//     const metaRot =
//       typeof settings.rotation === "number" ? settings.rotation : 0;
//     const totalDeg = ((metaRot + remoteViewRotate) % 360 + 360) % 360;

//     video.srcObject = remoteStream;
//     video.setAttribute("playsinline", "");
//     video.setAttribute("webkit-playsinline", "true");
//     video.playsInline = true;
//     video.controls = false;

//     if (totalDeg !== 0) {
//       video.style.transform = `rotate(${totalDeg}deg)`;
//       video.style.objectFit = "contain";
//     } else {
//       video.style.transform = "";
//       video.style.objectFit = "cover";
//     }

//     // Video: muted for reliable rendering across devices.
//     video.muted = true;
//     video.controls = false;

//     // Bind audio tracks only (so audio doesn't get blocked by video.muted).
//     const atracks = remoteStream.getAudioTracks();
//     const aStream = new MediaStream(atracks);
//     audio.srcObject = aStream;
//     audio.muted = false;
//     audio.playsInline = true;

//     const playVideo = async () => {
//       try {
//         video.muted = true;
//         await video.play();
//       } catch {
//         // Ignore autoplay failures for muted video; it will still render.
//       }
//     };

//     const playAudio = async () => {
//       try {
//         audio.muted = false;
//         await audio.play();
//       } catch {
//         // If user interaction is required, the next unmute/play attempt will fix.
//       }
//     };

//     const onTrackUnmute = () => {
//       void playAudio();
//     };

//     const onVideoUnmute = () => void playVideo();
//     vtrack?.addEventListener?.("unmute", onVideoUnmute);
//     atracks.forEach((t) => t.addEventListener?.("unmute", onTrackUnmute));
//     video.onloadedmetadata = () => void playVideo();
//     video.oncanplay = () => void playVideo();
//     audio.oncanplay = () => void playAudio();

//     void playVideo();
//     void playAudio();

//     return () => {
//       vtrack?.removeEventListener?.("unmute", onVideoUnmute);
//       atracks.forEach((t) => t.removeEventListener?.("unmute", onTrackUnmute));
//       video.onloadedmetadata = null;
//       video.oncanplay = null;
//       audio.oncanplay = null;
//       video.style.transform = "";
//       video.style.objectFit = "";
//     };
//   }, [remoteStream, remoteStream?.getTracks().length, remoteViewRotate]);

//   /* ================= LOADING ================= */
//   if (isMessagesLoading) {
//     return (
//       <div className="flex flex-col h-full">
//         <ChatHeader onBack={onBack} />
//         <MessageSkeleton />
//         <MessageInput />
//       </div>
//     );
//   }

//   return (
//     <div className="flex flex-col h-full overflow-hidden relative">
//       <ChatHeader onBack={onBack} />

//       {/* Active / dialing: show media when local or remote stream exists */}
//       {(isCalling || outgoingCall) && (
//         <div className="absolute inset-0 z-50 flex flex-col bg-black">
//           <div className="relative flex flex-1 min-h-0 items-center justify-center overflow-hidden bg-neutral-900">
//             <video
//               ref={remoteVideoRef}
//               autoPlay
//               playsInline
//               className="h-full w-full bg-neutral-900 sm:absolute sm:inset-0"
//             />
//             <audio ref={remoteAudioRef} playsInline className="hidden" />

//             <video
//               ref={localVideoRef}
//               autoPlay
//               muted
//               playsInline
//               className="absolute bottom-20 right-4 w-40 h-28 sm:w-44 sm:h-32 rounded-xl border-2 border-white/90 shadow-lg object-cover bg-neutral-800"
//             />
//           </div>

//           <div className="shrink-0 flex justify-center gap-4 pb-6 pt-2 bg-gradient-to-t from-black/80 to-transparent">
//             <button
//               type="button"
//               onClick={toggleMic}
//               className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-700 text-white hover:bg-neutral-600"
//               title={isMicOn ? "Mute" : "Unmute"}
//             >
//               {isMicOn ? (
//                 <Mic className="h-5 w-5" />
//               ) : (
//                 <MicOff className="h-5 w-5" />
//               )}
//             </button>

//             <button
//               type="button"
//               onClick={toggleCamera}
//               className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-700 text-white hover:bg-neutral-600"
//               title={isCameraOn ? "Camera off" : "Camera on"}
//             >
//               {isCameraOn ? (
//                 <Video className="h-5 w-5" />
//               ) : (
//                 <VideoOff className="h-5 w-5" />
//               )}
//             </button>

//             <button
//               type="button"
//               onClick={() => setRemoteViewRotate((d) => (d + 90) % 360)}
//               className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-700 text-white hover:bg-neutral-600"
//               title="Rotate remote view"
//             >
//               <RotateCw className="h-5 w-5" />
//             </button>

//             <button
//               type="button"
//               onClick={() => endCall()}
//               className="rounded-full bg-red-600 px-8 py-3 text-sm font-semibold text-white hover:bg-red-700"
//             >
//               End
//             </button>
//           </div>
//         </div>
//       )}

//       {/* 💬 MESSAGES */}
//       <div className="flex-1 overflow-y-auto p-4 space-y-4">
//         {messages.map((msg) => (
//           <div
//             key={msg._id}
//             className={`chat ${
//               msg.senderId === authUser._id ? "chat-end" : "chat-start"
//             }`}
//           >
//             <div className="chat-image avatar">
//               <div className="size-10 rounded-full border">
//                 <img
//                   src={
//                     msg.senderId === authUser._id
//                       ? authUser.profilePic || "/avatar.png"
//                       : selectedUser.profilePic || "/avatar.png"
//                   }
//                 />
//               </div>
//             </div>

//             <div className="chat-header mb-1">
//               <time className="text-xs opacity-50 ml-1">
//                 {formatMessageTime(msg.createdAt)}
//               </time>
//             </div>

//             <div className="chat-bubble max-w-xs">{msg.text}</div>
//           </div>
//         ))}

//         <div ref={messageEndRef} />
//       </div>

//       <MessageInput />
//     </div>
//   );
// };

// export default ChatContainer;
