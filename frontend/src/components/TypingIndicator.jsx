import "./TypingIndicator.css";

const TypingIndicator = ({ userName }) => {
  return (
    <div className="flex items-center gap-1 text-xs text-gray-500">
      <span>{userName || "Someone"} is typing</span>
      <div className="flex gap-0.5">
        <div className="typing-dot"></div>
        <div className="typing-dot" style={{ animationDelay: "0.2s" }}></div>
        <div className="typing-dot" style={{ animationDelay: "0.4s" }}></div>
      </div>
    </div>
  );
};

export default TypingIndicator;
