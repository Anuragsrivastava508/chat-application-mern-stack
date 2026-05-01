import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { useThemeStore } from "../store/useThemeStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import {
  Search, Camera, EllipsisVertical, MessageSquare, Users,
  Phone, Settings, LogOut, User, Sun, Moon, ArrowLeft, Palette,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const Sidebar = ({ onSelectUser }) => {
  const { getUsers, users, selectedUser, setSelectedUser, isUsersLoading } = useChatStore();
  const { onlineUsers, authUser, logout } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("chats");
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => { getUsers(); }, [getUsers]);

  const filteredUsers = users.filter((u) =>
    u.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isUsersLoading) return <SidebarSkeleton />;

  /* ==================== MOBILE ==================== */
  if (isMobile) {
    return (
      <div className="h-full w-full flex flex-col bg-[#111b21] text-white overflow-hidden">

        {/* TOP HEADER */}
        <div className="flex items-center justify-between px-4 pt-12 pb-3 flex-shrink-0">
          <h1 className="text-2xl font-bold">
            {activeTab === "chats" && "Chatty"}
            {activeTab === "settings" && "Settings"}
            {activeTab === "calls" && "Calls"}
            {activeTab === "communities" && "Communities"}
          </h1>
          {activeTab === "chats" && (
            <div className="flex items-center gap-1">
              <button className="p-2 rounded-full">
                <Camera className="w-5 h-5 text-white/80" />
              </button>
              <button className="p-2 rounded-full hover:bg-white/10 transition-colors">
                <EllipsisVertical className="w-5 h-5 text-white/80" />
              </button>
            </div>
          )}
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto min-h-0">

          {/* ===== CHATS TAB ===== */}
          {activeTab === "chats" && (
            <>
              <div className="px-3 pb-2">
                <div className="flex items-center gap-3 bg-[#202c33] rounded-xl px-4 py-2.5">
                  <Search className="w-4 h-4 text-[#8696a0] flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Ask Meta AI or Search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent outline-none text-sm flex-1 text-white placeholder:text-[#8696a0]"
                  />
                </div>
              </div>

              {filteredUsers.map((user) => {
                const isOnline = onlineUsers.includes(user._id);
                const isSelected = selectedUser?._id === user._id;
                return (
                  <button
                    key={user._id}
                    onClick={() => { setSelectedUser(user); onSelectUser?.(); }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-left
                      ${isSelected ? "bg-[#2a3942]" : "hover:bg-[#202c33]"}`}
                  >
                    <div className="relative flex-shrink-0">
                      <img src={user.profilePic || "/avatar.png"} alt={user.fullName}
                        className="w-12 h-12 rounded-full object-cover" />
                      {isOnline && (
                        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#111b21]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 border-b border-[#202c33] pb-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-[15px] truncate">{user.fullName}</span>
                        <span className="text-xs text-[#8696a0] flex-shrink-0">Yesterday</span>
                      </div>
                      <p className="text-sm text-[#8696a0] truncate mt-0.5">
                        {isOnline ? "Online" : "Tap to chat"}
                      </p>
                    </div>
                  </button>
                );
              })}

              {filteredUsers.length === 0 && (
                <p className="text-center text-[#8696a0] py-10 text-sm">No contacts found</p>
              )}
            </>
          )}

          {/* ===== CALLS TAB ===== */}
          {activeTab === "calls" && (
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-[#8696a0]">
              <Phone className="w-12 h-12 opacity-20" />
              <p className="text-sm">No recent calls</p>
            </div>
          )}

          {/* ===== COMMUNITIES TAB ===== */}
          {activeTab === "communities" && (
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-[#8696a0]">
              <Users className="w-12 h-12 opacity-20" />
              <p className="text-sm">No communities yet</p>
            </div>
          )}

          {/* ===== SETTINGS TAB ===== */}
          {activeTab === "settings" && (
            <div className="flex flex-col">

              {/* Profile card — tap karo profile edit ke liye */}
              <button
                onClick={() => navigate("/profile")}
                className="flex items-center gap-4 px-5 py-4 hover:bg-[#202c33] transition-colors border-b border-[#202c33] text-left w-full"
              >
                <img src={authUser?.profilePic || "/avatar.png"} alt=""
                  className="w-16 h-16 rounded-full object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white text-base">{authUser?.fullName}</p>
                  <p className="text-sm text-[#8696a0] truncate">{authUser?.email}</p>
                  <p className="text-xs text-emerald-400 mt-0.5">Edit profile →</p>
                </div>
              </button>

              {/* Theme toggle */}
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-[#202c33] transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                  {theme === "dark"
                    ? <Sun className="w-5 h-5 text-yellow-400" />
                    : <Moon className="w-5 h-5 text-yellow-400" />}
                </div>
                <div className="flex-1 text-left">
                  <p className="text-white text-sm font-medium">
                    {theme === "dark" ? "Switch to Light" : "Switch to Dark"}
                  </p>
                  <p className="text-[#8696a0] text-xs">Current: {theme} theme</p>
                </div>
                {/* Toggle switch */}
                <div className={`w-12 h-6 rounded-full transition-colors flex-shrink-0 ${theme === "dark" ? "bg-emerald-500" : "bg-[#3a3a3a]"}`}>
                  <div className={`w-5 h-5 bg-white rounded-full mt-0.5 transition-transform shadow-sm ${theme === "dark" ? "translate-x-6" : "translate-x-0.5"}`} />
                </div>
              </button>

              {/* App theme/settings page */}
              <button
                onClick={() => navigate("/settings")}
                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-[#202c33] transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <Palette className="w-5 h-5 text-blue-400" />
                </div>
                <div className="text-left">
                  <p className="text-white text-sm font-medium">App Theme</p>
                  <p className="text-[#8696a0] text-xs">Change color themes</p>
                </div>
              </button>

              {/* Logout */}
              <button
                onClick={logout}
                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-red-500/10 transition-colors mt-6 border-t border-[#202c33]"
              >
                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                  <LogOut className="w-5 h-5 text-red-400" />
                </div>
                <p className="text-red-400 text-sm font-medium">Log Out</p>
              </button>
            </div>
          )}
        </div>

        {/* FAB */}
        {activeTab === "chats" && (
          <div className="absolute bottom-20 right-4 z-10">
            <button className="w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-600 flex items-center justify-center shadow-xl transition-colors">
              <MessageSquare className="w-6 h-6 text-white" />
            </button>
          </div>
        )}

        {/* BOTTOM TAB BAR */}
        <div className="flex-shrink-0 bg-[#1f2c34] border-t border-[#2a3942] flex items-center justify-around px-2 py-2">
          {[
            { id: "chats", icon: MessageSquare, label: "Chats" },
            { id: "calls", icon: Phone, label: "Calls" },
            { id: "communities", icon: Users, label: "Communities" },
            { id: "settings", icon: Settings, label: "Settings" },
          ].map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-colors ${
                activeTab === id ? "text-emerald-400" : "text-[#8696a0]"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{label}</span>
              {activeTab === id && <span className="w-1 h-1 rounded-full bg-emerald-400" />}
            </button>
          ))}
        </div>
      </div>
    );
  }

  /* ==================== DESKTOP ==================== */
  return (
    <aside className="h-full w-full flex flex-col bg-base-100 overflow-hidden">
      <div className="border-b border-base-300 px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold text-base">Chats</span>
          {onlineUsers.filter((id) => id !== authUser?._id).length > 0 && (
            <span className="flex items-center gap-1 text-xs bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              {onlineUsers.filter((id) => id !== authUser?._id).length} online
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 bg-base-200 rounded-full px-3 py-1.5">
          <Search className="w-4 h-4 text-base-content/40 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent outline-none text-sm flex-1 placeholder:text-base-content/30"
          />
        </div>
      </div>

      <div className="overflow-y-auto w-full flex-1">
        {filteredUsers.map((user) => {
          const isOnline = onlineUsers.includes(user._id);
          const isSelected = selectedUser?._id === user._id;
          return (
            <button
              key={user._id}
              onClick={() => setSelectedUser(user)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-base-200
             ${isSelected ? "bg-base-200 border-l-4 border-emerald-500" : "border-l-4 border-transparent"}`}
            >
              <div className="relative flex-shrink-0">
                <img src={user.profilePic || "/avatar.png"} alt={user.fullName}
                  className="w-11 h-11 rounded-full object-cover" />
                {isOnline && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-base-100" />
                )}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <span className="font-medium text-sm truncate block">{user.fullName}</span>
                <span className={`text-xs ${isOnline ? "text-emerald-500" : "text-base-content/40"}`}>
                  {isOnline ? "Online" : "Offline"}
                </span>
              </div>
            </button>
          );
        })}

        {filteredUsers.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <Users className="w-8 h-8 text-base-content/20" />
            <p className="text-sm text-base-content/40">No contacts found</p>
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
// import { Search, Camera, EllipsisVertical, Image, MessageSquare, Users, Phone, Settings, LogOut, User, Sun, Moon } from "lucide-react";
// import { Link } from "react-router-dom";
// import { useThemeStore } from "../store/useThemeStore";

// const Sidebar = ({ onSelectUser }) => {
//   const { getUsers, users, selectedUser, setSelectedUser, isUsersLoading } = useChatStore();
//   const { onlineUsers, authUser, logout } = useAuthStore();
//   const [searchQuery, setSearchQuery] = useState("");
//   const [activeTab, setActiveTab] = useState("chats");
//   const [showProfileMenu, setShowProfileMenu] = useState(false);
//   const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

//   // Try to get theme store — graceful fallback if not present
//   let theme, setTheme;
//   try {
//     const ts = useThemeStore();
//     theme = ts.theme;
//     setTheme = ts.setTheme;
//   } catch {
//     theme = "light";
//     setTheme = () => {};
//   }

//   useEffect(() => {
//     const check = () => setIsMobile(window.innerWidth <= 768);
//     window.addEventListener("resize", check);
//     return () => window.removeEventListener("resize", check);
//   }, []);

//   useEffect(() => {
//     getUsers();
//   }, [getUsers]);

//   const filteredUsers = users.filter((user) =>
//     user.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
//   );

//   if (isUsersLoading) return <SidebarSkeleton />;

//   /* ===================== MOBILE LAYOUT ===================== */
//   if (isMobile) {
//     return (
//       <div className="h-full w-full flex flex-col bg-[#111b21] text-white overflow-hidden">

//         {/* ---- TOP HEADER ---- */}
//         <div className="flex items-center justify-between px-4 pt-12 pb-3 bg-[#111b21] flex-shrink-0">
//           <h1 className="text-2xl font-bold text-white">
//             {activeTab === "chats" && "WhatsApp"}
//             {activeTab === "settings" && "Settings"}
//             {activeTab === "calls" && "Calls"}
//           </h1>
//           {activeTab === "chats" && (
//             <div className="flex items-center gap-2">
//               <button className="p-2 rounded-full hover:bg-white/10 transition-colors">
//                 <Camera className="w-5 h-5 text-white/80" />
//               </button>
//               <button className="p-2 rounded-full hover:bg-white/10 transition-colors">
//                 <EllipsisVertical className="w-5 h-5 text-white/80" />
//               </button>
//             </div>
//           )}
//         </div>

//         {/* ---- CONTENT AREA ---- */}
//         <div className="flex-1 overflow-y-auto min-h-0">

//           {/* === CHATS TAB === */}
//           {activeTab === "chats" && (
//             <>
//               {/* Search */}
//               <div className="px-3 pb-2">
//                 <div className="flex items-center gap-3 bg-[#202c33] rounded-xl px-4 py-2.5">
//                   <Search className="w-4 h-4 text-[#8696a0] flex-shrink-0" />
//                   <input
//                     type="text"
//                     placeholder="Ask Meta AI or Search"
//                     value={searchQuery}
//                     onChange={(e) => setSearchQuery(e.target.value)}
//                     className="bg-transparent outline-none text-sm flex-1 text-white placeholder:text-[#8696a0]"
//                   />
//                 </div>
//               </div>

//               {/* Contact list */}
//               {filteredUsers.map((user) => {
//                 const isOnline = onlineUsers.includes(user._id);
//                 const isSelected = selectedUser?._id === user._id;

//                 return (
//                   <button
//                     key={user._id}
//                     onClick={() => {
//                       setSelectedUser(user);
//                       onSelectUser?.();
//                     }}
//                     className={`w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-left
//                       ${isSelected ? "bg-[#2a3942]" : "hover:bg-[#202c33]"}`}
//                   >
//                     <div className="relative flex-shrink-0">
//                       <img src={user.profilePic || "/avatar.png"} alt={user.fullName}
//                         className="w-12 h-12 rounded-full object-cover" />
//                       {isOnline && (
//                         <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#111b21]" />
//                       )}
//                     </div>
//                     <div className="flex-1 min-w-0 border-b border-[#202c33] pb-2.5">
//                       <div className="flex items-center justify-between gap-2">
//                         <span className="font-medium text-[15px] text-white truncate">{user.fullName}</span>
//                         <span className="text-xs text-[#8696a0] flex-shrink-0">Yesterday</span>
//                       </div>
//                       <div className="flex items-center justify-between mt-0.5">
//                         <p className="text-sm text-[#8696a0] truncate">
//                           {isOnline ? "Online" : "Tap to chat"}
//                         </p>
//                       </div>
//                     </div>
//                   </button>
//                 );
//               })}

//               {filteredUsers.length === 0 && (
//                 <p className="text-center text-[#8696a0] py-10 text-sm">No contacts found</p>
//               )}
//             </>
//           )}

//           {/* === SETTINGS TAB === */}
//           {activeTab === "settings" && (
//             <div className="flex flex-col">

//               {/* Profile card */}
//               <div className="flex items-center gap-4 px-5 py-4 hover:bg-[#202c33] transition-colors border-b border-[#202c33]">
//                 <img src={authUser?.profilePic || "/avatar.png"} alt=""
//                   className="w-16 h-16 rounded-full object-cover" />
//                 <div className="flex-1 min-w-0">
//                   <p className="font-semibold text-white text-base">{authUser?.fullName}</p>
//                   <p className="text-sm text-[#8696a0] truncate">{authUser?.email}</p>
//                 </div>
//               </div>

//               {/* Settings items */}
//               <div className="mt-2">
//                 <Link
//                   to="/profile"
//                   className="flex items-center gap-4 px-5 py-4 hover:bg-[#202c33] transition-colors"
//                 >
//                   <div className="w-9 h-9 rounded-full bg-emerald-500/20 flex items-center justify-center">
//                     <User className="w-5 h-5 text-emerald-400" />
//                   </div>
//                   <div>
//                     <p className="text-white text-sm font-medium">Account</p>
//                     <p className="text-[#8696a0] text-xs">Privacy, security, change number</p>
//                   </div>
//                 </Link>

//                 <Link
//                   to="/settings"
//                   className="flex items-center gap-4 px-5 py-4 hover:bg-[#202c33] transition-colors"
//                 >
//                   <div className="w-9 h-9 rounded-full bg-blue-500/20 flex items-center justify-center">
//                     <Settings className="w-5 h-5 text-blue-400" />
//                   </div>
//                   <div>
//                     <p className="text-white text-sm font-medium">Theme & Display</p>
//                     <p className="text-[#8696a0] text-xs">Wallpaper, chat themes</p>
//                   </div>
//                 </Link>

//                 {/* Dark/Light toggle */}
//                 <button
//                   onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
//                   className="w-full flex items-center gap-4 px-5 py-4 hover:bg-[#202c33] transition-colors"
//                 >
//                   <div className="w-9 h-9 rounded-full bg-yellow-500/20 flex items-center justify-center">
//                     {theme === "dark"
//                       ? <Sun className="w-5 h-5 text-yellow-400" />
//                       : <Moon className="w-5 h-5 text-yellow-400" />}
//                   </div>
//                   <div className="flex-1 text-left">
//                     <p className="text-white text-sm font-medium">
//                       {theme === "dark" ? "Light Mode" : "Dark Mode"}
//                     </p>
//                     <p className="text-[#8696a0] text-xs">Currently {theme} theme</p>
//                   </div>
//                   <div className={`w-12 h-6 rounded-full transition-colors ${theme === "dark" ? "bg-emerald-500" : "bg-[#3a3a3a]"}`}>
//                     <div className={`w-5 h-5 bg-white rounded-full mt-0.5 transition-transform shadow-sm ${theme === "dark" ? "translate-x-6" : "translate-x-0.5"}`} />
//                   </div>
//                 </button>

//                 {/* Logout */}
//                 <button
//                   onClick={logout}
//                   className="w-full flex items-center gap-4 px-5 py-4 hover:bg-red-500/10 transition-colors mt-4 border-t border-[#202c33]"
//                 >
//                   <div className="w-9 h-9 rounded-full bg-red-500/20 flex items-center justify-center">
//                     <LogOut className="w-5 h-5 text-red-400" />
//                   </div>
//                   <p className="text-red-400 text-sm font-medium">Log Out</p>
//                 </button>
//               </div>
//             </div>
//           )}

//           {/* === CALLS TAB === */}
//           {activeTab === "calls" && (
//             <div className="flex flex-col items-center justify-center h-full gap-3 text-[#8696a0]">
//               <Phone className="w-12 h-12 opacity-20" />
//               <p className="text-sm">No recent calls</p>
//               <p className="text-xs opacity-60">Your call history will appear here</p>
//             </div>
//           )}
//         </div>

//         {/* ---- BOTTOM TAB BAR ---- */}
//         <div className="flex-shrink-0 bg-[#1f2c34] border-t border-[#2a3942] flex items-center justify-around px-2 py-2 safe-area-inset-bottom">
//           {[
//             { id: "chats", icon: MessageSquare, label: "Chats" },
//             { id: "calls", icon: Phone, label: "Calls" },
//             { id: "communities", icon: Users, label: "Communities" },
//             { id: "settings", icon: Settings, label: "Settings" },
//           ].map(({ id, icon: Icon, label }) => (
//             <button
//               key={id}
//               onClick={() => setActiveTab(id)}
//               className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-colors ${
//                 activeTab === id ? "text-emerald-400" : "text-[#8696a0]"
//               }`}
//             >
//               <Icon className="w-5 h-5" />
//               <span className="text-[10px] font-medium">{label}</span>
//               {activeTab === id && (
//                 <span className="w-1 h-1 rounded-full bg-emerald-400 mt-0.5" />
//               )}
//             </button>
//           ))}
//         </div>

//         {/* FAB — only on chats tab */}
//         {activeTab === "chats" && (
//           <div className="absolute bottom-20 right-4 z-10">
//             <button className="w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-600 flex items-center justify-center shadow-xl transition-colors">
//               <MessageSquare className="w-6 h-6 text-white" />
//             </button>
//           </div>
//         )}
//       </div>
//     );
//   }

//   /* ===================== DESKTOP LAYOUT ===================== */
//   return (
//     <aside className="h-full w-full flex flex-col bg-base-100 overflow-hidden">

//       {/* Header */}
//       <div className="border-b border-base-300 px-4 py-3 flex-shrink-0">
//         <div className="flex items-center justify-between mb-2">
//           <span className="font-semibold text-base">Chats</span>
//           {onlineUsers.filter((id) => id !== authUser?._id).length > 0 && (
//             <span className="flex items-center gap-1 text-xs bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full font-medium">
//               <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
//               {onlineUsers.filter((id) => id !== authUser?._id).length} online
//             </span>
//           )}
//         </div>
//         <div className="flex items-center gap-2 bg-base-200 rounded-full px-3 py-1.5">
//           <Search className="w-4 h-4 text-base-content/40 flex-shrink-0" />
//           <input
//             type="text"
//             placeholder="Search contacts..."
//             value={searchQuery}
//             onChange={(e) => setSearchQuery(e.target.value)}
//             className="bg-transparent outline-none text-sm flex-1 placeholder:text-base-content/30"
//           />
//         </div>
//       </div>

//       {/* User list */}
//       <div className="overflow-y-auto w-full flex-1">
//         {filteredUsers.map((user) => {
//           const isOnline = onlineUsers.includes(user._id);
//           const isSelected = selectedUser?._id === user._id;
//           return (
//             <button
//               key={user._id}
//               onClick={() => setSelectedUser(user)}
//               className={`w-full flex items-center gap-3 px-3 py-2.5 transition-colors
//                 hover:bg-base-200
//                 ${isSelected ? "bg-base-200 border-l-4 border-emerald-500" : "border-l-4 border-transparent"}`}
//             >
//               <div className="relative flex-shrink-0">
//                 <img src={user.profilePic || "/avatar.png"} alt={user.fullName}
//                   className="w-11 h-11 rounded-full object-cover" />
//                 {isOnline && (
//                   <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-base-100" />
//                 )}
//               </div>
//               <div className="flex-1 min-w-0 text-left">
//                 <div className="flex items-center justify-between">
//                   <span className="font-medium text-sm truncate">{user.fullName}</span>
//                 </div>
//                 <span className={`text-xs ${isOnline ? "text-emerald-500" : "text-base-content/40"}`}>
//                   {isOnline ? "Online" : "Offline"}
//                 </span>
//               </div>
//             </button>
//           );
//         })}

//         {filteredUsers.length === 0 && (
//           <div className="flex flex-col items-center justify-center py-12 gap-2">
//             <Users className="w-8 h-8 text-base-content/20" />
//             <p className="text-sm text-base-content/40">No contacts found</p>
//           </div>
//         )}
//       </div>
//     </aside>
//   );
// };

// export default Sidebar;

// // Sidebar.jsx
// import { useEffect, useState } from "react";
// import { useChatStore } from "../store/useChatStore";
// import { useAuthStore } from "../store/useAuthStore";
// import SidebarSkeleton from "./skeletons/SidebarSkeleton";
// import { Users } from "lucide-react";

// const Sidebar = ({ onSelectUser }) => {
//   const { getUsers, users, selectedUser, setSelectedUser, isUsersLoading } =
//     useChatStore();

//   const { onlineUsers, authUser } = useAuthStore();
//   const [showOnlineOnly, setShowOnlineOnly] = useState(false);

//   // Fetch Users on Load
//   useEffect(() => {
//     getUsers();
//   }, [getUsers]);

//   // Filter Users by Online Status
//   const filteredUsers = showOnlineOnly
//     ? users.filter((user) => onlineUsers.includes(user._id))
//     : users;

//   if (isUsersLoading) return <SidebarSkeleton />;

//   return (
//     <aside
//       className="
//         h-full
//         w-20
//         lg:w-72
//         border-r border-base-300
//         flex flex-col
//         transition-all duration-200
//         max-[450px]:w-16
//       "
//     >
//       {/* HEADER */}
//       <div className="border-b border-base-300 w-full p-5 max-[450px]:p-3">
//         <div className="flex items-center gap-2">
//           <Users className="size-6 max-[450px]:size-5" />
//           <span className="font-medium hidden lg:block">Contacts</span>
//         </div>

//         {/* Online Filter */}
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

//           <span className="text-xs text-zinc-500">
//             (
//             {
//               onlineUsers.filter((id) => id !== authUser?._id).length
//             }{" "}
//             online)
//           </span>
//         </div>
//       </div>

//       {/* USER LIST */}
//       <div className="overflow-y-auto w-full py-3 max-[450px]:py-2">
//         {filteredUsers.map((user) => (
//           <button
//             key={user._id}
//             onClick={() => {
//               setSelectedUser(user);

//               // Close sidebar automatically on mobile
//               if (window.innerWidth <= 720) {
//                 onSelectUser?.();
//               }
//             }}
//             className={`
//               w-full
//               p-3 max-[450px]:p-2
//               flex items-center gap-3
//               hover:bg-base-300 transition-colors
//               ${
//                 selectedUser?._id === user._id
//                   ? "bg-base-300 ring-1 ring-base-300"
//                   : ""
//               }
//             `}
//           >
//             {/* Avatar */}
//             <div className="relative mx-auto lg:mx-0">
//               <img
//                 src={user.profilePic || "/avatar.png"}
//                 alt={user.fullName}      // ⭐ FIXED
//                 className="size-12 max-[450px]:size-10 object-cover rounded-full"
//               />

//               {/* Online Badge */}
//               {onlineUsers.includes(user._id) && (
//                 <span className="absolute bottom-0 right-0 size-3 bg-green-500 rounded-full ring-2 ring-zinc-900" />
//               )}
//             </div>

//             {/* User Info (hidden on small screens) */}
//             <div className="hidden lg:block text-left min-w-0">
//               <div className="font-medium truncate">{user.fullName}</div>

//               <div className="text-sm text-zinc-400">
//                 {onlineUsers.includes(user._id)
//                   ? "Online"
//                   : "Offline"}
//               </div>
//             </div>
//           </button>
//         ))}

//         {/* Empty State */}
//         {filteredUsers.length === 0 && (
//           <div className="text-center text-zinc-500 py-4 text-sm lg:text-base">
//             No online users
//           </div>
//         )}
//       </div>
//     </aside>
//   );
// };

// export default Sidebar;





// // import { useEffect, useState } from "react";
// // import { useChatStore } from "../store/useChatStore";
// // import { useAuthStore } from "../store/useAuthStore";
// // import SidebarSkeleton from "./skeletons/SidebarSkeleton";
// // import { Users } from "lucide-react";

// // const Sidebar = () => {
// //   const { getUsers, users, selectedUser, setSelectedUser, isUsersLoading } = useChatStore();

// //   const { onlineUsers } = useAuthStore();
// //   const [showOnlineOnly, setShowOnlineOnly] = useState(false);

// //   useEffect(() => {
// //     getUsers();
// //   }, [getUsers]);

// //   const filteredUsers = showOnlineOnly
// //     ? users.filter((user) => onlineUsers.includes(user._id))
// //     : users;

// //   if (isUsersLoading) return <SidebarSkeleton />;

// //   return (
// //     <aside className="h-full w-20 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200">
// //       <div className="border-b border-base-300 w-full p-5">
// //         <div className="flex items-center gap-2">
// //           <Users className="size-6" />
// //           <span className="font-medium hidden lg:block">Contacts</span>
// //         </div>
// //         {/* TODO: Online filter toggle */}
// //         <div className="mt-3 hidden lg:flex items-center gap-2">
// //           <label className="cursor-pointer flex items-center gap-2">
// //             <input
// //               type="checkbox"
// //               checked={showOnlineOnly}
// //               onChange={(e) => setShowOnlineOnly(e.target.checked)}
// //               className="checkbox checkbox-sm"
// //             />
// //             <span className="text-sm">Show online only</span>
// //           </label>
// //           <span className="text-xs text-zinc-500">({onlineUsers.length - 1} online)</span>
// //         </div>
// //       </div>

// //       <div className="overflow-y-auto w-full py-3">
// //         {filteredUsers.map((user) => (
// //           <button
// //             key={user._id}
// //             onClick={() => setSelectedUser(user)}
// //             className={`
// //               w-full p-3 flex items-center gap-3
// //               hover:bg-base-300 transition-colors
// //               ${selectedUser?._id === user._id ? "bg-base-300 ring-1 ring-base-300" : ""}
// //             `}
// //           >
// //             <div className="relative mx-auto lg:mx-0">
// //               <img
// //                 src={user.profilePic || "/avatar.png"}
// //                 alt={user.name}
// //                 className="size-12 object-cover rounded-full"
// //               />
// //               {onlineUsers.includes(user._id) && (
// //                 <span
// //                   className="absolute bottom-0 right-0 size-3 bg-green-500 
// //                   rounded-full ring-2 ring-zinc-900"
// //                 />
// //               )}
// //             </div>

// //             {/* User info - only visible on larger screens */}
// //             <div className="hidden lg:block text-left min-w-0">
// //               <div className="font-medium truncate">{user.fullName}</div>
// //               <div className="text-sm text-zinc-400">
// //                 {onlineUsers.includes(user._id) ? "Online" : "Offline"}
// //               </div>
// //             </div>
// //           </button>
// //         ))}

// //         {filteredUsers.length === 0 && (
// //           <div className="text-center text-zinc-500 py-4">No online users</div>
// //         )}
// //       </div>
// //     </aside>
// //   );
// // };
// // export default Sidebar;
// import { useEffect, useState } from "react";
// import { useChatStore } from "../store/useChatStore";
// import { useAuthStore } from "../store/useAuthStore";
// import SidebarSkeleton from "./skeletons/SidebarSkeleton";
// import { Search, Users } from "lucide-react";

// const Sidebar = ({ onSelectUser }) => {
//   const { getUsers, users, selectedUser, setSelectedUser, isUsersLoading } = useChatStore();
//   const { onlineUsers, authUser } = useAuthStore();

//   const [showOnlineOnly, setShowOnlineOnly] = useState(false);
//   const [searchQuery, setSearchQuery] = useState("");

//   useEffect(() => {
//     getUsers();
//   }, [getUsers]);

//   const filteredUsers = users.filter((user) => {
//     const matchesOnline = showOnlineOnly ? onlineUsers.includes(user._id) : true;
//     const matchesSearch = user.fullName?.toLowerCase().includes(searchQuery.toLowerCase());
//     return matchesOnline && matchesSearch;
//   });

//   const onlineCount = onlineUsers.filter((id) => id !== authUser?._id).length;

//   if (isUsersLoading) return <SidebarSkeleton />;

//   return (
//     <aside className="h-full w-20 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200 bg-base-100 max-[450px]:w-16">

//       {/* ===== HEADER ===== */}
//       <div className="border-b border-base-300 w-full px-3 py-3 flex-shrink-0">

//         {/* Title row */}
//         <div className="flex items-center justify-between mb-2 px-1">
//           <div className="flex items-center gap-2">
//             <Users className="w-5 h-5 text-base-content/70 lg:hidden" />
//             <span className="font-semibold text-base hidden lg:block">Chats</span>
//           </div>
//           {/* Online badge */}
//           {onlineCount > 0 && (
//             <span className="hidden lg:flex items-center gap-1 text-xs bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full font-medium">
//               <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
//               {onlineCount} online
//             </span>
//           )}
//         </div>

//         {/* Search bar — lg only */}
//         <div className="hidden lg:flex items-center gap-2 bg-base-200 rounded-full px-3 py-1.5">
//           <Search className="w-4 h-4 text-base-content/40 flex-shrink-0" />
//           <input
//             type="text"
//             placeholder="Search contacts..."
//             value={searchQuery}
//             onChange={(e) => setSearchQuery(e.target.value)}
//             className="bg-transparent outline-none text-sm flex-1 placeholder:text-base-content/30"
//           />
//         </div>

//         {/* Online only toggle — lg only */}
//         <div className="mt-2 hidden lg:flex items-center gap-2 px-1">
//           <label className="cursor-pointer flex items-center gap-2">
//             <input
//               type="checkbox"
//               checked={showOnlineOnly}
//               onChange={(e) => setShowOnlineOnly(e.target.checked)}
//               className="checkbox checkbox-xs checkbox-success"
//             />
//             <span className="text-xs text-base-content/60">Online only</span>
//           </label>
//         </div>
//       </div>

//       {/* ===== USER LIST ===== */}
//       <div className="overflow-y-auto w-full flex-1">
//         {filteredUsers.map((user) => {
//           const isOnline = onlineUsers.includes(user._id);
//           const isSelected = selectedUser?._id === user._id;

//           return (
//             <button
//               key={user._id}
//               onClick={() => {
//                 setSelectedUser(user);
//                 if (window.innerWidth <= 720) onSelectUser?.();
//               }}
//               className={`w-full flex items-center gap-3 px-3 py-2.5 max-[450px]:py-2 transition-colors
//                 hover:bg-base-200
//                 ${isSelected ? "bg-base-200 border-l-4 border-emerald-500" : "border-l-4 border-transparent"}
//               `}
//             >
//               {/* Avatar + online dot */}
//               <div className="relative flex-shrink-0 mx-auto lg:mx-0">
//                 <img
//                   src={user.profilePic || "/avatar.png"}
//                   alt={user.fullName}
//                   className="w-12 h-12 max-[450px]:w-10 max-[450px]:h-10 rounded-full object-cover"
//                 />
//                 {isOnline && (
//                   <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-base-100" />
//                 )}
//               </div>

//               {/* User info — lg only */}
//               <div className="hidden lg:flex flex-col flex-1 min-w-0 text-left">
//                 <div className="flex items-center justify-between gap-1">
//                   <span className={`font-medium text-sm truncate ${isSelected ? "text-base-content" : "text-base-content/90"}`}>
//                     {user.fullName}
//                   </span>
//                 </div>
//                 <span className={`text-xs truncate ${isOnline ? "text-emerald-500" : "text-base-content/40"}`}>
//                   {isOnline ? "Online" : "Offline"}
//                 </span>
//               </div>
//             </button>
//           );
//         })}

//         {/* Empty state */}
//         {filteredUsers.length === 0 && (
//           <div className="flex flex-col items-center justify-center py-12 px-4 text-center gap-2">
//             <Users className="w-8 h-8 text-base-content/20" />
//             <p className="text-sm text-base-content/40">
//               {searchQuery ? "No contacts found" : "No online users"}
//             </p>
//           </div>
//         )}
//       </div>
//     </aside>
//   );
// };

// export default Sidebar;