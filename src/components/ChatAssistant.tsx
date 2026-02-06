import React, { useEffect, useRef, useState } from "react";

interface Citation {
  text: string;
  sources: {
    content: string;
    location: string;
  }[];
}

interface SuggestedAction {
  type: string;
  label: string;
  helpText?: string;
  data: {
    productId: string;
    productName: string;
    modelNumber?: string;
    vendorId?: string;
    vendorName?: string;
    manufacturerId?: string;
    manufacturerName?: string;
    unitCost: number;
    quantity: number;
    unit: string;
    material?: string;
  };
}

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  citations?: Citation[];
  suggestedActions?: SuggestedAction[];
}

type ChatMode = "project" | "documents";

interface ChatAssistantProps {
  projectId: string;
  projectName?: string;
  onLineItemAdded?: (lineItem: any) => void;
}

export function ChatAssistant({
  projectId,
  projectName,
  onLineItemAdded,
}: ChatAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<ChatMode>("project");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [showCategorySelector, setShowCategorySelector] = useState(false);
  const [pendingAction, setPendingAction] = useState<SuggestedAction | null>(
    null,
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch categories when component mounts
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(
          `https://xrld1hq3e2.execute-api.us-east-1.amazonaws.com/prod/projects/${projectId}/categories`,
        );
        const data = await response.json();
        // API returns array directly, not wrapped in {success, categories}
        if (Array.isArray(data)) {
          setCategories(data);
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      }
    };
    fetchCategories();
  }, [projectId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      if (mode === "project") {
        // Project chat mode - send full conversation history
        const conversationHistory = [...messages, userMessage].map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));

        const response = await fetch(
          "https://xrld1hq3e2.execute-api.us-east-1.amazonaws.com/prod/ai/chat",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              projectId,
              messages: conversationHistory,
            }),
          },
        );

        const data = await response.json();

        if (data.success) {
          const aiMessage: Message = {
            role: "assistant",
            content: data.response,
            timestamp: new Date(),
            suggestedActions: data.suggestedActions || [],
          };
          setMessages((prev) => [...prev, aiMessage]);
        } else {
          throw new Error(data.error || "Failed to get response");
        }
      } else {
        // Document search mode
        const response = await fetch(
          "https://xrld1hq3e2.execute-api.us-east-1.amazonaws.com/prod/ai/docs",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              question: userMessage.content,
            }),
          },
        );

        const data = await response.json();

        if (data.success) {
          const aiMessage: Message = {
            role: "assistant",
            content: data.response,
            timestamp: new Date(),
            citations: data.citations,
          };
          setMessages((prev) => [...prev, aiMessage]);
        } else {
          throw new Error(data.error || "Failed to get response");
        }
      }
    } catch (error) {
      const errorMessage: Message = {
        role: "assistant",
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : "Unknown error"}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleAction = async (action: SuggestedAction) => {
    if (action.type === "addLineItem") {
      // Show category selector
      setPendingAction(action);
      setShowCategorySelector(true);
    }
  };

  const handleCategorySelect = async (categoryId: string) => {
    if (!pendingAction) return;

    setShowCategorySelector(false);

    try {
      const response = await fetch(
        `https://xrld1hq3e2.execute-api.us-east-1.amazonaws.com/prod/categories/${categoryId}/lineitems`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: pendingAction.data.productName,
            productId: pendingAction.data.productId,
            modelNumber: pendingAction.data.modelNumber,
            vendorId: pendingAction.data.vendorId,
            manufacturerId: pendingAction.data.manufacturerId,
            material: pendingAction.data.material,
            quantity: pendingAction.data.quantity,
            unit: pendingAction.data.unit,
            unitCost: pendingAction.data.unitCost,
            totalCost:
              pendingAction.data.unitCost * pendingAction.data.quantity,
            status: "pending",
            notes: "Added via AI assistant",
          }),
        },
      );

      const data = await response.json();

      if (data.success) {
        const categoryName =
          categories.find((c) => c.id === categoryId)?.name || "category";
        const successMessage: Message = {
          role: "assistant",
          content: `✅ Added ${pendingAction.data.productName} to ${categoryName}`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, successMessage]);

        // Notify parent to add the new line item to state
        if (onLineItemAdded && data.lineItem) {
          onLineItemAdded(data.lineItem);
        }
      } else {
        throw new Error(data.error || "Failed to add line item");
      }
    } catch (error) {
      const errorMessage: Message = {
        role: "assistant",
        content: `❌ Failed to add item: ${error instanceof Error ? error.message : "Unknown error"}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setPendingAction(null);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Chat Window */}
      {isOpen && (
        <div className="mb-4 w-[480px] bg-white rounded-lg shadow-xl border border-gray-200 flex flex-col h-[500px]">
          {/* Header */}
          <div className="bg-blue-600 text-white px-3 py-2 rounded-t-lg flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-lg">
                {mode === "project" ? "💬" : "📄"}
              </span>
              <div>
                <h3 className="font-semibold text-sm">
                  {mode === "project" ? "Project Assistant" : "Document Search"}
                </h3>
                {projectName && mode === "project" && (
                  <p className="text-xs opacity-90">{projectName}</p>
                )}
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-blue-700 rounded px-2 py-1 text-sm"
            >
              ✕
            </button>
          </div>

          {/* Mode Toggle */}
          <div className="bg-gray-100 px-3 py-2 border-b border-gray-200">
            <div className="flex gap-1 bg-white rounded-lg p-1">
              <button
                onClick={() => {
                  setMode("project");
                  setMessages([]);
                }}
                className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  mode === "project"
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                Project Chat
              </button>
              <button
                onClick={() => {
                  setMode("documents");
                  setMessages([]);
                }}
                className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  mode === "documents"
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                Documents
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <p className="text-sm">
                  {mode === "project"
                    ? "Hi! I'm your AI assistant."
                    : "Search project documents"}
                </p>
                <p className="text-xs mt-2">
                  {mode === "project"
                    ? "Ask me anything about this project!"
                    : "Ask questions about specifications or requirements."}
                </p>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] px-2 py-1.5 rounded-lg text-sm leading-snug ${
                      msg.role === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-white text-gray-800 border border-gray-200"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>

                    {/* Suggested Actions */}
                    {msg.suggestedActions &&
                      msg.suggestedActions.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-gray-200 space-y-1">
                          <p className="text-xs font-semibold text-gray-600">
                            Suggested Actions:
                          </p>
                          {msg.suggestedActions.map((action, actIdx) => (
                            <button
                              key={actIdx}
                              onClick={() => handleAction(action)}
                              className="w-full px-2 py-1.5 text-xs bg-blue-50 hover:bg-blue-100 
                                       text-blue-700 rounded border border-blue-200 
                                       transition-colors text-left flex flex-col"
                            >
                              <span className="font-medium">
                                {action.label}
                              </span>
                              {action.helpText && (
                                <span className="text-blue-600 mt-0.5">
                                  {action.helpText}
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      )}

                    {/* Citations */}
                    {msg.citations && msg.citations.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <p className="text-xs font-semibold text-gray-600 mb-1">
                          Sources:
                        </p>
                        {msg.citations.map((citation, citIdx) => (
                          <div
                            key={citIdx}
                            className="text-xs text-gray-500 mb-1"
                          >
                            {citation.sources.map((source, srcIdx) => (
                              <div key={srcIdx} className="truncate">
                                • {source.location.split("/").pop()}
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}

                    <p
                      className={`text-xs mt-1 ${
                        msg.role === "user" ? "text-blue-100" : "text-gray-400"
                      }`}
                    >
                      {msg.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-800 border border-gray-200 px-2 py-1.5 rounded-lg text-sm">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                      <span
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></span>
                      <span
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></span>
                    </div>
                    <span className="text-xs text-gray-500">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 p-3 bg-white rounded-b-lg">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  mode === "project"
                    ? "Ask about this project..."
                    : "Search documents..."
                }
                disabled={loading}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {mode === "project" ? "Send" : "Search"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Selector Modal */}
      {showCategorySelector && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl border-2 border-gray-300 p-4 w-full max-w-md">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">
              Select Category
            </h3>
            <p className="text-xs text-gray-600 mb-3">
              Where would you like to add{" "}
              <span className="font-medium">
                {pendingAction?.data.productName}
              </span>
              ?
            </p>
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategorySelect(cat.id)}
                  className="w-full text-left px-2 py-1.5 text-xs hover:bg-purple-50 rounded border border-gray-200 hover:border-purple-300 transition-colors"
                >
                  <div className="font-medium">
                    {cat.categoryName || cat.name}
                  </div>
                  <div className="text-gray-500">
                    Allowance: ${(cat.allowance || 0).toLocaleString()}
                  </div>
                </button>
              ))}
            </div>
            <div className="flex justify-end gap-2 mt-3">
              <button
                onClick={() => {
                  setShowCategorySelector(false);
                  setPendingAction(null);
                }}
                className="px-3 py-1 text-xs text-gray-700 hover:text-gray-900"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Bubble Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-blue-600 text-white w-14 h-14 rounded-full shadow-lg hover:bg-blue-700 transition-all hover:scale-110 flex items-center justify-center text-2xl"
        title="Chat with AI Assistant"
      >
        {isOpen ? "✕" : "💬"}
      </button>
    </div>
  );
}
