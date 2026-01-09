import { ArrowLeft, Phone, Video, MoreVertical } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { useState } from "react";

const ChatHeader = ({ onBack }) => {
  const { selectedUser, startCall } = useChatStore(); // ✅ startCall added
  const { onlineUsers } = useAuthStore();
  const [openMenu, setOpenMenu] = useState(false);

  if (!selectedUser) return null;

  return (
    <div className="p-2.5 border-b border-base-300 bg-base-100">
      <div className="flex items-center justify-between">

        {/* LEFT SIDE */}
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="lg:hidden p-1">
            <ArrowLeft className="w-6 h-6" />
          </button>

          <div className="avatar">
            <div className="size-10 rounded-full">
              <img
                src={selectedUser.profilePic || "/avatar.png"}
                alt=""
              />
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

        {/* RIGHT SIDE */}
        <div className="flex items-center gap-3 relative">

          {/* 📞 AUDIO CALL */}
          <button
            onClick={() => startCall("audio")}
            className="p-2 hover:bg-base-200 rounded-full"
          >
            <Phone className="w-5 h-5" />
          </button>

          {/* 🎥 VIDEO CALL */}
          <button
            onClick={() => startCall("video")}
            className="p-2 hover:bg-base-200 rounded-full"
          >
            <Video className="w-5 h-5" />
          </button>

          {/* MENU */}
          <button
            onClick={() => setOpenMenu(!openMenu)}
            className="p-2 hover:bg-base-200 rounded-full"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {openMenu && (
            <ul className="absolute right-0 top-10 bg-base-100 border border-base-300 rounded-md shadow-md w-40 z-50">
              <li className="px-4 py-2 hover:bg-base-200 cursor-pointer">
                View Profile
              </li>
              <li className="px-4 py-2 hover:bg-base-200 cursor-pointer">
                Clear Chat
              </li>
              <hr />
              <li className="px-4 py-2 hover:bg-error/10 text-error cursor-pointer">
                More
              </li>
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;



// // ChatHeader.jsx
// // import { ArrowLeft } from "lucide-react";
// // import { useAuthStore } from "../store/useAuthStore";
// // import { useChatStore } from "../store/useChatStore";

// // const ChatHeader = ({ onBack }) => {
// //   const { selectedUser } = useChatStore();
// //   const { onlineUsers } = useAuthStore();

// //   return (
// //     <div className="p-2.5 border-b border-base-300 bg-base-100">
// //       <div className="flex items-center gap-3">

// //         {/* Mobile Back Button */}
// //         <button
// //           onClick={onBack}
// //           className="lg:hidden p-1"
// //         >
// //           <ArrowLeft className="w-6 h-6" />
// //         </button>

// //         {/* Avatar */}
// //         <div className="avatar">
// //           <div className="size-10 rounded-full">
// //             <img src={selectedUser.profilePic || "/avatar.png"} alt="" />
// //           </div>
// //         </div>

// //         {/* Name + Status */}
// //         <div>
// //           <h3 className="font-medium">{selectedUser.fullName}</h3>
// //           <p className="text-sm text-base-content/70">
// //             {onlineUsers.includes(selectedUser._id) ? "Online" : "Offline"}
// //           </p>
// //         </div>

// //       </div>
// //     </div>
// //   );
// // };

// // export default ChatHeader;

// import { ArrowLeft, Phone, Video, MoreVertical } from "lucide-react";
// import { useAuthStore } from "../store/useAuthStore";
// import { useChatStore } from "../store/useChatStore";
// import { useState } from "react";

// const ChatHeader = ({ onBack }) => {
//   const { selectedUser } = useChatStore();
//   const { onlineUsers } = useAuthStore();
//   const [openMenu, setOpenMenu] = useState(false);

//   if (!selectedUser) return null;

//   return (
//     <div className="p-2.5 border-b border-base-300 bg-base-100">
//       <div className="flex items-center justify-between">

//         {/* LEFT SIDE */}
//         <div className="flex items-center gap-3">
//           <button onClick={onBack} className="lg:hidden p-1">
//             <ArrowLeft className="w-6 h-6" />
//           </button>

//           <div className="avatar">
//             <div className="size-10 rounded-full">
//               <img
//                 src={selectedUser.profilePic || "/avatar.png"}
//                 alt=""
//               />
//             </div>
//           </div>

//           <div>
//             <h3 className="font-medium">{selectedUser.fullName}</h3>
//             <p className="text-sm text-base-content/70">
//               {onlineUsers.includes(selectedUser._id) ? "Online" : "Offline"}
//             </p>
//           </div>
//         </div>

//         {/* RIGHT SIDE ICONS */}
//         <div className="flex items-center gap-3 relative">

//           {/* Voice Call */}
//           <button className="p-2 hover:bg-base-200 rounded-full">
//             <Phone className="w-5 h-5" />
//           </button>

//           {/* Video Call */}
//           <button className="p-2 hover:bg-base-200 rounded-full">
//             <Video className="w-5 h-5" />
//           </button>

//           {/* Three Dot Menu */}
//           <button
//             onClick={() => setOpenMenu(!openMenu)}
//             className="p-2 hover:bg-base-200 rounded-full"
//           >
//             <MoreVertical className="w-5 h-5" />
//           </button>

//           {/* Dropdown Menu */}
//           {openMenu && (
//             <ul className="absolute right-0 top-10 bg-base-100 border border-base-300 rounded-md shadow-md w-40 z-50">
//               <li className="px-4 py-2 hover:bg-base-200 cursor-pointer">
//                 View Profile
//               </li>
//               <li className="px-4 py-2 hover:bg-base-200 cursor-pointer">
//                 Clear Chat
//               </li>
//               <li className="px-4 py-2 hover:bg-base-200 cursor-pointer">
//                 Media, link and docs
//               </li>
//               <li className="px-4 py-2 hover:bg-base-200 cursor-pointer">
//               Mute
//               </li>
//               <li className="px-4 py-2 hover:bg-base-200 cursor-pointer">
//               Disapperaing
//               </li>
//               <hr />
//               <li className="px-4 py-2 hover:bg-error/10 text-error cursor-pointer">
//                 More
//               </li>
//             </ul>
//           )}

//         </div>
//       </div>
//     </div>
//   );
// };

// export default ChatHeader;




// // import { X } from "lucide-react";
// // import { useAuthStore } from "../store/useAuthStore";
// // import { useChatStore } from "../store/useChatStore";

// // const ChatHeader = () => {
// //   const { selectedUser, setSelectedUser } = useChatStore();
// //   const { onlineUsers } = useAuthStore();

// //   return (
// //     <div className="p-2.5 border-b border-base-300">
// //       <div className="flex items-center justify-between">
// //         <div className="flex items-center gap-3">
// //           {/* Avatar */}
// //           <div className="avatar">
// //             <div className="size-10 rounded-full relative">
// //               <img src={selectedUser.profilePic || "/avatar.png"} alt={selectedUser.fullName} />
// //             </div>
// //           </div>

// //           {/* User info */}
// //           <div>
// //             <h3 className="font-medium">{selectedUser.fullName}</h3>
// //             <p className="text-sm text-base-content/70">
// //               {onlineUsers.includes(selectedUser._id) ? "Online" : "Offline"}
// //             </p>
// //           </div>
// //         </div>

// //         {/* Close button */}
// //         <button onClick={() => setSelectedUser(null)}>
// //           <X />
// //         </button>
// //       </div>
// //     </div>
// //   );
// // };
// // export default ChatHeader;
