// ChatThread.tsx
import React, { useEffect, useRef, useState, useMemo } from 'react';
import classNames from 'classnames';
import { ImagePlus, MoreVertical } from 'lucide-react';
import ConfirmModal from './ConfirmModal';
import {
  fetchMessages as fetchMessagesAPI,
  sendMessage as sendMessageAPI,
  deleteMessage as deleteMessageAPI,
} from '../api/messages';
import { getSocket } from '../socket';
import { getTokenPayload } from '../utils/auth';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { markConversationAsRead } from '../api/conversations';
import heic2any from 'heic2any';
import { convertHeicToJpeg, isHeicFile } from '../utils/heicConverter';



interface ChatThreadProps {
  conversation: any;
  setConversation: (c: any | null) => void;
  showBackButton?: boolean;
  onBack?: () => void;
}




const formatDateHeader = (dateStr: string) => {
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? '' : date.toLocaleDateString();
};

const formatTime = (dateStr: string) => {
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? '' : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const groupMessagesByDate = (messages: any[]) => {
  return messages.reduce((acc: any, msg) => {
    const date = new Date(msg.createdAt).toLocaleDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(msg);
    return acc;
  }, {});
};
 
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return isMobile;
};


const ChatThread = ({ conversation, setConversation, showBackButton = true, onBack }: ChatThreadProps) => {


  const userId = getTokenPayload()?.id;
  const [messages, setMessages] = useState(conversation.messages || []);
  const [newMessage, setNewMessage] = useState('');
  const [files, setFiles] = useState<any[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [modalPreviewUrl, setModalPreviewUrl] = useState<string | null>(null);
  const [errorMessageIds, setErrorMessageIds] = useState<string[]>([]);
  const [typingTimer, setTypingTimer] = useState<number | null>(null);
  const [showOptions, setShowOptions] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const navigate = useNavigate();


  const menuRef = useRef(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const grouped = useMemo(() => groupMessagesByDate(messages), [messages]);
  const sortedDates = useMemo(() => Object.keys(grouped).sort(), [grouped]);

  const other = conversation.participants.find((p: any) => p.userId !== userId);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const isFetchingRef = useRef(false);
  const [lastReadTime] = useState(conversation.lastRead || null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isMobile = useIsMobile();

  console.log('🧠 ChatThread rendered → isMobile:', isMobile, 'showBackButton:', showBackButton);




  useEffect(() => {
    scrollContainerRef.current?.scrollTo({
      top: scrollContainerRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages]);

  useEffect(() => {
    const urls = files.map((file) =>
      typeof file === 'string' ? file : URL.createObjectURL(file)
    );
    setPreviewUrls(urls);
  }, [files]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() && files.length === 0) return;

    const tempId = `temp-${Date.now()}`;
    const timestamp = new Date().toISOString();

    const newMsg = {
      id: tempId,
      content: newMessage.trim(),
      imageUrls: previewUrls,
      senderId: userId,
      createdAt: timestamp,
    };

    setMessages((prev) => [...prev, newMsg]);
    setNewMessage('');
    setFiles([]);
    setPreviewUrls([]);

    const formData = new FormData();
    formData.append('content', newMsg.content);
    files.forEach((file) => {
      if (file && typeof file !== 'string') {
        formData.append('images', file);
      }
    });

    try {
      const res = await sendMessageAPI(conversation.id, formData);
      setMessages((prev) => prev.map((m) => (m.id === tempId ? res : m)));
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    } catch (err) {
      console.error('❌ Failed to send message:', err);
      setErrorMessageIds((prev) => [...prev, tempId]);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await deleteMessageAPI(conversation.id, messageId);
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
    } catch (err) {
      console.error('Failed to delete message:', err);
    }
  };

  const onScroll = async () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 50;
    setShowScrollToBottom(!isAtBottom);

    if (container.scrollTop < 80 && hasMore && !isFetchingRef.current) {
      isFetchingRef.current = true;
      try {
        const nextPage = page + 1;
        const response = await fetchMessagesAPI(conversation.id, nextPage);
        const olderMessages = Array.isArray(response) ? response : response?.messages || [];
        if (olderMessages.length === 0) {
          setHasMore(false);
        } else {
          const prevScrollHeight = container.scrollHeight;
          setMessages((prev) => [...olderMessages, ...prev]);
          setPage(nextPage);
          requestAnimationFrame(() => {
            const newScrollHeight = container.scrollHeight;
            container.scrollTop = newScrollHeight - prevScrollHeight + container.scrollTop;
          });
        }
      } catch (err) {
        console.error('Failed to fetch older messages:', err);
      } finally {
        isFetchingRef.current = false;
      }
    }
  };




  

  useEffect(() => {
    const socket = getSocket();
    socket?.on('new-message', (payload: any) => {
      if (payload.conversationId === conversation.id) {
        setMessages((prev) => [...prev, payload]);
      }
    });
    return () => {
      socket?.off('new-message');
    };
  }, [conversation.id]);

  useEffect(() => {
    const clickOutside = (e: MouseEvent) => {
      if (menuRef.current && !(menuRef.current as any).contains(e.target)) {
        setShowOptions(false);
      }
    };
    document.addEventListener('click', clickOutside);
    return () => document.removeEventListener('click', clickOutside);
  }, []);





useEffect(() => {
  inputRef.current?.focus();
}, []);


useEffect(() => {
  if (isMobile) {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }
}, [isMobile]);





 return (
  <div
  className={classNames(
    'absolute inset-0 bg-black flex flex-col',
    isMobile ? 'z-50' : 'relative flex-1'
  )}
>

    {/* 🔝 Top bar - sticky */}
      <div className="sticky top-0 z-10 p-4 border-b border-white/10 bg-black flex items-center justify-between gap-3 shrink-0">

      {isMobile && showBackButton && (
        <button
          onClick={() => {
            console.log('⬅️ Mobile back pressed');
           if (onBack) {
            console.log('⬅️ Mobile back pressed');
              sessionStorage.removeItem('showMobileThread');
              sessionStorage.removeItem('selectedConversationId');
              setConversation(null); // ✅ clears the thread
              onBack(); // triggers UI to rerender ConversationList
             }

          }}
          className="text-white px-4 py-2 text-xl"
        >
          ←
        </button>
      )}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <img
          src={other?.profilePhoto || '/default-avatar.png'}
          alt={other?.name}
          className="w-8 h-8 rounded-full border border-white/10 object-cover"
        />
        <div className="font-semibold truncate">{other?.name}</div>
      </div>
      <div className="relative pointer-events-none">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowOptions((prev) => !prev);
          }}
          className="text-white/40 hover:text-white pointer-events-auto"
        >
          <MoreVertical className="w-5 h-5" />
        </button>
        {showOptions && (
          <div
            ref={menuRef}
            className="absolute right-0 mt-2 w-48 bg-black border border-white/10 rounded-md shadow-lg z-50 pointer-events-auto"
          >
            <button
              onClick={() => {
                setShowOptions(false);
                setShowDeleteModal(true);
              }}
              className="w-full px-4 py-2 text-sm text-left text-white hover:bg-white/10"
            >
              🗑 Poista keskustelu
            </button>
            <button
              onClick={() => {
                setShowOptions(false);
                alert('Kiitos ilmoituksesta! Tiimimme tarkistaa viestin.');
              }}
              className="w-full px-4 py-2 text-sm text-left text-white hover:bg-white/10"
            >
              🚩 Ilmoita käyttäjästä
            </button>
          </div>
        )}
      </div>
    </div>

    {/* 🧠 Messages area (scrollable) */}
    <div
      ref={scrollContainerRef}
      onScroll={onScroll}
      className="flex-1 overflow-y-auto px-4 pt-20 py-2 space-y-4 scrollbar-thin scrollbar-thumb-white/20"
      style={{ overscrollBehavior: 'contain' }}
    >
      {sortedDates.map((date) => {
        let hasInsertedUnreadSeparator = false;
        return (
          <div key={date} className="space-y-2">
            <div className="text-xs text-center text-white/40">
              — {formatDateHeader(date)} —
            </div>
            {grouped[date].map((msg) => {
              const isOwn = msg.senderId === userId;
              const isFailed = errorMessageIds.includes(msg.id);
              const showUnread =
                lastReadTime &&
                !hasInsertedUnreadSeparator &&
                new Date(msg.createdAt) > new Date(lastReadTime);

              if (showUnread) hasInsertedUnreadSeparator = true;

              return (
                <React.Fragment key={msg.id}>
                  {showUnread && (
                    <div className="text-xs text-center text-yellow-400 my-2">
                      — Uudet viestit —
                    </div>
                  )}
                  <div
                    className={classNames(
                      'flex flex-col',
                      isOwn ? 'items-end' : 'items-start'
                    )}
                  >
                    <div
                      className={classNames(
                        'relative group max-w-[75%] p-3 rounded-2xl text-sm break-words',
                        isOwn
                          ? 'bg-blue-600 text-white'
                          : 'bg-white/10 text-white'
                      )}
                    >
                      {msg.content}
                      {msg.imageUrls?.map((url: string, i: number) => (
                        <img
                          key={i}
                          src={url}
                          className="mt-2 max-w-xs rounded-md border border-white/20 cursor-pointer"
                          onClick={() => window.open(url, '_blank')}
                        />
                      ))}
                      {isOwn && (
                        <button
                          onClick={() => handleDeleteMessage(msg.id)}
                          className="absolute top-1 right-1 text-white/40 hover:text-red-400 text-xs hidden group-hover:block"
                        >
                          🗑
                        </button>
                      )}
                    </div>
                    <div
                      className={classNames(
                        'text-[10px] mt-1',
                        isOwn
                          ? 'text-right pr-1 text-white/40'
                          : 'text-left pl-1 text-white/40'
                      )}
                    >
                      {formatTime(msg.createdAt)}
                    </div>
                    {isOwn && isFailed && (
                      <div className="text-[10px] text-red-400 pr-1 flex items-center gap-1">
                        Viestin lähetys epäonnistui
                        <button
                          onClick={() => {
                            setErrorMessageIds((prev) =>
                              prev.filter((id) => id !== msg.id)
                            );
                            setNewMessage(msg.content);
                            setFiles(msg.imageUrls || []);
                            handleSendMessage();
                          }}
                          className="text-blue-300 underline text-[10px]"
                        >
                          yritä uudelleen
                        </button>
                      </div>
                    )}
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>

    {/* 🔽 Scroll to bottom */}
    {showScrollToBottom && (
      <button
        onClick={() => {
          scrollContainerRef.current?.scrollTo({
            top: scrollContainerRef.current.scrollHeight,
            behavior: 'smooth',
          });
        }}
        className="fixed bottom-24 sm:bottom-20 right-4 z-50 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-md text-sm"
      >
        ⬇ Uudet viestit
      </button>
    )}

    {/* 📎 File Preview */}
    {files.length > 0 && (
      <div className="px-4 pb-3">
        <div className="text-sm text-white/70 mb-1">Esikatselu:</div>
        <div className="flex flex-wrap gap-4">
          {files.map((file, index) => (
            <div key={index} className="relative group">
              <img
                src={previewUrls[index]}
                className="w-20 h-20 object-cover rounded border border-white/20 cursor-pointer"
                onClick={() => setModalPreviewUrl(previewUrls[index])}
              />
              <button
                onClick={() =>
                  setFiles((prev) => prev.filter((_, i) => i !== index))
                }
                className="absolute -top-2 -right-2 bg-black text-white/70 rounded-full w-5 h-5 text-xs flex items-center justify-center hover:text-red-400"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>
    )}

    {/* 💬 Sticky input */}
    <div className="sticky bottom-0 z-10 p-4 flex items-center gap-2 sm:flex-nowrap bg-black shrink-0">
      <label className="cursor-pointer text-white hover:text-gray-300">
        <ImagePlus className="w-5 h-5 mt-1" />
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={async (e) => {
            const selected = Array.from(e.target.files || []);
            const processed = await Promise.all(selected.map(async (file) => {
              if (file && isHeicFile(file)) {
                console.log('🔄 ChatThread - Attempting HEIC/HEIF conversion for:', file.name);
                const result = await convertHeicToJpeg(file);
                if (result.success && result.file) {
                  console.log('✅ ChatThread - HEIC/HEIF conversion successful:', result.file.name);
                  return result.file;
                } else {
                  console.error('❌ ChatThread - HEIC/HEIF conversion failed:', result.error);
                  return null;
                }
              }
              return file;
            }));
            setFiles(prev => [...prev, ...processed.filter(Boolean)]);
          }}
        />
      </label>
      <textarea
        ref={inputRef}
        rows={1}
        className="flex-1 resize-none max-h-32 overflow-auto p-2 bg-black border border-white/20 rounded text-white focus:outline-none"
        placeholder="Kirjoita viesti..."
        value={newMessage}
        onChange={(e) => {
          setNewMessage(e.target.value);
          if (typingTimer) clearTimeout(typingTimer);
          const timeoutId = window.setTimeout(() => setTypingTimer(null), 3000);
          setTypingTimer(timeoutId);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
          }
        }}
      />
      <button
        className={classNames(
          'ml-1 p-2 rounded-full',
          newMessage.trim() || files.length
            ? 'bg-white hover:bg-gray-200 text-black'
            : 'bg-white/30 cursor-not-allowed text-black/40'
        )}
        onClick={handleSendMessage}
        disabled={!newMessage.trim() && files.length === 0}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 12h14M12 5l7 7-7 7"
          />
        </svg>
      </button>
    </div>

    {/* ❌ Confirm delete modal */}
    {showDeleteModal && (
      <ConfirmModal
        title="Poistetaanko keskustelu?"
        onCancel={() => setShowDeleteModal(false)}
        onConfirm={async () => {
          setShowDeleteModal(false);
          try {
            const token =
              localStorage.getItem('token') || sessionStorage.getItem('token');
            await fetch(
              `http://localhost:5001/api/conversations/${conversation.id}`,
              {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
              }
            );
            setConversation(null);
          } catch (err) {
            console.error('❌ Keskustelun poisto epäonnistui:', err);
            alert('Keskustelun poistaminen epäonnistui.');
          }
        }}
      />
    )}
  </div>
);



};

export default React.memo(ChatThread);
