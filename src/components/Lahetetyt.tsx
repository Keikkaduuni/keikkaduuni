import React, { useState, useEffect } from 'react';
import LahetetytSubTabs from './LahetetytSubTabs';
import SentBookingList from './SentBookingList';
import SentOfferList from './SentOfferList';
import ConversationList from './ConversationList';
import ChatThreadPage from '../pages/ChatThreadPage';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import ChatThread from './ChatThread'; // ✅ or adjust path if needed


type LähetetytSubtab = 'VARAUSPYYNNÖT' | 'TARJOUKSET' | 'VIESTIT';

interface Booking {
  id: number;
  palveluId: number;
  palveluTitle: string;
  date: string;
  createdAt: string;
  hours: number;
  status: 'pending' | 'approved' | 'rejected';
  unit: 'hour' | 'urakka';
}

interface Conversation {
  id: string;
  participants: any[];
  palveluId?: number;
  tarveId?: number;
  palveluTitle?: string;
  tarveTitle?: string;
  messages: any[];
  isUnread?: boolean;
}

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return isMobile;
};

const Lahetetyt: React.FC = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const sessionInitialSubtab = sessionStorage.getItem('lähetetytInitialSubtab') as LähetetytSubtab | null;
  const [subtab, setSubtab] = useState<LähetetytSubtab>(sessionInitialSubtab || 'VARAUSPYYNNÖT');

  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);

  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const decodedToken: any = token ? jwtDecode(token) : null;

  useEffect(() => {
    const fetchConversations = async () => {
      if (!token) return;

      try {
        const res = await fetch('http://localhost:5001/api/conversations?mode=sent', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setConversations(data);
      } catch (err) {
        console.error('Failed to fetch conversations:', err);
      }
    };

    if (subtab === 'VIESTIT') {
      fetchConversations();
    }
  }, [subtab]);

  useEffect(() => {
    sessionStorage.removeItem('lähetetytInitialSubtab');
  }, []);

  useEffect(() => {
    setSelectedBooking(null);
    setSelectedConversationId(null);
    setSelectedConversation(null);
  }, [subtab]);

  const handleSelect = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setSelectedConversationId(conversation.id);
  };

  return (
    <div className="flex flex-1 h-full">
      {/* LEFT PANEL */}
      {(!isMobile || (!selectedBooking && !selectedConversationId)) && (
        <div className="w-[410px] border-r border-white/10 flex flex-col">
          <LahetetytSubTabs
            active={subtab}
            setActive={setSubtab}
            hasUnreadBookings={true}
            hasUnreadOffers={true}
            hasUnreadMessages={true}
          />

          {subtab === 'VARAUSPYYNNÖT' && (
            <SentBookingList
              onSelect={(booking) => {
                navigate(`/palvelut/${booking.palveluId}`, {
                  state: { returnTo: 'VARAUSPYYNNÖT' },
                });
              }}
            />
          )}

          {subtab === 'TARJOUKSET' && (
            <SentOfferList selectedId={null} onSelect={() => {}} />
          )}

          {subtab === 'VIESTIT' && (
            <ConversationList
              conversations={conversations}
              selectedConversation={selectedConversation}
              onSelect={handleSelect}
              tab="CONTACTED"
              selectedListingId={null}
              setConversations={setConversations}
              currentUserId={decodedToken?.id || ''}
            />
          )}
        </div>
      )}

      {/* RIGHT PANEL */}
      {(!isMobile || selectedBooking || selectedConversationId) && (
        <div className="flex-1 overflow-y-auto">
          {isMobile && (selectedBooking || selectedConversationId) && (
            <div className="bg-white/2 px-4 py-3 border-b border-white/10">
              <button
                onClick={() => {
                  setSelectedBooking(null);
                  setSelectedConversationId(null);
                  setSelectedConversation(null);
                }}
                className="text-white text-md px-4 py-2"
              >
                ← Takaisin
              </button>
            </div>
          )}

          {!selectedBooking && !selectedConversationId && (
            <div className="text-white/40 flex items-center justify-center h-full">
              Valitse keskustelu tai varauspyyntö vasemmalta
            </div>
          )}

          {selectedBooking && subtab === 'TARJOUKSET' && (
            <div className="p-6 text-white">[ Offer details here later ]</div>
          )}

          {selectedConversationId && subtab === 'VIESTIT' && (
  <ChatThread
    conversation={conversations.find(c => c.id === selectedConversationId)}
    setConversation={(updated) =>
      setConversations((prev) =>
        prev.map((c) => (c.id === updated?.id ? updated : c))
      )
    }
  />
)}

        </div>
      )}
    </div>
  );
};

export default Lahetetyt;
