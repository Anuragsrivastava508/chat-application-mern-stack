import { Phone, Video, X } from "lucide-react";
import { useChatStore } from "../store/useChatStore";

const IncomingCallPopup = () => {
  const { incomingCall, acceptCall, rejectCall, isCalling, users } = useChatStore();

  // ✅ FIX: hide when call started or no incoming
  if (!incomingCall || isCalling) return null;

  const caller =
    users.find((u) => u._id === incomingCall.from) || {};

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-base-100 shadow-xl rounded-xl w-80 p-4 border border-base-300">

        {/* HEADER */}
        <div className="flex items-center gap-3 mb-3">
          <div className="avatar">
            <div className="w-12 rounded-full">
              <img src={caller.profilePic || "/avatar.png"} alt="" />
            </div>
          </div>

          <div>
            <p className="font-semibold">{caller.fullName || "Unknown"}</p>
            <p className="text-sm text-base-content/70 flex items-center gap-1">
              {incomingCall.callType === "video" ? (
                <>
                  <Video className="w-4 h-4" /> Video call
                </>
              ) : (
                <>
                  <Phone className="w-4 h-4" /> Audio call
                </>
              )}
            </p>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex justify-between mt-4">
          <button
            onClick={rejectCall}
            className="bg-red-500 text-white w-12 h-12 rounded-full flex items-center justify-center"
          >
            <X />
          </button>

          <button
            onClick={acceptCall}
            className="bg-green-500 text-white w-12 h-12 rounded-full flex items-center justify-center"
          >
            <Phone />
          </button>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallPopup;