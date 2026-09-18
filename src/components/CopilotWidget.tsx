"use client";

import React, { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";

const AUTH_SUGGESTIONS = [
  { label: "Trouble Logging In?", prompt: "I am having trouble signing in. How can I resolve my login issues or reset my password?" },
  { label: "Account Pending Approval?", prompt: "My account says pending approval. Why can't I sign in yet and who approves it?" },
  { label: "Demo Login Credentials", prompt: "Can you provide the demo login credentials for testing the platform?" },
  { label: "How to Sign Up as Buyer/Seller?", prompt: "How do I register a new Buyer or Seller account on VendorBridge?" },
];

const PORTAL_SUGGESTIONS = [
  { label: "Diagnose Failed Invoices", prompt: "Diagnose any failed or mismatch invoices and explain why they did not match." },
  { label: "Check Pending Approvals", prompt: "Show all high-value pending approvals and purchase orders awaiting sign-off." },
  { label: "How does Smart Award work?", prompt: "How does the Smart Award Engine calculate the 100-point normalized scoring model?" },
  { label: "Look up RFQ Status", prompt: "Lookup current RFQs, items, and received vendor quotations." },
];

function extractMessageContent(msg: any): string {
  if (typeof msg.content === "string" && msg.content.trim().length > 0) {
    return msg.content;
  }
  if (Array.isArray(msg.parts)) {
    return msg.parts
      .map((p: any) => {
        if (p.type === "text") return p.text;
        if (p.type === "tool-call") {
          return `🔍 *Querying ERP tool:* \`${p.toolName}\`...`;
        }
        return "";
      })
      .filter(Boolean)
      .join("\n\n");
  }
  return "";
}

function RobotFaceIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2v4" />
      <circle cx="12" cy="2" r="1" fill="currentColor" />
      <rect x="4" y="6" width="16" height="13" rx="3" />
      <circle cx="9" cy="12" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="15" cy="12" r="1.5" fill="currentColor" stroke="none" />
      <path d="M9.5 15.5h5" />
      <path d="M1.5 12h2.5" />
      <path d="M20 12h2.5" />
    </svg>
  );
}

export default function CopilotWidget() {
  const pathname = usePathname();
  const isAuthPage =
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/forgot-password" ||
    pathname === "/pending-approval" ||
    Boolean(pathname?.startsWith("/admin/login")) ||
    Boolean(pathname?.startsWith("/admin/signup"));

  const suggestions = isAuthPage ? AUTH_SUGGESTIONS : PORTAL_SUGGESTIONS;

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputVal, setInputVal] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status, stop, error } = useChat({
    api: "/api/copilot/chat",
    transport: new DefaultChatTransport({
      api: "/api/copilot/chat",
      body: { pathname, isAuthPage },
    }),
  } as any);

  const isLoading = status === "submitted" || status === "streaming";

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
    }
  }, [messages, isLoading, isOpen, isMinimized]);

  const handleSend = async (text?: string) => {
    const messageText = (text || inputVal).trim();
    if (!messageText || isLoading) return;
    setInputVal("");
    try {
      if (typeof sendMessage === "function") {
        await sendMessage({ text: messageText });
      }
    } catch (err) {
      console.error("Failed to send message to Copilot:", err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Launcher Button */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            setIsMinimized(false);
          }}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-full bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 px-5 py-3.5 text-white font-semibold shadow-xl shadow-brand-500/25 hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 border border-white/20 group"
          aria-label="Open BridgeBot"
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400"></span>
          </span>
          <RobotFaceIcon className="w-5 h-5 text-amber-300 group-hover:scale-110 group-hover:-rotate-6 transition-transform" />
          <span className="text-sm font-bold tracking-wide">BridgeBot</span>
        </button>
      )}

      {/* Floating Copilot Modal */}
      {isOpen && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200/80 transition-all duration-300 overflow-hidden ${
            isMinimized
              ? "w-80 h-16"
              : "w-[440px] max-w-[calc(100vw-2rem)] h-[620px] max-h-[calc(100vh-4rem)]"
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 bg-gradient-to-r from-slate-900 via-slate-850 to-brand-950 text-white border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-500 to-indigo-500 shadow-md text-white">
                <RobotFaceIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm tracking-tight text-white">BridgeBot</span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium">
                  {isAuthPage ? "Sign-In & Onboarding Assistant" : "Enterprise ERP Assistant"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                title={isMinimized ? "Expand" : "Minimize"}
              >
                {isMinimized ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                title="Close"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Body content when expanded */}
          {!isMinimized && (
            <div className="flex-1 flex flex-col min-h-0 bg-slate-50/50">
              {/* Message List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="py-4 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 border border-brand-100 text-brand-600 mb-3 shadow-sm">
                      <RobotFaceIcon className="w-6 h-6 text-brand-600" />
                    </div>
                    {isAuthPage ? (
                      <>
                        <h4 className="text-sm font-bold text-slate-800 mb-1">Sign-In & Onboarding Assistant</h4>
                        <p className="text-xs text-slate-500 max-w-xs mx-auto mb-3 leading-relaxed">
                          Having trouble signing in or registering? I can assist with credential errors, account approval rules, and onboarding questions.
                        </p>
                        <div className="rounded-xl border border-amber-200/80 bg-amber-50/80 p-2.5 text-[11px] text-amber-900 text-left mb-4 flex items-start gap-2 shadow-2xs">
                          <span className="text-amber-600 font-bold shrink-0 mt-0.5">🔒</span>
                          <span>
                            <strong>Access Policy:</strong> Internal platform documents (RFQs, POs, Invoices) require an active authorized session. Please log in to view documents.
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <h4 className="text-sm font-bold text-slate-800 mb-1">How can I help you today?</h4>
                        <p className="text-xs text-slate-500 max-w-xs mx-auto mb-4 leading-relaxed">
                          I have live access to your RFQs, quotations, 3-way invoice matching, vendor scorecards, and spend approval queues.
                        </p>
                      </>
                    )}

                    <div className="space-y-1.5 text-left pt-1">
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">Suggested Inquiries</div>
                      {suggestions.map((s, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSend(s.prompt)}
                          className="w-full text-left rounded-xl border border-slate-200/80 bg-white p-2.5 text-xs text-slate-700 hover:bg-brand-50/60 hover:border-brand-300 hover:text-brand-700 transition shadow-2xs group flex items-center justify-between"
                        >
                          <span className="font-medium">{s.label}</span>
                          <span className="text-slate-400 group-hover:translate-x-0.5 group-hover:text-brand-600 transition-all text-xs">→</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    {messages.map((m: any, idx: number) => {
                      const isUser = m.role === "user";
                      const content = extractMessageContent(m);
                      return (
                        <div
                          key={m.id || idx}
                          className={`flex gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}
                        >
                          {!isUser && (
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-tr from-brand-600 to-indigo-600 text-white shadow-xs text-xs font-bold mt-0.5">
                              <RobotFaceIcon className="w-4 h-4 text-white" />
                            </div>
                          )}
                          <div
                            className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                              isUser
                                ? "bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-br-xs shadow-xs"
                                : "bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs shadow-xs"
                            }`}
                          >
                            <div className="whitespace-pre-wrap font-sans break-words">{content}</div>
                          </div>
                        </div>
                      );
                    })}

                    {isLoading && (
                      <div className="flex gap-2.5 justify-start">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white text-xs font-bold mt-0.5">
                          <RobotFaceIcon className="w-4 h-4 text-white" />
                        </div>
                        <div className="rounded-2xl rounded-bl-xs bg-white border border-slate-200 px-4 py-3 shadow-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-brand-600 animate-bounce"></span>
                            <span className="h-1.5 w-1.5 rounded-full bg-brand-600 animate-bounce [animation-delay:0.2s]"></span>
                            <span className="h-1.5 w-1.5 rounded-full bg-brand-600 animate-bounce [animation-delay:0.4s]"></span>
                            <span className="text-[11px] text-slate-400 ml-1.5 font-medium">Processing inquiry...</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {error && (
                      <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                        <div className="font-semibold mb-1 flex items-center gap-1.5">
                          <span>⚠️</span>
                          <span>Inquiry Notice:</span>
                        </div>
                        <p>{error.message || "The AI Copilot encountered a temporary issue. Please try your question again."}</p>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Quick suggestion chips when messages exist */}
              {messages.length > 0 && (
                <div className="px-4 py-1.5 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar bg-slate-50/80">
                  {suggestions.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(s.prompt)}
                      disabled={isLoading}
                      className="shrink-0 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:border-brand-400 hover:text-brand-600 hover:bg-brand-50/50 transition disabled:opacity-50"
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Input Footer */}
              <div className="p-3 bg-white border-t border-slate-200/80">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend();
                  }}
                  className="flex items-center gap-2"
                >
                  <textarea
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={
                      isAuthPage
                        ? "Ask about sign-in issues, demo accounts, or approval status..."
                        : "Ask about RFQs, invoices, spend limits..."
                    }
                    rows={1}
                    className="flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/10 transition"
                  />
                  {isLoading ? (
                    <button
                      type="button"
                      onClick={() => stop()}
                      className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 transition shrink-0"
                      title="Stop generating"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <rect x="6" y="6" width="12" height="12" rx="2" />
                      </svg>
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={!inputVal.trim()}
                      className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-xs hover:from-brand-700 hover:to-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition shrink-0"
                      title="Send message"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </button>
                  )}
                </form>
                <div className="flex items-center justify-between mt-1.5 px-1">
                  <span className="text-[10px] text-slate-400">Shift + Enter for new line</span>
                  <span className="text-[10px] text-brand-600 font-semibold">BridgeBot AI</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
