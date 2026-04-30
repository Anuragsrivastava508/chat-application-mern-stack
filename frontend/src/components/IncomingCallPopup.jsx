import { Phone, Video, PhoneOff } from "lucide-react";
import { useChatStore } from "../store/useChatStore";

const IncomingCallPopup = () => {
  const {
    incomingCall, pendingOffer, acceptCall, rejectCall,
    isCalling, callActive, users,
  } = useChatStore();

  // Hide when call is active or no incoming call
  if (!incomingCall || isCalling || callActive) return null;

  const caller = users.find((u) => u._id === incomingCall.from) || {};
  const isVideo = incomingCall.callType === "video";

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-base-100 rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">

        {/* Top colored strip */}
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 px-6 pt-8 pb-10 flex flex-col items-center gap-3">

          {/* Avatar with pulse rings */}
          <div className="relative flex items-center justify-center">
            {/* Outer ring */}
            <span className="absolute w-28 h-28 rounded-full bg-white/20 animate-ping" style={{ animationDuration: "1.5s" }} />
            {/* Middle ring */}
            <span className="absolute w-24 h-24 rounded-full bg-white/20 animate-ping" style={{ animationDuration: "1.5s", animationDelay: "0.3s" }} />
            {/* Avatar */}
            <img
              src={caller.profilePic || "/avatar.png"}
              alt={caller.fullName}
              className="relative w-20 h-20 rounded-full object-cover ring-4 ring-white/40 shadow-xl z-10"
            />
          </div>

          <div className="text-center text-white mt-2">
            <p className="text-xl font-bold">{caller.fullName || "Unknown"}</p>
            <p className="text-white/80 text-sm flex items-center justify-center gap-1.5 mt-1">
              {isVideo ? <Video className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
              {isVideo ? "Incoming video call" : "Incoming voice call"}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="bg-base-100 flex justify-around items-center px-8 py-6">

          {/* Decline */}
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={rejectCall}
              className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-500/30 transition-all active:scale-95"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
            <span className="text-xs text-base-content/60">Decline</span>
          </div>

          {/* Accept */}
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              disabled={!pendingOffer}
              onClick={() => acceptCall()}
              className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isVideo ? <Video className="w-6 h-6" /> : <Phone className="w-6 h-6" />}
            </button>
            <span className="text-xs text-base-content/60">
              {pendingOffer ? "Accept" : "Connecting…"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallPopup;


// import { Phone, Video, X } from "lucide-react";
// import { useChatStore } from "../store/useChatStore";

// const IncomingCallPopup = () => {
//   const {
//     incomingCall, pendingOffer, acceptCall, rejectCall,
//     isCalling, callActive, users,
//   } = useChatStore();

//   // ✅ Hide when call active or no incoming
//   if (!incomingCall || isCalling || callActive) return null;

//   const caller = users.find((u) => u._id === incomingCall.from) || {};

//   return (
//     <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40">
//       <div className="bg-base-100 shadow-xl rounded-xl w-80 p-4 border border-base-300">
//         <div className="flex items-center gap-3 mb-3">
//           <div className="avatar">
//             <div className="w-12 rounded-full">
//               <img src={caller.profilePic || "/avatar.png"} alt="" />
//             </div>
//           </div>
//           <div>
//             <p className="font-semibold">{caller.fullName || "Unknown"}</p>
//             <p className="text-sm text-base-content/70 flex items-center gap-1">
//               {incomingCall.callType === "video" ? (
//                 <><Video className="w-4 h-4" /> Video call</>
//               ) : (
//                 <><Phone className="w-4 h-4" /> Audio call</>
//               )}
//             </p>
//           </div>
//         </div>

//         <div className="flex justify-between mt-4">
//           <button onClick={rejectCall}
//             className="bg-red-500 text-white w-12 h-12 rounded-full flex items-center justify-center">
//             <X />
//           </button>
//           <button type="button"
//             disabled={!pendingOffer}
//             onClick={() => acceptCall()}
//             className="bg-green-500 text-white w-12 h-12 rounded-full flex items-center justify-center disabled:opacity-50"
//             title={pendingOffer ? "Accept" : "Connecting…"}>
//             <Phone />
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default IncomingCallPopup;