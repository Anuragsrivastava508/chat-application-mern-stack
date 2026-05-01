import { PhoneOff, Video, Phone } from "lucide-react";
import { useChatStore } from "../store/useChatStore";

const OutgoingCallPopup = () => {
  const { outgoingCall, cancelOutgoingCall, users, isCalling, callActive } = useChatStore();

  // Hide when call is active or no outgoing call
  if (!outgoingCall || isCalling || callActive) return null;

  const user = users.find((u) => u._id === outgoingCall.to) || {};
  const isVideo = outgoingCall.callType === "video";

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-base-100 rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">

        {/* Top strip */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 px-6 pt-8 pb-10 flex flex-col items-center gap-3">

          {/* Avatar with slow pulse */}
          <div className="relative flex items-center justify-center">
            <span className="absolute w-28 h-28 rounded-full bg-white/15 animate-ping" style={{ animationDuration: "2s" }} />
            <span className="absolute w-24 h-24 rounded-full bg-white/15 animate-ping" style={{ animationDuration: "2s", animationDelay: "0.5s" }} />
            <img
              src={user.profilePic || "/avatar.png"}
              alt={user.fullName}
              className="relative w-20 h-20 rounded-full object-cover ring-4 ring-white/40 shadow-xl z-10"
            />
          </div>

          <div className="text-center text-white mt-2">
            <p className="text-xl font-bold">{user.fullName || "Calling…"}</p>
            <p className="text-white/80 text-sm flex items-center justify-center gap-1.5 mt-1 animate-pulse">
              {isVideo ? <Video className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
              {isVideo ? "Video calling…" : "Calling…"}
            </p>
          </div>
        </div>

        {/* Action button */}
        <div className="bg-base-100 flex justify-center items-center px-8 py-6">
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={cancelOutgoingCall}
              className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-500/30 transition-all active:scale-95"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
            <span className="text-xs text-base-content/60">Cancel</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OutgoingCallPopup;


// import { useChatStore } from "../store/useChatStore";

// const OutgoingCallPopup = () => {
//   const { outgoingCall, cancelOutgoingCall, users, isCalling, callActive } = useChatStore();

//   // ✅ Hide when call active or no outgoing
//   if (!outgoingCall || isCalling || callActive) return null;

//   const user = users.find((u) => u._id === outgoingCall.to) || {};

//   return (
//     <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
//       <div className="bg-base-100 shadow-xl rounded-xl w-80 p-4 border border-base-300">
//         <div className="flex items-center gap-3 mb-3">
//           <div className="avatar">
//             <div className="w-12 rounded-full">
//               <img src={user.profilePic || "/avatar.png"} alt="" />
//             </div>
//           </div>
//           <div>
//             <p className="font-semibold">{user.fullName || "Calling..."}</p>
//             <p className="text-sm text-base-content/70 flex items-center gap-1">
//               {outgoingCall.callType === "video" ? (
//                 <><Video className="w-4 h-4" /> Video call</>
//               ) : (
//                 <><Phone className="w-4 h-4" /> Audio call</>
//               )}
//             </p>
//           </div>
//         </div>
//         <div className="flex justify-center mt-4">
//           <button onClick={cancelOutgoingCall}
//             className="bg-red-500 text-white w-12 h-12 rounded-full flex items-center justify-center">
//             <X />
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default OutgoingCallPopup;