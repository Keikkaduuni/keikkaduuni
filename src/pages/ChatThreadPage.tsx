import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ChatThread from '../components/ChatThread';

const ChatThreadPage = () => {
  const { id } = useParams(); // conversationId
  const navigate = useNavigate();

  const [conversation, setConversation] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConversation = async () => {
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const res = await axios.get(`http://localhost:5001/api/conversations/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setConversation(res.data);
      } catch (err) {
        console.error('Failed to load conversation', err);
        setConversation(null);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchConversation();
  }, [id]);

  if (loading) {
    return (
      <div className="text-white/50 flex items-center justify-center h-full">
        Ladataan keskustelua...
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="text-white/60 text-center p-6">
        <p>Valitettavasti keskustelua ei löytynyt tai siihen ei ole oikeuksia.</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-full overflow-hidden bg-black">
      <ChatThread
        conversation={conversation}
        setConversation={setConversation}
        showBackButton={true}
        onBack={() => navigate(-1)} // ✅ Go back on mobile
      />
    </div>
  );
};

export default ChatThreadPage;
