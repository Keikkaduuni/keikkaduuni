import React, { useEffect, useState, useRef } from 'react';
import { fetchConversations } from '../api/conversations';
import Tabs from '../components/Tabs';
import ConversationList from '../components/ConversationList';
import ChatThread from '../components/ChatThread';
import OwnListingList from '../components/OwnListingList';
import BookingRequestList from '../components/BookingRequestList';
import BookingDetailsPanel from '../components/BookingDetailsPanel';
import Lahetetyt from '../components/Lahetetyt'; // ✅ Add this import
import { io } from 'socket.io-client';
import { useLocation, useNavigate } from 'react-router-dom'; // ✅ BOTH imported together
import LahetetytSubTabs from '../components/LahetetytSubTabs';
import SentBookingList from '../components/SentBookingList';
import SentOfferList from '../components/SentOfferList';
import OfferList from '../components/OfferList';
import OfferDetailsPanel from '../components/OfferDetailsPanel';
import { getSocket } from '../socket';
import { BACKEND_URL } from '../config';

// Add at the top if not present
type OwnListing = { id: number; title: string; image?: string; createdAt: string; conversationCount?: number; hasUnreadBookings?: boolean; pendingCount?: number; hasUnreadOffers?: boolean; };

// Add LähetetytSubtab type at the top if not present
// type LähetetytSubtab = 'VARAUSPYYNNÖT' | 'TARJOUKSET' | 'VIESTIT';

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return isMobile;
};

