// Sidebar.jsx
import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Users } from "lucide-react";

const Sidebar = ({ onSelectUser }) => {
  const { getUsers, users, selectedUser, setSelectedUser, isUsersLoading } =
    useChatStore();

  const { onlineUsers } = useAuthStore();
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);

  // Fetch Users on Load
  useEffect(() => {
    getUsers();
  }, [getUsers]);

  // Filter Users by Online Status
  const filteredUsers = showOnlineOnly
    ? users.filter((user) => onlineUsers.includes(user._id))
    : users;

  if (isUsersLoading) return <SidebarSkeleton />;

  return (
    <aside
      className="
        h-full
        w-20
        lg:w-72
        border-r border-base-300
        flex flex-col
        transition-all duration-200
        max-[450px]:w-16
      "
    >
      {/* HEADER */}
      <div className="border-b border-base-300 w-full p-5 max-[450px]:p-3">
        <div className="flex items-center gap-2">
          <Users className="size-6 max-[450px]:size-5" />
          <span className="font-medium hidden lg:block">Contacts</span>
        </div>

        {/* Online Filter */}
        <div className="mt-3 hidden lg:flex items-center gap-2">
          <label className="cursor-pointer flex items-center gap-2">
            <input
              type="checkbox"
              checked={showOnlineOnly}
              onChange={(e) => setShowOnlineOnly(e.target.checked)}
              className="checkbox checkbox-sm"
            />
            <span className="text-sm">Show online only</span>
          </label>

          <span className="text-xs text-zinc-500">
            ({onlineUsers.length - 1} online)
          </span>
        </div>
      </div>

      {/* USER LIST */}
      <div className="overflow-y-auto w-full py-3 max-[450px]:py-2">
        {filteredUsers.map((user) => (
          <button
            key={user._id}
            onClick={() => {
              setSelectedUser(user);

              // Close sidebar automatically on mobile
              if (window.innerWidth <= 720) {
                onSelectUser?.();
              }
            }}
            className={`
              w-full
              p-3 max-[450px]:p-2
              flex items-center gap-3
              hover:bg-base-300 transition-colors
              ${
                selectedUser?._id === user._id
                  ? "bg-base-300 ring-1 ring-base-300"
                  : ""
              }
            `}
          >
            {/* Avatar */}
            <div className="relative mx-auto lg:mx-0">
              <img
                src={user.profilePic || "/avatar.png"}
                alt={user.fullName}      // ⭐ FIXED
                className="size-12 max-[450px]:size-10 object-cover rounded-full"
              />

              {/* Online Badge */}
              {onlineUsers.includes(user._id) && (
                <span className="absolute bottom-0 right-0 size-3 bg-green-500 rounded-full ring-2 ring-zinc-900" />
              )}
            </div>

            {/* User Info (hidden on small screens) */}
            <div className="hidden lg:block text-left min-w-0">
              <div className="font-medium truncate">{user.fullName}</div>

              <div className="text-sm text-zinc-400">
                {onlineUsers.includes(user._id)
                  ? "Online"
                  : "Offline"}
              </div>
            </div>
          </button>
        ))}

        {/* Empty State */}
        {filteredUsers.length === 0 && (
          <div className="text-center text-zinc-500 py-4 text-sm lg:text-base">
            No online users
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;





// import { useEffect, useState } from "react";
// import { useChatStore } from "../store/useChatStore";
// import { useAuthStore } from "../store/useAuthStore";
// import SidebarSkeleton from "./skeletons/SidebarSkeleton";
// import { Users } from "lucide-react";

// const Sidebar = () => {
//   const { getUsers, users, selectedUser, setSelectedUser, isUsersLoading } = useChatStore();

//   const { onlineUsers } = useAuthStore();
//   const [showOnlineOnly, setShowOnlineOnly] = useState(false);

//   useEffect(() => {
//     getUsers();
//   }, [getUsers]);

//   const filteredUsers = showOnlineOnly
//     ? users.filter((user) => onlineUsers.includes(user._id))
//     : users;

//   if (isUsersLoading) return <SidebarSkeleton />;

//   return (
//     <aside className="h-full w-20 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200">
//       <div className="border-b border-base-300 w-full p-5">
//         <div className="flex items-center gap-2">
//           <Users className="size-6" />
//           <span className="font-medium hidden lg:block">Contacts</span>
//         </div>
//         {/* TODO: Online filter toggle */}
//         <div className="mt-3 hidden lg:flex items-center gap-2">
//           <label className="cursor-pointer flex items-center gap-2">
//             <input
//               type="checkbox"
//               checked={showOnlineOnly}
//               onChange={(e) => setShowOnlineOnly(e.target.checked)}
//               className="checkbox checkbox-sm"
//             />
//             <span className="text-sm">Show online only</span>
//           </label>
//           <span className="text-xs text-zinc-500">({onlineUsers.length - 1} online)</span>
//         </div>
//       </div>

//       <div className="overflow-y-auto w-full py-3">
//         {filteredUsers.map((user) => (
//           <button
//             key={user._id}
//             onClick={() => setSelectedUser(user)}
//             className={`
//               w-full p-3 flex items-center gap-3
//               hover:bg-base-300 transition-colors
//               ${selectedUser?._id === user._id ? "bg-base-300 ring-1 ring-base-300" : ""}
//             `}
//           >
//             <div className="relative mx-auto lg:mx-0">
//               <img
//                 src={user.profilePic || "/avatar.png"}
//                 alt={user.name}
//                 className="size-12 object-cover rounded-full"
//               />
//               {onlineUsers.includes(user._id) && (
//                 <span
//                   className="absolute bottom-0 right-0 size-3 bg-green-500 
//                   rounded-full ring-2 ring-zinc-900"
//                 />
//               )}
//             </div>

//             {/* User info - only visible on larger screens */}
//             <div className="hidden lg:block text-left min-w-0">
//               <div className="font-medium truncate">{user.fullName}</div>
//               <div className="text-sm text-zinc-400">
//                 {onlineUsers.includes(user._id) ? "Online" : "Offline"}
//               </div>
//             </div>
//           </button>
//         ))}

//         {filteredUsers.length === 0 && (
//           <div className="text-center text-zinc-500 py-4">No online users</div>
//         )}
//       </div>
//     </aside>
//   );
// };
// export default Sidebar;
