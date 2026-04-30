import { ArrowLeft, Phone, Video, MoreVertical, Search } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";

const ChatHeader = ({ onBack }) => {
  const { selectedUser, startCall, isCalling, callActive, outgoingCall } = useChatStore();
  const { onlineUsers } = useAuthStore();

  if (!selectedUser) return null;

  const isOnline = onlineUsers.includes(selectedUser._id);
  const inCall = isCalling || callActive || outgoingCall;

  return (
    <div className="border-b border-base-300 bg-base-100 px-2 py-2 shrink-0">
      <div className="flex items-center justify-between gap-2">

        {/* ===== LEFT ===== */}
        <div className="flex items-center gap-2 min-w-0">

          {/* Back button (mobile) */}
          <button
            onClick={onBack}
            className="lg:hidden p-2 rounded-full hover:bg-base-200 transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Avatar + online dot */}
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-base-300">
              <img
                src={selectedUser.profilePic || "/avatar.png"}
                alt={selectedUser.fullName}
                className="w-full h-full object-cover"
              />
            </div>
            {/* Online indicator */}
            {isOnline && (
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-base-100" />
            )}
          </div>

          {/* Name + status */}
          <div className="min-w-0">
            <h3 className="font-semibold text-base-content text-sm sm:text-base leading-tight truncate">
              {selectedUser.fullName}
            </h3>
            <p className={`text-xs leading-tight ${isOnline ? "text-emerald-500" : "text-base-content/40"}`}>
              {inCall ? "In call…" : isOnline ? "Online" : "Offline"}
            </p>
          </div>
        </div>

        {/* ===== RIGHT ===== */}
        <div className="flex items-center gap-1 flex-shrink-0">

          {/* Search (placeholder, mobile hidden) */}
          <button
            type="button"
            className="hidden sm:flex p-2 rounded-full hover:bg-base-200 transition-colors"
            title="Search"
          >
            <Search className="w-5 h-5 text-base-content/70" />
          </button>

          {/* Audio call */}
          <button
            type="button"
            onClick={() => startCall("audio")}
            disabled={!!inCall}
            className="p-2 rounded-full hover:bg-base-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title="Voice call"
          >
            <Phone className="w-5 h-5 text-base-content/80" />
          </button>

          {/* Video call */}
          <button
            type="button"
            onClick={() => startCall("video")}
            disabled={!!inCall}
            className="p-2 rounded-full hover:bg-base-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title="Video call"
          >
            <Video className="w-5 h-5 text-base-content/80" />
          </button>

          {/* More options */}
          <button
            type="button"
            className="p-2 rounded-full hover:bg-base-200 transition-colors"
            title="More options"
          >
            <MoreVertical className="w-5 h-5 text-base-content/70" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;

// import { ArrowLeft, Phone, Video, MoreVertical } from "lucide-react";
// import { useChatStore } from "../store/useChatStore"; // ✅ IMPORTANT
// import { useAuthStore } from "../store/useAuthStore";
// const ChatHeader = ({ onBack }) => {
//   const { selectedUser, startCall } = useChatStore();
//   const { onlineUsers } = useAuthStore();

//   if (!selectedUser) return null;

//   return (
//     <div className="p-2.5 border-b border-base-300 bg-base-100">
//       <div className="flex items-center justify-between">

//         {/* LEFT */}
//         <div className="flex items-center gap-3">
//           <button onClick={onBack} className="lg:hidden p-1">
//             <ArrowLeft className="w-6 h-6" />
//           </button>

//           <div className="avatar">
//             <div className="size-10 rounded-full">
//               <img src={selectedUser.profilePic || "/avatar.png"} />
//             </div>
//           </div>

//           <div>
//             <h3 className="font-medium">{selectedUser.fullName}</h3>
//             <p className="text-sm text-base-content/70">
//               {onlineUsers.includes(selectedUser._id)
//                 ? "Online"
//                 : "Offline"}
//             </p>
//           </div>
//         </div>

//         {/* RIGHT */}
//         <div className="flex items-center gap-3">

//           {/* 📞 AUDIO */}
//           <button
//             type="button"
//             onClick={() => startCall("audio")}
//             className="p-2 hover:bg-base-200 rounded-full"
//             title="Voice call"
//           >
//             <Phone className="w-5 h-5" />
//           </button>

//           <button
//             type="button"
//             onClick={() => startCall("video")}
//             className="p-2 hover:bg-base-200 rounded-full"
//             title="Video call"
//           >
//             <Video className="w-5 h-5" />
//           </button>

//           <MoreVertical className="w-5 h-5" />
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ChatHeader;