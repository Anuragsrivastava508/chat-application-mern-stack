// // MessageInput.jsx
// import { useRef, useState } from "react";
// import { useChatStore } from "../store/useChatStore";
// import { Image, Send, X } from "lucide-react";
// import toast from "react-hot-toast";

// const MessageInput = () => {
//   const [text, setText] = useState("");
//   const [imagePreview, setImagePreview] = useState(null);
//   const fileInputRef = useRef(null);
//   const { sendMessage } = useChatStore();

//   const handleImageChange = (e) => {
//     const file = e.target.files[0];
//     if (!file?.type?.startsWith("image/")) {
//       toast.error("Please select an image file");
//       return;
//     }
//     const reader = new FileReader();
//     reader.onloadend = () => setImagePreview(reader.result);
//     reader.readAsDataURL(file);
//   };

//   const removeImage = () => {
//     setImagePreview(null);
//     if (fileInputRef.current) fileInputRef.current.value = "";
//   };

//   const handleSendMessage = async (e) => {
//     e.preventDefault();
//     if (!text.trim() && !imagePreview) return;
//     try {
//       await sendMessage({ text: text.trim(), image: imagePreview });
//       setText("");
//       setImagePreview(null);
//       if (fileInputRef.current) fileInputRef.current.value = "";
//     } catch (error) {
//       console.error("Failed to send message:", error);
//     }
//   };

//   return (
//     <div className="p-4 w-full border-t border-base-300 bg-base-100 mt-auto">
//       {imagePreview && (
//         <div className="mb-3 flex items-center gap-2">
//           <div className="relative">
//             <img
//               src={imagePreview}
//               alt="Preview"
//               className="w-20 h-20 object-cover rounded-lg border border-zinc-700"
//             />
//             <button
//               onClick={removeImage}
//               className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300 flex items-center justify-center"
//               type="button"
//             >
//               <X className="size-3" />
//             </button>
//           </div>
//         </div>
//       )}

//       <form onSubmit={handleSendMessage} className="flex items-center gap-2">
//         <div className="flex-1 flex gap-2">
//           <input
//             type="text"
//             className="w-full input input-bordered rounded-lg input-sm sm:input-md"
//             placeholder="Type a message..."
//             value={text}
//             onChange={(e) => setText(e.target.value)}
//           />

//           <input
//             type="file"
//             accept="image/*"
//             className="hidden"
//             ref={fileInputRef}
//             onChange={handleImageChange}
//           />

//           <button
//             type="button"
//             className={`hidden sm:flex btn btn-circle ${imagePreview ? "text-emerald-500" : "text-zinc-400"}`}
//             onClick={() => fileInputRef.current?.click()}
//           >
//             <Image size={20} />
//           </button>
//         </div>

//         <button type="submit" className="btn btn-sm btn-circle" disabled={!text.trim() && !imagePreview}>
//           <Send size={22} />
//         </button>
//       </form>
//     </div>
//   );
// };

// export default MessageInput;

// import { useRef, useState } from "react";
// import { useChatStore } from "../store/useChatStore";
// import {
//   Image,
//   Send,
//   X,
//   Smile,
//   Paperclip,
//   Camera,
//   Mic,
// } from "lucide-react";
// import toast from "react-hot-toast";

// const MessageInput = () => {
//   const [text, setText] = useState("");
//   const [imagePreview, setImagePreview] = useState(null);
//   const fileInputRef = useRef(null);
//   const { sendMessage } = useChatStore();

//   const handleImageChange = (e) => {
//     const file = e.target.files[0];
//     if (!file?.type?.startsWith("image/")) {
//       toast.error("Please select an image file");
//       return;
//     }
//     const reader = new FileReader();
//     reader.onloadend = () => setImagePreview(reader.result);
//     reader.readAsDataURL(file);
//   };

//   const removeImage = () => {
//     setImagePreview(null);
//     if (fileInputRef.current) fileInputRef.current.value = "";
//   };

//   const handleSendMessage = async (e) => {
//     e.preventDefault();
//     if (!text.trim() && !imagePreview) return;

//     try {
//       await sendMessage({
//         text: text.trim(),
//         image: imagePreview,
//       });
//       setText("");
//       setImagePreview(null);
//       if (fileInputRef.current) fileInputRef.current.value = "";
//     } catch (error) {
//       console.error("Failed to send message:", error);
//     }
//   };

