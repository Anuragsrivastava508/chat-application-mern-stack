// import { Users } from "lucide-react";

// const SidebarSkeleton = () => {
//   // Create 8 skeleton items
//   const skeletonContacts = Array(8).fill(null);

//   return (
//     <aside
//       className="h-full w-20 lg:w-72 border-r border-base-300 
//     flex flex-col transition-all duration-200"
//     >
//       {/* Header */}
//       <div className="border-b border-base-300 w-full p-5">
//         <div className="flex items-center gap-2">
//           <Users className="w-6 h-6" />
//           <span className="font-medium hidden lg:block">Contacts</span>
//         </div>
//       </div>

//       {/* Skeleton Contacts */}
//       <div className="overflow-y-auto w-full py-3">
//         {skeletonContacts.map((_, idx) => (
//           <div key={idx} className="w-full p-3 flex items-center gap-3">
//             {/* Avatar skeleton */}
//             <div className="relative mx-auto lg:mx-0">
//               <div className="skeleton size-12 rounded-full" />
//             </div>

//             {/* User info skeleton - only visible on larger screens */}
//             <div className="hidden lg:block text-left min-w-0 flex-1">
//               <div className="skeleton h-4 w-32 mb-2" />
//               <div className="skeleton h-3 w-16" />
//             </div>
//           </div>
//         ))}
//       </div>
//     </aside>
//   );
// };

// export default SidebarSkeleton;


import { Search } from "lucide-react";

const SidebarSkeleton = () => {
  const skeletonContacts = Array(8).fill(null);
  // Vary the name widths for a natural look
  const nameWidths = ["w-28", "w-36", "w-24", "w-32", "w-20", "w-36", "w-28", "w-24"];
  const msgWidths  = ["w-20", "w-28", "w-16", "w-24", "w-20", "w-16", "w-28", "w-20"];

  return (
    <aside className="h-full w-20 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200 bg-base-100">

      {/* Header */}
      <div className="border-b border-base-300 w-full px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="skeleton h-5 w-24 hidden lg:block" />
          <div className="skeleton h-8 w-8 rounded-full mx-auto lg:mx-0" />
        </div>

        {/* Search bar skeleton — lg only */}
        <div className="hidden lg:flex items-center gap-2 bg-base-200 rounded-full px-3 py-2">
          <Search className="w-4 h-4 text-base-content/30 flex-shrink-0" />
          <div className="skeleton h-3 w-full rounded-full" />
        </div>
      </div>

      {/* Contact list */}
      <div className="overflow-y-auto w-full py-2">
        {skeletonContacts.map((_, idx) => (
          <div key={idx} className="w-full px-3 py-2.5 flex items-center gap-3">

            {/* Avatar */}
            <div className="relative flex-shrink-0 mx-auto lg:mx-0">
              <div className="skeleton w-12 h-12 rounded-full" />
              {/* Online dot placeholder — every other */}
              {idx % 3 === 0 && (
                <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full skeleton border-2 border-base-100" />
              )}
            </div>

            {/* Text info — lg only */}
            <div className="hidden lg:flex flex-col gap-1.5 flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div className={`skeleton h-3.5 rounded-full ${nameWidths[idx]}`} />
                <div className="skeleton h-2.5 w-8 rounded-full opacity-60" />
              </div>
              <div className={`skeleton h-3 rounded-full opacity-60 ${msgWidths[idx]}`} />
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
};

export default SidebarSkeleton;