const ConversationsPage = () => {
  const [conversations, setConversations] = useState<any[]>([]);
   const storedTab = sessionStorage.getItem('viestitInitialTab') as 'PALVELUT' | 'TARPEET' | 'CONTACTED' | null;
   const [activeTab, setActiveTab] = useState<'PALVELUT' | 'TARPEET' | 'CONTACTED'>(storedTab || 'PALVELUT');
    useEffect(() => {
      sessionStorage.removeItem('viestitInitialTab');
    }, []);

  const [selectedConversation, setSelectedConversation] = useState<any | null>(null);
  const [selectedListingId, setSelectedListingId] = useState<number | null>(null);
  const userId = localStorage.getItem('userId');
  const isMobile = useIsMobile();
  const [ownPalvelut, setOwnPalvelut] = useState<OwnListing[]>([]);
  const [ownTarpeet, setOwnTarpeet] = useState<OwnListing[]>([]);
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const [activeSubTab, setActiveSubTab] = useState<'VARAUKSET' | 'VIESTIT' | 'TARJOUKSET'>('VIESTIT');
  const [bookingRequests, setBookingRequests] = useState<any[]>([]);
  const [hasUnreadBookings, setHasUnreadBookings] = useState(false);
  const [unreadPalveluIds, setUnreadPalveluIds] = useState<number[]>([]);
  const [offerRequests, setOfferRequests] = useState<any[]>([]);
  const [hasUnreadOffers, setHasUnreadOffers] = useState(false);
  const [unreadTarveIds, setUnreadTarveIds] = useState<number[]>([]);
    const getHasUnreadInPalvelutTab = () =>
      ownPalvelut.some((p) => p.hasUnreadBookings || unreadPalveluIds.includes(p.id));

  const getHasUnreadInTarpeetTab = () =>
    ownTarpeet.some((t) => t.hasUnreadOffers || unreadTarveIds.includes(t.id));

  const [selectedBookingRequest, setSelectedBookingRequest] = useState<any | null>(null);
  const [selectedOffer, setSelectedOffer] = useState<any | null>(null);
  const showThread = !!selectedConversation || !!selectedBookingRequest || !!selectedOffer;

  const [readBookingIds, setReadBookingIds] = useState<number[]>([]);
  const [showBookingCancelled, setShowBookingCancelled] = useState(false);
  const socketRef = useRef<any>(null);

  const [lahetetytSubtab, setLahetetytSubtab] = useState<'VARAUSPYYNNÖT' | 'TARJOUKSET' | 'VIESTIT'>('VARAUSPYYNNÖT');
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);

  const [showConversationOpenedToast, setShowConversationOpenedToast] = useState(false);
  const location = useLocation();

  const [showBookingApprovedToast, setShowBookingApprovedToast] = useState(false);

  const lastBackActionRef = useRef(false);

  // Helper to refetch booking requests
  const refetchBookingRequests = async () => {
    if (!token || !selectedListingId) return;
    try {
      const res = await fetch(`http://localhost:5001/api/palvelut/${selectedListingId}/bookings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setBookingRequests(data);
      const unreadPalveluIds = data
        .filter((b: any) => !b.isRead && b.palveluId)
        .map((b: any) => b.palveluId);
      setUnreadPalveluIds((prev: any) => [...new Set([...prev, ...unreadPalveluIds])]);
      const hasUnread = data.some((b: any) => !b.isRead);
      setHasUnreadBookings(hasUnread);
    } catch (err) {
      console.error('❌ Failed to refetch booking requests:', err);
    }
  };

  // Helper to refetch offer requests
  const refetchOfferRequests = async () => {
    if (!token || !selectedListingId) return;
    try {
      const res = await fetch(`http://localhost:5001/api/offers/tarve/${selectedListingId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setOfferRequests(data);
      const unreadTarveIds = data
        .filter((o: any) => !o.isRead && o.tarveId)
        .map((o: any) => o.tarveId);
      setUnreadTarveIds((prev: any) => [...new Set([...prev, ...unreadTarveIds])]);
      const hasUnread = data.some((o: any) => !o.isRead);
      setHasUnreadOffers(hasUnread);
    } catch (err) {
      console.error('❌ Failed to refetch offer requests:', err);
    }
  };

  const handleApprove = () => {
    setShowBookingApprovedToast(true);
    setTimeout(() => setShowBookingApprovedToast(false), 3000);
    if (isMobile) {
      setSelectedBookingRequest(null);
    } else {
      setSelectedBookingRequest((prev: typeof selectedBookingRequest) => prev ? { ...prev, status: 'approved' } : prev);
      setBookingRequests((prev: typeof bookingRequests) => prev.map((b: any) => b.id === selectedBookingRequest?.id ? { ...b, status: 'approved' } : b));
    }
    refetchBookingRequests(); // Refresh after approval
  };

  const handleReject = () => {};

  const handleApproveOffer = async () => {
    if (!selectedOffer || !token) return;
    
    try {
      const res = await fetch(`http://localhost:5001/api/offers/${selectedOffer.id}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.ok) {
        if (isMobile) {
          setSelectedOffer(null);
        } else {
          setSelectedOffer((prev: typeof selectedOffer) => prev ? { ...prev, status: 'approved' } : prev);
          setOfferRequests((prev: typeof offerRequests) => prev.map((o: any) => o.id === selectedOffer?.id ? { ...o, status: 'approved' } : o));
        }
        refetchOfferRequests(); // Refresh after approval
      } else {
        console.error('Failed to approve offer');
      }
    } catch (err) {
      console.error('Error approving offer:', err);
    }
  };

  const handleRejectOffer = async () => {
    if (!selectedOffer || !token) return;
    
    try {
      const res = await fetch(`http://localhost:5001/api/offers/${selectedOffer.id}/reject`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.ok) {
        if (isMobile) {
          setSelectedOffer(null);
        } else {
          setSelectedOffer((prev: typeof selectedOffer) => prev ? { ...prev, status: 'rejected' } : prev);
          setOfferRequests((prev: typeof offerRequests) => prev.map((o: any) => o.id === selectedOffer?.id ? { ...o, status: 'rejected' } : o));
        }
        refetchOfferRequests(); // Refresh after rejection
      } else {
        console.error('Failed to reject offer');
      }
    } catch (err) {
      console.error('Error rejecting offer:', err);
    }
  };

    const handleBack = () => {
      if (isMobile) {
        lastBackActionRef.current = true;
        if (activeTab === 'PALVELUT' && selectedListingId) {
          setSelectedConversation(null);
        } else if (activeTab === 'TARPEET' && selectedListingId) {
          setSelectedConversation(null);
        } else if (activeTab === 'CONTACTED') {
          setSelectedConversation(null);
        } else {
          setSelectedConversation(null);
          setSelectedBookingRequest(null);
          setSelectedOffer(null);
          setSelectedListingId(null);
        }
      } else {
        setSelectedConversation(null);
        setSelectedBookingRequest(null);
        setSelectedOffer(null);
      }
    };

    
    const fetchOwnPalvelut = async () => {
      if (!token) return;
      try {
        const res = await fetch('http://localhost:5001/api/palvelut/omat', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setOwnPalvelut(
          data.map((item: any) => ({
            id: item.id,
            title: item.title,
            createdAt: item.createdAt,
            image: item.photoUrl || null,
            hasUnreadBookings: !!item.hasUnreadBookings,
          }))
        );
      } catch (err) {
        console.error('❌ Failed to fetch own palvelut:', err);
      }
    };

    
    const fetchBookingRequests = async () => {
      if (!token || !selectedListingId) return;
      try {
        const res = await fetch(`http://localhost:5001/api/palvelut/${selectedListingId}/bookings`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setBookingRequests(data);

        const unreadPalveluIds = data
          .filter((b: any) => !b.isRead && b.palveluId)
          .map((b: any) => b.palveluId);

        setUnreadPalveluIds((prev: any) => [...new Set([...prev, ...unreadPalveluIds])]);

        const hasUnread = data.some((b: any) => !b.isRead);
        setHasUnreadBookings(hasUnread);
      } catch (err) {
        console.error('❌ Failed to fetch booking requests:', err);
      }
    };

    const fetchOwnListings = async () => {
      if (!token) return;

      if (activeTab === 'PALVELUT') {
        await fetchOwnPalvelut(); // ✅ reuse the existing function
      } else if (activeTab === 'TARPEET') {
        try {
          const res = await fetch(`${BACKEND_URL}/api/tarpeet/omat`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          if (!Array.isArray(data)) {
            console.error('❌ Tarpeet response was not an array:', data);
            return;
          }
          setOwnTarpeet(data.map((item: any) => ({
            id: item.id,
            title: item.title,
            createdAt: item.createdAt,
            image: item.photoUrl || null,
            pendingCount: item.pendingCount || 0,
            hasUnreadOffers: !!item.hasUnreadOffers,
          })));
        } catch (err) {
          console.error('❌ Failed to fetch own tarpeet:', err);
        }
      }
    };

    const markBookingAsReadLocally = (bookingId: number, palveluId: number) => {
      setReadBookingIds((prev: any) => [...new Set([...prev, bookingId])]);

      setBookingRequests((prev: any) =>
        prev.map((r: any) => r.id === bookingId ? { ...r, isRead: true } : r)
      );

      // ✅ Remove from unreadPalveluIds
      setUnreadPalveluIds((prev: any) => prev.filter((id: any) => id !== palveluId));

      // ✅ Update local palvelut state to remove unread marker
      setOwnPalvelut((prev: any) =>
        prev.map((p: any) =>
          p.id === palveluId ? { ...p, hasUnreadBookings: false } : p
        )
      );

      // ✅ Recalculate if anything left unread
      const allRead = bookingRequests.every(
        (r: any) => r.id === bookingId || r.isRead || readBookingIds.includes(r.id)
      );
      if (allRead) setHasUnreadBookings(false);
    };

    const markOfferAsReadLocally = (offerId: number, tarveId: number) => {
      setOfferRequests((prev) =>
        prev.map((offer) =>
          offer.id === offerId ? { ...offer, isRead: true } : offer
        )
      );
      setUnreadTarveIds((prev) => prev.filter((id) => id !== tarveId));
      
      // Call backend to mark as read
      if (token) {
        fetch(`http://localhost:5001/api/offers/${offerId}/read`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}` },
        }).catch(err => console.error('Failed to mark offer as read:', err));
      }
    };

    useEffect(() => {
  if (!token) return;

  // Connect socket once
  socketRef.current = io(BACKEND_URL);

  // Listen for incoming messages
  socketRef.current.on('new-message', (message: any) => {
    setConversations((prevConversations: any) => {
      const updated = [...prevConversations];
      const idx = updated.findIndex((c: any) => c.id === message.conversationId);
      if (idx !== -1) {
        const convo = updated[idx];
        convo.messages = [...(convo.messages || []), message];
        updated.splice(idx, 1); // remove old
        updated.unshift(convo); // add updated at top
        return updated;
      } else {
        // Optionally: refetch or ignore if not found
        return prevConversations;
      }
    });
  });

  return () => {
    socketRef.current?.disconnect();
  };
}, [token]);

    
    


    useEffect(() => {
      const clearHandler = () => {
        setSelectedConversation(null);
        setSelectedBookingRequest(null);
        setSelectedListingId(null);
      };
      window.addEventListener('clearConversationBooking', clearHandler);
      return () => {
        window.removeEventListener('clearConversationBooking', clearHandler);
      };
    }, []);




    
    useEffect(() => {
      if (!token) return;
      let intervalId: NodeJS.Timeout;

      const fetchData = async () => {
        const data = await fetchConversations(token);
        setConversations(data);

        // Auto-select conversation if coming from payment
        const selectedIdFromSession = sessionStorage.getItem('selectedConversationId');
        if (selectedIdFromSession) {
          const selected = data.find((c: any) => c.id === selectedIdFromSession);
          if (selected) {
            setSelectedConversation(selected);
          }
          sessionStorage.removeItem('selectedConversationId');
        }

        // Prevent auto-select after back
        if (lastBackActionRef.current) {
          lastBackActionRef.current = false;
          return;
        }

        if (selectedConversation) {
          const updated = data.find((c: any) => c.id === selectedConversation.id);
          if (updated) {
            setSelectedConversation((prev: any) => ({
              ...updated,
              messages: updated.messages,
            }));
          } else {
            setSelectedConversation(null);
          }
        }
      };

      fetchData();
      intervalId = setInterval(fetchData, 5000);
      return () => clearInterval(intervalId);
    }, [token, selectedConversation]);


  useEffect(() => {
    setSelectedListingId(null);
  }, [activeTab]);
    
    useEffect(() => {
      setReadBookingIds([]);
    }, [selectedListingId]);
    
    useEffect(() => {
      if (!selectedListingId || activeTab !== 'PALVELUT') return;

      // Remove this palvelu from unreadPalveluIds
      setUnreadPalveluIds((prev: any) => prev.filter((id: any) => id !== selectedListingId));

      // Remove red dot from that Palvelu in list
      setOwnPalvelut((prev: any) =>
        prev.map((p: any) =>
          p.id === selectedListingId ? { ...p, hasUnreadBookings: false } : p
        )
      );

      // Check if any unread left to show tab-level red dot
      const stillUnread = ownPalvelut.some(
        (p: any) =>
          p.id !== selectedListingId &&
          (p.hasUnreadBookings || unreadPalveluIds.includes(p.id))
      );
      setHasUnreadBookings(stillUnread);
    }, [selectedListingId, activeTab]);

    useEffect(() => {
      if (activeTab === 'CONTACTED') {
        setSelectedBookingRequest(null);
      }
    }, [activeTab]);

    useEffect(() => {
      if (isMobile && (selectedConversation || selectedBookingRequest)) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = 'auto';
      }

      return () => {
        document.body.style.overflow = 'auto';
      };
    }, [isMobile, selectedConversation, selectedBookingRequest]);

    

  useEffect(() => {
    const fetchBookingRequests = async () => {
      if (!token || !selectedListingId) return;
      try {
        const res = await fetch(`http://localhost:5001/api/palvelut/${selectedListingId}/bookings`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setBookingRequests(data);
          const unreadPalveluIds = data
            .filter((b: any) => !b.isRead && b.palveluId)
            .map((b: any) => b.palveluId);

          setUnreadPalveluIds((prev: any) => {
            const unique = [...new Set([...prev, ...unreadPalveluIds])];
            return unique;
          });

        const hasUnread = data.some((b: any) => !b.isRead);
        setHasUnreadBookings(hasUnread);
      } catch (err) {
        console.error('❌ Failed to fetch booking requests:', err);
      }
    };
    fetchBookingRequests();
  }, [selectedListingId, token]);

    useEffect(() => {
      const fetchOwnListings = async () => {
        if (!token) return;

        try {
          if (activeTab === 'PALVELUT') {
            await fetchOwnPalvelut();
          } else if (activeTab === 'TARPEET') {
            const res = await fetch(`${BACKEND_URL}/api/tarpeet/omat`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (!Array.isArray(data)) {
              console.error('❌ Tarpeet response was not an array:', data);
              return;
            }
            setOwnTarpeet(data.map((item: any) => ({
              id: item.id,
              title: item.title,
              createdAt: item.createdAt,
              image: item.photoUrl || null,
              pendingCount: item.pendingCount || 0,
              hasUnreadOffers: !!item.hasUnreadOffers,
            })));
          }
          // ✅ Don't fetch anything for CONTACTED tab!
        } catch (err) {
          console.error('❌ Failed to fetch own listings:', err);
        }
      };

      // ✅ only run for PALVELUT or TARPEET
      if (activeTab === 'PALVELUT' || activeTab === 'TARPEET') {
        fetchOwnListings();
      }
    }, [token, activeTab]);

    useEffect(() => {
      if (!token || activeTab !== 'PALVELUT') return;
        
        

      const interval = setInterval(async () => {
        try {
          const res = await fetch('http://localhost:5001/api/palvelut/omat', {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();

          const unreadIds = data
            .filter((item: any) => item.hasUnreadBookings)
            .map((item: any) => item.id);

          setUnreadPalveluIds(unreadIds);
          setHasUnreadBookings(unreadIds.length > 0);

          setOwnPalvelut(
            data.map((item: any) => ({
              id: item.id,
              title: item.title,
              createdAt: item.createdAt,
              image: item.photoUrl || null,
              hasUnreadBookings: !!item.hasUnreadBookings,
            }))
          );
        } catch (err) {
          console.error('🔁 Failed to poll unread bookings:', err);
        }
      }, 5000); // ✅ THIS was missing

      return () => clearInterval(interval); // ✅ Also important
    }, [token, activeTab]); // ✅ Entire useEffect block was incomplete

    useEffect(() => {
      if (!token || activeTab !== 'TARPEET') return;

      const interval = setInterval(async () => {
        try {
          const res = await fetch('http://localhost:5001/api/tarpeet/omat', {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();

          const unreadIds = data
            .filter((item: any) => item.hasUnreadOffers)
            .map((item: any) => item.id);

          setUnreadTarveIds(unreadIds);
          setHasUnreadOffers(unreadIds.length > 0);

          setOwnTarpeet(
            data.map((item: any) => ({
              id: item.id,
              title: item.title,
              createdAt: item.createdAt,
              image: item.photoUrl || null,
              pendingCount: item.pendingCount || 0,
              hasUnreadOffers: !!item.hasUnreadOffers,
            }))
          );
        } catch (err) {
          console.error('🔁 Failed to poll unread offers:', err);
        }
      }, 5000);

      return () => clearInterval(interval);
    }, [token, activeTab]);

    useEffect(() => {
      const { fromSubtab, toast } = location.state || {};

      if (fromSubtab) {
        setActiveTab('CONTACTED');
        sessionStorage.setItem('lähetetytInitialSubtab', fromSubtab);
      }

      const cancelled = sessionStorage.getItem('bookingCancelled');
      if (cancelled === 'true' || toast === 'bookingCancelled') {
        setShowBookingCancelled(true);
        sessionStorage.removeItem('bookingCancelled');

        setTimeout(() => {
          setShowBookingCancelled(false);
        }, 3000);
      }
    }, [location.state]);

    // Show toast and auto-select conversation after payment
    useEffect(() => {
      if (location.state?.fromPayment) {
        setShowConversationOpenedToast(true);
        setTimeout(() => setShowConversationOpenedToast(false), 3000);
        // Clear the state so it doesn't show again on reload
        window.history.replaceState({}, document.title);
      }
    }, [location.state]);

    // Helper to get all conversations for Lähetetyt > Viestit
    const allUserConversations = conversations.map((c: any) => {
      const lastMessage = c.messages?.[c.messages.length - 1];
      const meParticipant = c.participants?.find((p: any) => p.id === userId);
      const lastSeenAt = meParticipant?.lastSeenAt ? new Date(meParticipant.lastSeenAt) : new Date(0);
      const lastMsgDate = lastMessage ? new Date(lastMessage.createdAt) : new Date(0);
      const isUnread = lastMessage && lastMessage.senderId !== userId && lastMsgDate > lastSeenAt;
      return { ...c, isUnread };
    });

    const currentTabConversations = conversations
      .map((c: any) => {
        const lastMessage = c.messages?.[c.messages.length - 1];
        const meParticipant = c.participants?.find((p: any) => p.id === userId);
        const lastSeenAt = meParticipant?.lastSeenAt ? new Date(meParticipant.lastSeenAt) : new Date(0);
        const lastMsgDate = lastMessage ? new Date(lastMessage.createdAt) : new Date(0);
        const isUnread = lastMessage && lastMessage.senderId !== userId && lastMsgDate > lastSeenAt;
        return { ...c, isUnread };
      })
      .filter((c: any) => {
        if (activeTab === 'PALVELUT') return !!c.palveluId;
        if (activeTab === 'TARPEET') return !!c.tarveId;
        return !c.palveluId && !c.tarveId;
      });
    
    
    

    useEffect(() => {
      const cameFromChatThreadPage = sessionStorage.getItem('cameFromChatThreadPage') === 'true';

      if (location.pathname === '/viestit') {
        if (cameFromChatThreadPage) {
          // Just reset the flag so we don't do this next time
          sessionStorage.removeItem('cameFromChatThreadPage');
        } else {
          setSelectedConversation(null);
          setSelectedBookingRequest(null);
          sessionStorage.removeItem('selectedConversationId');
        }
      }
    }, [location.pathname]);

    
    
    const navigate = useNavigate();
    
    // When changing main tab, subtab, or listing, clear selected conversation and booking request (desktop)
    useEffect(() => {
      if (!isMobile) {
        setSelectedConversation(null);
        setSelectedBookingRequest(null);
        setSelectedOffer(null);
      }
    }, [activeTab, activeSubTab, selectedListingId, isMobile]);

    // Real-time updates for bookings and offers
    useEffect(() => {
      const socket = getSocket();
      if (!socket) return;

      // Booking updates
      socket.on('booking-updated', (booking) => {
        // Refetch booking requests and sent bookings
        refetchBookingRequests();
        // Optionally, show a toast or badge here
        setShowBookingApprovedToast(true);
        setTimeout(() => setShowBookingApprovedToast(false), 3000);
      });

      // Offer updates (future-proof, if backend emits 'offer-updated')
      socket.on('offer-updated', () => {
        // Optionally, refetch sent offers or show a badge
        setHasUnreadOffers(true);
      });

      return () => {
        socket.off('booking-updated');
        socket.off('offer-updated');
      };
    }, []);

    useEffect(() => {
      const fetchOfferRequests = async () => {
        if (!token || !selectedListingId) return;
        try {
          const res = await fetch(`http://localhost:5001/api/offers/tarve/${selectedListingId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          setOfferRequests(data);
          const unreadTarveIds = data
            .filter((o: any) => !o.isRead && o.tarveId)
            .map((o: any) => o.tarveId);
          setUnreadTarveIds((prev: any) => [...new Set([...prev, ...unreadTarveIds])]);
          const hasUnread = data.some((o: any) => !o.isRead);
          setHasUnreadOffers(hasUnread);
        } catch (err) {
          console.error('❌ Failed to fetch offer requests:', err);
        }
      };
      fetchOfferRequests();
    }, [selectedListingId, token, activeTab]);

    return (
      <div className="fixed inset-0 pt-[60px] z-10 overflow-hidden bg-black">
        <div className="max-w-6xl h-full mx-auto flex flex-col bg-white/5 border border-white/10 rounded-2xl text-white shadow-xl overflow-hidden">
          {/* Header Tabs */}
          {isMobile ? (
            <>
              <div className="px-6 pt-5">
                <h2 className="text-xl px-5 font-bold mb-3">Viestit</h2>
                <div className="flex justify-center gap-5">
                  {[
                    { label: 'Omat Palvelut', value: 'PALVELUT' },
                    { label: 'Omat Tarpeet', value: 'TARPEET' },
                    { label: 'Lähetetyt', value: 'CONTACTED' },
                  ].map(({ label, value }) => {
                    const showRedDot = 
                      (value === 'PALVELUT' && getHasUnreadInPalvelutTab()) ||
                      (value === 'TARPEET' && getHasUnreadInTarpeetTab());
                    return (
                      <button
                        key={value}
                        onClick={() => {
                          setActiveTab(value as any);
                          setSelectedListingId(null);
                          setSelectedConversation(null);
                          setSelectedBookingRequest(null);
                          setSelectedOffer(null);
                        }}
                        className={`relative px-3 py-1.5 text-sm uppercase rounded-full transition border ${
                          activeTab === value
                            ? 'bg-white text-black border-white'
                            : 'bg-transparent text-white border-white/20 hover:border-white/40'
                        }`}
                      >
                        {label}
                        {showRedDot && (
                          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="border-b border-white/10 w-full py-1.5" />
            </>
          ) : (
            <div className="p-6 border-b border-white/10 shrink-0">
              <h2 className="text-2xl font-bold mb-4">Viestit</h2>
              <Tabs
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                hasUnreadInPalvelutTab={getHasUnreadInPalvelutTab()}
                hasUnreadInTarpeetTab={getHasUnreadInTarpeetTab()}
              />
            </div>
          )}

          {/* Content */}
          <div className="flex flex-1 overflow-hidden divide-x divide-white/10">
            {/* Desktop: Left panel always visible */}
            {!isMobile && activeTab !== 'CONTACTED' && (
              <div className="w-[35%] max-w-[410px] border-r border-white/10 flex flex-col">
                {activeTab === 'PALVELUT' && selectedListingId ? (
                  <>
                    <div className="flex items-center px-6 py-3 border-b border-white/10 gap-3">
                      <button
                        className="px-4 py-1.5 text-sm rounded-md border border-white/20 text-white hover:border-white/40 transition"
                        onClick={() => {
                          setSelectedListingId(null);
                          setSelectedConversation(null);
                          setSelectedBookingRequest(null);
                          setSelectedOffer(null);
                        }}
                      >
                        ← Takaisin
                      </button>
                      <div className="flex gap-3 ml-2">
                        {['VIESTIT', 'VARAUKSET'].map((tab) => (
                          <button
                            key={tab}
                            className={`relative px-5 py-1.5 text-sm rounded-md border transition ${
                              activeSubTab === tab
                                ? 'bg-white text-black border-white'
                                : 'border-white/20 text-white hover:border-white/40 bg-transparent'
                            }`}
                            onClick={() => setActiveSubTab(tab as any)}
                          >
                            {tab}
                            {tab === 'VARAUKSET' && hasUnreadBookings && (
                              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                    {activeSubTab === 'VARAUKSET' ? (
                      <BookingRequestList
                        requests={bookingRequests.map((req) => ({
                          ...req,
                          onClick: () => setSelectedBookingRequest(req),
                        }))}
                      />
                    ) : (
                      <ConversationList
                        conversations={currentTabConversations.filter(
                          (c) => c.palveluId === selectedListingId
                        )}
                        tab={activeTab}
                        currentUserId={userId || ""}
                        selectedConversation={selectedConversation}
                        onSelect={(c) => { setSelectedConversation(c); setSelectedBookingRequest(null); setSelectedOffer(null); }}
                      />
                    )}
                  </>
                ) : activeTab === 'TARPEET' && selectedListingId ? (
                  <>
                    <div className="flex items-center px-6 py-3 border-b border-white/10 gap-3">
                      <button
                        className="px-4 py-1.5 text-sm rounded-md border border-white/20 text-white hover:border-white/40 transition"
                        onClick={() => {
                          setSelectedListingId(null);
                          setSelectedConversation(null);
                          setSelectedBookingRequest(null);
                          setSelectedOffer(null);
                        }}
                      >
                        ← Takaisin
                      </button>
                      <div className="flex gap-3 ml-2">
                        {['VIESTIT', 'TARJOUKSET'].map((tab) => (
                          <button
                            key={tab}
                            className={`relative px-5 py-1.5 text-sm rounded-md border transition ${
                              activeSubTab === tab
                                ? 'bg-white text-black border-white'
                                : 'border-white/20 text-white hover:border-white/40 bg-transparent'
                            }`}
                            onClick={() => setActiveSubTab(tab as any)}
                          >
                            {tab}
                            {tab === 'TARJOUKSET' && hasUnreadOffers && (
                              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                    {activeSubTab === 'TARJOUKSET' ? (
                      <OfferList 
                        offers={offerRequests} 
                        onSelect={(offer) => setSelectedOffer(offer)}
                      />
                    ) : (
                      <ConversationList
                        conversations={currentTabConversations.filter(
                          (c) => c.tarveId === selectedListingId
                        )}
                        tab={activeTab}
                        currentUserId={userId || ""}
                        selectedConversation={selectedConversation}
                        onSelect={(c) => { setSelectedConversation(c); setSelectedBookingRequest(null); setSelectedOffer(null); }}
                      />
                    )}
                  </>
                ) : (
                  <OwnListingList
                    listings={activeTab === 'PALVELUT' ? ownPalvelut : ownTarpeet}
                    selectedId={selectedListingId}
                    onSelect={(id) => {
                      setSelectedListingId(id);
                      setSelectedConversation(null);
                      setSelectedBookingRequest(null);
                      setSelectedOffer(null);
                    }}
                  />
                )}
              </div>
            )}

            {/* Desktop: Right panel for details */}
            {!isMobile && activeTab !== 'CONTACTED' && (
              <div className="flex-1 overflow-y-auto">
                {selectedBookingRequest && !selectedConversation && (
                  <BookingDetailsPanel
                    key={selectedBookingRequest?.id}
                    request={selectedBookingRequest}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    onBack={handleBack}
                    showBackButton={false}
                    onMarkedAsRead={(bookingId) =>
                      markBookingAsReadLocally(bookingId, selectedBookingRequest?.palveluId)
                    }
                  />
                )}
                {selectedOffer && !selectedConversation && !selectedBookingRequest && (
                  <OfferDetailsPanel
                    key={selectedOffer?.id}
                    offer={selectedOffer}
                    onApprove={handleApproveOffer}
                    onReject={handleRejectOffer}
                    onBack={handleBack}
                    showBackButton={false}
                    onMarkedAsRead={(offerId) => {
                      markOfferAsReadLocally(offerId, selectedOffer?.tarveId);
                    }}
                  />
                )}
                {selectedConversation && (
                  <ChatThread
                    conversation={selectedConversation}
                    setConversation={setSelectedConversation}
                    showBackButton={true}
                    onBack={handleBack}
                  />
                )}
              </div>
            )}

            {/* Mobile: Only show details or list, never both */}
            {isMobile && (
              <div className="flex-1 overflow-y-auto">
                {selectedBookingRequest ? (
                  <BookingDetailsPanel
                    request={selectedBookingRequest}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    onBack={handleBack}
                    showBackButton={activeTab === 'PALVELUT' && activeSubTab === 'VARAUKSET'}
                    onMarkedAsRead={(bookingId) =>
                      markBookingAsReadLocally(bookingId, selectedBookingRequest?.palveluId)
                    }
                  />
                ) : selectedOffer ? (
                  <OfferDetailsPanel
                    offer={selectedOffer}
                    onApprove={handleApproveOffer}
                    onReject={handleRejectOffer}
                    onBack={handleBack}
                    showBackButton={activeTab === 'TARPEET' && activeSubTab === 'TARJOUKSET'}
                    onMarkedAsRead={(offerId) => {
                      markOfferAsReadLocally(offerId, selectedOffer?.tarveId);
                    }}
                  />
                ) : selectedConversation ? (
                  <ChatThread
                    conversation={selectedConversation}
                    setConversation={setSelectedConversation}
                    showBackButton={true}
                    onBack={handleBack}
                  />
                ) : (
                  <>
                    {/* Mobile: Show subtabs and list */}
                    {activeTab === 'PALVELUT' && selectedListingId ? (
                      <>
                        <div className="flex items-center px-6 py-3 border-b border-white/10 gap-3">
                          <button
                            className="px-4 py-1.5 text-sm rounded-md border border-white/20 text-white hover:border-white/40 transition"
                            onClick={() => {
                              setSelectedListingId(null);
                              setSelectedConversation(null);
                              setSelectedBookingRequest(null);
                              setSelectedOffer(null);
                            }}
                          >
                            ← Takaisin
                          </button>
                          <div className="flex gap-3 ml-2">
                            {['VIESTIT', 'VARAUKSET'].map((tab) => (
                              <button
                                key={tab}
                                className={`relative px-5 py-1.5 text-sm rounded-md border transition ${
                                  activeSubTab === tab
                                    ? 'bg-white text-black border-white'
                                    : 'border-white/20 text-white hover:border-white/40 bg-transparent'
                                }`}
                                onClick={() => setActiveSubTab(tab as any)}
                              >
                                {tab}
                                {tab === 'VARAUKSET' && hasUnreadBookings && (
                                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full" />
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                        {activeSubTab === 'VARAUKSET' ? (
                          <BookingRequestList
                            requests={bookingRequests.map((req) => ({
                              ...req,
                              onClick: () => setSelectedBookingRequest(req),
                            }))}
                          />
                        ) : (
                          <ConversationList
                            conversations={currentTabConversations.filter(
                              (c) => c.palveluId === selectedListingId
                            )}
                            tab={activeTab}
                            currentUserId={userId || ""}
                            selectedConversation={selectedConversation}
                            onSelect={(c) => { setSelectedConversation(c); setSelectedBookingRequest(null); setSelectedOffer(null); }}
                          />
                        )}
                      </>
                    ) : activeTab === 'TARPEET' && selectedListingId ? (
                      <>
                        <div className="flex items-center px-6 py-3 border-b border-white/10 gap-3">
                          <button
                            className="px-4 py-1.5 text-sm rounded-md border border-white/20 text-white hover:border-white/40 transition"
                            onClick={() => {
                              setSelectedListingId(null);
                              setSelectedConversation(null);
                              setSelectedBookingRequest(null);
                              setSelectedOffer(null);
                            }}
                          >
                            ← Takaisin
                          </button>
                          <div className="flex gap-3 ml-2">
                            {['VIESTIT', 'TARJOUKSET'].map((tab) => (
                              <button
                                key={tab}
                                className={`relative px-5 py-1.5 text-sm rounded-md border transition ${
                                  activeSubTab === tab
                                    ? 'bg-white text-black border-white'
                                    : 'border-white/20 text-white hover:border-white/40 bg-transparent'
                                }`}
                                onClick={() => setActiveSubTab(tab as any)}
                              >
                                {tab}
                                {tab === 'TARJOUKSET' && hasUnreadOffers && (
                                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full" />
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                        {activeSubTab === 'TARJOUKSET' ? (
                          <OfferList 
                            offers={offerRequests} 
                            onSelect={(offer) => setSelectedOffer(offer)}
                          />
                        ) : (
                          <ConversationList
                            conversations={currentTabConversations.filter(
                              (c) => c.tarveId === selectedListingId
                            )}
                            tab={activeTab}
                            currentUserId={userId || ""}
                            selectedConversation={selectedConversation}
                            onSelect={(c) => { setSelectedConversation(c); setSelectedBookingRequest(null); setSelectedOffer(null); }}
                          />
                        )}
                      </>
                    ) : (
                      <OwnListingList
                        listings={activeTab === 'PALVELUT' ? ownPalvelut : ownTarpeet}
                        selectedId={selectedListingId}
                        onSelect={(id) => {
                          setSelectedListingId(id);
                          setSelectedConversation(null);
                          setSelectedBookingRequest(null);
                          setSelectedOffer(null);
                        }}
                      />
                    )}
                  </>
                )}
              </div>
            )}

            {/* CONTACTED tab always renders multi-column */}
            {activeTab === 'CONTACTED' && (
              <>
                {/* Desktop layout: two columns */}
                {!isMobile ? (
                  <>
                    {/* Left panel: tabs, subtabs, and list */}
                    <div className="w-[35%] max-w-[410px] border-r border-white/10 flex flex-col">
                      <div className="px-6 pt-3">
                        <LahetetytSubTabs
                          active={lahetetytSubtab}
                          setActive={setLahetetytSubtab}
                          hasUnreadBookings={hasUnreadBookings}
                          hasUnreadOffers={hasUnreadOffers}
                          hasUnreadMessages={hasUnreadMessages}
                        />
                      </div>
                      <div className="flex-1 overflow-y-auto">
                        {lahetetytSubtab === 'VARAUSPYYNNÖT' && (
                          <SentBookingList onSelect={(booking) => {
                            navigate(`/palvelut/${booking.palveluId}`, { state: { returnTo: 'VARAUSPYYNNÖT' } });
                          }} />
                        )}
                        {lahetetytSubtab === 'TARJOUKSET' && (
                          <SentOfferList selectedId={null} onSelect={() => {}} />
                        )}
                        {lahetetytSubtab === 'VIESTIT' && (
                          <ConversationList
                            conversations={allUserConversations}
                            selectedConversation={selectedConversation}
                            onSelect={(c) => { setSelectedConversation(c); setSelectedBookingRequest(null); setSelectedOffer(null); }}
                            tab="CONTACTED"
                            selectedListingId={null}
                            setConversations={setConversations}
                            currentUserId={userId || ''}
                          />
                        )}
                      </div>
                    </div>
                    {/* Right panel: details only when selected */}
                    <div className="flex-1 overflow-y-auto">
                      {selectedBookingRequest && !selectedConversation && (
                        <BookingDetailsPanel
                          key={selectedBookingRequest?.id}
                          request={selectedBookingRequest}
                          onApprove={handleApprove}
                          onReject={handleReject}
                          onBack={handleBack}
                          showBackButton={false}
                          onMarkedAsRead={(bookingId) =>
                            markBookingAsReadLocally(bookingId, selectedBookingRequest?.palveluId)
                          }
                        />
                      )}
                      {selectedOffer && !selectedConversation && !selectedBookingRequest && (
                        <OfferDetailsPanel
                          key={selectedOffer?.id}
                          offer={selectedOffer}
                          onApprove={handleApproveOffer}
                          onReject={handleRejectOffer}
                          onBack={handleBack}
                          showBackButton={false}
                          onMarkedAsRead={(offerId) => {
                            markOfferAsReadLocally(offerId, selectedOffer?.tarveId);
                          }}
                        />
                      )}
                      {selectedConversation && (
                        <ChatThread
                          conversation={selectedConversation}
                          setConversation={setSelectedConversation}
                        />
                      )}
                    </div>
                  </>
                ) : (
                  /* Mobile: keep as single column */
                  <div className="px-6 pt-3">
                    <LahetetytSubTabs
                      active={lahetetytSubtab}
                      setActive={setLahetetytSubtab}
                      hasUnreadBookings={hasUnreadBookings}
                      hasUnreadOffers={hasUnreadOffers}
                      hasUnreadMessages={hasUnreadMessages}
                    />
                    <div className="flex-1 overflow-y-auto">
                      {lahetetytSubtab === 'VARAUSPYYNNÖT' && (
                        <SentBookingList onSelect={(booking) => {
                          navigate(`/palvelut/${booking.palveluId}`, { state: { returnTo: 'VARAUSPYYNNÖT' } });
                        }} />
                      )}
                      {lahetetytSubtab === 'TARJOUKSET' && (
                        <SentOfferList selectedId={null} onSelect={() => {}} />
                      )}
                      {lahetetytSubtab === 'VIESTIT' && (
                        <ConversationList
                          conversations={allUserConversations}
                          selectedConversation={selectedConversation}
                          onSelect={(c) => { setSelectedConversation(c); setSelectedBookingRequest(null); setSelectedOffer(null); }}
                          tab="CONTACTED"
                          selectedListingId={null}
                          setConversations={setConversations}
                          currentUserId={userId || ''}
                        />
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        {/* Toast for conversation opened after payment */}
        {showConversationOpenedToast && (
          <div
            className={
              'fixed z-50 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg animate-slide-in ' +
              (isMobile ? 'left-1/2 -translate-x-1/2 bottom-4 w-[90vw] max-w-sm' : 'top-6 right-6')
            }
          >
            Keskustelu avattu! Voit nyt keskustella palveluntarjoajan kanssa.
            <button
              onClick={() => setShowConversationOpenedToast(false)}
              className="text-white text-lg leading-none ml-4"
            >
              ×
            </button>
          </div>
        )}
        {/* Toast for booking approved */}
        {showBookingApprovedToast && (
          <div
            className={
              'fixed z-50 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg animate-slide-in ' +
              (isMobile ? 'left-1/2 -translate-x-1/2 bottom-4 w-[90vw] max-w-sm' : 'top-6 right-6')
            }
          >
            Varauspyyntö hyväksytty!
            <button
              onClick={() => setShowBookingApprovedToast(false)}
              className="text-white text-lg leading-none ml-4"
            >
              ×
            </button>
          </div>
        )}
        {/* Toast for booking cancelled */}
        {showBookingCancelled && (
          <div
            className={
              'fixed z-50 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg animate-slide-in ' +
              (isMobile ? 'left-1/2 -translate-x-1/2 bottom-4 w-[90vw] max-w-sm' : 'top-6 right-6')
            }
          >
            Varauspyyntö peruttu
            <button
              onClick={() => setShowBookingCancelled(false)}
              className="text-white text-lg leading-none ml-4"
            >
              ×
            </button>
          </div>
        )}
      </div>
    );


    };

    export default ConversationsPage;

