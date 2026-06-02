import React, { useState, useRef, useEffect } from "react";
import { Sparkles, X, ChevronDown, CheckCircle, Info } from "lucide-react";

export const AiAssistantWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ id: string; text: string; sender: "user" | "ai" }[]>([
    { id: "1", text: "Yo! I'm Ziggy, your chill offGrid mascot & smart assistant. I calculate your responses by querying Arrise's leave policy documents using a Retrieval-Augmented Generation (RAG) model. I can answer policy questions or help you plan travel.", sender: "ai" },
    { id: "2", text: "Note: I will only answer questions related to your leave policy and company travel. If you ask out-of-domain questions (like cooking recipes), I will politely decline.", sender: "ai" }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const toggleOpen = () => setIsOpen(!isOpen);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { id: Date.now().toString(), text: userMessage, sender: "user" }]);
    setInput("");
    setIsTyping(true);

    try {
      const response = await fetch("/api/policy-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      });
      const data = await response.json();
      
      let aiText = data.text;
      if (data.error) aiText = data.error;

      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), text: aiText, sender: "ai" }]);
    } catch (err) {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), text: "Network error fetching AI response.", sender: "ai" }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      <div className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${isOpen ? "opacity-0 pointer-events-none scale-90" : "opacity-100 scale-100"}`}>
        <button
          onClick={toggleOpen}
          className="w-14 h-14 bg-white border border-[#eae7e7] text-[#1c1b1b] rounded-full shadow-lg flex items-center justify-center hover:bg-stone-50 hover:scale-105 transition-all group"
        >
          <div className="relative">
             <svg width="36" height="36" viewBox="0 0 100 100" fill="none" className="hover:rotate-12 transition-transform duration-300">
               {/* Head squircle with cozy earth color fill */}
               <rect x="22" y="28" width="56" height="52" rx="18" fill="#fcfaf8" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
               
               {/* OffGrid green leaf sprout on top */}
               <path d="M50 28 C50 16 58 12 62 14 C62 20 54 26 50 28Z" fill="#00b05c" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
               <path d="M50 28 C50 20 44 16 40 18 C40 24 46 27 50 28Z" fill="#00b05c" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
               <path d="M50 28 V20" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />

               {/* Cool sunglasses */}
               <rect x="30" y="44" width="16" height="12" rx="6" fill="#1c1b1b" stroke="currentColor" strokeWidth="3" />
               <rect x="54" y="44" width="16" height="12" rx="6" fill="#1c1b1b" stroke="currentColor" strokeWidth="3" />
               <path d="M46 48 H54" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" />
               
               {/* Sparkles on sunglasses */}
               <line x1="33" y1="47" x2="37" y2="47" stroke="white" strokeWidth="2" strokeLinecap="round" />
               <line x1="57" y1="47" x2="61" y2="47" stroke="white" strokeWidth="2" strokeLinecap="round" />

               {/* Easygoing wise smile */}
               <path d="M43 62 Q50 71 57 62" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
               
               {/* Blush cheeks */}
               <ellipse cx="28" cy="58" rx="3.5" ry="2" fill="#ffdcc5" opacity="0.8" />
               <ellipse cx="72" cy="58" rx="3.5" ry="2" fill="#ffdcc5" opacity="0.8" />
             </svg>
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 border border-white rounded-full"></div>
          </div>
        </button>
      </div>

      <div className={`fixed bottom-6 right-6 z-50 w-80 md:w-96 h-[500px] max-h-[80vh] bg-white rounded-2xl shadow-2xl flex flex-col border border-[#eae7e7] overflow-hidden transition-all duration-300 origin-bottom-right ${isOpen ? "opacity-100 scale-100" : "opacity-0 pointer-events-none scale-90"}`}>
        <div className="bg-[#f6f3f2] p-4 border-b border-[#eae7e7] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white border border-[#eae7e7] flex items-center justify-center text-[#1c1b1b] shrink-0">
              <svg width="22" height="22" viewBox="0 0 100 100" fill="none">
                 <rect x="22" y="28" width="56" height="52" rx="18" fill="#fcfaf8" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
                 
                 <path d="M50 28 C50 16 58 12 62 14 C62 20 54 26 50 28Z" fill="#00b05c" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                 <path d="M50 28 C50 20 44 16 40 18 C40 24 46 27 50 28Z" fill="#00b05c" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                 <path d="M50 28 V20" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />

                 <rect x="30" y="44" width="16" height="12" rx="6" fill="#1c1b1b" stroke="currentColor" strokeWidth="3" />
                 <rect x="54" y="44" width="16" height="12" rx="6" fill="#1c1b1b" stroke="currentColor" strokeWidth="3" />
                 <path d="M46 48 H54" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" />
                 
                 <line x1="33" y1="47" x2="37" y2="47" stroke="white" strokeWidth="2" strokeLinecap="round" />
                 <line x1="57" y1="47" x2="61" y2="47" stroke="WHITE" strokeWidth="2" strokeLinecap="round" />

                 <path d="M43 62 Q50 71 57 62" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                 
                 <ellipse cx="28" cy="58" rx="3.5" ry="2" fill="#ffdcc5" opacity="0.8" />
                 <ellipse cx="72" cy="58" rx="3.5" ry="2" fill="#ffdcc5" opacity="0.8" />
               </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1c1b1b]">Ziggy (offGrid Mascot)</h3>
              <p className="text-[11px] text-[#564337] flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block"></span> Always Active</p>
            </div>
          </div>
          <button onClick={toggleOpen} className="p-1.5 hover:bg-[#eae7e7] rounded-md transition-colors text-[#564337]">
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>
        
        {/* Helper info note about AI constraints */}
        <div className="p-2 border-b border-[#eae7e7] bg-yellow-50/50">
           <div className="flex items-start gap-2 text-xs text-[#944a00]">
             <Info className="w-4 h-4 shrink-0 mt-0.5" />
             <p><strong>System Logic:</strong> I use retrieval-augmented grounding limits. I am strictly forbidden from answering off-topic queries outside offGrid's HR policy scope.</p>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${msg.sender === "user" ? "bg-[#944a00] text-white rounded-br-none" : "bg-[#f6f3f2] text-[#1c1b1b] border border-[#eae7e7] rounded-bl-none"}`}>
                <p className="whitespace-pre-wrap">{msg.text}</p>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
               <div className="bg-[#f6f3f2] border border-[#eae7e7] rounded-2xl rounded-bl-none px-4 py-3 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-[#944a00] rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-[#944a00] rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                  <span className="w-1.5 h-1.5 bg-[#944a00] rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
               </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-3 bg-white border-t border-[#eae7e7] shrink-0">
          <form onSubmit={handleSend} className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about leave or travel..."
              className="w-full bg-[#f6f3f2] border border-[#eae7e7] rounded-full pl-4 pr-10 py-3 text-sm focus:outline-none focus:border-[#944a00] transition-colors"
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="absolute right-2 top-1.5 w-8 h-8 flex items-center justify-center bg-[#944a00] text-white rounded-full hover:bg-[#e67e22] disabled:opacity-50 transition-colors"
            >
              <Sparkles className="w-3 h-3" />
            </button>
          </form>
        </div>
      </div>
    </>
  );
};
