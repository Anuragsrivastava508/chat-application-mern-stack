import { useRef, useState, useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import {
  Send, X, Smile, Paperclip, Camera, Mic, FileText, Image, StopCircle,
} from "lucide-react";
import toast from "react-hot-toast";

const MessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [docPreview, setDocPreview] = useState(null); // { name, base64, type }
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);

  const fileInputRef = useRef(null);
  const docInputRef = useRef(null);
  const cameraVideoRef = useRef(null);
  const canvasRef = useRef(null);

  const { sendMessage } = useChatStore();

  // Close attach menu on outside click
  useEffect(() => {
    if (!showAttachMenu) return;
    const close = () => setShowAttachMenu(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [showAttachMenu]);

  // Attach camera stream to video element
  useEffect(() => {
    if (cameraVideoRef.current && cameraStream) {
      cameraVideoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream, showCamera]);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => { cameraStream?.getTracks().forEach((t) => t.stop()); };
  }, [cameraStream]);

  /* ---- IMAGE from gallery ---- */
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file?.type?.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
      setDocPreview(null);
    };
    reader.readAsDataURL(file);
    setShowAttachMenu(false);
  };

  /* ---- DOCUMENT ---- */
  const handleDocChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Unsupported file type");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large (max 10MB)");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setDocPreview({ name: file.name, base64: reader.result, type: file.type });
      setImagePreview(null);
    };
    reader.readAsDataURL(file);
    setShowAttachMenu(false);
  };

  /* ---- CAMERA ---- */
  const openCamera = async () => {
    setShowAttachMenu(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      setCameraStream(stream);
      setShowCamera(true);
    } catch (err) {
      toast.error("Camera access denied");
    }
  };

  const capturePhoto = () => {
    const video = cameraVideoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    setImagePreview(dataUrl);
    setDocPreview(null);
    stopCamera();
  };

  const stopCamera = () => {
    cameraStream?.getTracks().forEach((t) => t.stop());
    setCameraStream(null);
    setShowCamera(false);
  };

  /* ---- REMOVE previews ---- */
  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeDoc = () => {
    setDocPreview(null);
    if (docInputRef.current) docInputRef.current.value = "";
  };

  /* ---- SEND ---- */
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview && !docPreview) return;

    try {
      await sendMessage({
        text: text.trim(),
        image: imagePreview || undefined,
        document: docPreview ? { base64: docPreview.base64, name: docPreview.name, type: docPreview.type } : undefined,
      });
    } catch {
      toast.error("Failed to send");
      return;
    }

    setText("");
    setImagePreview(null);
    setDocPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (docInputRef.current) docInputRef.current.value = "";
  };

  const hasContent = text.trim() || imagePreview || docPreview;

  return (
    <>
      {/* ===== CAMERA MODAL ===== */}
      {showCamera && (
        <div className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center">
          <video
            ref={cameraVideoRef}
            autoPlay
            playsInline
            className="w-full max-h-[70vh] object-cover"
          />
          <canvas ref={canvasRef} className="hidden" />
          <div className="flex gap-6 mt-6">
            <button
              onClick={stopCamera}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500 text-white"
            >
              <StopCircle className="w-6 h-6" />
            </button>
            <button
              onClick={capturePhoto}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-white border-4 border-gray-300 shadow-lg"
            >
              <Camera className="w-7 h-7 text-gray-800" />
            </button>
          </div>
          <p className="text-white/60 text-xs mt-4">Tap camera to capture</p>
        </div>
      )}

      {/* ===== INPUT AREA ===== */}
      <div className="w-full border-t border-base-300 bg-base-100 px-2 sm:px-4 py-2 mt-auto">

        {/* IMAGE PREVIEW */}
        {imagePreview && (
          <div className="mb-2">
            <div className="relative w-fit">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-20 h-20 object-cover rounded-xl border border-base-300 shadow-sm"
              />
              <button onClick={removeImage} type="button"
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-content/80 text-base-100 flex items-center justify-center">
                <X size={11} />
              </button>
            </div>
          </div>
        )}

        {/* DOCUMENT PREVIEW */}
        {docPreview && (
          <div className="mb-2">
            <div className="relative flex items-center gap-2 bg-base-200 rounded-xl px-3 py-2 w-fit max-w-[220px]">
              <FileText size={20} className="text-emerald-500 flex-shrink-0" />
              <span className="text-xs text-base-content truncate">{docPreview.name}</span>
              <button onClick={removeDoc} type="button"
                className="ml-1 flex-shrink-0 w-4 h-4 rounded-full bg-base-content/60 text-base-100 flex items-center justify-center">
                <X size={9} />
              </button>
            </div>
          </div>
        )}

        {/* INPUT BAR */}
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">

          {/* EMOJI (placeholder) */}
          <button type="button" className="p-2 rounded-full hover:bg-base-300 transition-colors">
            <Smile size={20} className="text-base-content/70" />
          </button>

          {/* INPUT + ICONS */}
          <div className="flex-1 flex items-center bg-base-200 rounded-full px-3 relative">
            <input
              type="text"
              placeholder="Type a message..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="flex-1 bg-transparent outline-none px-1 py-2.5 text-sm"
            />

            {/* ATTACH DROPDOWN */}
            <div className="relative">
              <button
                type="button"
                className="p-2 rounded-full hover:bg-base-300 transition-colors"
                onClick={(e) => { e.stopPropagation(); setShowAttachMenu((p) => !p); }}
              >
                <Paperclip size={18} className="text-base-content/70" />
              </button>

              {showAttachMenu && (
                <ul
                  className="absolute bottom-12 right-0 bg-base-100 shadow-xl rounded-2xl w-48 py-2 z-50 border border-base-200"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Photos */}
                  <li
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-base-200 cursor-pointer rounded-xl mx-1"
                    onClick={() => { fileInputRef.current?.click(); setShowAttachMenu(false); }}
                  >
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                      <Image size={16} className="text-purple-600" />
                    </div>
                    <span className="text-sm">Photos</span>
                  </li>

                  {/* Camera */}
                  <li
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-base-200 cursor-pointer rounded-xl mx-1"
                    onClick={openCamera}
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <Camera size={16} className="text-blue-600" />
                    </div>
                    <span className="text-sm">Camera</span>
                  </li>

                  {/* Document */}
                  <li
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-base-200 cursor-pointer rounded-xl mx-1"
                    onClick={() => { docInputRef.current?.click(); setShowAttachMenu(false); }}
                  >
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                      <FileText size={16} className="text-emerald-600" />
                    </div>
                    <span className="text-sm">Document</span>
                  </li>
                </ul>
              )}
            </div>

            {/* Hidden file inputs */}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            <input ref={docInputRef} type="file"
              accept=".pdf,.doc,.docx,.txt,.xls,.xlsx"
              className="hidden" onChange={handleDocChange} />
          </div>

          {/* SEND / MIC */}
          <button
            type="submit"
            disabled={!hasContent}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-all active:scale-95 shadow-md shadow-emerald-500/30"
          >
            {hasContent ? <Send size={17} /> : <Mic size={17} />}
          </button>
        </form>
      </div>
    </>
  );
};

export default MessageInput;