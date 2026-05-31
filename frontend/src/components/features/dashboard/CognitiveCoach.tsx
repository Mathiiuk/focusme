import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Send, Bot } from 'lucide-react'
import { chatService } from '@/services/api'

interface ChatMessage {
  id: string
  role: 'user' | 'coach'
  text: string
}

export const CognitiveCoach: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'coach', text: '¡Hola! Soy tu coach cognitivo. ¿En qué te estás trabando hoy? No hay respuestas incorrectas ni juicios acá.' }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (isOpen) scrollToBottom()
  }, [messages, isOpen])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: input.trim() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsLoading(true)

    try {
      const { reply } = await chatService.sendMessage(userMsg.text)
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'coach', text: reply }])
    } catch (err) {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'coach', text: 'Uy, me distraje un segundo. ¿Podés repetir?' }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-24 right-4 md:bottom-6 md:right-6 p-4 rounded-full bg-[var(--color-accent)] text-white shadow-xl hover:scale-105 transition-transform z-40 focus:outline-none focus:ring-4 focus:ring-blue-300"
          aria-label="Hablar con el coach cognitivo"
        >
          <MessageCircle size={28} />
        </button>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-24 right-4 md:bottom-6 md:right-6 w-[360px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[80vh] bg-[var(--color-bg-primary)] rounded-2xl shadow-2xl border border-[var(--color-border)] flex flex-col z-50 overflow-hidden"
          >
            <div className="bg-[var(--color-accent)] text-white p-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-full">
                  <Bot size={20} />
                </div>
                <h3 className="font-bold text-lg">FocusFlow Coach</h3>
              </div>
              <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-2 rounded-full transition-colors" aria-label="Cerrar chat">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
              {messages.map(msg => (
                <div key={msg.id} className={`max-w-[85%] p-3 rounded-2xl ${msg.role === 'coach' ? 'bg-[var(--color-bg-muted)] border border-[var(--color-border)] self-start rounded-tl-none text-[var(--color-text-primary)]' : 'bg-[var(--color-accent)] text-white self-end rounded-tr-none'}`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                </div>
              ))}
              {isLoading && (
                <div className="bg-[var(--color-bg-muted)] border border-[var(--color-border)] self-start rounded-2xl rounded-tl-none p-4 flex gap-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} className="p-3 border-t border-[var(--color-border)] bg-[var(--color-bg-muted)] flex gap-2">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Me siento estancado con..."
                className="flex-1 px-4 py-2 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] transition-colors text-sm"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="p-2 rounded-full bg-[var(--color-accent)] text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors flex-shrink-0"
                aria-label="Enviar"
              >
                <Send size={18} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
