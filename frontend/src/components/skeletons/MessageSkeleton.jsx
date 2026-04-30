// const MessageSkeleton = () => {
//   // Create an array of 6 items for skeleton messages
//   const skeletonMessages = Array(6).fill(null);

//   return (
//     // <div className="flex-1 overflow-y-auto p-4 space-y-4">
//       <div className="flex-1 overflow-y-auto p-4 space-y-4">

//       {skeletonMessages.map((_, idx) => (
//         <div key={idx} className={`chat ${idx % 2 === 0 ? "chat-start" : "chat-end"}`}>
//           <div className="chat-image avatar">
//             <div className="size-10 rounded-full">
//               <div className="skeleton w-full h-full rounded-full" />
//             </div>
//           </div>

//           <div className="chat-header mb-1">
//             <div className="skeleton h-4 w-16" />
//           </div>

//           <div className="chat-bubble bg-transparent p-0">
//             <div className="skeleton h-16 w-[200px]" />
//           </div>
//         </div>
//       ))}
//     </div>
//   );
// };

// export default MessageSkeleton;



const MessageSkeleton = () => {
  // Different widths for natural look
  const skeletonMessages = [
    { mine: false, w: "w-40" },
    { mine: true,  w: "w-56" },
    { mine: false, w: "w-64" },
    { mine: true,  w: "w-36" },
    { mine: false, w: "w-48" },
    { mine: true,  w: "w-52" },
  ];

  return (
    <div className="flex-1 overflow-y-auto px-3 py-4 space-y-2 bg-base-200"
      style={{
        backgroundImage: "radial-gradient(circle at 1px 1px, rgba(0,0,0,0.04) 1px, transparent 0)",
        backgroundSize: "24px 24px",
      }}
    >
      {skeletonMessages.map((msg, idx) => (
        <div
          key={idx}
          className={`flex items-end gap-2 ${msg.mine ? "flex-row-reverse" : "flex-row"}`}
        >
          {/* Avatar placeholder (only for received) */}
          {!msg.mine && (
            <div className="w-7 h-7 flex-shrink-0 rounded-full skeleton" />
          )}

          {/* Bubble skeleton */}
          <div className={`flex flex-col gap-1 ${msg.mine ? "items-end" : "items-start"}`}>
            <div
              className={`skeleton h-10 rounded-2xl ${msg.w} ${
                msg.mine ? "rounded-br-sm" : "rounded-bl-sm"
              }`}
            />
            {/* Tiny timestamp placeholder */}
            <div className="skeleton h-2 w-10 rounded-full opacity-50" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default MessageSkeleton;