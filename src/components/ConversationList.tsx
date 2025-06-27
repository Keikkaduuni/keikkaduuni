import React from 'react';
import classNames from 'classnames';
import { motion, AnimatePresence } from 'framer-motion';

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
  paymentCompleted?: boolean;
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
          <div className="flex flex-col items-center justify-center h-full text-white/40 text-sm pt-20">
            <span>Ei keskusteluja vielä</span>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {filteredConversations.map((c) => {
              const other = c.participants.find((p) => p.userId !== currentUserId);
              const isPalvelu = !!c.palveluId;
              const isTarve = !!c.tarveId;
              return (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.25 }}
                  onClick={() => onSelect(c)}
                  className={classNames(
                    'flex items-center gap-4 p-4 rounded-xl cursor-pointer mb-2 shadow-sm',
                    selectedConversation?.id === c.id ? 'bg-white/10 ring-2 ring-white/40' : 'bg-white/5 hover:bg-white/10',
                    'touch-manipulation'
                  )}
                >
                  {/* Other user's profile photo */}
                  {other?.profilePhoto && (
                    <img src={other.profilePhoto} alt={other.name} className="w-10 h-10 rounded-full object-cover border border-white/20" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-anton text-white text-base truncate">
                      {isPalvelu && c.palveluTitle ? `Palvelu: ${c.palveluTitle}` : isTarve && c.tarveTitle ? `Tarve: ${c.tarveTitle}` : 'Keskustelu'}
                    </div>
                    <div className="text-xs text-white/60 truncate">{other?.name || 'Tuntematon'}</div>
                  </div>
                  <AnimatePresence>
                    {c.isUnread && (
                      <motion.span
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="w-2.5 h-2.5 bg-red-500 rounded-full ml-2"
                      />
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default ConversationList;
