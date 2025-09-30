// recruitment-ai-system/frontend/src/pages/Messages.js

import React, { useState, useEffect, useRef } from 'react';
import { messageAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import io from 'socket.io-client';

const Messages = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  
  // Initialize socket connection
  useEffect(() => {
    if (user) {
      socketRef.current = io('http://localhost:5000', {
        query: { userId: user.id }
      });
      
      // Listen for new messages
      socketRef.current.on('new_message', (data) => {
        console.log('📨 New message received:', data);
        
        // Add message to current conversation if it matches
        if (selectedConversation && data.conversationId === selectedConversation.id) {
          setMessages(prev => [...prev, data.message]);
          // Mark as read immediately since user is viewing
          messageAPI.markAsRead(data.conversationId).catch(console.error);
        }
        
        // Update conversation list
        loadConversations();
      });
      
      // Listen for message sent confirmation
      socketRef.current.on('message_sent', (data) => {
        console.log('✅ Message sent confirmed:', data);
      });
      
      return () => {
        if (socketRef.current) {
          socketRef.current.disconnect();
        }
      };
    }
  }, [user, selectedConversation]);
  
  // Load conversations
  const loadConversations = async () => {
    try {
      const response = await messageAPI.getConversations();
      setConversations(response.data.conversations);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  };
  
  // Load messages for selected conversation
  const loadMessages = async (conversationId) => {
    try {
      const response = await messageAPI.getMessages(conversationId);
      setMessages(response.data.messages);
      
      // Mark as read
      await messageAPI.markAsRead(conversationId);
      
      // Update conversation unread count
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, unreadCount: 0 }
            : conv
        )
      );
      
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };
  
  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !selectedConversation || sending) return;
    
    setSending(true);
    
    try {
      const messageData = {
        conversationId: selectedConversation.id,
        content: {
          text: newMessage,
          messageType: 'text'
        }
      };
      
      const response = await messageAPI.sendMessage(messageData);
      
      // Add message to UI immediately
      setMessages(prev => [...prev, response.data.message]);
      setNewMessage('');
      
      // Update conversation in list
      setConversations(prev => 
        prev.map(conv => 
          conv.id === selectedConversation.id
            ? {
                ...conv,
                lastMessage: {
                  content: newMessage,
                  sender: user.id,
                  timestamp: new Date()
                }
              }
            : conv
        )
      );
      
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };
  
  // Select conversation
  const selectConversation = (conversation) => {
    setSelectedConversation(conversation);
    loadMessages(conversation.id);
  };
  
  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Load initial data
  useEffect(() => {
    if (user) {
      loadConversations().finally(() => setLoading(false));
    }
  }, [user]);
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading messages...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden" style={{ height: '600px' }}>
          <div className="flex h-full">
            
            {/* Conversations Sidebar */}
            <div className="w-1/3 border-r border-gray-200 flex flex-col">
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-xl font-semibold text-gray-800">💬 Messages</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
                </p>
              </div>
              
              <div className="flex-1 overflow-y-auto">
                {conversations.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    <div className="text-4xl mb-4">💬</div>
                    <p>No conversations yet</p>
                    <p className="text-sm mt-2">Start applying to jobs to connect with recruiters</p>
                  </div>
                ) : (
                  conversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      className={`p-4 border-b border-gray-100 cursor-pointer transition-colors ${
                        selectedConversation?.id === conversation.id
                          ? 'bg-blue-50 border-l-4 border-l-blue-600'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => selectConversation(conversation)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center">
                            <h3 className="font-medium text-gray-900 truncate">
                              {conversation.otherUser.name}
                            </h3>
                            <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                              conversation.otherUser.role === 'recruiter'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {conversation.otherUser.role}
                            </span>
                          </div>
                          
                          {conversation.context?.jobId && (
                            <p className="text-xs text-gray-500 mt-1">
                              📋 {conversation.context.jobId.title}
                            </p>
                          )}
                          
                          {conversation.lastMessage && (
                            <p className="text-sm text-gray-600 mt-2 truncate">
                              {conversation.lastMessage.content}
                            </p>
                          )}
                          
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(conversation.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                        
                        {conversation.unreadCount > 0 && (
                          <div className="bg-red-600 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center ml-2">
                            {conversation.unreadCount}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
              {selectedConversation ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center">
                      <h3 className="font-semibold text-gray-900">
                        {selectedConversation.otherUser.name}
                      </h3>
                      <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                        selectedConversation.otherUser.role === 'recruiter'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {selectedConversation.otherUser.role}
                      </span>
                    </div>
                    
                    {selectedConversation.context?.jobId && (
                      <p className="text-sm text-gray-600 mt-1">
                        📋 Regarding: {selectedConversation.context.jobId.title}
                      </p>
                    )}
                  </div>
                  
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message._id}
                        className={`flex ${
                          message.sender._id === user.id ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.sender._id === user.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-900'
                        }`}>
                          <p className="text-sm">{message.content.text}</p>
                          <div className="flex items-center justify-between mt-1">
                            <p className={`text-xs ${
                              message.sender._id === user.id ? 'text-blue-100' : 'text-gray-500'
                            }`}>
                              {new Date(message.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                            
                            {message.sender._id === user.id && (
                              <div className="flex space-x-1 ml-2">
                                {message.status.sent && (
                                  <span className="text-blue-100">✓</span>
                                )}
                                {message.status.delivered && (
                                  <span className="text-blue-100">✓</span>
                                )}
                                {message.status.read && (
                                  <span className="text-blue-100">✓✓</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                  
                  {/* Message Input */}
                  <div className="p-4 border-t border-gray-200 bg-gray-50">
                    <form onSubmit={handleSendMessage} className="flex space-x-4">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={sending}
                      />
                      <button
                        type="submit"
                        disabled={!newMessage.trim() || sending}
                        className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                          !newMessage.trim() || sending
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {sending ? '⏳' : '📤 Send'}
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-center text-gray-500">
                  <div>
                    <div className="text-6xl mb-4">💬</div>
                    <h3 className="text-xl font-medium mb-2">Select a conversation</h3>
                    <p>Choose a conversation from the sidebar to start chatting</p>
                  </div>
                </div>
              )}
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;