//   return (
//     <div className="w-full border-t border-base-300 bg-base-100 px-2 sm:px-4 py-2 mt-auto">

//       {/* IMAGE PREVIEW */}
//       {imagePreview && (
//         <div className="mb-3">
//           <div className="relative w-fit">
//             <img
//               src={imagePreview}
//               alt="Preview"
//               className="w-20 h-20 object-cover rounded-lg border border-zinc-700"
//             />
//             <button
//               onClick={removeImage}
//               type="button"
//               className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300 flex items-center justify-center"
//             >
//               <X size={12} />
//             </button>
//           </div>
//         </div>
//       )}

//       {/* INPUT BAR */}
//       <form onSubmit={handleSendMessage} className="flex items-center gap-2">

//         {/* EMOJI */}
//         <button type="button" className="p-2 rounded-full hover:bg-base-300">
//           <Smile size={20} className="text-base-content" />
//         </button>

//         {/* INPUT + ICONS */}
//         <div className="flex-1 flex items-center bg-base-200 rounded-full px-2 sm:px-3">

//           <input
//             type="text"
//             className="flex-1 bg-transparent outline-none px-2 py-2 text-sm sm:text-base text-base-content"
//             placeholder="Type a message..."
//             value={text}
//             onChange={(e) => setText(e.target.value)}
//           />

//           {/* ATTACH / IMAGE */}
//           <button
//             type="button"
//             className="p-2 rounded-full hover:bg-base-300"
//             onClick={() => fileInputRef.current?.click()}
//           >
//             <Paperclip size={18} className="text-base-content" />
//           </button>

//           {/* CAMERA (desktop only) */}
//           <button
//             type="button"
//             className="hidden sm:flex p-2 rounded-full hover:bg-base-300"
//           >
//             <Camera size={18} className="text-base-content" />
//           </button>

//           <input
//             type="file"
//             accept="image/*"
//             className="hidden"
//             ref={fileInputRef}
//             onChange={handleImageChange}
//           />
//         </div>

//         {/* MIC / SEND */}
//         <button
//           type="submit"
//           disabled={!text.trim() && !imagePreview}
//           className="btn btn-circle btn-sm bg-emerald-500 hover:bg-emerald-600 text-white"
//         >
//           {text.trim() || imagePreview ? (
//             <Send size={18} />
//           ) : (
//             <Mic size={18} />
//           )}
//         </button>
//       </form>
//     </div>
//   );
// };

// export default MessageInput;


import { useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import {
  Image,
  Send,
  X,
  Smile,
  Paperclip,
  Camera,
  Mic,
  FileText,
} from "lucide-react";
import toast from "react-hot-toast";

const MessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [showAttachMenu, setShowAttachMenu] = useState(false);

  const fileInputRef = useRef(null);
  const { sendMessage } = useChatStore();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file?.type?.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
    setShowAttachMenu(false);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview) return;

    await sendMessage({
      text: text.trim(),
      image: imagePreview,
    });

    setText("");
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="w-full border-t border-base-300 bg-base-100 px-2 sm:px-4 py-2 mt-auto">

      {/* IMAGE PREVIEW */}
      {imagePreview && (
        <div className="mb-3">
          <div className="relative w-fit">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-20 h-20 object-cover rounded-lg border border-zinc-700"
            />
            <button
              onClick={removeImage}
              type="button"
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300 flex items-center justify-center"
            >
              <X size={12} />
            </button>
          </div>
        </div>
      )}

      {/* INPUT BAR */}
      <form onSubmit={handleSendMessage} className="flex items-center gap-2">

        {/* EMOJI */}
        <button type="button" className="p-2 rounded-full hover:bg-base-300">
          <Smile size={20} className="text-base-content" />
        </button>

        {/* INPUT + ICONS */}
        <div className="flex-1 flex items-center bg-base-200 rounded-full px-2 sm:px-3 relative">

          <input
            type="text"
            placeholder="Type a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="flex-1 bg-transparent outline-none px-2 py-2 text-sm sm:text-base"
          />

          {/* ATTACH DROPDOWN */}
          <div className="relative">
            <button
              type="button"
              className="p-2 rounded-full hover:bg-base-300"
              onClick={() => setShowAttachMenu((p) => !p)}
            >
              <Paperclip size={18} />
            </button>

            {showAttachMenu && (
              <ul className="absolute bottom-12 right-0 bg-base-100 shadow-lg rounded-lg w-44 py-2 z-50">
                <li
                  className="flex items-center gap-3 px-4 py-2 hover:bg-base-200 cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Image size={18} />
                  <span>Photos</span>
                </li>

                <li className="flex items-center gap-3 px-4 py-2 hover:bg-base-200 cursor-pointer">
                  <Camera size={18} />
                  <span>Camera</span>
                </li>

                <li className="flex items-center gap-3 px-4 py-2 hover:bg-base-200 cursor-pointer">
                  <FileText size={18} />
                  <span>Document</span>
                </li>
              </ul>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageChange}
          />
        </div>

        {/* MIC / SEND */}
        <button
          type="submit"
          disabled={!text.trim() && !imagePreview}
          className="btn btn-circle btn-sm bg-emerald-500 hover:bg-emerald-600 text-white"
        >
          {text.trim() || imagePreview ? (
            <Send size={18} />
          ) : (
            <Mic size={18} />
          )}
        </button>
      </form>
    </div>
  );
};

