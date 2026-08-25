import { useEffect, useRef, useState, type FormEvent } from "react";
import { Send, Bot, User, Loader2 } from "lucide-react";
import type { ChatMessage, TripPlan } from "@/types";
import { sendTripChat } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface TripChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  trip: TripPlan;
}

export function TripChatDrawer({ isOpen, onClose, trip }: TripChatDrawerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `안녕하세요! **${trip.destinationName} ${trip.durationSummary}** 여행 전담 AI 비서입니다. 
일정에 대해 궁금한 점이나 맛집 변경, 비 오는 날 대안, 교통 패스 사용법 등 무엇이든 편하게 물어보세요!`,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (event: FormEvent) => {
    event.preventDefault();
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    const userMsg: ChatMessage = {
      id: "user-" + Date.now(),
      role: "user",
      content: userText,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const reply = await sendTripChat({
        tripContext: trip,
        message: userText,
        chatHistory: messages.slice(-6),
      });
      const assistantMsg: ChatMessage = {
        id: "ai-" + Date.now(),
        role: "assistant",
        content: reply,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: "err-" + Date.now(),
          role: "assistant",
          content: "네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
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
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-full gap-0 p-0 sm:max-w-md"
        showCloseButton
      >
        <SheetHeader className="border-b border-slate-200 bg-slate-900 p-4 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center text-white">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <SheetTitle className="text-white">AI 현지 여행 가이드</SheetTitle>
              <SheetDescription className="text-slate-300">
                {trip.destinationName} 맞춤형 컨시어지
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 bg-slate-50">
          <div className="space-y-3.5 p-4 text-xs sm:text-sm">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}

                <div
                  className={`max-w-[82%] p-3.5 rounded-2xl leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-slate-900 text-white rounded-tr-xs"
                      : "bg-white text-slate-800 border border-slate-200 rounded-tl-xs"
                  }`}
                >
                  {msg.content}
                  <span className="block text-[10px] mt-1 text-right text-slate-400">
                    {msg.timestamp}
                  </span>
                </div>

                {msg.role === "user" && (
                  <div className="w-7 h-7 rounded-full bg-slate-700 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
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
        </ScrollArea>

        <div className="flex gap-1.5 overflow-x-auto border-t border-slate-200 bg-slate-100 p-2.5">
          {quickQuestions.map((question) => (
            <Badge
              key={question}
              variant="secondary"
              onClick={() => setInput(question)}
              className="cursor-pointer whitespace-nowrap"
            >
              {question}
            </Badge>
          ))}
        </div>

        <form
          onSubmit={(event) => {
            void handleSend(event);
          }}
          className="flex items-center gap-2 border-t border-slate-200 bg-white p-3"
        >
          <Input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="여행 일정에 대해 질문해보세요..."
            className="h-auto rounded-xl px-3.5 py-2.5 text-xs sm:text-sm"
          />
          <Button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="bg-amber-500 hover:bg-amber-600"
            size="icon"
          >
            <Send />
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
