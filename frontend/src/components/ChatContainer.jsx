import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { useEffect, useRef, useState } from "react";

import { Mic, MicOff, RotateCw, Video, VideoOff } from "lucide-react";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { formatMessageTime } from "../lib/utils";

const ChatContainer = ({ onBack }) => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,

    /* CALL STATE */
    isCalling,
    outgoingCall,
    endCall,

    localStream,
    remoteStream,

    toggleMic,
    toggleCamera,
    isMicOn,
    isCameraOn,
  } = useChatStore();

  const { authUser } = useAuthStore();

  const messageEndRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const [remoteViewRotate, setRemoteViewRotate] = useState(0);

  /* 🔥 MESSAGE SOCKET */
  useEffect(() => {
    if (!selectedUser?._id) return;
    getMessages(selectedUser._id);
    subscribeToMessages();
    return () => unsubscribeFromMessages();
  }, [selectedUser?._id]);

  /* 🔽 AUTO SCROLL */
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* 🎥 LOCAL VIDEO */
  useEffect(() => {
    const video = localVideoRef.current;
    if (!video) return;
    if (!localStream) {
      video.srcObject = null;
      return;
    }
    video.srcObject = localStream;
    video.muted = true;
    video.playsInline = true;
    video.play().catch(() => {});
  }, [localStream]);

  /* Reset rotation when call ends */
  useEffect(() => {
    if (!remoteStream) setRemoteViewRotate(0);
  }, [remoteStream]);

  /* 🎥 REMOTE VIDEO + AUDIO
     ✅ FIX 1: video is muted (prevents autoplay block), audio plays from separate <audio> element
     ✅ FIX 2: playsinline set both as attribute and property (mobile Safari fix)
     ✅ FIX 3: play() called on every remoteStream change + on loadedmetadata
  */
  useEffect(() => {
    const video = remoteVideoRef.current;
    const audio = remoteAudioRef.current;
    console.log("[ChatContainer] remoteStream effect fired:", remoteStream?.getTracks().map(t=>t.kind));
    if (!video || !audio) return;

    if (!remoteStream) {
      video.srcObject = null;
      audio.srcObject = null;
      video.style.transform = "";
      video.style.objectFit = "";
      return;
    }

    // ✅ Force srcObject reassign even if same stream
    video.srcObject = null;
    audio.srcObject = null;

    // --- Rotation ---
    const vtrack = remoteStream.getVideoTracks()[0];
    const settings = vtrack?.getSettings?.() ?? {};
    const metaRot = typeof settings.rotation === "number" ? settings.rotation : 0;
    const totalDeg = ((metaRot + remoteViewRotate) % 360 + 360) % 360;

    // --- Attach video stream (muted for reliable autoplay) ---
    video.srcObject = remoteStream;
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "true");
    video.playsInline = true;
    video.muted = true;
    video.controls = false;

    if (totalDeg !== 0) {
      video.style.transform = `rotate(${totalDeg}deg)`;
      video.style.objectFit = "contain";
    } else {
      video.style.transform = "";
      video.style.objectFit = "cover";
    }

    // --- Attach ONLY audio tracks to <audio> element ---
    const atracks = remoteStream.getAudioTracks();
    if (atracks.length > 0) {
      const aStream = new MediaStream(atracks);
      audio.srcObject = aStream;
      audio.muted = false;
      audio.playsInline = true;
    }

    const playVideo = async () => {
      try {
        await video.play();
      } catch (e) {
        // muted video — autoplay should always succeed; ignore if not
      }
    };

    const playAudio = async () => {
      try {
        audio.muted = false;
        await audio.play();
      } catch (e) {
        // Will retry on next user interaction or unmute event
      }
    };

    // ✅ FIX: Retry play on track unmute (mobile sometimes mutes tracks initially)
    const onVideoUnmute = () => void playVideo();
    const onAudioUnmute = () => void playAudio();

    vtrack?.addEventListener("unmute", onVideoUnmute);
    atracks.forEach((t) => t.addEventListener("unmute", onAudioUnmute));

    video.onloadedmetadata = () => void playVideo();
    video.oncanplay = () => void playVideo();
    audio.oncanplay = () => void playAudio();

    // ✅ FIX: Also try immediately
    void playVideo();
    void playAudio();

    return () => {
      vtrack?.removeEventListener("unmute", onVideoUnmute);
      atracks.forEach((t) => t.removeEventListener("unmute", onAudioUnmute));
      video.onloadedmetadata = null;
      video.oncanplay = null;
      audio.oncanplay = null;
      video.style.transform = "";
      video.style.objectFit = "";
    };
  }, [remoteStream, remoteStream?.getTracks().length, remoteViewRotate]);

  /* ================= LOADING ================= */
  if (isMessagesLoading) {
    return (
      <div className="flex flex-col h-full">
        <ChatHeader onBack={onBack} />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden relative">
      <ChatHeader onBack={onBack} />

      {/* ====== ACTIVE CALL UI ====== */}
      {(isCalling || outgoingCall) && (
        <div className="absolute inset-0 z-50 flex flex-col bg-black">

          {/* VIDEO AREA */}
          <div className="relative flex flex-1 min-h-0 items-center justify-center overflow-hidden bg-neutral-900">

            {/* REMOTE VIDEO — full screen, muted (audio plays from <audio> below) */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full object-cover bg-neutral-900"
            />

            {/* REMOTE AUDIO — separate element so it's never blocked by video.muted */}
            {/* ✅ FIX: autoPlay + playsInline on audio element */}
            <audio
              ref={remoteAudioRef}
              autoPlay
              playsInline
              className="hidden"
            />

            {/* LOCAL VIDEO — picture-in-picture */}
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="absolute bottom-20 right-4 w-40 h-28 sm:w-44 sm:h-32 rounded-xl border-2 border-white/90 shadow-lg object-cover bg-neutral-800"
            />

            {/* Waiting label when remote not connected yet */}
            {!remoteStream && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <p className="text-white/60 text-sm animate-pulse">
                  {outgoingCall ? "Calling…" : "Connecting…"}
                </p>
              </div>
            )}
          </div>

          {/* CONTROLS */}
          <div className="shrink-0 flex justify-center gap-4 pb-6 pt-3 bg-gradient-to-t from-black/80 to-transparent">

            {/* MIC */}
            <button
              type="button"
              onClick={toggleMic}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-700 text-white hover:bg-neutral-600"
              title={isMicOn ? "Mute" : "Unmute"}
            >
              {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            </button>

            {/* CAMERA */}
            <button
              type="button"
              onClick={toggleCamera}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-700 text-white hover:bg-neutral-600"
              title={isCameraOn ? "Camera off" : "Camera on"}
            >
              {isCameraOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
            </button>

            {/* ROTATE (fix sideways remote video) */}
            <button
              type="button"
              onClick={() => setRemoteViewRotate((d) => (d + 90) % 360)}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-700 text-white hover:bg-neutral-600"
              title="Rotate remote view"
            >
              <RotateCw className="h-5 w-5" />
            </button>

            {/* END */}
            <button
              type="button"
              onClick={() => endCall()}
              className="rounded-full bg-red-600 px-8 py-3 text-sm font-semibold text-white hover:bg-red-700"
            >
              End
            </button>
          </div>
        </div>
      )}

      {/* 💬 MESSAGES */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg._id}
            className={`chat ${msg.senderId === authUser._id ? "chat-end" : "chat-start"}`}
          >
            <div className="chat-image avatar">
              <div className="size-10 rounded-full border">
                <img
                  src={
                    msg.senderId === authUser._id
                      ? authUser.profilePic || "/avatar.png"
                      : selectedUser.profilePic || "/avatar.png"
                  }
                />
              </div>
            </div>
            <div className="chat-header mb-1">
              <time className="text-xs opacity-50 ml-1">
                {formatMessageTime(msg.createdAt)}
              </time>
            </div>
            <div className="chat-bubble max-w-xs">{msg.text}</div>
          </div>
        ))}
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
