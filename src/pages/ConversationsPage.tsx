import React, { useEffect, useState } from 'react';
import { fetchConversations } from '../api/conversations';
import Tabs from '../components/Tabs';
import ConversationList from '../components/ConversationList';
import ChatThread from '../components/ChatThread';
import OwnListingList from '../components/OwnListingList';
import BookingRequestList from '../components/BookingRequestList';
import BookingDetailsPanel from '../components/BookingDetailsPanel';
import Lahetetyt from '../components/Lahetetyt'; // ✅ Add this import
import { io } from 'socket.io-client';
import { useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom'; // ✅ BOTH imported together








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
  const [activeSubTab, setActiveSubTab] = useState<'VARAUKSET' | 'VIESTIT'>('VIESTIT');
  const [bookingRequests, setBookingRequests] = useState<any[]>([]);
  const [hasUnreadBookings, setHasUnreadBookings] = useState(false);
  const [unreadPalveluIds, setUnreadPalveluIds] = useState<number[]>([]);
    const getHasUnreadInPalvelutTab = () =>
      ownPalvelut.some((p) => p.hasUnreadBookings || unreadPalveluIds.includes(p.id));

  const [selectedBookingRequest, setSelectedBookingRequest] = useState<any | null>(null);
  const showThread = !!selectedConversation || !!selectedBookingRequest;

  const [readBookingIds, setReadBookingIds] = useState<number[]>([]);
  const [showBookingCancelled, setShowBookingCancelled] = useState(false);
  const socketRef = useRef<any>(null);
  const [showMobileThread, setShowMobileThread] = useState(false);
  const [mobileThreadKey, setMobileThreadKey] = useState(Date.now());




    const handleBack = () => {
      setSelectedConversation(null);
      setShowMobileThread(false);
      sessionStorage.removeItem('showMobileThread');
      sessionStorage.removeItem('selectedConversationId');
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
          .filter((b) => !b.isRead && b.palveluId)
          .map((b) => b.palveluId);

        setUnreadPalveluIds((prev) => [...new Set([...prev, ...unreadPalveluIds])]);

        const hasUnread = data.some((b) => !b.isRead);
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
          const res = await fetch('http://localhost:5001/api/tarpeet/omat', {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          setOwnTarpeet(
            data.map((item: any) => ({
              id: item.id,
              title: item.title,
              createdAt: item.createdAt,
              image: item.photoUrl || null,
            }))
          );
        } catch (err) {
          console.error('❌ Failed to fetch own tarpeet:', err);
        }
      }
    };

    const markBookingAsReadLocally = (bookingId: number, palveluId: number) => {
      setReadBookingIds((prev) => [...new Set([...prev, bookingId])]);

      setBookingRequests((prev) =>
        prev.map((r) => r.id === bookingId ? { ...r, isRead: true } : r)
      );

      // ✅ Remove from unreadPalveluIds
      setUnreadPalveluIds((prev) => prev.filter((id) => id !== palveluId));

      // ✅ Update local palvelut state to remove unread marker
      setOwnPalvelut((prev) =>
        prev.map((p) =>
          p.id === palveluId ? { ...p, hasUnreadBookings: false } : p
        )
      );

      // ✅ Recalculate if anything left unread
      const allRead = bookingRequests.every(
        (r) => r.id === bookingId || r.isRead || readBookingIds.includes(r.id)
      );
      if (allRead) setHasUnreadBookings(false);
    };


    
    useEffect(() => {
  if (!token) return;

  // Connect socket once
  socketRef.current = io('http://localhost:5001');

  // Listen for incoming messages
  socketRef.current.on('new-message', (message: any) => {
    setConversations((prevConversations) => {
      const updated = [...prevConversations];
      const idx = updated.findIndex((c) => c.id === message.conversationId);
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
        try {
          const data = await fetchConversations(token);
          setConversations(data);

          // ✅ PATCH: auto-select conversation from sessionStorage (MOBILE back fix)
          const selectedIdFromSession = sessionStorage.getItem('selectedConversationId');
          if (selectedIdFromSession) {
            const selected = data.find((c) => c.id === Number(selectedIdFromSession));
            if (selected) {
              setSelectedConversation(selected);
              setShowMobileThread(true);
            }
            sessionStorage.removeItem('selectedConversationId');
              sessionStorage.removeItem('showMobileThread');

          }

          if (selectedConversation) {
            const updated = data.find((c) => c.id === selectedConversation.id);
            if (updated) {
              setSelectedConversation((prev) => ({
                ...updated,
                messages: updated.messages,
              }));
            } else {
              setSelectedConversation(null);
            }
          }
        } catch (error) {
          console.error('Failed to fetch conversations:', error);
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
      setUnreadPalveluIds((prev) => prev.filter((id) => id !== selectedListingId));

      // Remove red dot from that Palvelu in list
      setOwnPalvelut((prev) =>
        prev.map((p) =>
          p.id === selectedListingId ? { ...p, hasUnreadBookings: false } : p
        )
      );

      // Check if any unread left to show tab-level red dot
      const stillUnread = ownPalvelut.some(
        (p) =>
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
    const fetchBookingRequests = async () => {
      if (!token || !selectedListingId) return;
      try {
        const res = await fetch(`http://localhost:5001/api/palvelut/${selectedListingId}/bookings`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setBookingRequests(data);
          const unreadPalveluIds = data
            .filter((b) => !b.isRead && b.palveluId)
            .map((b) => b.palveluId);

          setUnreadPalveluIds((prev) => {
            const unique = [...new Set([...prev, ...unreadPalveluIds])];
            return unique;
          });

        const hasUnread = data.some((b) => !b.isRead);
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
            const res = await fetch('http://localhost:5001/api/tarpeet/omat', {
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
            })));
          }
          // ✅ Don’t fetch anything for CONTACTED tab!
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

    const location = useLocation();
    
    

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




  const currentTabConversations = conversations
    .map((c) => {
      const lastMessage = c.messages?.[c.messages.length - 1];
      const meParticipant = c.participants?.find((p: any) => p.id === userId);
      const lastSeenAt = meParticipant?.lastSeenAt ? new Date(meParticipant.lastSeenAt) : new Date(0);
      const lastMsgDate = lastMessage ? new Date(lastMessage.createdAt) : new Date(0);
      const isUnread = lastMessage && lastMessage.senderId !== userId && lastMsgDate > lastSeenAt;
      return { ...c, isUnread };
    })
    .filter((c) => {
      if (activeTab === 'PALVELUT') return !!c.palveluId;
      if (activeTab === 'TARPEET') return !!c.tarveId;
      return !c.palveluId && !c.tarveId;
    });
    
    
    

    useEffect(() => {
      const cameFromChatThreadPage = sessionStorage.getItem('cameFromChatThreadPage') === 'true';

      if (location.pathname === '/viestit') {
        if (cameFromChatThreadPage) {
          // Just reset the flag so we don’t do this next time
          sessionStorage.removeItem('cameFromChatThreadPage');
        } else {
          setShowMobileThread(false);
          setSelectedConversation(null);
          setSelectedBookingRequest(null);
          sessionStorage.removeItem('showMobileThread');
          sessionStorage.removeItem('selectedConversationId');
        }
      }
    }, [location.pathname]);

    
    
    return (
      <div className="fixed inset-0 pt-[60px] z-10 overflow-hidden bg-black">
        <div className="max-w-6xl h-full mx-auto flex flex-col bg-white/5 border border-white/10 rounded-2xl text-white shadow-xl overflow-hidden">

          {/* Header Tabs */}
          {isMobile ? (
            !showThread && !selectedBookingRequest && (

              <>
                <div className="px-6 pt-5">
                  <h2 className="text-xl px-5 font-bold mb-3">Viestit</h2>
                  <div className="flex justify-center gap-5">
                    {[
                      { label: 'Omat Palvelut', value: 'PALVELUT' },
                      { label: 'Omat Tarpeet', value: 'TARPEET' },
                      { label: 'Lähetetyt', value: 'CONTACTED' },
                    ].map(({ label, value }) => {
                      const showRedDot = value === 'PALVELUT' && getHasUnreadInPalvelutTab();
                      return (
                        <button
                          key={value}
                          onClick={() => {
                            setActiveTab(value as any);
                            setSelectedListingId(null);
                            setSelectedConversation(null);
                            setSelectedBookingRequest(null);
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
            )
          ) : (
            <div className="p-6 border-b border-white/10 shrink-0">
              <h2 className="text-2xl font-bold mb-4">Viestit</h2>
              <Tabs
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                hasUnreadInPalvelutTab={getHasUnreadInPalvelutTab()}
              />
            </div>
          )}

          {/* Content */}
          <div className="flex flex-1 overflow-hidden divide-x divide-white/10">

            {/* CONTACTED tab always renders multi-column */}
            {activeTab === 'CONTACTED' && (
              <>
                <Lahetetyt
                  initialSubtab={
                    sessionStorage.getItem('lähetetytInitialSubtab') as
                      | 'VARAUSPYYNNÖT'
                      | 'TARJOUKSET'
                      | 'VIESTIT'
                      | null
                  }
                />
                {showBookingCancelled && (
                  <div className="fixed top-[80px] right-6 z-50">
                    <div className="bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-3 animate-fade-in">
                      <span>Varauspyyntö peruttu</span>
                      <button
                        onClick={() => setShowBookingCancelled(false)}
                        className="text-white text-lg leading-none"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* DESKTOP: Only show ChatThread */}
            {!isMobile && activeTab !== 'CONTACTED' && selectedConversation && (
                <div className="flex-1 h-full overflow-hidden">
                 <div className="flex flex-col h-full overflow-hidden">
                  <ChatThread
                    conversation={selectedConversation}
                    setConversation={setSelectedConversation}
                  />
              </div>
            </div>
           )}

            {/* DESKTOP: Only show BookingDetails */}
            {!isMobile && activeTab !== 'CONTACTED' && !selectedConversation && selectedBookingRequest && (
              <div className="w-[480px] h-full flex flex-col border-x border-white/10 overflow-hidden">
                  <div className="flex flex-col h-full overflow-hidden">
                    <BookingDetailsPanel
                      key={selectedBookingRequest?.id} // ← 🔥 This will force remount on change
                      request={selectedBookingRequest}
                      onApprove={handleApprove}
                      onReject={handleReject}
                      onBack={handleBack}
                      showBackButton={false}
                      onMarkedAsRead={(bookingId) =>
                      markBookingAsReadLocally(bookingId, selectedBookingRequest?.palveluId)
                     }
                  />

              </div>
            </div>
            )}

            {/* DESKTOP: Show listing + convo list (when nothing selected) */}
            {!isMobile && !selectedConversation && !selectedBookingRequest && activeTab !== 'CONTACTED' && (
              <>
                <div className="w-[35%] max-w-[410px] border-r border-white/10">
                  <OwnListingList
                    tab={activeTab}
                    listings={activeTab === 'PALVELUT' ? ownPalvelut : ownTarpeet}
                    selectedId={selectedListingId}
                    onSelect={(id) => {
                      setSelectedListingId(id);
                      setSelectedConversation(null);
                      setSelectedBookingRequest(null);
                    }}
                    unreadIds={unreadPalveluIds}
                  />
                </div>

                <div className="flex-1 flex flex-col">
                  {activeTab === 'PALVELUT' && selectedListingId && (
                    <div className="flex px-6 py-3 border-b border-white/10 gap-3">
                      {['VIESTIT', 'VARAUKSET'].map((tab) => (
                        <button
                          key={tab}
                          className={`relative px-3 py-1.5 text-sm rounded-md transition ${
                            activeSubTab === tab
                              ? 'bg-white text-black'
                              : 'text-white hover:bg-white/10'
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
                  )}
                  <div className="flex-1 overflow-y-auto">
                    {activeTab === 'PALVELUT' && activeSubTab === 'VARAUKSET' ? (
                      <BookingRequestList
                        requests={bookingRequests}
                        readIds={readBookingIds}
                        onSelect={(request) => {
                          setSelectedBookingRequest(request);
                          setSelectedConversation(null);
                        }}
                      />
                    ) : (
                      <ConversationList
                        conversations={currentTabConversations.filter(
                          (c) =>
                            (activeTab === 'PALVELUT' && c.palveluId === selectedListingId) ||
                            (activeTab === 'TARPEET' && c.tarveId === selectedListingId)
                        )}
                        onSelect={(c) => {
                          setSelectedConversation(c);
                          setSelectedBookingRequest(null);
                            if (isMobile) {
                                setShowMobileThread(true); // ✅ fixes back button behavior
                              }
                        }}
                        selectedConversationId={selectedConversation?.id}
                        setSelectedBookingRequest={setSelectedBookingRequest} // ✅ ← ADD THIS

                      />
                    )}
                  </div>
                </div>
              </>
            )}

            
            {isMobile && activeTab !== 'CONTACTED' && (
              <>
                {selectedConversation ? (
                  <div className="h-[calc(100vh-60px)] overflow-hidden">
                    <ChatThread
                      conversation={selectedConversation}
                      setConversation={setSelectedConversation}
                      showBackButton={true}
                      onBack={() => {
                        console.log('⬅️ Mobile back pressed');
                        setSelectedConversation(null);
                        setSelectedBookingRequest(null);
                        sessionStorage.removeItem('selectedConversationId');
                      }}
                    />
                  </div>
                ) : (
                  <div className="h-[calc(100vh-60px)] overflow-hidden">
                    <ConversationList
                      conversations={currentTabConversations.filter(
                        (c) =>
                          (activeTab === 'PALVELUT' && c.palveluId === selectedListingId) ||
                          (activeTab === 'TARPEET' && c.tarveId === selectedListingId)
                      )}
                      onSelect={(c) => {
                        setSelectedConversation(c);
                        setSelectedBookingRequest(null);
                      }}
                      selectedConversationId={selectedConversation?.id}
                      setSelectedBookingRequest={setSelectedBookingRequest}
                    />
                  </div>
                )}
              </>
            )}











            {/* MOBILE: show BookingDetails */}
            {isMobile && !!selectedBookingRequest && !selectedConversation && (
              <BookingDetailsPanel
                request={selectedBookingRequest}
                onApprove={handleApprove}
                onReject={handleReject}
                onBack={handleBack}
                showBackButton={activeTab === 'PALVELUT' && activeSubTab === 'VARAUKSET'} // ✅ fixed
                onMarkedAsRead={(bookingId) =>
                  markBookingAsReadLocally(bookingId, selectedBookingRequest?.palveluId)
                }
              />
            )}

          </div>
        </div>
      </div>
    );


    };

    export default ConversationsPage;