export default MessageInput;



// import { useRef, useState } from "react";
// import { useChatStore } from "../store/useChatStore";
// import { Image, Send, X } from "lucide-react";
// import toast from "react-hot-toast";

// const MessageInput = () => {
//   const [text, setText] = useState("");
//   const [imagePreview, setImagePreview] = useState(null);
//   const fileInputRef = useRef(null);
//   const { sendMessage } = useChatStore();

//   const handleImageChange = (e) => {
//     const file = e.target.files[0];
//     if (!file.type.startsWith("image/")) {
//       toast.error("Please select an image file");
//       return;
//     }

//     const reader = new FileReader();
//     reader.onloadend = () => {
//       setImagePreview(reader.result);
//     };
//     reader.readAsDataURL(file);
//   };

//   const removeImage = () => {
//     setImagePreview(null);
//     if (fileInputRef.current) fileInputRef.current.value = "";
//   };

//   const handleSendMessage = async (e) => {
//     e.preventDefault();
//     if (!text.trim() && !imagePreview) return;

//     try {
//       await sendMessage({
//         text: text.trim(),
//         image: imagePreview,
//       });

//       // Clear form
//       setText("");
//       setImagePreview(null);
//       if (fileInputRef.current) fileInputRef.current.value = "";
//     } catch (error) {
//       console.error("Failed to send message:", error);
//     }
//   };



  
//   return (
//     <div className="p-4 w-full">
//       {imagePreview && (
//         <div className="mb-3 flex items-center gap-2">
//           <div className="relative">
//             <img
//               src={imagePreview}
//               alt="Preview"
//               className="w-20 h-20 object-cover rounded-lg border border-zinc-700"
//             />
//             <button
//               onClick={removeImage}
//               className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300
//               flex items-center justify-center"
//               type="button"
//             >
//               <X className="size-3" />
//             </button>
//           </div>
//         </div>
//       )}

//       <form onSubmit={handleSendMessage} className="flex items-center gap-2">
//         <div className="flex-1 flex gap-2">
//           <input
//             type="text"
//             className="w-full input input-bordered rounded-lg input-sm sm:input-md"
//             placeholder="Type a message..."
//             value={text}
//             onChange={(e) => setText(e.target.value)}
//           />
//           <input
//             type="file"
//             accept="image/*"
//             className="hidden"
//             ref={fileInputRef}
//             onChange={handleImageChange}
//           />

//           <button
//             type="button"
//             className={`hidden sm:flex btn btn-circle
//                      ${imagePreview ? "text-emerald-500" : "text-zinc-400"}`}
//             onClick={() => fileInputRef.current?.click()}
//           >
//             <Image size={20} />
//           </button>
//         </div>
//         <button
//           type="submit"
//           className="btn btn-sm btn-circle"
//           disabled={!text.trim() && !imagePreview}
//         >
//           <Send size={22} />
//         </button>
//       </form>
//     </div>
//   );
// };
// export default MessageInput;
