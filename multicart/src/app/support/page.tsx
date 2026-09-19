"use client";

import { useEffect, useRef, useState } from "react";
import axios from "axios";
import Image from "next/image";
import { FaPaperPlane, FaUserCircle } from "react-icons/fa";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";

interface ChatUser {
  _id: string;
  name: string;
  image?: string;
  role: "user" | "vendor" | "admin";
  shopName?: string;
}

interface Message {
  sender: string;
  text: string;
  createdAt: string;
}

export default function SupportPage() {
  const { userData } = useSelector((state: RootState) => state.user);
  const myId = String(userData?._id);

  const [users, setUsers] = useState<ChatUser[]>([]);
  const [activeUser, setActiveUser] = useState<ChatUser | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");

  /* ================= AI SUGGESTIONS ================= */
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  if (!myId) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Loading support...
      </div>
    );
  }

  /* ================= ACTIVE USERS ================= */
  useEffect(() => {
    axios
      .get("/api/chat/active-users")
      .then((res) => setUsers(res.data || []))
      .catch(console.log);
  }, []);

  /* ================= FETCH MESSAGES ================= */
  useEffect(() => {
    if (!activeUser) return;

    axios
      .get(`/api/chat/get?with=${activeUser._id}`)
      .then((res) => setMessages(res.data || []))
      .catch(console.log);
  }, [activeUser]);

  /* ================= AUTO SCROLL ================= */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ================= FETCH AI SUGGESTIONS (BUTTON) ================= */
  const fetchSuggestions = async () => {
    if (!messages.length || !activeUser || !userData?.role) return;

    const lastMessage = messages[messages.length - 1];

    // Don't generate if last message is mine
    if (String(lastMessage.sender) === String(myId)) return;

    setLoadingSuggestions(true);

    try {
      const res = await axios.post("/api/chat/suggestions", {
        message: lastMessage.text,
        role: userData.role,
        targetRole: activeUser.role,
      });

      setSuggestions(res.data.suggestions || []);
    } catch (err) {
      setSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  /* ================= SEND MESSAGE ================= */
  const sendMessage = async () => {
    if (!text.trim() || !activeUser) return;

    await axios.post("/api/chat/send", {
      receiverId: activeUser._id,
      text,
    });

    setMessages((prev) => [
      ...prev,
      {
        sender: myId,
        text,
        createdAt: new Date().toISOString(),
      },
    ]);

    setText("");
    setSuggestions([]); // clear after sending
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 h-[90vh]">

        {/* ================= LEFT PANEL ================= */}
        <div className="bg-black/50 border border-white/10 rounded-2xl p-4 overflow-y-auto">
          <h2 className="text-white font-semibold mb-4 text-lg">
            Support Chats
          </h2>

          {users.length === 0 && (
            <p className="text-gray-400 text-sm text-center">
              No active chats
            </p>
          )}

          <div className="space-y-3">
            {users.map((u) => (
              <div
                key={u._id}
                onClick={() => setActiveUser(u)}
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition
                  ${
                    activeUser?._id === u._id
                      ? "bg-blue-600/20 border border-blue-500/40 shadow-lg"
                      : "hover:bg-white/5 border border-transparent"
                  }`}
              >
                <div className="w-12 h-12 rounded-full overflow-hidden border border-white/20">
                  {u.image ? (
                    <Image
                      src={u.image}
                      alt={u.name}
                      width={48}
                      height={48}
                      className="object-cover"
                    />
                  ) : (
                    <FaUserCircle className="text-gray-400 w-12 h-12" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-white text-sm font-medium truncate">
                    {u.name}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {u.role === "admin"
                      ? "Admin Support"
                      : u.shopName || u.role}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ================= RIGHT PANEL ================= */}
        <div className="md:col-span-2 bg-black/50 border border-white/10 rounded-2xl flex flex-col overflow-hidden">

          {!activeUser ? (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              Select a chat to start conversation
            </div>
          ) : (
            <>
              {/* ================= MESSAGES ================= */}
              <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                {messages.map((msg, i) => {
                  const isMe = msg.sender === myId;
                  const avatarUser = isMe ? userData : activeUser;

                  return (
                    <div
                      key={i}
                      className={`flex items-end gap-3 ${
                        isMe ? "justify-end" : "justify-start"
                      }`}
                    >
                      {!isMe && (
                        <div className="w-9 h-9 rounded-full overflow-hidden border border-white/20">
                          {avatarUser?.image ? (
                            <Image
                              src={avatarUser.image}
                              alt="user"
                              width={36}
                              height={36}
                              className="object-cover"
                            />
                          ) : (
                            <FaUserCircle className="text-gray-400 w-9 h-9" />
                          )}
                        </div>
                      )}

                      <div
                        className={`max-w-[70%] px-4 py-2.5 text-sm rounded-2xl
                          ${
                            isMe
                              ? "bg-blue-600 text-white rounded-br-sm"
                              : "bg-white/10 text-gray-200 rounded-bl-sm"
                          }`}
                      >
                        {msg.text}
                      </div>

                      {isMe && (
                        <div className="w-9 h-9 rounded-full overflow-hidden border border-white/20">
                          {userData?.image ? (
                            <Image
                              src={userData.image}
                              alt="me"
                              width={36}
                              height={36}
                              className="object-cover"
                            />
                          ) : (
                            <FaUserCircle className="text-gray-400 w-9 h-9" />
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              {/* ================= AI BUTTON ================= */}
              <div className="px-4 pb-2">
                <button
                  onClick={fetchSuggestions}
                  disabled={loadingSuggestions}
                  className="text-xs px-4 py-1.5 rounded-full
                    bg-purple-600/20 text-purple-300
                    border border-purple-500/30
                    hover:bg-purple-600/30
                    disabled:opacity-50 transition z-50"
                >
                  {loadingSuggestions ? "Generating..." : "Get AI Suggestions"}
                </button>
              </div>

              {/* ================= AI SUGGESTIONS ================= */}
              {suggestions.length > 0 && (
                <div className="px-4 pb-2 flex gap-2 flex-wrap">
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => setText(s)}
                      className="text-xs px-3 py-1 rounded-full
                        bg-blue-500/10 text-blue-300
                        border border-blue-500/30
                        hover:bg-blue-500/20 transition"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {/* ================= INPUT ================= */}
              <div className="p-3 border-t border-white/10 bg-black/60 flex gap-2">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 bg-black/80 text-white border border-white/20 rounded-full px-5 py-2.5 outline-none focus:border-blue-500"
                />
                <button
                  onClick={sendMessage}
                  className="bg-blue-600 hover:bg-blue-700 w-11 h-11 rounded-full flex items-center justify-center"
                >
                  <FaPaperPlane className="text-white text-sm" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
