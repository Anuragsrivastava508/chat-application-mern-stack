// // NoChatSelected.jsx
// import { MessageSquare } from "lucide-react";

// const NoChatSelected = () => {
//   return (
//     <div className="w-full flex flex-1 flex-col items-center justify-center 
//       p-10 sm:p-16 bg-base-100/50 text-center">

//       {/* icon */}
//       <div className="flex justify-center gap-4 mb-4">
//         <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center 
//           justify-center animate-bounce">
//           <MessageSquare className="w-8 h-8 text-primary" />
//         </div>
//       </div>

//       {/* text */}
//       <h2 className="text-xl sm:text-2xl font-bold">Welcome to Chatty!</h2>
//       <p className="text-base-content/60 max-w-sm mx-auto">
//         Select a conversation from the sidebar to start chatting
//       </p>
//     </div>
//   );
// };

// export default NoChatSelected;


import { MessageSquare, Lock } from "lucide-react";

const NoChatSelected = () => {
  return (
    <div className="w-full flex flex-1 flex-col items-center justify-center p-10 bg-base-200 text-center"
      style={{
        backgroundImage: "radial-gradient(circle at 1px 1px, rgba(0,0,0,0.04) 1px, transparent 0)",
        backgroundSize: "24px 24px",
      }}
    >
      <div className="flex flex-col items-center gap-5 max-w-sm">

        {/* Icon */}
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <MessageSquare className="w-12 h-12 text-emerald-500/60" strokeWidth={1.5} />
          </div>
          {/* Subtle ring */}
          <div className="absolute inset-0 rounded-full border-2 border-emerald-500/20 animate-ping" style={{ animationDuration: "3s" }} />
        </div>

        {/* Text */}
        <div>
          <h2 className="text-2xl font-bold text-base-content mb-2">Welcome to Chatty</h2>
          <p className="text-base-content/50 text-sm leading-relaxed">
            Select a conversation from the sidebar to start chatting with your contacts
          </p>
        </div>

        {/* E2E note like WhatsApp */}
        <div className="flex items-center gap-1.5 text-xs text-base-content/30 mt-2">
          <Lock className="w-3 h-3" />
          <span>Your messages are end-to-end encrypted</span>
        </div>
      </div>
    </div>
  );
};

export default NoChatSelected;