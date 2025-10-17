// src/components/AIChatbot/AIChatWidget.jsx
import React, { useState, useEffect, useRef, useContext } from 'react';
import { MessageCircle, X, Send, Trash2, Loader2, Sparkles, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';

const AIChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  
  // Get authentication state
  const { user } = useContext(AuthContext);
  const isAuthenticated = !!user;

  // API Configuration
  const API_BASE_URL = 'https://kamcomuser.duckdns.org:30443';
  
  const getAuthToken = () => {
    return localStorage.getItem('access_token');
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      inputRef.current?.focus();
    }
  }, [isOpen, isAuthenticated]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setError(null);

    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const token = getAuthToken();
      const response = await axios.post(
        `${API_BASE_URL}/api/ai/chat/`,
        {
          message: userMessage,
          conversation_id: conversationId
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: response.data.message 
      }]);

      if (!conversationId) {
        setConversationId(response.data.conversation_id);
      }

    } catch (err) {
      console.error('AI Chat Error:', err);
      setError(err.response?.data?.error || 'Failed to get response. Please try again.');
      
      setMessages(prev => [...prev, { 
        role: 'error', 
        content: 'Sorry, I encountered an error. Please try again.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearConversation = () => {
    setMessages([]);
    setConversationId(null);
    setError(null);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleLoginClick = () => {
    setIsOpen(false);
    navigate('/login');
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full p-4 shadow-lg transform transition-all duration-300 hover:scale-110 z-50 group"
          aria-label="Open AI Chat"
        >
          <MessageCircle className="h-6 w-6" />
          <span className="absolute -top-1 -right-1 bg-green-500 h-3 w-3 rounded-full animate-pulse"></span>
          
          <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block">
            <div className="bg-gray-900 text-white text-sm rounded-lg py-2 px-3 whitespace-nowrap">
              Ask AI Assistant
              <div className="absolute top-full right-4 -mt-1">
                <div className="border-4 border-transparent border-t-gray-900"></div>
              </div>
            </div>
          </div>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 transform transition-all duration-300 animate-in">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-2xl p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 rounded-full p-2">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">AI Assistant</h3>
                <p className="text-xs text-blue-100">Powered by Gemini</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-white/20 rounded-lg p-1 transition-colors"
              aria-label="Close chat"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {/* Not Logged In State */}
            {!isAuthenticated ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <div className="bg-gradient-to-br from-blue-100 to-purple-100 w-20 h-20 rounded-full flex items-center justify-center mb-4">
                  <LogIn className="h-10 w-10 text-blue-600" />
                </div>
                <h4 className="text-xl font-semibold text-gray-900 mb-2">
                  Hello there!
                </h4>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  I'm your AI assistant, ready to help with jobs, bidding, and platform questions.
                </p>
                <p className="text-sm text-gray-500 mb-6">
                  Please log in to start chatting with me.
                </p>
                <button
                  onClick={handleLoginClick}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-6 py-3 rounded-xl flex items-center space-x-2 transform transition-all duration-200 hover:scale-105 shadow-lg"
                >
                  <LogIn className="h-5 w-5" />
                  <span>Log In to Continue</span>
                </button>
              </div>
            ) : (
              <>
                {/* Welcome Message */}
                {messages.length === 0 && (
                  <div className="text-center py-8">
                    <div className="bg-gradient-to-br from-blue-100 to-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Sparkles className="h-8 w-8 text-blue-600" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">
                      Hi {user?.username || 'there'}! How can I help you?
                    </h4>
                    <p className="text-sm text-gray-600">
                      Ask me about jobs, bidding, or anything else!
                    </p>
                  </div>
                )}

                {/* Messages */}
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                        message.role === 'user'
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                          : message.role === 'error'
                          ? 'bg-red-50 text-red-600 border border-red-200'
                          : 'bg-white text-gray-800 shadow-sm border border-gray-200'
                      }`}
                    >
                      {message.role === 'assistant' && (
                        <div className="flex items-center space-x-2 mb-1">
                          <Sparkles className="h-3 w-3 text-purple-600" />
                          <span className="text-xs font-medium text-purple-600">AI</span>
                        </div>
                      )}
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">
                        {message.content}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Loading Indicator */}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-200">
                      <div className="flex items-center space-x-2">
                        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                        <span className="text-sm text-gray-600">AI is typing...</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}
              </>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area - Only show if authenticated */}
          {isAuthenticated && (
            <div className="border-t border-gray-200 p-4 bg-white rounded-b-2xl">
              {messages.length > 0 && (
                <button
                  onClick={clearConversation}
                  className="text-xs text-gray-500 hover:text-red-600 flex items-center space-x-1 mb-2 transition-colors"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Clear conversation</span>
                </button>
              )}
              
              <div className="flex items-end space-x-2">
                <textarea
                  ref={inputRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="flex-1 resize-none border border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm max-h-32"
                  rows="1"
                  disabled={isLoading}
                />
                <button
                  onClick={sendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white rounded-xl p-2.5 transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100"
                  aria-label="Send message"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        @keyframes animate-in {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-in {
          animation: animate-in 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default AIChatWidget;