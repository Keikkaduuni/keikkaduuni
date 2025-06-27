// ChatThreadPage.tsx
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';

const ChatThreadPage = () => {
  const { id } = useParams();

  useEffect(() => {
    if (id) {
      sessionStorage.setItem('selectedConversationId', id);
      sessionStorage.setItem('cameFromChatThreadPage', 'true'); // ✅ ADD THIS
      window.location.replace('/viestit');
    }
  }, [id]);

  return null;
};

export default ChatThreadPage;
