import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';
import { 
  MessageSquare, Plus, LogOut, Send, Bot, User, 
  Sparkles, Menu, X, Trash2, Globe, AlertCircle, RefreshCw
} from 'lucide-react';

const BACKEND_URL = import.meta.env.DEV ? '' : 'https://chatgpt-bfup.onrender.com';

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
  const typingIntervalRef = useRef(null);

  // localStorage dynamic keys helpers scoped to the logged-in user
  const getChatsKey = () => `chatgpt_clone_chats_${user?.id || 'default'}`;
  const getMessagesKey = (chatId) => `chat_messages_${user?.id || 'default'}_${chatId}`;
  const getLastActiveKey = () => `last_active_chat_id_${user?.id || 'default'}`;

  // Initialize socket on mount (dependent on user)
  useEffect(() => {
    if (!user) return;

    // Connect to the socket server (port 3000)
    // withCredentials ensures cookies (JWT token) are transmitted for authentication
    const newSocket = io(BACKEND_URL || window.location.origin, {
      withCredentials: true
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

      if (payload.chat) {
        const msgId = Math.random().toString();
        const fullContent = payload.content;

        const newMsg = {
          _id: msgId,
          role: 'model',
          content: '',
          timestamp: new Date().toISOString()
        };

        // Append empty message to start the typewriter streaming
        setMessages((prev) => [...prev, newMsg]);

        // Clean up any running typing intervals
        if (typingIntervalRef.current) {
          clearInterval(typingIntervalRef.current);
        }

        const words = fullContent.split(' ');
        let currentWordIndex = 0;
        let typedText = '';

        typingIntervalRef.current = setInterval(() => {
          if (currentWordIndex < words.length) {
            typedText += (currentWordIndex === 0 ? '' : ' ') + words[currentWordIndex];
            currentWordIndex++;
            setMessages((prev) =>
              prev.map(m => m._id === msgId ? { ...m, content: typedText } : m)
            );
          } else {
            clearInterval(typingIntervalRef.current);
            typingIntervalRef.current = null;
            setIsGenerating(false); // Enable input again when typing completes
            setMessages((prev) => {
              localStorage.setItem(getMessagesKey(payload.chat), JSON.stringify(prev));
              return prev;
            });
          }
        }, 50); // 50ms per word is highly fluid and natural
      } else {
        setIsGenerating(false);
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
    };
  }, [user]);

  // Load chat list from localStorage (dependent on user)
  useEffect(() => {
    if (!user) return;

    const savedChats = localStorage.getItem(getChatsKey());
    if (savedChats) {
      const parsed = JSON.parse(savedChats);
      setChats(parsed);
      if (parsed.length > 0) {
        // Find if there's a last active chat
        const lastActiveId = localStorage.getItem(getLastActiveKey());
        const lastChat = parsed.find(c => c._id === lastActiveId) || parsed[0];
        setActiveChat(lastChat);
      } else {
        setActiveChat(null);
      }
    } else {
      setChats([]);
      setActiveChat(null);
    }
  }, [user]);

  // Update messages when active chat changes
  useEffect(() => {
    if (!user) return;

    // Clear any running typewriter animation when changing chat
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
      setIsGenerating(false);
    }

    if (activeChat) {
      localStorage.setItem(getLastActiveKey(), activeChat._id);
      const savedMessages = localStorage.getItem(getMessagesKey(activeChat._id));
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
  }, [activeChat, user]);

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

  const handleCreateChat = async (initialTitle = '') => {
    const chatNumber = chats.length + 1;
    const finalTitle = (initialTitle && initialTitle !== 'New Chat') ? initialTitle : `Chat ${chatNumber}`;
    try {
      // 1. Post request to backend /api/chat to register the chat structure
      const res = await fetch(`${BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: finalTitle }),
        credentials: 'include'
      });
      const data = await res.json();
      
      let newChatObj;
      if (res.ok && data.chat) {
        newChatObj = { ...data.chat };
        // Safeguard: If the backend title is empty, undefined, or is returned as an object/blank string
        if (!newChatObj.title || typeof newChatObj.title === 'object' || newChatObj.title === '[object Object]') {
          newChatObj.title = finalTitle;
        }
      } else {
        // Fallback in case of backend issues
        newChatObj = {
          _id: 'local_' + Date.now(),
          title: finalTitle,
          lastActivity: new Date().toISOString()
        };
      }

      // Update state
      const updatedChats = [newChatObj, ...chats];
      setChats(updatedChats);
      localStorage.setItem(getChatsKey(), JSON.stringify(updatedChats));
      setActiveChat(newChatObj);
      setMessages([]);
      
      return newChatObj;
    } catch (error) {
      console.error('Error creating chat:', error);
      // Fallback
      const fallbackChat = {
        _id: 'local_' + Date.now(),
        title: finalTitle,
        lastActivity: new Date().toISOString()
      };
      const updatedChats = [fallbackChat, ...chats];
      setChats(updatedChats);
      localStorage.setItem(getChatsKey(), JSON.stringify(updatedChats));
      setActiveChat(fallbackChat);
      setMessages([]);
      return fallbackChat;
    }
  };

  const handleDeleteChat = (chatId, e) => {
    e.stopPropagation();
    const updatedChats = chats.filter(c => c._id !== chatId);
    setChats(updatedChats);
    localStorage.setItem(getChatsKey(), JSON.stringify(updatedChats));
    localStorage.removeItem(getMessagesKey(chatId));
    
    if (activeChat?._id === chatId) {
      if (updatedChats.length > 0) {
        setActiveChat(updatedChats[0]);
      } else {
        setActiveChat(null);
        localStorage.removeItem(getLastActiveKey());
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
    } else if (messages.length === 0) {
      // If chat is empty (e.g. created via "New Chat"), rename it to the first prompt
      const generatedTitle = input.length > 25 ? input.substring(0, 25) + '...' : input;
      
      const updatedChats = chats.map(c => c._id === currentChat._id ? { ...c, title: generatedTitle } : c);
      setChats(updatedChats);
      localStorage.setItem(getChatsKey(), JSON.stringify(updatedChats));
      
      currentChat = { ...currentChat, title: generatedTitle };
      setActiveChat(currentChat);
    }

    const userMsg = {
      _id: Math.random().toString(),
      role: 'user',
      content: input,
      timestamp: new Date().toISOString()
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    localStorage.setItem(getMessagesKey(currentChat._id), JSON.stringify(updatedMessages));
    
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
          content: "I am unable to answer right now because the backend server is offline or connection is lost. Please check if your deployed server at https://chatgpt-bfup.onrender.com is running.",
          timestamp: new Date().toISOString()
        };
        const endMessages = [...updatedMessages, errorMsg];
        setMessages(endMessages);
        localStorage.setItem(getMessagesKey(currentChat._id), JSON.stringify(endMessages));
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
      localStorage.removeItem(getMessagesKey(activeChat._id));
    }
  };

  // Helper for generating initials
  const getUserInitials = () => {
    if (!user) return 'UI';
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

        <button className="new-chat-btn" onClick={() => handleCreateChat()}>
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
        {/* Floating Sidebar Toggle Button (when sidebar is closed) */}
        {!sidebarOpen && (
          <button 
            className="floating-menu-btn" 
            onClick={() => setSidebarOpen(true)}
            title="Open Sidebar"
          >
            <Menu size={20} />
          </button>
        )}

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
                    <p>The socket connection to the backend is offline. Check if your deployed server at https://chatgpt-bfup.onrender.com is running so the AI model can respond.</p>
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
              {isGenerating && messages[messages.length - 1]?.role !== 'model' && (
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
