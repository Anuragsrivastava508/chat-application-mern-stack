import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Users, Menu } from "lucide-react";

const Sidebar = () => {
  const { getUsers, users, selectedUser, setSelectedUser, isUsersLoading } = useChatStore();
  const { onlineUsers } = useAuthStore();
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [isOpen, setIsOpen] = useState(false); // 🔥 mobile toggle

  useEffect(() => {
    getUsers();
  }, [getUsers]);

  const filteredUsers = showOnlineOnly
    ? users.filter((user) => onlineUsers.includes(user._id))
    : users;

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setIsOpen(false); // 🔥 close sidebar on mobile when a user is selected
  };

  if (isUsersLoading) return <SidebarSkeleton />;

  return (
    <>
      {/* 🔥 Mobile header menu button */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden p-3 text-xl absolute top-3 left-3 z-20"
      >
        <Menu className="text-white" size={30} />
      </button>

      {/* 🔥 Sidebar Container */}
      <aside
        className={`
          h-full bg-base-200 border-r border-base-300 flex flex-col transition-all duration-300
          w-64 md:w-72
          fixed lg:static top-0 left-0 z-30
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <div className="border-b border-base-300 w-full p-5">
          <div className="flex items-center gap-2">
            <Users className="size-6" />
            <span className="font-medium">Contacts</span>
          </div>

          {/* Online toggle only visible on large screens */}
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
            <span className="text-xs text-zinc-500">({onlineUsers.length - 1} online)</span>
          </div>
        </div>

        {/* USER LIST */}
        <div className="overflow-y-auto w-full py-3">
          {filteredUsers.map((user) => (
            <button
              key={user._id}
              onClick={() => handleSelectUser(user)}
              className={`w-full p-3 flex items-center gap-3 hover:bg-base-300 transition-colors 
                ${selectedUser?._id === user._id ? "bg-base-300 ring-1 ring-base-300" : ""}`}
            >
              <div className="relative">
                <img
                  src={user.profilePic || "/avatar.png"}
                  alt={user.name}
                  className="size-12 object-cover rounded-full"
                />
                {onlineUsers.includes(user._id) && (
                  <span className="absolute bottom-0 right-0 size-3 bg-green-500 rounded-full ring-2 ring-zinc-900" />
                )}
              </div>

              <div className="text-left min-w-0 hidden lg:block">
                <div className="font-medium truncate">{user.fullName}</div>
                <div className="text-sm text-zinc-400">
                  {onlineUsers.includes(user._id) ? "Online" : "Offline"}
                </div>
              </div>
            </button>
          ))}

          {filteredUsers.length === 0 && (
            <div className="text-center text-zinc-500 py-4">No online users</div>
          )}
        </div>
      </aside>

      {/* 🔥 Background overlay when sidebar open on phone */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/40 lg:hidden z-20"
        />
      )}
    </>
  );
};

export default Sidebar;
