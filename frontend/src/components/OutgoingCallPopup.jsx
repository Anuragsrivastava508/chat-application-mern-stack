import React from "react";
import { Phone, Video, X } from "lucide-react";
import { useChatStore } from "../store/useChatStore";

const OutgoingCallPopup = () => {
  const { outgoingCall, cancelOutgoingCall, users } = useChatStore();

  if (!outgoingCall) return null;

  const user = users.find((u) => u._id === outgoingCall.to) || {};

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="bg-base-100 shadow-xl rounded-xl w-80 p-4 border border-base-300">

        {/* HEADER */}
        <div className="flex items-center gap-3 mb-3">
          <div className="avatar">
            <div className="w-12 rounded-full">
              <img src={user.profilePic || "/avatar.png"} alt="" />
            </div>
          </div>

          <div>
            <p className="font-semibold">
              {user.fullName || "Calling..."}
            </p>

            <p className="text-sm text-base-content/70 flex items-center gap-1">
              {outgoingCall.callType === "video" ? (
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

        {/* ACTION */}
        <div className="flex justify-center mt-4">
          <button
            onClick={cancelOutgoingCall}
            className="bg-red-500 text-white w-12 h-12 rounded-full flex items-center justify-center"
          >
            <X />
          </button>
        </div>

      </div>
    </div>
  );
};

export default OutgoingCallPopup;
