
import { Link } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { LogOut, MessageSquare, Settings, User, Menu } from "lucide-react";
import { useState } from "react";

const Navbar = () => {
  const { logout, authUser } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header
      className="
        bg-base-100 border-b border-base-300 
        fixed w-full top-0 z-40 
        backdrop-blur-lg bg-base-100/80
      "
    >
      <div className="px-4 h-16 w-full flex items-center justify-between">

        {/* LEFT: LOGO */}
        <div className="flex items-center gap-2 shrink-0">
          <Link
            to="/"
            className="flex items-center gap-2 hover:opacity-80 transition"
          >
            <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-lg font-bold max-[350px]:hidden">Chatty</h1>
          </Link>
        </div>

        {/* DESKTOP BUTTONS */}
        <div className="hidden sm:flex items-center gap-2">
          <Link to="/settings" className="btn btn-sm gap-2">
            <Settings className="w-4 h-4" /> Settings
          </Link>

          <Link to="/profile" className="btn btn-sm gap-2">
            <User className="w-5 h-5" /> Profile
          </Link>

          <button onClick={logout} className="flex items-center gap-2 px-2 py-1">
            <LogOut className="w-5 h-5" /> Logout
          </button>
        </div>

        {/* MOBILE MENU BUTTON */}
        <button
          className="sm:hidden p-2"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* MOBILE DROPDOWN MENU */}
      {menuOpen && (
        <div className="sm:hidden bg-base-100 border-t border-base-300 p-4 flex flex-col gap-3">
          <Link
            to="/settings"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2"
          >
            <Settings className="w-5 h-5" /> Settings
          </Link>

          <Link
            to="/profile"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2"
          >
            <User className="w-5 h-5" /> Profile
          </Link>

          <button
            onClick={logout}
            className="flex items-center gap-2"
          >
            <LogOut className="w-5 h-5" /> Logout
          </button>
        </div>
      )}
    </header>
  );
};

export default Navbar;


// import { Link } from "react-router-dom";
// import { useAuthStore } from "../store/useAuthStore";
// import { LogOut, MessageSquare, Settings, User } from "lucide-react";

// const Navbar = () => {
//   const { logout, authUser } = useAuthStore();

//   return (
//     <header
//       className="bg-base-100 border-b border-base-300 fixed w-full top-0 z-40 
//     backdrop-blur-lg bg-base-100/80"
//     >
//       <div className="container mx-auto px-4 h-16">
//         <div className="flex items-center justify-between h-full">
//           <div className="flex items-center gap-8">
//             <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-all">
//               <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center">
//                 <MessageSquare className="w-5 h-5 text-primary" />
//               </div>
//               <h1 className="text-lg font-bold">Chatty</h1>
//             </Link>
//           </div>

//           <div className="flex items-center gap-2">
//             <Link
//               to={"/settings"}
//               className={`
//               btn btn-sm gap-2 transition-colors
              
//               `}
//             >
//               <Settings className="w-4 h-4" />
//               <span className="hidden sm:inline">Settings</span>
//             </Link>

//             {authUser && (
//               <>
//                 <Link to={"/profile"} className={`btn btn-sm gap-2`}>
//                   <User className="size-5" />
//                   <span className="hidden sm:inline">Profile</span>
//                 </Link>

//                 <button className="flex gap-2 items-center" onClick={logout}>
//                   <LogOut className="size-5" />
//                   <span className="hidden sm:inline">Logout</span>
//                 </button>
//               </>
//             )}
//           </div>
//         </div>
//       </div>
//     </header>
//   );
// };
// export default Navbar;
