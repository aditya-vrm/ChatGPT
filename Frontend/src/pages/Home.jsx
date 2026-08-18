import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';
import { 
  MessageSquare, Plus, LogOut, Send, Bot, User, 
  Sparkles, Menu, X, Trash2, Globe, AlertCircle, RefreshCw
} from 'lucide-react';

const Home = () => {
  const { user, logout } = useAuth();
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [socket, setSocket] = useState(null);
  const [socketStatus, setSocketStatus] = useState('connecting'); // 'connected', 'connecting', 'disconnected'
  const [isGenerating, setIsGenerating] = useState(false);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Initialize socket on mount
  useEffect(() => {
    // Connect to the socket server (port 3000)
    // withCredentials ensures cookies (JWT token) are transmitted for authentication
    const newSocket = io('http://localhost:3000', {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      setSocketStatus('connected');
      console.log('Socket connected successfully');
    });

    newSocket.on('connect_error', (error) => {
      setSocketStatus('disconnected');
      console.error('Socket connection error:', error);
    });

    newSocket.on('disconnect', () => {
      setSocketStatus('disconnected');
    });

    // Listen for AI responses
    newSocket.on('ai-response', (payload) => {
      console.log('Received AI response:', payload);
      
      // Verify payload is for the current active chat
      setIsGenerating(false);

      if (payload.chat) {
        const newMsg = {
          _id: Math.random().toString(),
          role: 'model',
          content: payload.content,
          timestamp: new Date().toISOString()
        };

        // Append to state
        setMessages((prev) => {
          const updated = [...prev, newMsg];
          // Save messages in localStorage
          localStorage.setItem(`chat_messages_${payload.chat}`, JSON.stringify(updated));
          return updated;
        });
      }
    });

    setSocket(newSocket);

    // Load chat list from localStorage
    const savedChats = localStorage.getItem('chatgpt_clone_chats');
    if (savedChats) {
      const parsed = JSON.parse(savedChats);
      setChats(parsed);
      if (parsed.length > 0) {
        // Find if there's a last active chat
        const lastActiveId = localStorage.getItem('last_active_chat_id');
        const lastChat = parsed.find(c => c._id === lastActiveId) || parsed[0];
        setActiveChat(lastChat);
      }
    } else {
      // Seed default interactive chats on first load
      const seedChats = [
        { _id: 'seed_1', title: 'Python Web Scraper', lastActivity: new Date().toISOString() },
        { _id: 'seed_2', title: 'UI Design Suggestions', lastActivity: new Date().toISOString() },
        { _id: 'seed_3', title: 'Quantum Physics Intro', lastActivity: new Date().toISOString() }
      ];
      setChats(seedChats);
      localStorage.setItem('chatgpt_clone_chats', JSON.stringify(seedChats));
      setActiveChat(seedChats[0]);

      // Seed message logs for these chats
      localStorage.setItem('chat_messages_seed_1', JSON.stringify([
        { _id: 'm1', role: 'user', content: 'How do I write a web scraper in Python?' },
        { _id: 'm2', role: 'model', content: 'You can use BeautifulSoup or Playwright. Here is a basic example using requests and BeautifulSoup:\n\n```python\nimport requests\nfrom bs4 import BeautifulSoup\n\nurl = "https://example.com"\nr = requests.get(url)\nsoup = BeautifulSoup(r.text, "html.parser")\nprint(soup.title.text)\n```' }
      ]));
      localStorage.setItem('chat_messages_seed_2', JSON.stringify([
        { _id: 'm3', role: 'user', content: 'What colors work best for an AMOLED dark mode?' },
        { _id: 'm4', role: 'model', content: 'For AMOLED dark mode, use pure black (#000000) for the main canvas, and very dark gray (#0d0d0d or #121212) for surfaces, cards, and input fields. Accents should be high contrast like emerald green (#10a37f) or electric blue to give a premium neon look.' }
      ]));
      localStorage.setItem('chat_messages_seed_3', JSON.stringify([
        { _id: 'm5', role: 'user', content: 'Explain quantum entanglement simply.' },
        { _id: 'm6', role: 'model', content: 'Imagine you have a pair of magical shoes. If you place one shoe in London and the other in New York, the moment you look at the London shoe and see it is a "left" shoe, you instantly know the New York shoe is a "right" shoe, no matter the distance. In quantum entanglement, particles become connected so that the state of one instantly dictates the state of the other.' }
      ]));
    }

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Update messages when active chat changes
  useEffect(() => {
    if (activeChat) {
      localStorage.setItem('last_active_chat_id', activeChat._id);
      const savedMessages = localStorage.getItem(`chat_messages_${activeChat._id}`);
      if (savedMessages) {
        setMessages(JSON.parse(savedMessages));
      } else {
        setMessages([]);
      }
    } else {
      setMessages([]);
    }
    // Auto focus textarea
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [activeChat]);

  // Scroll to bottom whenever messages list updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  // Auto resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleCreateChat = async (initialTitle = 'New Chat') => {
    try {
      // 1. Post request to backend /api/chat to register the chat structure
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: initialTitle })
      });
      const data = await res.json();
      
      let newChatObj;
      if (res.ok && data.chat) {
        newChatObj = data.chat;
      } else {
        // Fallback in case of backend issues
        newChatObj = {
          _id: 'local_' + Date.now(),
          title: initialTitle,
          lastActivity: new Date().toISOString()
        };
      }

      // Update state
      const updatedChats = [newChatObj, ...chats];
      setChats(updatedChats);
      localStorage.setItem('chatgpt_clone_chats', JSON.stringify(updatedChats));
      setActiveChat(newChatObj);
      setMessages([]);
      
      return newChatObj;
    } catch (error) {
      console.error('Error creating chat:', error);
      // Fallback
      const fallbackChat = {
        _id: 'local_' + Date.now(),
        title: initialTitle,
        lastActivity: new Date().toISOString()
      };
      const updatedChats = [fallbackChat, ...chats];
      setChats(updatedChats);
      localStorage.setItem('chatgpt_clone_chats', JSON.stringify(updatedChats));
      setActiveChat(fallbackChat);
      setMessages([]);
      return fallbackChat;
    }
  };

  const handleDeleteChat = (chatId, e) => {
    e.stopPropagation();
    const updatedChats = chats.filter(c => c._id !== chatId);
    setChats(updatedChats);
    localStorage.setItem('chatgpt_clone_chats', JSON.stringify(updatedChats));
    localStorage.removeItem(`chat_messages_${chatId}`);
    
    if (activeChat?._id === chatId) {
      if (updatedChats.length > 0) {
        setActiveChat(updatedChats[0]);
      } else {
        setActiveChat(null);
        localStorage.removeItem('last_active_chat_id');
      }
    }
  };

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!input.trim()) return;

    let currentChat = activeChat;
    
    // Create new chat session if none exists
    if (!currentChat) {
      const generatedTitle = input.length > 25 ? input.substring(0, 25) + '...' : input;
      currentChat = await handleCreateChat(generatedTitle);
    }

    const userMsg = {
      _id: Math.random().toString(),
      role: 'user',
      content: input,
      timestamp: new Date().toISOString()
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    localStorage.setItem(`chat_messages_${currentChat._id}`, JSON.stringify(updatedMessages));
    
    const messageContent = input;
    setInput('');
    setIsGenerating(true);

    // Send via socket
    if (socket && socketStatus === 'connected') {
      socket.emit('ai-message', {
        chat: currentChat._id,
        content: messageContent
      });
    } else {
      // Offline fallback
      setTimeout(() => {
        setIsGenerating(false);
        const errorMsg = {
          _id: Math.random().toString(),
          role: 'model',
          content: "I am unable to answer right now because the backend server is offline or connection is lost. Please ensure the backend is running on port 3000.",
          timestamp: new Date().toISOString()
        };
        const endMessages = [...updatedMessages, errorMsg];
        setMessages(endMessages);
        localStorage.setItem(`chat_messages_${currentChat._id}`, JSON.stringify(endMessages));
      }, 1500);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChatHistory = () => {
    if (!activeChat) return;
    if (window.confirm("Are you sure you want to clear all messages in this thread?")) {
      setMessages([]);
      localStorage.removeItem(`chat_messages_${activeChat._id}`);
    }
  };


  // Helper for generating initials
  const getUserInitials = () => {
    if (!user) return 'AC';
    const first = user.fullname?.firstname?.charAt(0) || '';
    const last = user.fullname?.lastname?.charAt(0) || '';
    return (first + last).toUpperCase() || user.email.charAt(0).toUpperCase();
  };

  const getUserName = () => {
    if (!user) return 'User';
    return `${user.fullname?.firstname || ''} ${user.fullname?.lastname || ''}`.trim() || user.email;
  };

  return (
    <div className="chat-layout-wrapper">
      {/* Sidebar Overlay for Mobile */}
      <div 
        className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`}
        onClick={() => setSidebarOpen(false)}
      ></div>

      {/* Left Sidebar */}
      <aside className={`sidebar-container glass-panel ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <Sparkles size={20} className="glow-icon" />
            <span className="gradient-text logo-title">ChatGPT Clone</span>
          </div>
          <button className="sidebar-close-btn" onClick={() => setSidebarOpen(false)}>
            <X size={18} />
          </button>
        </div>

        <button className="new-chat-btn" onClick={() => handleCreateChat('New Chat')}>
          <Plus size={18} />
          <span>New Chat</span>
        </button>

        {/* Chats History List */}
        <div className="chat-threads-list">
          {chats.length === 0 ? (
            <div className="empty-threads-state">
              <MessageSquare size={28} className="empty-icon" />
              <p>No chat history yet</p>
              <span>Conversations will appear here</span>
            </div>
          ) : (
            chats.map((c) => (
              <div 
                key={c._id}
                className={`thread-item ${activeChat?._id === c._id ? 'active' : ''}`}
                onClick={() => {
                  setActiveChat(c);
                  // Auto close on mobile
                  if (window.innerWidth <= 768) setSidebarOpen(false);
                }}
              >
                <MessageSquare size={16} className="thread-icon" />
                <span className="thread-title">{c.title}</span>
                <button 
                  className="thread-delete-btn"
                  onClick={(e) => handleDeleteChat(c._id, e)}
                  title="Delete Thread"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Sidebar Footer User Info */}
        <div className="sidebar-footer">
          <div className="user-profile-widget">
            <div className="avatar-circle">{getUserInitials()}</div>
            <div className="user-details">
              <span className="user-display-name">{getUserName()}</span>
              <span className="user-email-text">{user?.email}</span>
            </div>
          </div>
          <button className="logout-btn" onClick={logout} title="Sign Out">
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* Right Chat Area */}
      <main className="main-chat-container">
        {/* Top Navbar */}
        <header className="chat-navbar">
          <div className="navbar-left">
            <button className="hamburger-btn" onClick={() => setSidebarOpen(true)}>
              <Menu size={20} />
            </button>
            <div className="active-thread-details">
              <h2 className="navbar-thread-title">
                {activeChat ? activeChat.title : "New Conversation"}
              </h2>
              {activeChat && (
                <span className="navbar-model-badge">Gemini 1.5 Pro</span>
              )}
            </div>
          </div>

          <div className="navbar-right">
            {/* Socket Status Pill */}
            <div className={`status-pill ${socketStatus}`} title={`Socket Server is ${socketStatus}`}>
              <span className="status-dot"></span>
              <span className="status-text">{socketStatus}</span>
            </div>

            {activeChat && messages.length > 0 && (
              <button 
                className="navbar-action-btn" 
                onClick={handleClearChatHistory}
                title="Clear thread history"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </header>

        {/* Chat Content Panel */}
        <div className="chat-viewport">
          {messages.length === 0 && !isGenerating ? (
            /* Dashboard Welcome Empty State */
            <div className="dashboard-welcome animate-fade-in">
              <div className="welcome-header">
                <div className="welcome-ai-icon">
                  <Bot size={44} className="welcome-bot-icon" />
                  <Sparkles size={20} className="welcome-spark-icon animate-pulse" />
                </div>
                <h1 className="gradient-text">Hello, {user?.fullname?.firstname || 'Friend'}</h1>
                <p>Welcome to ChatGPT Clone. What shall we solve today?</p>
              </div>


              {socketStatus === 'disconnected' && (
                <div className="warning-panel glass-panel">
                  <AlertCircle size={20} className="warning-icon" />
                  <div className="warning-content">
                    <h4>Server Connection Warning</h4>
                    <p>The socket connection to `localhost:3000` is offline. Check if your backend server is running so the AI model can respond.</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Active Message Feeds */
            <div className="message-history-list">
              {messages.map((m) => (
                <div 
                  key={m._id} 
                  className={`message-bubble-row ${m.role === 'user' ? 'user-row' : 'model-row'} animate-slide-up`}
                >
                  <div className="bubble-avatar">
                    {m.role === 'user' ? (
                      <div className="user-bubble-avatar">{getUserInitials()}</div>
                    ) : (
                      <div className="ai-bubble-avatar">
                        <Bot size={18} />
                      </div>
                    )}
                  </div>
                  
                  <div className="bubble-content-wrapper">
                    <div className="bubble-header-row">
                      <span className="bubble-sender-name">
                        {m.role === 'user' ? 'You' : 'ChatGPT'}
                      </span>
                    </div>
                    <div className="bubble-body-content">
                      {m.content.split('\n').map((line, idx) => (
                        <p key={idx}>{line}</p>
                      ))}
                    </div>
                  </div>
                </div>
              ))}

              {/* Typing Dot generating animation */}
              {isGenerating && (
                <div className="message-bubble-row model-row">
                  <div className="bubble-avatar">
                    <div className="ai-bubble-avatar">
                      <Bot size={18} />
                    </div>
                  </div>
                  <div className="bubble-content-wrapper">
                    <div className="bubble-header-row">
                      <span className="bubble-sender-name">ChatGPT</span>
                    </div>
                    <div className="typing-loader-pill glass-panel">
                      <span className="dot"></span>
                      <span className="dot"></span>
                      <span className="dot"></span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Bar Area */}
        <footer className="chat-footer-input-zone">
          <form className="chat-input-form-container glass-panel" onSubmit={handleSendMessage}>
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message ChatGPT..."
              className="chat-textarea"
              disabled={isGenerating}
            />
            <button 
              type="submit" 
              className="send-message-btn" 
              disabled={!input.trim() || isGenerating}
              title="Send Message"
            >
              <Send size={16} />
            </button>
          </form>
          <p className="input-disclaimer-text">
            ChatGPT Clone can make mistakes. Verify critical code, facts, and calculations.
          </p>
        </footer>
      </main>
    </div>
  );
};

export default Home;
