import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Navbar from "./components/Navbar";

import HomePage from "./pages/HomePage";
import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import SettingsPage from "./pages/SettingsPage";
import ProfilePage from "./pages/ProfilePage";
import IncomingCallPopup from "./components/IncomingCallPopup";
import OutgoingCallPopup from "./components/OutgoingCallPopup";

import { useAuthStore } from "./store/useAuthStore";
import { useChatStore } from "./store/useChatStore";
import { useThemeStore } from "./store/useThemeStore";

import { Loader } from "lucide-react";
import { Toaster } from "react-hot-toast";

const App = () => {
  const { authUser, checkAuth, isCheckingAuth } = useAuthStore();
  const { subscribeToMessages, subscribeToCalls } = useChatStore();
  const { theme } = useThemeStore();

  // 🔐 check auth on app load
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // 🔥 attach socket listeners AFTER login
  useEffect(() => {
    if (authUser) {
      subscribeToMessages();
      subscribeToCalls();
    }
  }, [authUser, subscribeToMessages, subscribeToCalls]);

  // ⏳ loading screen
  if (isCheckingAuth && !authUser) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="size-10 animate-spin" />
      </div>
    );
  }

  return (
    <div data-theme={theme}>
      <Navbar />
      <IncomingCallPopup />
      <OutgoingCallPopup />
      <Routes>

        <Route
          path="/"
          element={authUser ? <HomePage /> : <Navigate to="/login" />}
        />
        <Route
          path="/signup"
          element={!authUser ? <SignUpPage /> : <Navigate to="/" />}
        />
        <Route
          path="/login"
          element={!authUser ? <LoginPage /> : <Navigate to="/" />}
        />
        <Route path="/settings" element={<SettingsPage />} />
        <Route
          path="/profile"
          element={authUser ? <ProfilePage /> : <Navigate to="/login" />}
        />
      </Routes>

      <Toaster />
    </div>
  );
};

export default App;


// import Navbar from "./components/Navbar";

// import HomePage from "./pages/HomePage";
// import SignUpPage from "./pages/SignUpPage";
// import LoginPage from "./pages/LoginPage";
// import SettingsPage from "./pages/SettingsPage";
// import ProfilePage from "./pages/ProfilePage";

// import { Routes, Route, Navigate } from "react-router-dom";
// import { useAuthStore } from "./store/useAuthStore";
// import { useThemeStore } from "./store/useThemeStore";
// import { useEffect } from "react";

// import { Loader } from "lucide-react";
// import { Toaster } from "react-hot-toast";

// const App = () => {
  
//   const { authUser, checkAuth, isCheckingAuth, onlineUsers } = useAuthStore();
 
//   const { theme } = useThemeStore();

//   console.log({ onlineUsers });

//   useEffect(() => {
//     checkAuth();
//   }, [checkAuth]);

//   console.log({ authUser });

//   if (isCheckingAuth && ! authUser)
//     return (
//       <div className="flex items-center justify-center h-screen">
//         <Loader className="size-10 animate-spin" />
//       </div>
//     );

//   return (
//     <div data-theme={ theme }>
//       <Navbar />

//       <Routes>
//         <Route path="/" element={authUser ? <HomePage /> : <Navigate to="/login" />} />
//         <Route path="/signup" element={!authUser ? <SignUpPage /> : <Navigate to="/" />} />
//         <Route path="/login" element={!authUser ? <LoginPage /> : <Navigate to="/" />} />
//         <Route path="/settings" element={<SettingsPage />} />
//         <Route path="/profile" element={authUser ? <ProfilePage /> : <Navigate to="/login" />} />
//       </Routes>

//       <Toaster />
//     </div>
//   );
// };
// export default App;
