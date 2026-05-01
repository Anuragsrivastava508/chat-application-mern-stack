
import { useEffect, useState, useRef } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { useThemeStore } from "../store/useThemeStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import {
  Search, MessageSquare, Users, Phone, Settings,
  Palette, ChevronRight, Bell, Shield, Mic,
  Pin, Video, PhoneCall, PhoneMissed, Star, Plus,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useChatStore as useCallStore } from "../store/useChatStore";

function useStagger(count, delay = 35) {
  const [visible, setVisible] = useState([]);
  useEffect(() => {
    setVisible([]);
    Array.from({ length: count }).forEach((_, i) => {
      setTimeout(() => setVisible((v) => [...v, i]), i * delay);
    });
  }, [count]);
  return visible;
}

const Sidebar = ({ onSelectUser }) => {
  const { getUsers, users, selectedUser, setSelectedUser, isUsersLoading, startCall } = useChatStore();
  const { onlineUsers, authUser, logout } = useAuthStore();
  const { theme } = useThemeStore();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("chats");
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [searchFocused, setSearchFocused] = useState(false);
  const [pinnedIds, setPinnedIds] = useState([]);
  const [longPressUser, setLongPressUser] = useState(null);
  const inputRef = useRef(null);
  const longPressTimer = useRef(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => { getUsers(); }, [getUsers]);

  const filteredUsers = users.filter((u) =>
    u.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const pinnedUsers = filteredUsers.filter((u) => pinnedIds.includes(u._id));
  const regularUsers = filteredUsers.filter((u) => !pinnedIds.includes(u._id));
  const onlineUsers2 = users.filter((u) => onlineUsers.includes(u._id) && u._id !== authUser?._id);
  const onlineCount = onlineUsers2.length;
  const visibleCount = pinnedUsers.length + regularUsers.length;
  const visibleItems = useStagger(visibleCount, 35);

  const togglePin = (id) => {
    setPinnedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
    setLongPressUser(null);
  };

  const handleLongPress = (id) => {
    longPressTimer.current = setTimeout(() => setLongPressUser(id), 500);
  };
  const cancelLongPress = () => clearTimeout(longPressTimer.current);

  if (isUsersLoading) return <SidebarSkeleton />;

  /* ═══════════════════════ MOBILE ═══════════════════════ */
  if (isMobile) {
    const isDark = theme === "dark";
    const bg         = isDark ? "rgba(18,18,22,1)"       : "rgba(242,242,247,1)";
    const cardBg     = isDark ? "rgba(30,30,38,0.95)"    : "rgba(255,255,255,0.9)";
    const cardBorder = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)";
    const textPri    = isDark ? "#f2f2f7"                : "#1c1c1e";
    const textSec    = isDark ? "rgba(235,235,245,0.45)" : "rgba(60,60,67,0.45)";
    const textTer    = isDark ? "rgba(235,235,245,0.25)" : "rgba(60,60,67,0.25)";
    const accent     = "#0a84ff";
    const green      = "#30d158";
    const red        = "#ff375f";
    const searchBg   = isDark ? "rgba(118,118,128,0.22)" : "rgba(118,118,128,0.12)";

    const settingsItems = [
      { icon: Palette, label: "Appearance",    sub: "Themes & display",   color: "#bf5af2", ibg: "rgba(191,90,242,0.18)", action: () => navigate("/settings") },
      { icon: Bell,    label: "Notifications", sub: "Sounds & alerts",    color: "#ff375f", ibg: "rgba(255,55,95,0.15)",  action: () => {} },
      { icon: Shield,  label: "Privacy",       sub: "Security & blocked", color: "#ffd60a", ibg: "rgba(255,214,10,0.15)", action: () => {} },
      { icon: Mic,     label: "Media",         sub: "Storage & data",     color: "#0a84ff", ibg: "rgba(10,132,255,0.15)", action: () => {} },
    ];

    /* fake call history */
    const fakeCallHistory = users.slice(0, 4).map((u, i) => ({
      user: u,
      type: ["incoming", "outgoing", "missed", "video"][i % 4],
      time: ["Just now", "2h ago", "Yesterday", "Mon"][i % 4],
    }));

    const CallIcon = ({ type }) => {
      if (type === "missed")   return <PhoneMissed size={16} style={{ color: red }} />;
      if (type === "video")    return <Video size={16} style={{ color: accent }} />;
      if (type === "incoming") return <PhoneCall size={16} style={{ color: green }} />;
      return <Phone size={16} style={{ color: accent }} />;
    };

    /* render a single contact row */
    const ContactRow = ({ user, rowIdx, isPinned }) => {
      const isOnline   = onlineUsers.includes(user._id);
      const isSelected = selectedUser?._id === user._id;
      const isVisible  = visibleItems.includes(rowIdx);
      const showMenu   = longPressUser === user._id;

      return (
        <div key={user._id} style={{ position: "relative" }}>
          {/* Context menu on long press */}
          {showMenu && (
            <div style={{
              position: "absolute", top: "0", right: "16px", zIndex: 99,
              background: isDark ? "rgba(44,44,52,0.97)" : "rgba(255,255,255,0.97)",
              borderRadius: "14px", padding: "6px 0", minWidth: "160px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
              border: `1px solid ${cardBorder}`,
              backdropFilter: "blur(20px)",
            }}>
              <button onClick={() => togglePin(user._id)} style={{
                width: "100%", padding: "10px 16px", display: "flex", alignItems: "center",
                gap: "10px", background: "transparent", border: "none", cursor: "pointer",
                color: textPri, fontSize: "15px",
              }}>
                <Pin size={16} style={{ color: accent }} />
                {pinnedIds.includes(user._id) ? "Unpin Chat" : "Pin Chat"}
              </button>
              <div style={{ height: "1px", background: cardBorder, margin: "2px 0" }} />
              <button onClick={() => { setSelectedUser(user); onSelectUser?.(); setLongPressUser(null); }} style={{
                width: "100%", padding: "10px 16px", display: "flex", alignItems: "center",
                gap: "10px", background: "transparent", border: "none", cursor: "pointer",
                color: textPri, fontSize: "15px",
              }}>
                <MessageSquare size={16} style={{ color: green }} />
                Open Chat
              </button>
              <div style={{ height: "1px", background: cardBorder, margin: "2px 0" }} />
              <button onClick={() => setLongPressUser(null)} style={{
                width: "100%", padding: "10px 16px", background: "transparent",
                border: "none", cursor: "pointer", color: red, fontSize: "15px",
              }}>
                Cancel
              </button>
            </div>
          )}

          <button
            onMouseDown={() => handleLongPress(user._id)}
            onMouseUp={cancelLongPress}
            onTouchStart={() => handleLongPress(user._id)}
            onTouchEnd={cancelLongPress}
            onClick={() => { if (!showMenu) { setSelectedUser(user); onSelectUser?.(); } }}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: "13px",
              padding: "11px 14px", textAlign: "left", cursor: "pointer",
              background: isSelected
                ? isDark ? "rgba(10,132,255,0.14)" : "rgba(10,132,255,0.08)"
                : "transparent",
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? "translateY(0)" : "translateY(8px)",
              transition: "opacity 0.25s ease, transform 0.25s ease, background 0.15s",
            }}
          >
            <div style={{ position: "relative", flexShrink: 0 }}>
              <img src={user.profilePic || "/avatar.png"} alt={user.fullName}
                style={{ width: "48px", height: "48px", borderRadius: "50%", objectFit: "cover" }} />
              {isOnline && (
                <span style={{
                  position: "absolute", bottom: "1px", right: "1px",
                  width: "12px", height: "12px", borderRadius: "50%",
                  background: green, border: `2px solid ${cardBg}`,
                }} />
              )}
              {isPinned && (
                <span style={{
                  position: "absolute", top: "-2px", right: "-2px",
                  width: "16px", height: "16px", borderRadius: "50%",
                  background: accent, display: "flex", alignItems: "center", justifyContent: "center",
                  border: `2px solid ${bg}`,
                }}>
                  <Pin size={8} style={{ color: "white" }} />
                </span>
              )}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "6px" }}>
                <span style={{ fontSize: "16px", fontWeight: "600", color: textPri, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user.fullName}
                </span>
                <span style={{ fontSize: "12px", color: textTer, flexShrink: 0 }}>Yesterday</span>
              </div>
              <p style={{
                fontSize: "13px", marginTop: "2px",
                color: isOnline ? green : textSec,
                fontWeight: isOnline ? "500" : "400",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {isOnline ? "● Active now" : "Tap to message"}
              </p>
            </div>
            <ChevronRight size={14} style={{ color: textTer, flexShrink: 0 }} />
          </button>
        </div>
      );
    };

    return (
      <div style={{
        height: "100%", width: "100%", display: "flex", flexDirection: "column",
        background: bg, color: textPri, overflow: "hidden", position: "relative",
        fontFamily: "-apple-system, 'SF Pro Display', 'Helvetica Neue', sans-serif",
      }}>

        {/* Tap outside to close context menu */}
        {longPressUser && (
          <div onClick={() => setLongPressUser(null)} style={{
            position: "absolute", inset: 0, zIndex: 50,
          }} />
        )}

        {/* ── HEADER ── */}
        <div style={{ padding: "52px 20px 12px", flexShrink: 0, zIndex: 2, position: "relative" }}>
          {activeTab === "chats" && (
            <>
              <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "14px" }}>
                <div>
                  <p style={{ fontSize: "12px", fontWeight: "700", color: accent, letterSpacing: "0.5px", marginBottom: "1px" }}>
                    {onlineCount > 0 ? `${onlineCount} active` : "Messages"}
                  </p>
                  <h1 style={{ fontSize: "34px", fontWeight: "800", letterSpacing: "-1.2px", lineHeight: 1, color: textPri }}>
                    Chatty
                  </h1>
                </div>
                <button onClick={() => setActiveTab("settings")} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, position: "relative" }}>
                  <img src={authUser?.profilePic || "/avatar.png"} alt="" style={{
                    width: "38px", height: "38px", borderRadius: "50%", objectFit: "cover",
                    boxShadow: `0 0 0 2.5px ${accent}`,
                  }} />
                  <span style={{
                    position: "absolute", bottom: 0, right: 0,
                    width: "11px", height: "11px", borderRadius: "50%",
                    background: green, border: `2px solid ${bg}`,
                  }} />
                </button>
              </div>

              {/* Search */}
              <div onClick={() => inputRef.current?.focus()} style={{
                display: "flex", alignItems: "center", gap: "8px",
                background: searchBg, borderRadius: "12px", padding: "9px 12px",
                border: searchFocused ? `1.5px solid ${accent}` : "1.5px solid transparent",
                transition: "border 0.2s",
              }}>
                <Search size={15} style={{ color: textSec, flexShrink: 0 }} />
                <input ref={inputRef} type="text" placeholder="Search"
                  value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)}
                  style={{ background: "transparent", border: "none", outline: "none", color: textPri, fontSize: "16px", flex: 1, fontFamily: "inherit" }} />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} style={{
                    background: textTer, border: "none", borderRadius: "50%",
                    width: "16px", height: "16px", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <span style={{ color: bg, fontSize: "10px", fontWeight: "800" }}>✕</span>
                  </button>
                )}
              </div>
            </>
          )}
          {activeTab === "calls"       && <h1 style={{ fontSize: "34px", fontWeight: "800", letterSpacing: "-1.2px", color: textPri }}>Recents</h1>}
          {activeTab === "communities" && <h1 style={{ fontSize: "34px", fontWeight: "800", letterSpacing: "-1.2px", color: textPri }}>People</h1>}
          {activeTab === "settings"    && <h1 style={{ fontSize: "34px", fontWeight: "800", letterSpacing: "-1.2px", color: textPri }}>Settings</h1>}
        </div>

        {/* ── SCROLLABLE CONTENT ── */}
        <div style={{ flex: 1, overflowY: "auto", minHeight: 0, position: "relative", zIndex: 1 }}>

          {/* ════ CHATS TAB ════ */}
          {activeTab === "chats" && (
            <div style={{ paddingBottom: "16px" }}>

              {/* ── STATUS / ACTIVE NOW ROW ── */}
              {onlineUsers2.length > 0 && !searchQuery && (
                <div style={{ marginBottom: "6px" }}>
                  <p style={{ fontSize: "12px", fontWeight: "600", color: textTer, letterSpacing: "0.6px", textTransform: "uppercase", padding: "0 20px 6px" }}>
                    Active Now
                  </p>
                  <div style={{ overflowX: "auto", display: "flex", gap: "16px", padding: "0 16px 10px", scrollbarWidth: "none" }}>
                    {/* My status */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "5px", flexShrink: 0 }}>
                      <div style={{ position: "relative" }}>
                        <img src={authUser?.profilePic || "/avatar.png"} alt=""
                          style={{ width: "54px", height: "54px", borderRadius: "50%", objectFit: "cover", border: `2px solid ${cardBorder}` }} />
                        <div style={{
                          position: "absolute", bottom: 0, right: 0,
                          width: "20px", height: "20px", borderRadius: "50%",
                          background: accent, border: `2px solid ${bg}`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          <Plus size={12} style={{ color: "white" }} />
                        </div>
                      </div>
                      <span style={{ fontSize: "11px", color: textSec, fontWeight: "500" }}>My Status</span>
                    </div>

                    {/* Online users */}
                    {onlineUsers2.slice(0, 8).map((user) => (
                      <button key={user._id} onClick={() => { setSelectedUser(user); onSelectUser?.(); }}
                        style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "5px", flexShrink: 0, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                        <div style={{ position: "relative" }}>
                          <img src={user.profilePic || "/avatar.png"} alt={user.fullName}
                            style={{ width: "54px", height: "54px", borderRadius: "50%", objectFit: "cover", border: `2.5px solid ${green}` }} />
                          <span style={{
                            position: "absolute", bottom: "1px", right: "1px",
                            width: "12px", height: "12px", borderRadius: "50%",
                            background: green, border: `2px solid ${bg}`,
                          }} />
                        </div>
                        <span style={{ fontSize: "11px", color: textSec, fontWeight: "500", maxWidth: "56px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {user.fullName.split(" ")[0]}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── PINNED CHATS ── */}
              {pinnedUsers.length > 0 && (
                <div style={{ margin: "0 16px 8px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                    <p style={{ fontSize: "12px", fontWeight: "600", color: textTer, letterSpacing: "0.6px", textTransform: "uppercase" }}>📌 Pinned</p>
                  </div>
                  <div style={{
                    background: cardBg, borderRadius: "16px", overflow: "hidden",
                    border: `1px solid ${cardBorder}`,
                    backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
                    boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.35)" : "0 2px 14px rgba(0,0,0,0.07)",
                  }}>
                    {pinnedUsers.map((user, i) => (
                      <div key={user._id} style={{ borderBottom: i < pinnedUsers.length - 1 ? `1px solid ${cardBorder}` : "none" }}>
                        <ContactRow user={user} rowIdx={i} isPinned />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── ALL CHATS ── */}
              <div style={{ margin: "0 16px" }}>
                {regularUsers.length > 0 && (
                  <p style={{ fontSize: "12px", fontWeight: "600", color: textTer, letterSpacing: "0.6px", textTransform: "uppercase", marginBottom: "6px" }}>
                    {pinnedUsers.length > 0 ? "All Chats" : "Recent"}
                  </p>
                )}

                {filteredUsers.length === 0 && (
                  <div style={{ textAlign: "center", padding: "60px 0" }}>
                    <div style={{ fontSize: "48px", marginBottom: "12px" }}>🔍</div>
                    <p style={{ color: textSec, fontSize: "15px", fontWeight: "500" }}>No results for "{searchQuery}"</p>
                  </div>
                )}

                <div style={{
                  background: cardBg, borderRadius: "16px", overflow: "hidden",
                  border: `1px solid ${cardBorder}`,
                  backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
                  boxShadow: isDark ? "0 4px 24px rgba(0,0,0,0.35)" : "0 2px 16px rgba(0,0,0,0.07)",
                }}>
                  {regularUsers.map((user, i) => (
                    <div key={user._id} style={{ borderBottom: i < regularUsers.length - 1 ? `1px solid ${cardBorder}` : "none" }}>
                      <ContactRow user={user} rowIdx={pinnedUsers.length + i} isPinned={false} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Hint */}
              {filteredUsers.length > 0 && !searchQuery && (
                <p style={{ textAlign: "center", color: textTer, fontSize: "12px", marginTop: "16px" }}>
                  Hold a chat to pin it 📌
                </p>
              )}
            </div>
          )}

          {/* ════ CALLS TAB ════ */}
          {activeTab === "calls" && (
            <div style={{ padding: "0 16px 16px" }}>
              {fakeCallHistory.length === 0 ? (
                <div style={{ textAlign: "center", padding: "80px 20px" }}>
                  <div style={{ fontSize: "52px", marginBottom: "12px" }}>📵</div>
                  <p style={{ color: textSec, fontSize: "16px", fontWeight: "500" }}>No Recent Calls</p>
                </div>
              ) : (
                <>
                  <p style={{ fontSize: "12px", fontWeight: "600", color: textTer, letterSpacing: "0.6px", textTransform: "uppercase", marginBottom: "8px" }}>Recent</p>
                  <div style={{
                    background: cardBg, borderRadius: "16px", overflow: "hidden",
                    border: `1px solid ${cardBorder}`,
                    backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
                    boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.3)" : "0 2px 14px rgba(0,0,0,0.07)",
                  }}>
                    {fakeCallHistory.map((call, i) => (
                      <div key={call.user._id} style={{ borderBottom: i < fakeCallHistory.length - 1 ? `1px solid ${cardBorder}` : "none" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "13px", padding: "13px 16px" }}>
                          <img src={call.user.profilePic || "/avatar.png"} alt=""
                            style={{ width: "46px", height: "46px", borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: "16px", fontWeight: "600", color: call.type === "missed" ? red : textPri, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {call.user.fullName}
                            </p>
                            <div style={{ display: "flex", alignItems: "center", gap: "5px", marginTop: "2px" }}>
                              <CallIcon type={call.type} />
                              <span style={{ fontSize: "13px", color: call.type === "missed" ? red : textSec, fontWeight: "400" }}>
                                {call.type.charAt(0).toUpperCase() + call.type.slice(1)} · {call.time}
                              </span>
                            </div>
                          </div>
                          {/* Callback buttons */}
                          <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                            <button onClick={() => { setSelectedUser(call.user); startCall("audio"); }} style={{
                              width: "34px", height: "34px", borderRadius: "50%",
                              background: isDark ? "rgba(10,132,255,0.2)" : "rgba(10,132,255,0.1)",
                              border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                              <Phone size={16} style={{ color: accent }} />
                            </button>
                            <button onClick={() => { setSelectedUser(call.user); startCall("video"); }} style={{
                              width: "34px", height: "34px", borderRadius: "50%",
                              background: isDark ? "rgba(48,209,88,0.2)" : "rgba(48,209,88,0.1)",
                              border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                              <Video size={16} style={{ color: green }} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ════ COMMUNITIES TAB ════ */}
          {activeTab === "communities" && (
            <div style={{ padding: "0 16px 16px" }}>
              {/* Online people horizontal */}
              {onlineUsers2.length > 0 && (
                <div style={{ marginBottom: "16px" }}>
                  <p style={{ fontSize: "12px", fontWeight: "600", color: textTer, letterSpacing: "0.6px", textTransform: "uppercase", marginBottom: "8px" }}>
                    Active Now
                  </p>
                  <div style={{ overflowX: "auto", display: "flex", gap: "12px", paddingBottom: "4px", scrollbarWidth: "none" }}>
                    {onlineUsers2.map((user) => (
                      <button key={user._id} onClick={() => { setSelectedUser(user); onSelectUser?.(); }}
                        style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", flexShrink: 0, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                        <div style={{ position: "relative" }}>
                          <img src={user.profilePic || "/avatar.png"} alt=""
                            style={{ width: "60px", height: "60px", borderRadius: "18px", objectFit: "cover", border: `2px solid ${green}` }} />
                          <span style={{ position: "absolute", bottom: "2px", right: "2px", width: "12px", height: "12px", borderRadius: "50%", background: green, border: `2px solid ${bg}` }} />
                        </div>
                        <span style={{ fontSize: "11px", color: textSec, fontWeight: "600", maxWidth: "64px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {user.fullName.split(" ")[0]}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* All contacts grid */}
              <p style={{ fontSize: "12px", fontWeight: "600", color: textTer, letterSpacing: "0.6px", textTransform: "uppercase", marginBottom: "8px" }}>
                All Contacts
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                {users.map((user) => {
                  const isOnline = onlineUsers.includes(user._id);
                  return (
                    <button key={user._id} onClick={() => { setSelectedUser(user); onSelectUser?.(); }} style={{
                      display: "flex", flexDirection: "column", alignItems: "center", gap: "6px",
                      padding: "14px 8px", borderRadius: "16px",
                      background: cardBg, border: `1px solid ${cardBorder}`,
                      cursor: "pointer", backdropFilter: "blur(20px)",
                    }}>
                      <div style={{ position: "relative" }}>
                        <img src={user.profilePic || "/avatar.png"} alt=""
                          style={{ width: "48px", height: "48px", borderRadius: "50%", objectFit: "cover" }} />
                        {isOnline && <span style={{ position: "absolute", bottom: "1px", right: "1px", width: "11px", height: "11px", borderRadius: "50%", background: green, border: `2px solid ${cardBg}` }} />}
                      </div>
                      <span style={{ fontSize: "12px", fontWeight: "600", color: textPri, textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", width: "100%" }}>
                        {user.fullName.split(" ")[0]}
                      </span>
                      <span style={{ fontSize: "10px", color: isOnline ? green : textTer, fontWeight: "500" }}>
                        {isOnline ? "Active" : "Offline"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ════ SETTINGS TAB ════ */}
          {activeTab === "settings" && (
            <div style={{ padding: "0 16px 48px" }}>

              {/* Profile hero */}
              <button onClick={() => navigate("/profile")} style={{
                width: "100%", display: "flex", alignItems: "center", gap: "14px",
                padding: "16px", borderRadius: "18px", marginBottom: "10px",
                background: cardBg, border: `1px solid ${cardBorder}`,
                cursor: "pointer", textAlign: "left",
                backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
                boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.35)" : "0 2px 12px rgba(0,0,0,0.07)",
              }}>
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <img src={authUser?.profilePic || "/avatar.png"} alt="" style={{
                    width: "64px", height: "64px", borderRadius: "50%", objectFit: "cover",
                  }} />
                  <span style={{ position: "absolute", bottom: "2px", right: "2px", width: "14px", height: "14px", borderRadius: "50%", background: green, border: `2.5px solid ${cardBg}` }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: "18px", fontWeight: "700", color: textPri, letterSpacing: "-0.3px" }}>{authUser?.fullName}</p>
                  <p style={{ fontSize: "13px", color: textSec, marginTop: "1px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{authUser?.email}</p>
                  <p style={{ fontSize: "12px", color: accent, fontWeight: "600", marginTop: "4px" }}>Edit Profile →</p>
                </div>
                <ChevronRight size={16} style={{ color: textTer }} />
              </button>

              {/* Preferences group */}
              <p style={{ fontSize: "12px", fontWeight: "600", color: textTer, letterSpacing: "0.6px", textTransform: "uppercase", marginBottom: "6px", paddingLeft: "4px" }}>
                Preferences
              </p>
              <div style={{
                background: cardBg, borderRadius: "16px", overflow: "hidden",
                border: `1px solid ${cardBorder}`,
                backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
                boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.3)" : "0 2px 12px rgba(0,0,0,0.06)",
                marginBottom: "10px",
              }}>
                {settingsItems.map((item, i) => (
                  <button key={i} onClick={item.action} style={{
                    width: "100%", display: "flex", alignItems: "center", gap: "13px",
                    padding: "13px 16px", textAlign: "left", cursor: "pointer",
                    background: "transparent",
                    borderBottom: i < settingsItems.length - 1 ? `1px solid ${cardBorder}` : "none",
                    transition: "background 0.15s",
                  }}>
                    <div style={{ width: "34px", height: "34px", borderRadius: "9px", flexShrink: 0, background: item.ibg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <item.icon size={18} style={{ color: item.color }} />
                    </div>
                    <span style={{ flex: 1, fontSize: "16px", fontWeight: "500", color: textPri }}>{item.label}</span>
                    <ChevronRight size={14} style={{ color: textTer }} />
                  </button>
                ))}
              </div>

              {/* Sign Out */}
              <div style={{ background: cardBg, borderRadius: "16px", overflow: "hidden", border: `1px solid ${cardBorder}`, backdropFilter: "blur(20px)" }}>
                <button onClick={logout} style={{
                  width: "100%", padding: "15px", display: "flex", alignItems: "center", justifyContent: "center",
                  background: "transparent", border: "none", cursor: "pointer",
                }}>
                  <span style={{ fontSize: "16px", fontWeight: "600", color: red }}>Sign Out</span>
                </button>
              </div>

              <p style={{ textAlign: "center", color: textTer, fontSize: "12px", marginTop: "24px" }}>Chatty · Version 1.0.0</p>
            </div>
          )}
        </div>

        {/* ── BOTTOM TAB BAR ── */}
        <div style={{
          flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-around",
          padding: "8px 4px 22px",
          background: isDark ? "rgba(18,18,22,0.94)" : "rgba(249,249,251,0.94)",
          borderTop: `1px solid ${cardBorder}`,
          backdropFilter: "blur(28px)", WebkitBackdropFilter: "blur(28px)",
        }}>
          {[
            { id: "chats",       icon: MessageSquare, label: "Chats"     },
            { id: "calls",       icon: Phone,         label: "Calls"     },
            { id: "communities", icon: Users,         label: "People"    },
            { id: "settings",    icon: Settings,      label: "Settings"  },
          ].map(({ id, icon: Icon, label }) => {
            const isActive = activeTab === id;
            return (
              <button key={id} onClick={() => setActiveTab(id)} style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: "3px",
                padding: "6px 12px", border: "none", background: "transparent", cursor: "pointer",
                transition: "transform 0.15s",
              }}>
                <div style={{
                  background: isActive ? (isDark ? "rgba(10,132,255,0.2)" : "rgba(10,132,255,0.12)") : "transparent",
                  borderRadius: "10px", padding: "6px 10px", transition: "background 0.2s",
                }}>
                  <Icon size={22} style={{ color: isActive ? accent : textTer, transition: "color 0.2s" }} strokeWidth={isActive ? 2.2 : 1.8} />
                </div>
                <span style={{ fontSize: "10px", fontWeight: isActive ? "700" : "500", color: isActive ? accent : textTer, letterSpacing: "0.2px" }}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  /* ═══════════════════════ DESKTOP (unchanged) ═══════════════════════ */
  return (
    <aside className="h-full w-full flex flex-col bg-base-100 overflow-hidden">
      <div className="border-b border-base-300 px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <span className="font-semibold text-base">Chatty</span>
          {onlineCount > 0 && (
            <span className="flex items-center gap-1 text-xs bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              {onlineCount} online
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 bg-base-200 rounded-full px-3 py-1.5">
          <Search className="w-4 h-4 text-base-content/40 flex-shrink-0" />
          <input type="text" placeholder="Search contacts..." value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent outline-none text-sm flex-1 placeholder:text-base-content/30" />
        </div>
      </div>
      <div className="overflow-y-auto w-full flex-1">
        {filteredUsers.map((user) => {
          const isOnline = onlineUsers.includes(user._id);
          const isSelected = selectedUser?._id === user._id;
          return (
            <button key={user._id} onClick={() => setSelectedUser(user)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-base-200
                ${isSelected ? "bg-base-200 border-l-4 border-blue-500" : "border-l-4 border-transparent"}`}>
              <div className="relative flex-shrink-0">
                <img src={user.profilePic || "/avatar.png"} alt={user.fullName} className="w-11 h-11 rounded-full object-cover" />
                {isOnline && <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-base-100" />}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <span className="font-medium text-sm truncate block">{user.fullName}</span>
                <span className={`text-xs ${isOnline ? "text-emerald-500" : "text-base-content/40"}`}>
                  {isOnline ? "Active Now" : "Offline"}
                </span>
              </div>
            </button>
          );
        })}
        {filteredUsers.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <Users className="w-8 h-8 text-base-content/20" />
            <p className="text-sm text-base-content/40">No contacts found</p>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;


















// import { useEffect, useState } from "react";
// import { useChatStore } from "../store/useChatStore";
// import { useAuthStore } from "../store/useAuthStore";
// import { useThemeStore } from "../store/useThemeStore";
// import SidebarSkeleton from "./skeletons/SidebarSkeleton";
// import {
//   Search, MessageSquare, Users, Phone, Settings,
//   LogOut, Palette, ChevronRight, Sparkles,
// } from "lucide-react";
// import { useNavigate } from "react-router-dom";

// const Sidebar = ({ onSelectUser }) => {
//   const { getUsers, users, selectedUser, setSelectedUser, isUsersLoading } = useChatStore();
//   const { onlineUsers, authUser, logout } = useAuthStore();
//   const { theme } = useThemeStore();
//   const navigate = useNavigate();

//   const [searchQuery, setSearchQuery] = useState("");
//   const [activeTab, setActiveTab] = useState("chats");
//   const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
//   const [hoveredUser, setHoveredUser] = useState(null);

//   useEffect(() => {
//     const check = () => setIsMobile(window.innerWidth <= 768);
//     window.addEventListener("resize", check);
//     return () => window.removeEventListener("resize", check);
//   }, []);

//   useEffect(() => { getUsers(); }, [getUsers]);

//   const filteredUsers = users.filter((u) =>
//     u.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
//   );

//   const onlineCount = onlineUsers.filter((id) => id !== authUser?._id).length;

//   if (isUsersLoading) return <SidebarSkeleton />;

//   /* ==================== MOBILE ==================== */
//   if (isMobile) {
//     return (
//       <div style={{
//         height: "100%", width: "100%", display: "flex", flexDirection: "column",
//         background: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
//         color: "white", overflow: "hidden", position: "relative",
//       }}>

//         {/* BG blobs */}
//         <div style={{
//           position: "absolute", top: "-80px", right: "-80px", width: "250px", height: "250px",
//           borderRadius: "50%", background: "radial-gradient(circle, rgba(120,80,255,0.3) 0%, transparent 70%)",
//           pointerEvents: "none",
//         }} />
//         <div style={{
//           position: "absolute", bottom: "80px", left: "-60px", width: "200px", height: "200px",
//           borderRadius: "50%", background: "radial-gradient(circle, rgba(0,200,150,0.2) 0%, transparent 70%)",
//           pointerEvents: "none",
//         }} />

//         {/* ---- HEADER ---- */}
//         <div style={{ padding: "48px 20px 16px", flexShrink: 0 }}>
//           {activeTab === "chats" && (
//             <>
//               <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
//                 <div>
//                   <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.45)", marginBottom: "2px", letterSpacing: "1.5px", textTransform: "uppercase" }}>
//                     Welcome back
//                   </p>
//                   <h1 style={{ fontSize: "24px", fontWeight: "800", lineHeight: 1.2 }}>
//                     {authUser?.fullName?.split(" ")[0]} 👋
//                   </h1>
//                 </div>
//                 <img src={authUser?.profilePic || "/avatar.png"} alt="" style={{
//                   width: "46px", height: "46px", borderRadius: "50%", objectFit: "cover",
//                   border: "2px solid rgba(120,80,255,0.6)", boxShadow: "0 0 0 4px rgba(120,80,255,0.15)",
//                 }} />
//               </div>

//               {onlineCount > 0 && (
//                 <div style={{
//                   display: "inline-flex", alignItems: "center", gap: "6px",
//                   background: "rgba(0,200,150,0.12)", border: "1px solid rgba(0,200,150,0.3)",
//                   borderRadius: "20px", padding: "4px 12px", marginBottom: "14px",
//                 }}>
//                   <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#00c896", display: "inline-block", boxShadow: "0 0 6px #00c896" }} />
//                   <span style={{ fontSize: "12px", color: "#00c896", fontWeight: "600" }}>{onlineCount} online now</span>
//                 </div>
//               )}

//               <div style={{
//                 display: "flex", alignItems: "center", gap: "10px",
//                 background: "rgba(255,255,255,0.07)", borderRadius: "14px",
//                 padding: "10px 14px", border: "1px solid rgba(255,255,255,0.1)",
//                 backdropFilter: "blur(10px)",
//               }}>
//                 <Search size={16} style={{ color: "rgba(255,255,255,0.4)", flexShrink: 0 }} />
//                 <input type="text" placeholder="Search people..."
//                   value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
//                   style={{ background: "transparent", border: "none", outline: "none", color: "white", fontSize: "14px", flex: 1 }} />
//               </div>
//             </>
//           )}

//           {activeTab === "settings" && <h1 style={{ fontSize: "24px", fontWeight: "800" }}>Settings ⚙️</h1>}
//           {activeTab === "calls"    && <h1 style={{ fontSize: "24px", fontWeight: "800" }}>Calls 📞</h1>}
//           {activeTab === "communities" && <h1 style={{ fontSize: "24px", fontWeight: "800" }}>People 👥</h1>}
//         </div>

//         {/* ---- CONTENT ---- */}
//         <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>

//           {/* CHATS */}
//           {activeTab === "chats" && (
//             <div style={{ padding: "4px 12px" }}>
//               {filteredUsers.length === 0 && (
//                 <p style={{ textAlign: "center", color: "rgba(255,255,255,0.3)", padding: "40px 0", fontSize: "14px" }}>No contacts found</p>
//               )}
//               {filteredUsers.map((user) => {
//                 const isOnline = onlineUsers.includes(user._id);
//                 const isSelected = selectedUser?._id === user._id;
//                 return (
//                   <button
//                     key={user._id}
//                     onClick={() => { setSelectedUser(user); onSelectUser?.(); }}
//                     onMouseEnter={() => setHoveredUser(user._id)}
//                     onMouseLeave={() => setHoveredUser(null)}
//                     style={{
//                       width: "100%", display: "flex", alignItems: "center", gap: "12px",
//                       padding: "10px 12px", borderRadius: "16px", marginBottom: "4px",
//                       background: isSelected
//                         ? "linear-gradient(135deg, rgba(120,80,255,0.35), rgba(0,200,150,0.15))"
//                         : hoveredUser === user._id ? "rgba(255,255,255,0.06)" : "transparent",
//                       border: isSelected ? "1px solid rgba(120,80,255,0.4)" : "1px solid transparent",
//                       transition: "all 0.2s ease", textAlign: "left", cursor: "pointer",
//                       boxShadow: isSelected ? "0 4px 20px rgba(120,80,255,0.15)" : "none",
//                     }}
//                   >
//                     <div style={{ position: "relative", flexShrink: 0 }}>
//                       <img src={user.profilePic || "/avatar.png"} alt={user.fullName} style={{
//                         width: "48px", height: "48px", borderRadius: "50%", objectFit: "cover",
//                         border: isSelected ? "2px solid rgba(120,80,255,0.7)" : "2px solid rgba(255,255,255,0.1)",
//                       }} />
//                       {isOnline && (
//                         <span style={{
//                           position: "absolute", bottom: "1px", right: "1px",
//                           width: "12px", height: "12px", borderRadius: "50%",
//                           background: "#00c896", border: "2px solid #1a1040",
//                           boxShadow: "0 0 6px #00c896",
//                         }} />
//                       )}
//                     </div>
//                     <div style={{ flex: 1, minWidth: 0 }}>
//                       <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
//                         <span style={{ fontWeight: "600", fontSize: "15px", color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
//                           {user.fullName}
//                         </span>
//                         <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", flexShrink: 0, marginLeft: "8px" }}>
//                           Yesterday
//                         </span>
//                       </div>
//                       <p style={{ fontSize: "13px", color: isOnline ? "#00c896" : "rgba(255,255,255,0.35)", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
//                         {isOnline ? "● Active now" : "Tap to message"}
//                       </p>
//                     </div>
//                   </button>
//                 );
//               })}
//             </div>
//           )}

//           {/* CALLS */}
//           {activeTab === "calls" && (
//             <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px", gap: "12px" }}>
//               <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: "rgba(120,80,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
//                 <Phone size={30} style={{ color: "rgba(120,80,255,0.5)" }} />
//               </div>
//               <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "14px" }}>No recent calls</p>
//             </div>
//           )}

//           {/* COMMUNITIES */}
//           {activeTab === "communities" && (
//             <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px", gap: "12px" }}>
//               <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: "rgba(0,200,150,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
//                 <Users size={30} style={{ color: "rgba(0,200,150,0.5)" }} />
//               </div>
//               <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "14px" }}>No communities yet</p>
//             </div>
//           )}

//           {/* SETTINGS */}
//           {activeTab === "settings" && (
//             <div style={{ padding: "0 12px 24px" }}>

//               {/* Profile card */}
//               <button onClick={() => navigate("/profile")} style={{
//                 width: "100%", display: "flex", alignItems: "center", gap: "14px",
//                 padding: "16px", borderRadius: "22px", marginBottom: "12px",
//                 background: "linear-gradient(135deg, rgba(120,80,255,0.25), rgba(0,200,150,0.12))",
//                 border: "1px solid rgba(120,80,255,0.35)", cursor: "pointer", textAlign: "left",
//                 boxShadow: "0 8px 24px rgba(120,80,255,0.12)",
//               }}>
//                 <div style={{ position: "relative", flexShrink: 0 }}>
//                   <img src={authUser?.profilePic || "/avatar.png"} alt="" style={{
//                     width: "58px", height: "58px", borderRadius: "50%", objectFit: "cover",
//                     border: "2px solid rgba(120,80,255,0.6)",
//                     boxShadow: "0 0 0 4px rgba(120,80,255,0.15)",
//                   }} />
//                   {/* small edit badge */}
//                   <div style={{
//                     position: "absolute", bottom: 0, right: 0,
//                     width: "20px", height: "20px", borderRadius: "50%",
//                     background: "linear-gradient(135deg,#7b50ff,#00c896)",
//                     display: "flex", alignItems: "center", justifyContent: "center",
//                     fontSize: "11px", border: "2px solid #1a1040",
//                   }}>✏️</div>
//                 </div>
//                 <div style={{ flex: 1, minWidth: 0 }}>
//                   <p style={{ fontWeight: "700", fontSize: "16px", color: "white" }}>{authUser?.fullName}</p>
//                   <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{authUser?.email}</p>
//                   <p style={{ fontSize: "11px", color: "#7b50ff", marginTop: "4px", fontWeight: "600" }}>Tap to edit profile →</p>
//                 </div>
//                 <ChevronRight size={18} style={{ color: "rgba(255,255,255,0.3)", flexShrink: 0 }} />
//               </button>

//               {/* Section label */}
//               <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "8px", paddingLeft: "4px" }}>
//                 Preferences
//               </p>

//               {/* App Themes card — gradient hero */}
//               <button onClick={() => navigate("/settings")} style={{
//                 width: "100%", display: "flex", alignItems: "center", gap: "14px",
//                 padding: "16px", borderRadius: "20px", marginBottom: "8px",
//                 background: "linear-gradient(135deg, rgba(123,80,255,0.22), rgba(0,200,150,0.12))",
//                 border: "1px solid rgba(123,80,255,0.28)", cursor: "pointer", textAlign: "left",
//                 boxShadow: "0 4px 16px rgba(123,80,255,0.1)",
//               }}>
//                 <div style={{
//                   width: "46px", height: "46px", borderRadius: "14px", flexShrink: 0,
//                   background: "linear-gradient(135deg, #7b50ff, #00c896)",
//                   display: "flex", alignItems: "center", justifyContent: "center",
//                   boxShadow: "0 4px 14px rgba(123,80,255,0.45)",
//                 }}>
//                   <Palette size={22} style={{ color: "white" }} />
//                 </div>
//                 <div style={{ flex: 1 }}>
//                   <p style={{ fontWeight: "700", fontSize: "15px", color: "white" }}>App Themes</p>
//                   <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", marginTop: "2px" }}>Colors, wallpapers & display</p>
//                 </div>
//                 <ChevronRight size={18} style={{ color: "rgba(255,255,255,0.35)" }} />
//               </button>

//               {/* Notifications card */}
//               <button style={{
//                 width: "100%", display: "flex", alignItems: "center", gap: "14px",
//                 padding: "16px", borderRadius: "20px", marginBottom: "8px",
//                 background: "rgba(0,200,150,0.07)", border: "1px solid rgba(0,200,150,0.18)",
//                 cursor: "pointer", textAlign: "left",
//               }}>
//                 <div style={{
//                   width: "46px", height: "46px", borderRadius: "14px", flexShrink: 0,
//                   background: "rgba(0,200,150,0.18)", display: "flex", alignItems: "center", justifyContent: "center",
//                 }}>
//                   <span style={{ fontSize: "22px" }}>🔔</span>
//                 </div>
//                 <div style={{ flex: 1 }}>
//                   <p style={{ fontWeight: "700", fontSize: "15px", color: "white" }}>Notifications</p>
//                   <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", marginTop: "2px" }}>Sounds, vibrations & alerts</p>
//                 </div>
//                 <ChevronRight size={18} style={{ color: "rgba(255,255,255,0.35)" }} />
//               </button>

//               {/* Privacy card */}
//               <button style={{
//                 width: "100%", display: "flex", alignItems: "center", gap: "14px",
//                 padding: "16px", borderRadius: "20px", marginBottom: "20px",
//                 background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.18)",
//                 cursor: "pointer", textAlign: "left",
//               }}>
//                 <div style={{
//                   width: "46px", height: "46px", borderRadius: "14px", flexShrink: 0,
//                   background: "rgba(245,158,11,0.18)", display: "flex", alignItems: "center", justifyContent: "center",
//                 }}>
//                   <span style={{ fontSize: "22px" }}>🔒</span>
//                 </div>
//                 <div style={{ flex: 1 }}>
//                   <p style={{ fontWeight: "700", fontSize: "15px", color: "white" }}>Privacy</p>
//                   <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", marginTop: "2px" }}>Last seen, blocked & security</p>
//                 </div>
//                 <ChevronRight size={18} style={{ color: "rgba(255,255,255,0.35)" }} />
//               </button>

//               {/* Logout */}
//               <button onClick={logout} style={{
//                 width: "100%", display: "flex", alignItems: "center", gap: "14px",
//                 padding: "16px", borderRadius: "20px",
//                 background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
//                 cursor: "pointer", textAlign: "left",
//               }}>
//                 <div style={{
//                   width: "46px", height: "46px", borderRadius: "14px", flexShrink: 0,
//                   background: "rgba(239,68,68,0.15)", display: "flex", alignItems: "center", justifyContent: "center",
//                 }}>
//                   <LogOut size={22} style={{ color: "#ef4444" }} />
//                 </div>
//                 <div style={{ flex: 1 }}>
//                   <p style={{ fontWeight: "700", fontSize: "15px", color: "#ef4444" }}>Log Out</p>
//                   <p style={{ fontSize: "12px", color: "rgba(239,68,68,0.5)", marginTop: "2px" }}>Sign out of your account</p>
//                 </div>
//               </button>
//             </div>
//           )}
//         </div>

//         {/* FAB */}
//         {activeTab === "chats" && (
//           <div style={{ position: "absolute", bottom: "80px", right: "20px", zIndex: 10 }}>
//             <button style={{
//               width: "56px", height: "56px", borderRadius: "18px",
//               background: "linear-gradient(135deg, #7b50ff, #00c896)",
//               display: "flex", alignItems: "center", justifyContent: "center",
//               boxShadow: "0 8px 24px rgba(123,80,255,0.45)", border: "none", cursor: "pointer",
//             }}>
//               <Sparkles size={22} style={{ color: "white" }} />
//             </button>
//           </div>
//         )}

//         {/* BOTTOM TAB BAR */}
//         <div style={{
//           flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-around",
//           padding: "10px 8px 16px",
//           background: "rgba(15,12,41,0.96)",
//           borderTop: "1px solid rgba(255,255,255,0.07)",
//           backdropFilter: "blur(20px)",
//         }}>
//           {[
//             { id: "chats", icon: MessageSquare, label: "Chats" },
//             { id: "calls", icon: Phone, label: "Calls" },
//             { id: "communities", icon: Users, label: "People" },
//             { id: "settings", icon: Settings, label: "Settings" },
//           ].map(({ id, icon: Icon, label }) => {
//             const isActive = activeTab === id;
//             return (
//               <button key={id} onClick={() => setActiveTab(id)} style={{
//                 display: "flex", flexDirection: "column", alignItems: "center", gap: "4px",
//                 padding: "8px 16px", borderRadius: "16px", border: "none", cursor: "pointer",
//                 background: isActive ? "rgba(123,80,255,0.2)" : "transparent",
//                 transition: "all 0.2s ease",
//               }}>
//                 <Icon size={20} style={{ color: isActive ? "#7b50ff" : "rgba(255,255,255,0.35)" }} />
//                 <span style={{ fontSize: "10px", fontWeight: isActive ? "700" : "500", color: isActive ? "#7b50ff" : "rgba(255,255,255,0.35)" }}>
//                   {label}
//                 </span>
//               </button>
//             );
//           })}
//         </div>
//       </div>
//     );
//   }

//   /* ==================== DESKTOP (unchanged) ==================== */
//   return (
//     <aside className="h-full w-full flex flex-col bg-base-100 overflow-hidden">
//       <div className="border-b border-base-300 px-4 py-3 flex-shrink-0">
//         <div className="flex items-center justify-between mb-3">
//           <span className="font-semibold text-base">Chats</span>
//           {onlineCount > 0 && (
//             <span className="flex items-center gap-1 text-xs bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full font-medium">
//               <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
//               {onlineCount} online
//             </span>
//           )}
//         </div>
//         <div className="flex items-center gap-2 bg-base-200 rounded-full px-3 py-1.5">
//           <Search className="w-4 h-4 text-base-content/40 flex-shrink-0" />
//           <input type="text" placeholder="Search contacts..."
//             value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
//             className="bg-transparent outline-none text-sm flex-1 placeholder:text-base-content/30" />
//         </div>
//       </div>

//       <div className="overflow-y-auto w-full flex-1">
//         {filteredUsers.map((user) => {
//           const isOnline = onlineUsers.includes(user._id);
//           const isSelected = selectedUser?._id === user._id;
//           return (
//             <button key={user._id} onClick={() => setSelectedUser(user)}
//               className={`w-full flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-base-200
//                 ${isSelected ? "bg-base-200 border-l-4 border-violet-500" : "border-l-4 border-transparent"}`}>
//               <div className="relative flex-shrink-0">
//                 <img src={user.profilePic || "/avatar.png"} alt={user.fullName}
//                   className="w-11 h-11 rounded-full object-cover" />
//                 {isOnline && <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-base-100" />}
//               </div>
//               <div className="flex-1 min-w-0 text-left">
//                 <span className="font-medium text-sm truncate block">{user.fullName}</span>
//                 <span className={`text-xs ${isOnline ? "text-emerald-500" : "text-base-content/40"}`}>
//                   {isOnline ? "● Online" : "Offline"}
//                 </span>
//               </div>
//             </button>
//           );
//         })}
//         {filteredUsers.length === 0 && (
//           <div className="flex flex-col items-center justify-center py-12 gap-2">
//             <Users className="w-8 h-8 text-base-content/20" />
//             <p className="text-sm text-base-content/40">No contacts found</p>
//           </div>
//         )}
//       </div>
//     </aside>
//   );
// };

// export default Sidebar;




// import { useEffect, useState } from "react";
// import { useChatStore } from "../store/useChatStore";
// import { useAuthStore } from "../store/useAuthStore";
// import SidebarSkeleton from "./skeletons/SidebarSkeleton";
// import { Search, Camera, EllipsisVertical, Image, MessageSquare, Users, Phone, Settings, LogOut, User, Sun, Moon } from "lucide-react";
// import { Link } from "react-router-dom";
// import { useThemeStore } from "../store/useThemeStore";

// const Sidebar = ({ onSelectUser }) => {
//   const { getUsers, users, selectedUser, setSelectedUser, isUsersLoading } = useChatStore();
//   const { onlineUsers, authUser, logout } = useAuthStore();
//   const [searchQuery, setSearchQuery] = useState("");
//   const [activeTab, setActiveTab] = useState("chats");
//   const [showProfileMenu, setShowProfileMenu] = useState(false);
//   const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

//   // Try to get theme store — graceful fallback if not present
//   let theme, setTheme;
//   try {
//     const ts = useThemeStore();
//     theme = ts.theme;
//     setTheme = ts.setTheme;
//   } catch {
//     theme = "light";
//     setTheme = () => {};
//   }

//   useEffect(() => {
//     const check = () => setIsMobile(window.innerWidth <= 768);
//     window.addEventListener("resize", check);
//     return () => window.removeEventListener("resize", check);
//   }, []);

//   useEffect(() => {
//     getUsers();
//   }, [getUsers]);

//   const filteredUsers = users.filter((user) =>
//     user.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
//   );

//   if (isUsersLoading) return <SidebarSkeleton />;

//   /* ===================== MOBILE LAYOUT ===================== */
//   if (isMobile) {
//     return (
//       <div className="h-full w-full flex flex-col bg-[#111b21] text-white overflow-hidden">

//         {/* ---- TOP HEADER ---- */}
//         <div className="flex items-center justify-between px-4 pt-12 pb-3 bg-[#111b21] flex-shrink-0">
//           <h1 className="text-2xl font-bold text-white">
//             {activeTab === "chats" && "WhatsApp"}
//             {activeTab === "settings" && "Settings"}
//             {activeTab === "calls" && "Calls"}
//           </h1>
//           {activeTab === "chats" && (
//             <div className="flex items-center gap-2">
//               <button className="p-2 rounded-full hover:bg-white/10 transition-colors">
//                 <Camera className="w-5 h-5 text-white/80" />
//               </button>
//               <button className="p-2 rounded-full hover:bg-white/10 transition-colors">
//                 <EllipsisVertical className="w-5 h-5 text-white/80" />
//               </button>
//             </div>
//           )}
//         </div>

//         {/* ---- CONTENT AREA ---- */}
//         <div className="flex-1 overflow-y-auto min-h-0">

//           {/* === CHATS TAB === */}
//           {activeTab === "chats" && (
//             <>
//               {/* Search */}
//               <div className="px-3 pb-2">
//                 <div className="flex items-center gap-3 bg-[#202c33] rounded-xl px-4 py-2.5">
//                   <Search className="w-4 h-4 text-[#8696a0] flex-shrink-0" />
//                   <input
//                     type="text"
//                     placeholder="Ask Meta AI or Search"
//                     value={searchQuery}
//                     onChange={(e) => setSearchQuery(e.target.value)}
//                     className="bg-transparent outline-none text-sm flex-1 text-white placeholder:text-[#8696a0]"
//                   />
//                 </div>
//               </div>

//               {/* Contact list */}
//               {filteredUsers.map((user) => {
//                 const isOnline = onlineUsers.includes(user._id);
//                 const isSelected = selectedUser?._id === user._id;

//                 return (
//                   <button
//                     key={user._id}
//                     onClick={() => {
//                       setSelectedUser(user);
//                       onSelectUser?.();
//                     }}
//                     className={`w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-left
//                       ${isSelected ? "bg-[#2a3942]" : "hover:bg-[#202c33]"}`}
//                   >
//                     <div className="relative flex-shrink-0">
//                       <img src={user.profilePic || "/avatar.png"} alt={user.fullName}
//                         className="w-12 h-12 rounded-full object-cover" />
//                       {isOnline && (
//                         <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#111b21]" />
//                       )}
//                     </div>
//                     <div className="flex-1 min-w-0 border-b border-[#202c33] pb-2.5">
//                       <div className="flex items-center justify-between gap-2">
//                         <span className="font-medium text-[15px] text-white truncate">{user.fullName}</span>
//                         <span className="text-xs text-[#8696a0] flex-shrink-0">Yesterday</span>
//                       </div>
//                       <div className="flex items-center justify-between mt-0.5">
//                         <p className="text-sm text-[#8696a0] truncate">
//                           {isOnline ? "Online" : "Tap to chat"}
//                         </p>
//                       </div>
//                     </div>
//                   </button>
//                 );
//               })}

//               {filteredUsers.length === 0 && (
//                 <p className="text-center text-[#8696a0] py-10 text-sm">No contacts found</p>
//               )}
//             </>
//           )}

//           {/* === SETTINGS TAB === */}
//           {activeTab === "settings" && (
//             <div className="flex flex-col">

//               {/* Profile card */}
//               <div className="flex items-center gap-4 px-5 py-4 hover:bg-[#202c33] transition-colors border-b border-[#202c33]">
//                 <img src={authUser?.profilePic || "/avatar.png"} alt=""
//                   className="w-16 h-16 rounded-full object-cover" />
//                 <div className="flex-1 min-w-0">
//                   <p className="font-semibold text-white text-base">{authUser?.fullName}</p>
//                   <p className="text-sm text-[#8696a0] truncate">{authUser?.email}</p>
//                 </div>
//               </div>

//               {/* Settings items */}
//               <div className="mt-2">
//                 <Link
//                   to="/profile"
//                   className="flex items-center gap-4 px-5 py-4 hover:bg-[#202c33] transition-colors"
//                 >
//                   <div className="w-9 h-9 rounded-full bg-emerald-500/20 flex items-center justify-center">
//                     <User className="w-5 h-5 text-emerald-400" />
//                   </div>
//                   <div>
//                     <p className="text-white text-sm font-medium">Account</p>
//                     <p className="text-[#8696a0] text-xs">Privacy, security, change number</p>
//                   </div>
//                 </Link>

//                 <Link
//                   to="/settings"
//                   className="flex items-center gap-4 px-5 py-4 hover:bg-[#202c33] transition-colors"
//                 >
//                   <div className="w-9 h-9 rounded-full bg-blue-500/20 flex items-center justify-center">
//                     <Settings className="w-5 h-5 text-blue-400" />
//                   </div>
//                   <div>
//                     <p className="text-white text-sm font-medium">Theme & Display</p>
//                     <p className="text-[#8696a0] text-xs">Wallpaper, chat themes</p>
//                   </div>
//                 </Link>

//                 {/* Dark/Light toggle */}
//                 <button
//                   onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
//                   className="w-full flex items-center gap-4 px-5 py-4 hover:bg-[#202c33] transition-colors"
//                 >
//                   <div className="w-9 h-9 rounded-full bg-yellow-500/20 flex items-center justify-center">
//                     {theme === "dark"
//                       ? <Sun className="w-5 h-5 text-yellow-400" />
//                       : <Moon className="w-5 h-5 text-yellow-400" />}
//                   </div>
//                   <div className="flex-1 text-left">
//                     <p className="text-white text-sm font-medium">
//                       {theme === "dark" ? "Light Mode" : "Dark Mode"}
//                     </p>
//                     <p className="text-[#8696a0] text-xs">Currently {theme} theme</p>
//                   </div>
//                   <div className={`w-12 h-6 rounded-full transition-colors ${theme === "dark" ? "bg-emerald-500" : "bg-[#3a3a3a]"}`}>
//                     <div className={`w-5 h-5 bg-white rounded-full mt-0.5 transition-transform shadow-sm ${theme === "dark" ? "translate-x-6" : "translate-x-0.5"}`} />
//                   </div>
//                 </button>

//                 {/* Logout */}
//                 <button
//                   onClick={logout}
//                   className="w-full flex items-center gap-4 px-5 py-4 hover:bg-red-500/10 transition-colors mt-4 border-t border-[#202c33]"
//                 >
//                   <div className="w-9 h-9 rounded-full bg-red-500/20 flex items-center justify-center">
//                     <LogOut className="w-5 h-5 text-red-400" />
//                   </div>
//                   <p className="text-red-400 text-sm font-medium">Log Out</p>
//                 </button>
//               </div>
//             </div>
//           )}

//           {/* === CALLS TAB === */}
//           {activeTab === "calls" && (
//             <div className="flex flex-col items-center justify-center h-full gap-3 text-[#8696a0]">
//               <Phone className="w-12 h-12 opacity-20" />
//               <p className="text-sm">No recent calls</p>
//               <p className="text-xs opacity-60">Your call history will appear here</p>
//             </div>
//           )}
//         </div>

//         {/* ---- BOTTOM TAB BAR ---- */}
//         <div className="flex-shrink-0 bg-[#1f2c34] border-t border-[#2a3942] flex items-center justify-around px-2 py-2 safe-area-inset-bottom">
//           {[
//             { id: "chats", icon: MessageSquare, label: "Chats" },
//             { id: "calls", icon: Phone, label: "Calls" },
//             { id: "communities", icon: Users, label: "Communities" },
//             { id: "settings", icon: Settings, label: "Settings" },
//           ].map(({ id, icon: Icon, label }) => (
//             <button
//               key={id}
//               onClick={() => setActiveTab(id)}
//               className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-colors ${
//                 activeTab === id ? "text-emerald-400" : "text-[#8696a0]"
//               }`}
//             >
//               <Icon className="w-5 h-5" />
//               <span className="text-[10px] font-medium">{label}</span>
//               {activeTab === id && (
//                 <span className="w-1 h-1 rounded-full bg-emerald-400 mt-0.5" />
//               )}
//             </button>
//           ))}
//         </div>

//         {/* FAB — only on chats tab */}
//         {activeTab === "chats" && (
//           <div className="absolute bottom-20 right-4 z-10">
//             <button className="w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-600 flex items-center justify-center shadow-xl transition-colors">
//               <MessageSquare className="w-6 h-6 text-white" />
//             </button>
//           </div>
//         )}
//       </div>
//     );
//   }

//   /* ===================== DESKTOP LAYOUT ===================== */
//   return (
//     <aside className="h-full w-full flex flex-col bg-base-100 overflow-hidden">

//       {/* Header */}
//       <div className="border-b border-base-300 px-4 py-3 flex-shrink-0">
//         <div className="flex items-center justify-between mb-2">
//           <span className="font-semibold text-base">Chats</span>
//           {onlineUsers.filter((id) => id !== authUser?._id).length > 0 && (
//             <span className="flex items-center gap-1 text-xs bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full font-medium">
//               <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
//               {onlineUsers.filter((id) => id !== authUser?._id).length} online
//             </span>
//           )}
//         </div>
//         <div className="flex items-center gap-2 bg-base-200 rounded-full px-3 py-1.5">
//           <Search className="w-4 h-4 text-base-content/40 flex-shrink-0" />
//           <input
//             type="text"
//             placeholder="Search contacts..."
//             value={searchQuery}
//             onChange={(e) => setSearchQuery(e.target.value)}
//             className="bg-transparent outline-none text-sm flex-1 placeholder:text-base-content/30"
//           />
//         </div>
//       </div>

//       {/* User list */}
//       <div className="overflow-y-auto w-full flex-1">
//         {filteredUsers.map((user) => {
//           const isOnline = onlineUsers.includes(user._id);
//           const isSelected = selectedUser?._id === user._id;
//           return (
//             <button
//               key={user._id}
//               onClick={() => setSelectedUser(user)}
//               className={`w-full flex items-center gap-3 px-3 py-2.5 transition-colors
//                 hover:bg-base-200
//                 ${isSelected ? "bg-base-200 border-l-4 border-emerald-500" : "border-l-4 border-transparent"}`}
//             >
//               <div className="relative flex-shrink-0">
//                 <img src={user.profilePic || "/avatar.png"} alt={user.fullName}
//                   className="w-11 h-11 rounded-full object-cover" />
//                 {isOnline && (
//                   <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-base-100" />
//                 )}
//               </div>
//               <div className="flex-1 min-w-0 text-left">
//                 <div className="flex items-center justify-between">
//                   <span className="font-medium text-sm truncate">{user.fullName}</span>
//                 </div>
//                 <span className={`text-xs ${isOnline ? "text-emerald-500" : "text-base-content/40"}`}>
//                   {isOnline ? "Online" : "Offline"}
//                 </span>
//               </div>
//             </button>
//           );
//         })}

//         {filteredUsers.length === 0 && (
//           <div className="flex flex-col items-center justify-center py-12 gap-2">
//             <Users className="w-8 h-8 text-base-content/20" />
//             <p className="text-sm text-base-content/40">No contacts found</p>
//           </div>
//         )}
//       </div>
//     </aside>
//   );
// };

// export default Sidebar;

// // Sidebar.jsx
// import { useEffect, useState } from "react";
// import { useChatStore } from "../store/useChatStore";
// import { useAuthStore } from "../store/useAuthStore";
// import SidebarSkeleton from "./skeletons/SidebarSkeleton";
// import { Users } from "lucide-react";

// const Sidebar = ({ onSelectUser }) => {
//   const { getUsers, users, selectedUser, setSelectedUser, isUsersLoading } =
//     useChatStore();

//   const { onlineUsers, authUser } = useAuthStore();
//   const [showOnlineOnly, setShowOnlineOnly] = useState(false);

//   // Fetch Users on Load
//   useEffect(() => {
//     getUsers();
//   }, [getUsers]);

//   // Filter Users by Online Status
//   const filteredUsers = showOnlineOnly
//     ? users.filter((user) => onlineUsers.includes(user._id))
//     : users;

//   if (isUsersLoading) return <SidebarSkeleton />;

//   return (
//     <aside
//       className="
//         h-full
//         w-20
//         lg:w-72
//         border-r border-base-300
//         flex flex-col
//         transition-all duration-200
//         max-[450px]:w-16
//       "
//     >
//       {/* HEADER */}
//       <div className="border-b border-base-300 w-full p-5 max-[450px]:p-3">
//         <div className="flex items-center gap-2">
//           <Users className="size-6 max-[450px]:size-5" />
//           <span className="font-medium hidden lg:block">Contacts</span>
//         </div>

//         {/* Online Filter */}
//         <div className="mt-3 hidden lg:flex items-center gap-2">
//           <label className="cursor-pointer flex items-center gap-2">
//             <input
//               type="checkbox"
//               checked={showOnlineOnly}
//               onChange={(e) => setShowOnlineOnly(e.target.checked)}
//               className="checkbox checkbox-sm"
//             />
//             <span className="text-sm">Show online only</span>
//           </label>

//           <span className="text-xs text-zinc-500">
//             (
//             {
//               onlineUsers.filter((id) => id !== authUser?._id).length
//             }{" "}
//             online)
//           </span>
//         </div>
//       </div>

//       {/* USER LIST */}
//       <div className="overflow-y-auto w-full py-3 max-[450px]:py-2">
//         {filteredUsers.map((user) => (
//           <button
//             key={user._id}
//             onClick={() => {
//               setSelectedUser(user);

//               // Close sidebar automatically on mobile
//               if (window.innerWidth <= 720) {
//                 onSelectUser?.();
//               }
//             }}
//             className={`
//               w-full
//               p-3 max-[450px]:p-2
//               flex items-center gap-3
//               hover:bg-base-300 transition-colors
//               ${
//                 selectedUser?._id === user._id
//                   ? "bg-base-300 ring-1 ring-base-300"
//                   : ""
//               }
//             `}
//           >
//             {/* Avatar */}
//             <div className="relative mx-auto lg:mx-0">
//               <img
//                 src={user.profilePic || "/avatar.png"}
//                 alt={user.fullName}      // ⭐ FIXED
//                 className="size-12 max-[450px]:size-10 object-cover rounded-full"
//               />

//               {/* Online Badge */}
//               {onlineUsers.includes(user._id) && (
//                 <span className="absolute bottom-0 right-0 size-3 bg-green-500 rounded-full ring-2 ring-zinc-900" />
//               )}
//             </div>

//             {/* User Info (hidden on small screens) */}
//             <div className="hidden lg:block text-left min-w-0">
//               <div className="font-medium truncate">{user.fullName}</div>

//               <div className="text-sm text-zinc-400">
//                 {onlineUsers.includes(user._id)
//                   ? "Online"
//                   : "Offline"}
//               </div>
//             </div>
//           </button>
//         ))}

//         {/* Empty State */}
//         {filteredUsers.length === 0 && (
//           <div className="text-center text-zinc-500 py-4 text-sm lg:text-base">
//             No online users
//           </div>
//         )}
//       </div>
//     </aside>
//   );
// };

// export default Sidebar;





// // import { useEffect, useState } from "react";
// // import { useChatStore } from "../store/useChatStore";
// // import { useAuthStore } from "../store/useAuthStore";
// // import SidebarSkeleton from "./skeletons/SidebarSkeleton";
// // import { Users } from "lucide-react";

// // const Sidebar = () => {
// //   const { getUsers, users, selectedUser, setSelectedUser, isUsersLoading } = useChatStore();

// //   const { onlineUsers } = useAuthStore();
// //   const [showOnlineOnly, setShowOnlineOnly] = useState(false);

// //   useEffect(() => {
// //     getUsers();
// //   }, [getUsers]);

// //   const filteredUsers = showOnlineOnly
// //     ? users.filter((user) => onlineUsers.includes(user._id))
// //     : users;

// //   if (isUsersLoading) return <SidebarSkeleton />;

// //   return (
// //     <aside className="h-full w-20 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200">
// //       <div className="border-b border-base-300 w-full p-5">
// //         <div className="flex items-center gap-2">
// //           <Users className="size-6" />
// //           <span className="font-medium hidden lg:block">Contacts</span>
// //         </div>
// //         {/* TODO: Online filter toggle */}
// //         <div className="mt-3 hidden lg:flex items-center gap-2">
// //           <label className="cursor-pointer flex items-center gap-2">
// //             <input
// //               type="checkbox"
// //               checked={showOnlineOnly}
// //               onChange={(e) => setShowOnlineOnly(e.target.checked)}
// //               className="checkbox checkbox-sm"
// //             />
// //             <span className="text-sm">Show online only</span>
// //           </label>
// //           <span className="text-xs text-zinc-500">({onlineUsers.length - 1} online)</span>
// //         </div>
// //       </div>

// //       <div className="overflow-y-auto w-full py-3">
// //         {filteredUsers.map((user) => (
// //           <button
// //             key={user._id}
// //             onClick={() => setSelectedUser(user)}
// //             className={`
// //               w-full p-3 flex items-center gap-3
// //               hover:bg-base-300 transition-colors
// //               ${selectedUser?._id === user._id ? "bg-base-300 ring-1 ring-base-300" : ""}
// //             `}
// //           >
// //             <div className="relative mx-auto lg:mx-0">
// //               <img
// //                 src={user.profilePic || "/avatar.png"}
// //                 alt={user.name}
// //                 className="size-12 object-cover rounded-full"
// //               />
// //               {onlineUsers.includes(user._id) && (
// //                 <span
// //                   className="absolute bottom-0 right-0 size-3 bg-green-500 
// //                   rounded-full ring-2 ring-zinc-900"
// //                 />
// //               )}
// //             </div>

// //             {/* User info - only visible on larger screens */}
// //             <div className="hidden lg:block text-left min-w-0">
// //               <div className="font-medium truncate">{user.fullName}</div>
// //               <div className="text-sm text-zinc-400">
// //                 {onlineUsers.includes(user._id) ? "Online" : "Offline"}
// //               </div>
// //             </div>
// //           </button>
// //         ))}

// //         {filteredUsers.length === 0 && (
// //           <div className="text-center text-zinc-500 py-4">No online users</div>
// //         )}
// //       </div>
// //     </aside>
// //   );
// // };
// // export default Sidebar;
// import { useEffect, useState } from "react";
// import { useChatStore } from "../store/useChatStore";
// import { useAuthStore } from "../store/useAuthStore";
// import SidebarSkeleton from "./skeletons/SidebarSkeleton";
// import { Search, Users } from "lucide-react";

// const Sidebar = ({ onSelectUser }) => {
//   const { getUsers, users, selectedUser, setSelectedUser, isUsersLoading } = useChatStore();
//   const { onlineUsers, authUser } = useAuthStore();

//   const [showOnlineOnly, setShowOnlineOnly] = useState(false);
//   const [searchQuery, setSearchQuery] = useState("");

//   useEffect(() => {
//     getUsers();
//   }, [getUsers]);

//   const filteredUsers = users.filter((user) => {
//     const matchesOnline = showOnlineOnly ? onlineUsers.includes(user._id) : true;
//     const matchesSearch = user.fullName?.toLowerCase().includes(searchQuery.toLowerCase());
//     return matchesOnline && matchesSearch;
//   });

//   const onlineCount = onlineUsers.filter((id) => id !== authUser?._id).length;

//   if (isUsersLoading) return <SidebarSkeleton />;

//   return (
//     <aside className="h-full w-20 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200 bg-base-100 max-[450px]:w-16">

//       {/* ===== HEADER ===== */}
//       <div className="border-b border-base-300 w-full px-3 py-3 flex-shrink-0">

//         {/* Title row */}
//         <div className="flex items-center justify-between mb-2 px-1">
//           <div className="flex items-center gap-2">
//             <Users className="w-5 h-5 text-base-content/70 lg:hidden" />
//             <span className="font-semibold text-base hidden lg:block">Chats</span>
//           </div>
//           {/* Online badge */}
//           {onlineCount > 0 && (
//             <span className="hidden lg:flex items-center gap-1 text-xs bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full font-medium">
//               <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
//               {onlineCount} online
//             </span>
//           )}
//         </div>

//         {/* Search bar — lg only */}
//         <div className="hidden lg:flex items-center gap-2 bg-base-200 rounded-full px-3 py-1.5">
//           <Search className="w-4 h-4 text-base-content/40 flex-shrink-0" />
//           <input
//             type="text"
//             placeholder="Search contacts..."
//             value={searchQuery}
//             onChange={(e) => setSearchQuery(e.target.value)}
//             className="bg-transparent outline-none text-sm flex-1 placeholder:text-base-content/30"
//           />
//         </div>

//         {/* Online only toggle — lg only */}
//         <div className="mt-2 hidden lg:flex items-center gap-2 px-1">
//           <label className="cursor-pointer flex items-center gap-2">
//             <input
//               type="checkbox"
//               checked={showOnlineOnly}
//               onChange={(e) => setShowOnlineOnly(e.target.checked)}
//               className="checkbox checkbox-xs checkbox-success"
//             />
//             <span className="text-xs text-base-content/60">Online only</span>
//           </label>
//         </div>
//       </div>

//       {/* ===== USER LIST ===== */}
//       <div className="overflow-y-auto w-full flex-1">
//         {filteredUsers.map((user) => {
//           const isOnline = onlineUsers.includes(user._id);
//           const isSelected = selectedUser?._id === user._id;

//           return (
//             <button
//               key={user._id}
//               onClick={() => {
//                 setSelectedUser(user);
//                 if (window.innerWidth <= 720) onSelectUser?.();
//               }}
//               className={`w-full flex items-center gap-3 px-3 py-2.5 max-[450px]:py-2 transition-colors
//                 hover:bg-base-200
//                 ${isSelected ? "bg-base-200 border-l-4 border-emerald-500" : "border-l-4 border-transparent"}
//               `}
//             >
//               {/* Avatar + online dot */}
//               <div className="relative flex-shrink-0 mx-auto lg:mx-0">
//                 <img
//                   src={user.profilePic || "/avatar.png"}
//                   alt={user.fullName}
//                   className="w-12 h-12 max-[450px]:w-10 max-[450px]:h-10 rounded-full object-cover"
//                 />
//                 {isOnline && (
//                   <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-base-100" />
//                 )}
//               </div>

//               {/* User info — lg only */}
//               <div className="hidden lg:flex flex-col flex-1 min-w-0 text-left">
//                 <div className="flex items-center justify-between gap-1">
//                   <span className={`font-medium text-sm truncate ${isSelected ? "text-base-content" : "text-base-content/90"}`}>
//                     {user.fullName}
//                   </span>
//                 </div>
//                 <span className={`text-xs truncate ${isOnline ? "text-emerald-500" : "text-base-content/40"}`}>
//                   {isOnline ? "Online" : "Offline"}
//                 </span>
//               </div>
//             </button>
//           );
//         })}

//         {/* Empty state */}
//         {filteredUsers.length === 0 && (
//           <div className="flex flex-col items-center justify-center py-12 px-4 text-center gap-2">
//             <Users className="w-8 h-8 text-base-content/20" />
//             <p className="text-sm text-base-content/40">
//               {searchQuery ? "No contacts found" : "No online users"}
//             </p>
//           </div>
//         )}
//       </div>
//     </aside>
//   );
// };

// export default Sidebar;