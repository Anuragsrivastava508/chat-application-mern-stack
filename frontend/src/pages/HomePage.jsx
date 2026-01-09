import { useState, useEffect } from "react";
import { useChatStore } from "../store/useChatStore";

import Sidebar from "../components/Sidebar";
import IncomingCallPopup from "../components/IncomingCallPopup";
import NoChatSelected from "../components/NoChatSelected";
import ChatContainer from "../components/ChatContainer";

const HomePage = () => {
  const { selectedUser } = useChatStore();
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Detect screen width
  useEffect(() => {
    const checkScreen = () => setIsMobile(window.innerWidth <= 720);
    checkScreen();
    window.addEventListener("resize", checkScreen);
    return () => window.removeEventListener("resize", checkScreen);
  }, []);

  // If chat opens on mobile → hide sidebar
  useEffect(() => {
    if (isMobile && selectedUser) {
      setSidebarOpen(false);
    }
  }, [selectedUser, isMobile]);

//   return (
//     <div className="h-screen bg-base-200 pt-16">

//       <div className="flex relative h-full">

//         {/* ⭐ MOBILE FULLSCREEN SIDEBAR ⭐ */}
//         {isMobile ? (
//           sidebarOpen ? (
//             <div className="absolute inset-0 z-40 bg-base-100 border-r border-base-300">
//               <Sidebar onSelectUser={() => setSidebarOpen(false)} />
//             </div>
//           ) : null
//         ) : (
//           /* DESKTOP SIDEBAR */
//           <Sidebar />
//         )}

//         {/* CHAT AREA */}
//         <div className="flex-1 h-full">

//           {!selectedUser ? (
//             <NoChatSelected />
//           ) : (
//             <ChatContainer
//               // Mobile back → show sidebar
//               onBack={() => setSidebarOpen(true)}
//             />
//           )}

//         </div>
//       </div>
//     </div>
//   );
// 
return (
  <div className="h-screen bg-base-200 pt-16">
    <div className="flex relative h-full">

      {/* ⭐ MOBILE FULLSCREEN SIDEBAR ⭐ */}
      {isMobile ? (
        sidebarOpen ? (
          <div className="absolute inset-0 z-40 bg-base-100 border-r border-base-300">
            <Sidebar onSelectUser={() => setSidebarOpen(false)} />
          </div>
        ) : null
      ) : (
        <Sidebar />
      )}

      {/* CHAT AREA */}
      <div className="flex-1 h-full">
        {!selectedUser ? (
          <NoChatSelected />
        ) : (
          <ChatContainer onBack={() => setSidebarOpen(true)} />
        )}
      </div>

      {/* 🔥🔥 INCOMING CALL POPUP 🔥🔥 */}
      <IncomingCallPopup />

    </div>
  </div>
);
};


export default HomePage;



// import { useChatStore } from "../store/useChatStore";

// import Sidebar from "../components/Sidebar";
// import NoChatSelected from "../components/NoChatSelected";
// import ChatContainer from "../components/ChatContainer";

// const HomePage = () => {
//   const { selectedUser } = useChatStore();

//   return (
//     <div className="h-screen bg-base-200">
//       <div className="flex items-center justify-center pt-20 px-4">
//         <div className="bg-base-100 rounded-lg shadow-cl w-full max-w-6xl h-[calc(100vh-8rem)]">
//           <div className="flex h-full rounded-lg overflow-hidden">
//             <Sidebar />

//             {!selectedUser ? <NoChatSelected /> : <ChatContainer />}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };
// export default HomePage;
