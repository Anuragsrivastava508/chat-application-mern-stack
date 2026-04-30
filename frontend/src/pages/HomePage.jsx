// import { useState, useEffect } from "react";
// import { useChatStore } from "../store/useChatStore";

// import Sidebar from "../components/Sidebar";
// import NoChatSelected from "../components/NoChatSelected";
// import ChatContainer from "../components/ChatContainer";

// const HomePage = () => {
//   const { selectedUser } = useChatStore();
//   const [isMobile, setIsMobile] = useState(false);
//   const [sidebarOpen, setSidebarOpen] = useState(true);

//   // Detect screen width
//   useEffect(() => {
//     const checkScreen = () => setIsMobile(window.innerWidth <= 720);
//     checkScreen();
//     window.addEventListener("resize", checkScreen);
//     return () => window.removeEventListener("resize", checkScreen);
//   }, []);

//   // If chat opens on mobile → hide sidebar
//   useEffect(() => {
//     if (isMobile && selectedUser) {
//       setSidebarOpen(false);
//     }
//   }, [selectedUser, isMobile]);

// return (
//   <div className="h-screen bg-base-200 pt-16">
//     <div className="flex relative h-full">

//       {/* ⭐ MOBILE FULLSCREEN SIDEBAR ⭐ */}
//       {isMobile ? (
//         sidebarOpen ? (
//           <div className="absolute inset-0 z-40 bg-base-100 border-r border-base-300">
//             <Sidebar onSelectUser={() => setSidebarOpen(false)} />
//           </div>
//         ) : null
//       ) : (
//         <Sidebar />
//       )}

//       {/* CHAT AREA */}
//       <div className="flex-1 h-full">
//         {!selectedUser ? (
//           <NoChatSelected />
//         ) : (
//           <ChatContainer onBack={() => setSidebarOpen(true)} />
//         )}
//       </div>

//     </div>
//   </div>
// );
// };


// export default HomePage;
import { useState, useEffect } from "react";
import { useChatStore } from "../store/useChatStore";

import Sidebar from "../components/Sidebar";
import NoChatSelected from "../components/NoChatSelected";
import ChatContainer from "../components/ChatContainer";

const HomePage = () => {
  const { selectedUser } = useChatStore();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Mobile pe chat select hone par sidebar band
  useEffect(() => {
    if (isMobile && selectedUser) setSidebarOpen(false);
  }, [selectedUser, isMobile]);

  // Desktop pe sidebar hamesha open
  useEffect(() => {
    if (!isMobile) setSidebarOpen(true);
  }, [isMobile]);

  /* ============ MOBILE LAYOUT ============ */
  if (isMobile) {
    return (
      <div className="h-screen w-screen overflow-hidden bg-[#111b21]">
        {/* SIDEBAR — full screen */}
        {sidebarOpen && (
          <div className="absolute inset-0 z-10">
            <Sidebar onSelectUser={() => setSidebarOpen(false)} />
          </div>
        )}

        {/* CHAT — full screen, slides in when user selected */}
        {!sidebarOpen && selectedUser && (
          <div className="absolute inset-0 z-20">
            <ChatContainer onBack={() => {
              setSidebarOpen(true);
            }} />
          </div>
        )}
      </div>
    );
  }

  /* ============ DESKTOP LAYOUT ============ */
  return (
    <div className="h-screen bg-base-200 pt-14">
      <div className="flex h-full max-w-7xl mx-auto shadow-2xl overflow-hidden rounded-none">

        {/* SIDEBAR — fixed width */}
        <div className="w-80 xl:w-96 flex-shrink-0 h-full border-r border-base-300 bg-base-100">
          <Sidebar />
        </div>

        {/* CHAT AREA */}
        <div className="flex-1 h-full flex flex-col bg-base-100">
          {!selectedUser ? <NoChatSelected /> : <ChatContainer />}
        </div>

      </div>
    </div>
  );
};

export default HomePage;