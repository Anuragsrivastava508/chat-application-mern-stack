import { ArrowLeft, Phone, Video, MoreVertical } from "lucide-react";
import { useChatStore } from "../store/useChatStore"; // ✅ IMPORTANT
import { useAuthStore } from "../store/useAuthStore";
const ChatHeader = ({ onBack }) => {
  const { selectedUser, startCall } = useChatStore();
  const { onlineUsers } = useAuthStore();

  if (!selectedUser) return null;

  return (
    <div className="p-2.5 border-b border-base-300 bg-base-100">
      <div className="flex items-center justify-between">

        {/* LEFT */}
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="lg:hidden p-1">
            <ArrowLeft className="w-6 h-6" />
          </button>

          <div className="avatar">
            <div className="size-10 rounded-full">
              <img src={selectedUser.profilePic || "/avatar.png"} />
            </div>
          </div>

          <div>
            <h3 className="font-medium">{selectedUser.fullName}</h3>
            <p className="text-sm text-base-content/70">
              {onlineUsers.includes(selectedUser._id)
                ? "Online"
                : "Offline"}
            </p>
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-3">

          {/* 📞 AUDIO */}
          <button
            type="button"
            onClick={() => startCall("audio")}
            className="p-2 hover:bg-base-200 rounded-full"
            title="Voice call"
          >
            <Phone className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() => startCall("video")}
            className="p-2 hover:bg-base-200 rounded-full"
            title="Video call"
          >
            <Video className="w-5 h-5" />
          </button>

          <MoreVertical className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;