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
  /** Remote audio plays from a dedicated element so autoplay never blocks it. */
  const remoteAudioRef = useRef(null);
  /** Manual fix when remote looks sideways (phone → laptop). Cycles 0° → 90° → … */
  const [remoteViewRotate, setRemoteViewRotate] = useState(0);

  /* Call listeners are registered once in App when the user logs in */

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

  useEffect(() => {
    if (!remoteStream) setRemoteViewRotate(0);
  }, [remoteStream]);

  /* 🎥 REMOTE:
     - Video stays muted (for stable autoplay + black-screen prevention)
     - Audio plays from a separate <audio> element (so it never depends on video.muted)
  */
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

    const vtrack = remoteStream.getVideoTracks()[0];
    const settings = vtrack?.getSettings?.() ?? {};
    const metaRot =
      typeof settings.rotation === "number" ? settings.rotation : 0;
    const totalDeg = ((metaRot + remoteViewRotate) % 360 + 360) % 360;

    video.srcObject = remoteStream;
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "true");
    video.playsInline = true;
    video.controls = false;

    if (totalDeg !== 0) {
      video.style.transform = `rotate(${totalDeg}deg)`;
      video.style.objectFit = "contain";
    } else {
      video.style.transform = "";
      video.style.objectFit = "cover";
    }

    // Video: muted for reliable rendering across devices.
    video.muted = true;
    video.controls = false;

    // Bind audio tracks only (so audio doesn't get blocked by video.muted).
    const atracks = remoteStream.getAudioTracks();
    const aStream = new MediaStream(atracks);
    audio.srcObject = aStream;
    audio.muted = false;
    audio.playsInline = true;

    const playVideo = async () => {
      try {
        video.muted = true;
        await video.play();
      } catch {
        // Ignore autoplay failures for muted video; it will still render.
      }
    };

    const playAudio = async () => {
      try {
        audio.muted = false;
        await audio.play();
      } catch {
        // If user interaction is required, the next unmute/play attempt will fix.
      }
    };

    const onTrackUnmute = () => {
      void playAudio();
    };

    const onVideoUnmute = () => void playVideo();
    vtrack?.addEventListener?.("unmute", onVideoUnmute);
    atracks.forEach((t) => t.addEventListener?.("unmute", onTrackUnmute));
    video.onloadedmetadata = () => void playVideo();
    video.oncanplay = () => void playVideo();
    audio.oncanplay = () => void playAudio();

    void playVideo();
    void playAudio();

    return () => {
      vtrack?.removeEventListener?.("unmute", onVideoUnmute);
      atracks.forEach((t) => t.removeEventListener?.("unmute", onTrackUnmute));
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

      {/* Active / dialing: show media when local or remote stream exists */}
      {(isCalling || outgoingCall) && (
        <div className="absolute inset-0 z-50 flex flex-col bg-black">
          <div className="relative flex flex-1 min-h-0 items-center justify-center overflow-hidden bg-neutral-900">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="h-full w-full bg-neutral-900 sm:absolute sm:inset-0"
            />
            <audio ref={remoteAudioRef} playsInline className="hidden" />

            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="absolute bottom-20 right-4 w-40 h-28 sm:w-44 sm:h-32 rounded-xl border-2 border-white/90 shadow-lg object-cover bg-neutral-800"
            />
          </div>

          <div className="shrink-0 flex justify-center gap-4 pb-6 pt-2 bg-gradient-to-t from-black/80 to-transparent">
            <button
              type="button"
              onClick={toggleMic}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-700 text-white hover:bg-neutral-600"
              title={isMicOn ? "Mute" : "Unmute"}
            >
              {isMicOn ? (
                <Mic className="h-5 w-5" />
              ) : (
                <MicOff className="h-5 w-5" />
              )}
            </button>

            <button
              type="button"
              onClick={toggleCamera}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-700 text-white hover:bg-neutral-600"
              title={isCameraOn ? "Camera off" : "Camera on"}
            >
              {isCameraOn ? (
                <Video className="h-5 w-5" />
              ) : (
                <VideoOff className="h-5 w-5" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setRemoteViewRotate((d) => (d + 90) % 360)}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-700 text-white hover:bg-neutral-600"
              title="Rotate remote view"
            >
              <RotateCw className="h-5 w-5" />
            </button>

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
            className={`chat ${
              msg.senderId === authUser._id ? "chat-end" : "chat-start"
            }`}
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
// import { useEffect, useRef } from "react";

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
//     subscribeToCalls,

//     /* 🔥 NEW */
//     localStream,
//     remoteStream,
//     isCalling,
//     endCall,
//   } = useChatStore();

//   const { authUser } = useAuthStore();

//   const messageEndRef = useRef(null);
//   const localVideoRef = useRef(null);
//   const remoteVideoRef = useRef(null);

//   /* ================= LOAD SOCKETS ================= */
//   useEffect(() => {
//     if (!selectedUser?._id) return;

//     getMessages(selectedUser._id);
//     subscribeToMessages();
//     subscribeToCalls();

//     return () => unsubscribeFromMessages();
//   }, [selectedUser?._id]);

//   /* ================= AUTO SCROLL ================= */
//   useEffect(() => {
//     messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages]);

//   /* ================= ATTACH LOCAL ================= */
//   useEffect(() => {
//     if (localVideoRef.current && localStream) {
//       localVideoRef.current.srcObject = localStream;
//     }
//   }, [localStream]);

//   /* ================= ATTACH REMOTE ================= */
//   useEffect(() => {
//     if (remoteVideoRef.current && remoteStream) {
//       remoteVideoRef.current.srcObject = remoteStream;
//     }
//   }, [remoteStream]);

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

//       {/* ================= 🔥 CALL SCREEN ================= */}
//       {isCalling && (
//         <div className="absolute inset-0 bg-black z-50">

//           {/* 🔵 REMOTE VIDEO (FULL SCREEN) */}
//           <video
//             ref={remoteVideoRef}
//             autoPlay
//             playsInline
//             className="w-full h-full object-cover"
//           />

//           {/* 🔵 LOCAL PREVIEW */}
//           <video
//             ref={localVideoRef}
//             autoPlay
//             muted
//             playsInline
//             className="absolute bottom-20 right-4 w-36 h-28 rounded-lg border-2 border-white object-cover"
//           />

//           {/* 🔴 END CALL */}
//           <button
//             onClick={endCall}
//             className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-red-600 text-white px-6 py-2 rounded-full"
//           >
//             End Call
//           </button>
//         </div>
//       )}

//       {/* ================= MESSAGES ================= */}
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
//                   alt=""
//                 />
//               </div>
//             </div>

//             <div className="chat-header mb-1">
//               <time className="text-xs opacity-50 ml-1">
//                 {formatMessageTime(msg.createdAt)}
//               </time>
//             </div>

//             <div className="chat-bubble max-w-xs">
//               {msg.text}
//             </div>
//           </div>
//         ))}

//         <div ref={messageEndRef} />
//       </div>

//       <MessageInput />
//     </div>
//   );
// };

// export default ChatContainer;






// // ChatContainer.jsx

// import { useChatStore } from "../store/useChatStore";
// import { useAuthStore } from "../store/useAuthStore";
// import { useEffect, useRef } from "react";

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
//     subscribeToCalls,
//     localStream,
//     isCalling,
//     endCall,
//   } = useChatStore();

//   const { authUser } = useAuthStore();
//   const messageEndRef = useRef(null);
//   const localVideoRef = useRef(null);

//   /* ================= LOAD MESSAGES + SOCKETS ================= */
//   useEffect(() => {
//     if (!selectedUser?._id) return;

//     getMessages(selectedUser._id);
//     subscribeToMessages();
//     subscribeToCalls();

//     return () => {
//       unsubscribeFromMessages();
//     };
//   }, [selectedUser?._id]);

//   /* ================= AUTO SCROLL ================= */
//   useEffect(() => {
//     messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages]);

//   /* ================= ATTACH CAMERA STREAM ================= */
//   useEffect(() => {
//     if (localVideoRef.current && localStream) {
//       localVideoRef.current.srcObject = localStream;
//     }
//   }, [localStream]);

//   if (isMessagesLoading) {
//     return (
//       <div className="flex flex-col h-full overflow-hidden">
//         <ChatHeader onBack={onBack} />
//         <MessageSkeleton />
//         <MessageInput />
//       </div>
//     );
//   }

//   return (
//     <div className="flex flex-col h-full overflow-hidden relative">
//       {/* HEADER */}
//       <ChatHeader onBack={onBack} />

//       {/* 🔥 VIDEO CALL PREVIEW */}
//       {isCalling && localStream && (
//         <div className="absolute top-16 right-4 z-50 bg-black rounded-lg p-2">
//           <video
//             ref={localVideoRef}
//             autoPlay
//             muted
//             playsInline
//             className="w-48 h-36 rounded bg-black"
//           />
//           <button
//             onClick={endCall}
//             className="mt-2 w-full bg-red-500 text-white py-1 rounded"
//           >
//             End Call
//           </button>
//         </div>
//       )}

//       {/* MESSAGES */}
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
//                   alt="profile"
//                 />
//               </div>
//             </div>

//             <div className="chat-header mb-1">
//               <time className="text-xs opacity-50 ml-1">
//                 {formatMessageTime(msg.createdAt)}
//               </time>
//             </div>

//             <div className="chat-bubble max-w-xs">
//               {msg.image && (
//                 <img
//                   src={msg.image}
//                   alt="attachment"
//                   className="rounded-md mb-2 max-w-[220px]"
//                 />
//               )}
//               {msg.text && <p>{msg.text}</p>}
//             </div>
//           </div>
//         ))}
//         <div ref={messageEndRef} />
//       </div>

//       {/* INPUT */}
//       <MessageInput />
//     </div>
//   );
// };

// export default ChatContainer;



// // import { useChatStore } from "../store/useChatStore";
// // import { useAuthStore } from "../store/useAuthStore";
// // import { useEffect, useRef } from "react";

// // import ChatHeader from "./ChatHeader";
// // import MessageInput from "./MessageInput";
// // import MessageSkeleton from "./skeletons/MessageSkeleton";
// // import { formatMessageTime } from "../lib/utils";

// // const ChatContainer = ({ onBack }) => {
// //   const {
// //     messages,
// //     getMessages,
// //     isMessagesLoading,
// //     selectedUser,
// //     subscribeToMessages,
// //     unsubscribeFromMessages,
// //   } = useChatStore();

// //   const { authUser } = useAuthStore();
// //   const messageEndRef = useRef(null);

// //   useEffect(() => {
// //     if (!selectedUser?._id) return;
// //     getMessages(selectedUser._id);
// //     subscribeToMessages();
// //     return () => unsubscribeFromMessages();
// //   }, [selectedUser?._id, getMessages, subscribeToMessages, unsubscribeFromMessages]);

// //   useEffect(() => {
// //     if (messageEndRef.current) {
// //       messageEndRef.current.scrollIntoView({ behavior: "smooth" });
// //     }
// //   }, [messages]);

// //   if (isMessagesLoading) {
// //     return (
// //       <div className="flex flex-col h-full overflow-hidden">
// //         <ChatHeader onBack={onBack} />
// //         <MessageSkeleton />
// //         <MessageInput />
// //       </div>
// //     );
// //   }

// //   return (
// //     <div className="flex flex-col h-full overflow-hidden">
// //       {/* Header */}
// //       <ChatHeader onBack={onBack} />

// //       {/* Messages area */}
// //       <div className="flex-1 overflow-y-auto p-4 space-y-4">
// //         {messages.map((msg) => (
// //           <div
// //             key={msg._id}
// //             className={`chat ${msg.senderId === authUser._id ? "chat-end" : "chat-start"}`}
// //           >
// //             <div className="chat-image avatar">
// //               <div className="size-10 rounded-full border">
// //                 <img
// //                   src={
// //                     msg.senderId === authUser._id
// //                       ? authUser.profilePic || "/avatar.png"
// //                       : selectedUser.profilePic || "/avatar.png"
// //                   }
// //                   alt="profile pic"
// //                 />
// //               </div>
// //             </div>

// //             <div className="chat-header mb-1">
// //               <time className="text-xs opacity-50 ml-1">{formatMessageTime(msg.createdAt)}</time>
// //             </div>

// //             <div
// //               className="
// //                 chat-bubble flex flex-col
// //                 max-w-[320px]
// //                 sm:max-w-[250px]
// //                 md:max-w-[280px]
// //                 lg:max-w-[340px]
// //                 xl:max-w-[380px]
// //                 max-[450px]:max-w-[180px]
// //                 max-[360px]:max-w-[160px]
// //                 max-[320px]:max-w-[150px]
// //               "
// //             >
// //               {msg.image && (
// //                 <img
// //                   src={msg.image}
// //                   alt="Attachment"
// //                   className="
// //                     rounded-md mb-2
// //                     max-w-[250px]
// //                     sm:max-w-[200px]
// //                     md:max-w-[180px]
// //                     max-[450px]:max-w-[140px]
// //                     max-[360px]:max-w-[120px]
// //                     max-[320px]:max-w-[110px]
// //                   "
// //                 />
// //               )}
// //               {msg.text && <p>{msg.text}</p>}
// //             </div>

// //             <div ref={messageEndRef} />
// //           </div>
// //         ))}
// //       </div>

// //       {/* Input (sticky bottom) */}
// //       <MessageInput />
// //     </div>
// //   );
// // };

// // export default ChatContainer;



// // import { useChatStore } from "../store/useChatStore";
// // import { useEffect, useRef } from "react";

// // import ChatHeader from "./ChatHeader";
// // import MessageInput from "./MessageInput";
// // import MessageSkeleton from "./skeletons/MessageSkeleton";
// // import { useAuthStore } from "../store/useAuthStore";
// // import { formatMessageTime } from "../lib/utils";

// // const ChatContainer = () => {
// //   const {
// //     messages,
// //     getMessages,
// //     isMessagesLoading,
// //     selectedUser,
// //     subscribeToMessages,
// //     unsubscribeFromMessages,
// //   } = useChatStore();
// //   const { authUser } = useAuthStore();
// //   const messageEndRef = useRef(null);

// //   useEffect(() => {
// //     getMessages(selectedUser._id);

// //     subscribeToMessages();

// //     return () => unsubscribeFromMessages();
// //   }, [selectedUser._id, getMessages, subscribeToMessages, unsubscribeFromMessages]);

// //   useEffect(() => {
// //     if (messageEndRef.current && messages) {
// //       messageEndRef.current.scrollIntoView({ behavior: "smooth" });
// //     }
// //   }, [messages]);

// //   if (isMessagesLoading) {
// //     return (
// //       <div className="flex-1 flex flex-col overflow-auto">
// //         <ChatHeader />
// //         <MessageSkeleton />
// //         <MessageInput />
// //       </div>
// //     );
// //   }

// //   return (
// //     <div className="flex-1 flex flex-col overflow-auto">
// //       <ChatHeader />

// //       <div className="flex-1 overflow-y-auto p-4 space-y-4">
// //         {messages.map((message) => (
// //           <div
// //             key={message._id}
// //             className={`chat ${message.senderId === authUser._id ? "chat-end" : "chat-start"}`}
// //             ref={messageEndRef}
// //           >
// //             <div className=" chat-image avatar">
// //               <div className="size-10 rounded-full border">
// //                 <img
// //                   src={
// //                     message.senderId === authUser._id
// //                       ? authUser.profilePic || "/avatar.png"
// //                       : selectedUser.profilePic || "/avatar.png"
// //                   }
// //                   alt="profile pic"
// //                 />
// //               </div>
// //             </div>
// //             <div className="chat-header mb-1">
// //               <time className="text-xs opacity-50 ml-1">
// //                 {formatMessageTime(message.createdAt)}
// //               </time>
// //             </div>
// //             <div className="chat-bubble flex flex-col">
// //               {message.image && (
// //                 <img
// //                   src={message.image}
// //                   alt="Attachment"
// //                   className="sm:max-w-[200px] rounded-md mb-2"
// //                 />
// //               )}
// //               {message.text && <p>{message.text}</p>}
// //             </div>
// //           </div>
// //         ))}
// //       </div>

// //       <MessageInput />
// //     </div>
// //   );
// // };
// // export default ChatContainer;
