import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { useEffect, useRef } from "react";

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
    subscribeToCalls,

    /* 🔥 CALL STATE */
    localStream,
    remoteStream,
    isCalling,
    endCall,

    /* 🔥 NEW CONTROLS */
    toggleMic,
    toggleCamera,
    isMicOn,
    isCameraOn,
  } = useChatStore();

  const { authUser } = useAuthStore();

  const messageEndRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  /* ================= LOAD SOCKETS ================= */
  useEffect(() => {
    if (!selectedUser?._id) return;

    getMessages(selectedUser._id);
    subscribeToMessages();
    subscribeToCalls();

    return () => unsubscribeFromMessages();
  }, [selectedUser?._id]);

  /* ================= AUTO SCROLL ================= */
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ================= ATTACH LOCAL ================= */
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  /* ================= ATTACH REMOTE ================= */
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

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

      {/* ================= 🔥 CALL SCREEN ================= */}
      {isCalling && (
        <div className="absolute inset-0 bg-black z-50">

          {/* 🔵 REMOTE VIDEO (FULL SCREEN) */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />

          {/* 🔵 LOCAL PREVIEW */}
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="absolute bottom-24 right-4 w-36 h-28 rounded-lg border-2 border-white object-cover"
          />

          {/* 🔥 CONTROLS */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4">

            {/* 🎤 MIC */}
            <button
              onClick={toggleMic}
              className="bg-gray-800 text-white px-4 py-2 rounded-full"
            >
              {isMicOn ? "🎤" : "🔇"}
            </button>

            {/* 🎥 CAMERA */}
            <button
              onClick={toggleCamera}
              className="bg-gray-800 text-white px-4 py-2 rounded-full"
            >
              {isCameraOn ? "📷" : "🚫"}
            </button>

            {/* 🔴 END CALL */}
            <button
              onClick={endCall}
              className="bg-red-600 text-white px-6 py-2 rounded-full"
            >
              End
            </button>

          </div>
        </div>
      )}

      {/* ================= MESSAGES ================= */}
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
                  alt=""
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
