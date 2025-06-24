import React from 'react';
import classNames from 'classnames';

interface Participant {
  userId: string;
  name: string;
  profilePhoto?: string;
}

interface Message {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
}

interface Conversation {
  id: string;
  palveluId?: number;
  tarveId?: number;
  palveluTitle?: string;
  tarveTitle?: string;
  participants: Participant[];
  messages: Message[];
  isUnread?: boolean;
}

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  onSelect: (c: Conversation) => void;
  tab: 'PALVELUT' | 'TARPEET' | 'CONTACTED';
  selectedListingId?: number | null;
  setConversations?: React.Dispatch<React.SetStateAction<Conversation[]>>;
  currentUserId: string;
  setSelectedBookingRequest?: React.Dispatch<React.SetStateAction<any | null>>;

}

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  selectedConversation,
  onSelect,
  tab,
  selectedListingId,
  setConversations,
  currentUserId,
  setSelectedBookingRequest, // ✅ new prop

}) => {
  const sortedConversations = [...conversations].sort((a, b) => {
    const aTime = new Date(a.messages?.[a.messages.length - 1]?.createdAt || 0).getTime();
    const bTime = new Date(b.messages?.[b.messages.length - 1]?.createdAt || 0).getTime();
    return bTime - aTime;
  });

  const filteredConversations = sortedConversations.filter((c) =>
    tab === 'PALVELUT'
      ? c.palveluId === selectedListingId
      : tab === 'TARPEET'
      ? c.tarveId === selectedListingId
      : true
  );

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="flex items-center justify-center text-white/60 h-full">
            Ei keskusteluja vielä
          </div>
        ) : (
          <div className="flex flex-col gap-1 px-2 py-2">
            {filteredConversations.map((c) => {
              const other = c.participants.find((p) => p.userId !== currentUserId);
              const lastMessage = c.messages?.[c.messages.length - 1];
              const isSelected = selectedConversation?.id === c.id;

              return (
                <div
                  key={c.id}
                  onClick={async () => {
                    if (c.isUnread) {
                      try {
                        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
                        await fetch(`http://localhost:5001/api/conversations/${c.id}/read`, {
                          method: 'PATCH',
                          headers: {
                            Authorization: `Bearer ${token}`,
                          },
                        });

                        setConversations?.((prev) =>
                          prev.map((conv) =>
                            conv.id === c.id ? { ...conv, isUnread: false } : conv
                          )
                        );
                      } catch (err) {
                        console.error('❌ Failed to mark conversation as read:', err);
                      }
                    }

                    const isParticipant = c.participants.some((p) => p.userId === currentUserId);
                    if (!isParticipant) {
                      console.warn('🚫 Tried to open conversation without being a participant:', c.id);
                      return;
                    }
                    
                    setSelectedBookingRequest?.(null); // ✅ clears booking view
                    onSelect(c);
                    if (window.innerWidth < 768) {
                      sessionStorage.setItem('showMobileThread', 'true');
                       sessionStorage.setItem('selectedConversationId', c.id); 
                     }

                
                  }}
                  className={classNames(
                    'flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all',
                    isSelected ? 'bg-white/10 border border-white' : 'hover:bg-white/5'
                  )}
                >
                  <img
                    src={other?.profilePhoto || '/default-avatar.png'}
                    alt={other?.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div
                      className={classNames(
                        'truncate',
                        c.isUnread ? 'text-white font-bold' : 'text-white font-semibold'
                      )}
                    >
                      {other?.name || 'Tuntematon'}
                    </div>
                    <div className="text-sm text-gray-400 truncate">
                      {c.palveluTitle || c.tarveTitle || 'Ei otsikkoa'}
                    </div>
                    <div className="text-sm text-gray-400 truncate">
                      {lastMessage?.content || 'Ei viestejä vielä'}
                    </div>
                  </div>
                  <div className="flex flex-col items-end justify-center">
                    <span className="text-xs text-gray-500">
                      {lastMessage?.createdAt
                        ? new Date(lastMessage.createdAt).toLocaleTimeString('fi-FI', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : ''}
                    </span>
                    {c.isUnread && <div className="w-2 h-2 bg-red-500 rounded-full mt-1" />}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationList;
