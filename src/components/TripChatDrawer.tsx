import React, { useState, useRef, useEffect } from "react";
import { TripPlan, ChatMessage } from "../types";
import { MessageSquare, X, Send, Bot, User, Sparkles, Loader2 } from "lucide-react";

interface TripChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  trip: TripPlan;
}

export const TripChatDrawer: React.FC<TripChatDrawerProps> = ({
  isOpen,
  onClose,
  trip,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `안녕하세요! **${trip.destinationName} ${trip.durationSummary}** 여행 전담 AI 비서입니다. 
일정에 대해 궁금한 점이나 맛집 변경, 비 오는 날 대안, 교통 패스 사용법 등 무엇이든 편하게 물어보세요!`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!isOpen) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    const userMsg: ChatMessage = {
      id: "user-" + Date.now(),
      role: "user",
      content: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/trip-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tripContext: trip,
          message: userText,
          chatHistory: messages.slice(-6),
        }),
      });
      const data = await res.json();

      const assistantMsg: ChatMessage = {
        id: "ai-" + Date.now(),
        role: "assistant",
        content: data.reply || "죄송합니다, 잠시 후 다시 질문해주세요.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: "err-" + Date.now(),
          role: "assistant",
          content: "네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickQuestions = [
    "2일차 점심 식당 웨이팅이 길면 다른 대안은?",
    "오사카 주유패스 1일권으로 이 일정 소화 가능해?",
    "비가 올 경우를 대비한 실내 추천 코스는?",
    "저녁에 가볍게 한잔하기 좋은 이자카야 골목은?",
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between animate-slideLeft">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center text-white">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm">AI 현지 여행 가이드</h3>
              <p className="text-[11px] text-slate-300">{trip.destinationName} 맞춤형 컨시어지</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message Thread */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50 text-xs sm:text-sm">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2.5 ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.role === "assistant" && (
                <div className="w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-2xs">
                  <Bot className="w-3.5 h-3.5" />
                </div>
              )}

              <div
                className={`max-w-[82%] p-3.5 rounded-2xl leading-relaxed whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-slate-900 text-white rounded-tr-xs"
                    : "bg-white text-slate-800 border border-slate-200 rounded-tl-xs shadow-2xs"
                }`}
              >
                {msg.content}
                <span
                  className={`block text-[10px] mt-1 text-right ${
                    msg.role === "user" ? "text-slate-400" : "text-slate-400"
                  }`}
                >
                  {msg.timestamp}
                </span>
              </div>

              {msg.role === "user" && (
                <div className="w-7 h-7 rounded-full bg-slate-700 text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-2xs">
                  <User className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-2.5 items-center text-slate-500 text-xs">
              <div className="w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              </div>
              <span>답변을 작성하고 있습니다...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="p-2.5 bg-slate-100 border-t border-slate-200 overflow-x-auto flex gap-1.5 scrollbar-thin">
          {quickQuestions.map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setInput(q);
              }}
              className="text-[11px] bg-white text-slate-700 font-medium px-2.5 py-1 rounded-lg border border-slate-200 hover:border-amber-300 hover:bg-amber-50 whitespace-nowrap transition-colors flex-shrink-0 cursor-pointer"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-3 border-t border-slate-200 bg-white flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="여행 일정에 대해 질문해보세요..."
            className="flex-1 bg-slate-50 border border-slate-200 focus:border-amber-500 focus:bg-white rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 outline-none transition-all"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white rounded-xl font-bold transition-all cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
