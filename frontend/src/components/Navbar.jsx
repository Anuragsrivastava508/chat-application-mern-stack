import { Link } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { LogOut, MessageSquare, Settings, User, Menu, X } from "lucide-react";
import { useState } from "react";

const Navbar = () => {
  const { logout, authUser } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    /* ⭐ hidden on mobile (md:flex) — WhatsApp jaisa full screen mobile experience */
    <header className="hidden md:block bg-base-100/80 backdrop-blur-lg border-b border-base-300 fixed w-full top-0 z-40">
      <div className="px-4 h-14 w-full flex items-center justify-between">

        {/* LEFT: LOGO */}
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition shrink-0">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/15 flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-emerald-500" />
          </div>
          <h1 className="text-base font-bold max-[350px]:hidden">Chatty</h1>
        </Link>

        {/* DESKTOP BUTTONS */}
        <div className="hidden sm:flex items-center gap-1">
          <Link
            to="/settings"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm hover:bg-base-200 transition-colors text-base-content/70"
          >
            <Settings className="w-4 h-4" />
            Settings
          </Link>

          <Link
            to="/profile"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm hover:bg-base-200 transition-colors text-base-content/70"
          >
            <User className="w-4 h-4" />
            Profile
          </Link>

          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm hover:bg-red-50 hover:text-red-500 transition-colors text-base-content/70 ml-1"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>

        {/* MOBILE MENU BUTTON (md se upar nahi dikhega, but just in case) */}
        <button
          className="sm:hidden p-2 rounded-full hover:bg-base-200 transition-colors"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* MOBILE DROPDOWN */}
      {menuOpen && (
        <div className="sm:hidden bg-base-100 border-t border-base-200 py-2 flex flex-col">
          <Link to="/settings" onClick={() => setMenuOpen(false)}
            className="flex items-center gap-3 px-5 py-3 hover:bg-base-200 text-sm">
            <Settings className="w-4 h-4 text-base-content/60" /> Settings
          </Link>
          <Link to="/profile" onClick={() => setMenuOpen(false)}
            className="flex items-center gap-3 px-5 py-3 hover:bg-base-200 text-sm">
            <User className="w-4 h-4 text-base-content/60" /> Profile
          </Link>
          <div className="border-t border-base-200 mt-1 pt-1">
            <button onClick={() => { logout(); setMenuOpen(false); }}
              className="flex items-center gap-3 px-5 py-3 hover:bg-red-50 hover:text-red-500 text-sm w-full">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;



// import { Link } from "react-router-dom";
// import { useAuthStore } from "../store/useAuthStore";
// import { LogOut, MessageSquare, Settings, User, Menu } from "lucide-react";
// import { useState } from "react";

// const Navbar = () => {
//   const { logout, authUser } = useAuthStore();
//   const [menuOpen, setMenuOpen] = useState(false);

//   return (
//     <header
//       className="
//         bg-base-100 border-b border-base-300 
//         fixed w-full top-0 z-40 
//         backdrop-blur-lg bg-base-100/80
//       "
//     >
//       <div className="px-4 h-16 w-full flex items-center justify-between">

//         {/* LEFT: LOGO */}
//         <div className="flex items-center gap-2 shrink-0">
//           <Link
//             to="/"
//             className="flex items-center gap-2 hover:opacity-80 transition"
//           >
//             <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center">
//               <MessageSquare className="w-5 h-5 text-primary" />
//             </div>
//             <h1 className="text-lg font-bold max-[350px]:hidden">Chatty</h1>
//           </Link>
//         </div>

//         {/* DESKTOP BUTTONS */}
//         <div className="hidden sm:flex items-center gap-2">
//           <Link to="/settings" className="btn btn-sm gap-2">
//             <Settings className="w-4 h-4" /> Settings
//           </Link>

//           <Link to="/profile" className="btn btn-sm gap-2">
//             <User className="w-5 h-5" /> Profile
//           </Link>

//           <button onClick={logout} className="flex items-center gap-2 px-2 py-1">
//             <LogOut className="w-5 h-5" /> Logout
//           </button>
//         </div>

//         {/* MOBILE MENU BUTTON */}
//         <button
//           className="sm:hidden p-2"
//           onClick={() => setMenuOpen(!menuOpen)}
//         >
//           <Menu className="w-6 h-6" />
//         </button>
//       </div>

//       {/* MOBILE DROPDOWN MENU */}
//       {menuOpen && (
//         <div className="sm:hidden bg-base-100 border-t border-base-300 p-4 flex flex-col gap-3">
//           <Link
//             to="/settings"
//             onClick={() => setMenuOpen(false)}
//             className="flex items-center gap-2"
//           >
//             <Settings className="w-5 h-5" /> Settings
//           </Link>

//           <Link
//             to="/profile"
//             onClick={() => setMenuOpen(false)}
//             className="flex items-center gap-2"
//           >
//             <User className="w-5 h-5" /> Profile
//           </Link>

//           <button
//             onClick={logout}
//             className="flex items-center gap-2"
//           >
//             <LogOut className="w-5 h-5" /> Logout
//           </button>
//         </div>
//       )}
//     </header>
//   );
// };

// export default Navbar;
// import { Link } from "react-router-dom";
// import { useAuthStore } from "../store/useAuthStore";
// import { LogOut, MessageSquare, Settings, User, Menu, X } from "lucide-react";
// import { useState } from "react";

// const Navbar = () => {
//   const { logout, authUser } = useAuthStore();
//   const [menuOpen, setMenuOpen] = useState(false);

//   return (
//     <header className="bg-base-100/80 backdrop-blur-lg border-b border-base-300 fixed w-full top-0 z-40">
//       <div className="px-4 h-14 w-full flex items-center justify-between">

//         {/* LEFT: LOGO */}
//         <div className="flex items-center gap-2 shrink-0">
//           <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition">
//             <div className="w-8 h-8 rounded-xl bg-emerald-500/15 flex items-center justify-center">
//               <MessageSquare className="w-4 h-4 text-emerald-500" />
//             </div>
//             <h1 className="text-base font-bold max-[350px]:hidden">Chatty</h1>
//           </Link>
//         </div>

//         {/* DESKTOP BUTTONS */}
//         <div className="hidden sm:flex items-center gap-1">
//           <Link
//             to="/settings"
//             className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm hover:bg-base-200 transition-colors text-base-content/70"
//           >
//             <Settings className="w-4 h-4" />
//             Settings
//           </Link>

//           <Link
//             to="/profile"
//             className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm hover:bg-base-200 transition-colors text-base-content/70"
//           >
//             <User className="w-4 h-4" />
//             Profile
//           </Link>

//           <button
//             onClick={logout}
//             className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm hover:bg-red-50 hover:text-red-500 transition-colors text-base-content/70 ml-1"
//           >
//             <LogOut className="w-4 h-4" />
//             Logout
//           </button>
//         </div>

//         {/* MOBILE MENU BUTTON */}
//         <button
//           className="sm:hidden p-2 rounded-full hover:bg-base-200 transition-colors"
//           onClick={() => setMenuOpen(!menuOpen)}
//         >
//           {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
//         </button>
//       </div>

//       {/* MOBILE DROPDOWN MENU */}
//       {menuOpen && (
//         <div className="sm:hidden bg-base-100 border-t border-base-200 py-2 flex flex-col">
//           <Link
//             to="/settings"
//             onClick={() => setMenuOpen(false)}
//             className="flex items-center gap-3 px-5 py-3 hover:bg-base-200 transition-colors text-sm"
//           >
//             <Settings className="w-4 h-4 text-base-content/60" />
//             Settings
//           </Link>

//           <Link
//             to="/profile"
//             onClick={() => setMenuOpen(false)}
//             className="flex items-center gap-3 px-5 py-3 hover:bg-base-200 transition-colors text-sm"
//           >
//             <User className="w-4 h-4 text-base-content/60" />
//             Profile
//           </Link>

//           <div className="border-t border-base-200 mt-1 pt-1">
//             <button
//               onClick={() => { logout(); setMenuOpen(false); }}
//               className="flex items-center gap-3 px-5 py-3 hover:bg-red-50 hover:text-red-500 transition-colors text-sm w-full"
//             >
//               <LogOut className="w-4 h-4" />
//               Logout
//             </button>
//           </div>
//         </div>
//       )}
//     </header>
//   );
// };

// export default Navbar;