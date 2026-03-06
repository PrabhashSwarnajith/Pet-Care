import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import api from '../api/axiosConfig';

interface Message {
    id: number;
    role: 'user' | 'assistant';
    text: string;
    time: Date;
}

const WELCOME = `Hello! Welcome to **PetCare Chat**.

I can help you with:
- **Pet health questions** and general advice
- **Symptom guidance** — when to visit a vet
- **Medication and treatment** info for common conditions
- **Nutrition and diet** tips for dogs, cats, birds and more

*Note: This provides general guidance only. Always consult a licensed vet for medical decisions.*

**How can I help you today?**`;

const SUGGESTIONS = [
    { text: 'My dog is scratching a lot' },
    { text: 'What foods are toxic to cats?' },
    { text: 'How often should I deworm my pet?' },
    { text: 'My rabbit is not eating today' },
    { text: 'Signs of parvo in puppies' },
    { text: 'Why is my cat vomiting?' },
];

let msgId = 0;

const ChatbotPage = () => {
    const [messages, setMessages] = useState<Message[]>([
        { id: ++msgId, role: 'assistant', text: WELCOME, time: new Date() },
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const endRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

    const sendMessage = async (text: string) => {
        if (!text.trim() || loading) return;

        const userMsg: Message = { id: ++msgId, role: 'user', text, time: new Date() };
        setMessages((prev) => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        await new Promise(r => setTimeout(r, 300));

        try {
            const res = await api.post('/api/chat', { message: text });
            setMessages((prev) => [...prev, {
                id: ++msgId, role: 'assistant',
                text: res.data.reply || 'No response received.',
                time: new Date(),
            }]);
        } catch (err: any) {
            const errMsg = err?.response?.data?.error
                || 'Unable to reach the service. Please ensure the backend is running and try again.';
            setMessages((prev) => [...prev, {
                id: ++msgId, role: 'assistant',
                text: `**Connection Error**\n\n${errMsg}`,
                time: new Date(),
            }]);
        }
        setLoading(false);
        setTimeout(() => inputRef.current?.focus(), 100);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        sendMessage(input);
    };

    const fmt = (d: Date) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
        <div style={styles.root}>
            {/* Sidebar */}
            <div style={styles.sidebar}>
                <div style={styles.sidebarHeader}>
                    <div style={styles.sidebarIcon}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#a89cf5' }}>CHAT</span>
                    </div>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Vet Support Chat</div>
                        <div style={styles.onlineIndicator}>
                            <span style={styles.onlineDot} />
                            <span>Online</span>
                        </div>
                    </div>
                </div>

                <div className="divider" />

                <div style={styles.suggestLabel}>Suggested questions</div>
                {SUGGESTIONS.map((s) => (
                    <button key={s.text} style={styles.suggestion}
                        onClick={() => sendMessage(s.text)} disabled={loading}>
                        <span>{s.text}</span>
                    </button>
                ))}

                <div style={{ flex: 1 }} />

                <button style={styles.clearBtn}
                    onClick={() => {
                        setMessages([{ id: ++msgId, role: 'assistant', text: WELCOME, time: new Date() }]);
                    }}
                >
                    Clear chat
                </button>
            </div>

            {/* Chat area */}
            <div style={styles.chatArea}>
                {/* Header */}
                <div style={styles.chatHeader}>
                    <div style={styles.chatHeaderAvatar}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#a89cf5' }}>PC</span>
                    </div>
                    <div>
                        <div style={{ fontWeight: 700 }}>PetCare Support</div>
                        <div style={{ color: '#34d399', fontSize: '0.8rem' }}>Always available</div>
                    </div>
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={styles.statusTag}>Live</span>
                    </div>
                </div>

                {/* Messages */}
                <div style={styles.messages} id="chat-messages">
                    {messages.map((msg) => (
                        <div key={msg.id} style={{
                            ...styles.msgRow,
                            justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                        }}>
                            {msg.role === 'assistant' && (
                                <div style={styles.aiAvatar}>
                                    <span style={{ fontSize: '0.6rem', fontWeight: 900, color: '#a89cf5' }}>PC</span>
                                </div>
                            )}

                            <div style={{ maxWidth: '72%' }}>
                                <div style={{ ...styles.bubble, ...(msg.role === 'user' ? styles.userBubble : styles.aiBubble) }}>
                                    {msg.role === 'assistant' ? (
                                        <div style={styles.mkd}><ReactMarkdown>{msg.text}</ReactMarkdown></div>
                                    ) : msg.text}
                                </div>
                                <div style={{ ...styles.ts, textAlign: msg.role === 'user' ? 'right' : 'left' }}>
                                    {fmt(msg.time)}
                                </div>
                            </div>

                            {msg.role === 'user' && (
                                <div style={styles.userAvatar}>
                                    <span style={{ fontSize: '0.6rem', fontWeight: 900, color: '#4eb8ff' }}>U</span>
                                </div>
                            )}
                        </div>
                    ))}

                    {loading && (
                        <div style={{ ...styles.msgRow, justifyContent: 'flex-start' }}>
                            <div style={styles.aiAvatar}>
                                <span style={{ fontSize: '0.6rem', fontWeight: 900, color: '#a89cf5' }}>PC</span>
                            </div>
                            <div style={{ ...styles.bubble, ...styles.aiBubble }}>
                                <div style={styles.typing}>
                                    <span style={styles.dot} />
                                    <span style={{ ...styles.dot, animationDelay: '0.2s' }} />
                                    <span style={{ ...styles.dot, animationDelay: '0.4s' }} />
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={endRef} />
                </div>

                {/* Input */}
                <div style={styles.inputWrapper}>
                    <form onSubmit={handleSubmit} style={styles.inputArea}>
                        <input
                            ref={inputRef}
                            id="chat-input"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask about your pet's health..."
                            style={styles.chatInput}
                            disabled={loading}
                            autoFocus
                        />
                        <button id="chat-send" type="submit" disabled={loading || !input.trim()}
                            style={{ ...styles.sendBtn, ...(input.trim() && !loading ? styles.sendBtnActive : {}) }}>
                            {loading ? <span className="spinner" style={{ width: 18, height: 18 }} /> : 'Send'}
                        </button>
                    </form>
                    <div style={styles.inputHint}>Press Enter to send — always verify advice with a licensed veterinarian</div>
                </div>
            </div>

            <style>{`
        @keyframes dotBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-6px); opacity: 1; }
        }
        #chat-messages p { color: #c5c8e8; margin: 0 0 8px; }
        #chat-messages ul { padding-left: 18px; }
        #chat-messages li { color: #c5c8e8; margin-bottom: 4px; }
        #chat-messages strong { color: #f0f2ff; }
        #chat-messages blockquote { border-left: 3px solid #7c6af5; padding-left: 12px; color: #8890b8; font-style: italic; }
      `}</style>
        </div>
    );
};

const styles: Record<string, React.CSSProperties> = {
    root: { display: 'flex', height: 'calc(100vh - 64px)', overflow: 'hidden', background: 'var(--bg-primary)', margin: '-24px -32px -60px' },
    sidebar: {
        width: 260, flexShrink: 0, padding: '20px 14px',
        background: 'rgba(255,255,255,0.02)',
        borderRight: '1px solid rgba(255,255,255,0.05)',
        display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto',
    },
    sidebarHeader: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 },
    sidebarIcon: {
        width: 42, height: 42, borderRadius: 12,
        background: 'rgba(124,106,245,0.12)',
        border: '1px solid rgba(124,106,245,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    onlineIndicator: { display: 'flex', alignItems: 'center', gap: 5, color: '#34d399', fontSize: '0.78rem' },
    onlineDot: { width: 6, height: 6, borderRadius: '50%', background: '#34d399', display: 'inline-block' },
    suggestLabel: { color: '#4a5080', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0 4px', marginTop: 4 },
    suggestion: {
        display: 'flex', alignItems: 'flex-start', gap: 8,
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 10, padding: '9px 12px', color: '#c5c8e8',
        fontSize: '0.82rem', textAlign: 'left', cursor: 'pointer',
        transition: 'all 0.2s', fontFamily: 'inherit', lineHeight: 1.4,
    },
    clearBtn: {
        background: 'none', border: 'none', color: '#4a5080', fontSize: '0.82rem',
        cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
        padding: '8px 4px', borderRadius: 8, transition: 'color 0.2s',
    },
    chatArea: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 },
    chatHeader: {
        display: 'flex', alignItems: 'center', gap: 14, padding: '14px 24px',
        background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)', flexShrink: 0,
    },
    chatHeaderAvatar: {
        width: 44, height: 44, borderRadius: 14,
        background: 'rgba(124,106,245,0.12)',
        border: '1px solid rgba(124,106,245,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
    },
    statusTag: {
        background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.25)',
        borderRadius: 100, padding: '4px 12px', fontSize: '0.75rem', color: '#34d399', fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.05em',
    },
    messages: { flex: 1, overflowY: 'auto', padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 18 },
    msgRow: { display: 'flex', alignItems: 'flex-end', gap: 10 },
    aiAvatar: { width: 32, height: 32, borderRadius: 10, background: 'rgba(124,106,245,0.1)', border: '1px solid rgba(124,106,245,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    userAvatar: { width: 32, height: 32, borderRadius: '50%', background: 'rgba(78,184,255,0.1)', border: '1px solid rgba(78,184,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    bubble: { padding: '12px 16px', borderRadius: 18, fontSize: '0.92rem', lineHeight: 1.65, wordBreak: 'break-word' },
    aiBubble: { background: 'rgba(255,255,255,0.05)', borderBottomLeftRadius: 4, color: '#e0e4ff' },
    userBubble: { background: '#7c6af5', color: '#fff', borderBottomRightRadius: 4 },
    mkd: {},
    ts: { color: '#4a5080', fontSize: '0.68rem', marginTop: 5, padding: '0 4px' },
    typing: { display: 'flex', gap: 5, alignItems: 'center', height: 22 },
    dot: { width: 8, height: 8, borderRadius: '50%', background: '#7c6af5', display: 'inline-block', animation: 'dotBounce 1.2s infinite' },
    inputWrapper: { padding: '12px 24px 20px', flexShrink: 0, borderTop: '1px solid rgba(255,255,255,0.05)' },
    inputArea: { display: 'flex', gap: 10, alignItems: 'center' },
    chatInput: {
        flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)',
        borderRadius: 14, padding: '13px 18px', color: '#f0f2ff', fontSize: '0.95rem',
        outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.2s',
    },
    sendBtn: {
        padding: '0 20px', height: 46, borderRadius: 12, border: 'none',
        background: 'rgba(255,255,255,0.07)', color: '#8890b8',
        fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.2s', fontFamily: 'inherit', flexShrink: 0,
    },
    sendBtnActive: {
        background: '#7c6af5', color: '#fff', boxShadow: '0 2px 8px rgba(124,106,245,0.3)',
    },
    inputHint: { color: '#4a5080', fontSize: '0.7rem', textAlign: 'center', marginTop: 8 },
};

export default ChatbotPage;
