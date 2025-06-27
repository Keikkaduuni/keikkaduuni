import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ConfirmPaymentModal from '../components/ConfirmPaymentModal';
import { motion, AnimatePresence } from 'framer-motion';
import { getSocket } from '../socket';

interface Booking {
  id: number;
  palveluId: number;
  palveluTitle: string;
  date: string;
  createdAt: string;
  hours: number;
  status: 'pending' | 'approved' | 'rejected';
  unit: 'hour' | 'urakka';
  paymentCompleted?: boolean;
  price?: number;
}

interface SentBookingListProps {
  selectedId?: number;
  onSelect?: (booking: Booking) => void;
}

const SentBookingList: React.FC<SentBookingListProps> = ({ selectedId, onSelect }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const { getToken } = useAuth();
  const navigate = useNavigate();

  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleBookingDeleted = (deletedBookingId: number) => {
      setBookings(prev => prev.filter(booking => booking.id !== deletedBookingId));
    };

    socket.on('booking-deleted', handleBookingDeleted);

    return () => {
      socket.off('booking-deleted', handleBookingDeleted);
    };
  }, []);

  useEffect(() => {
    const fetchBookings = async () => {
      setError(null);
      const token = getToken();
      if (!token) return;
      try {
        const res = await fetch('/api/bookings/sent', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setBookings(data);
      } catch (err) {
        setError('Lähetettyjen varausten haku epäonnistui');
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [getToken]);

  const handleConfirmPay = async () => {
    if (!selectedBooking) return;
    setPaying(true);
    try {
      const token = getToken();
      const res = await axios.post(
        `/api/payments/booking/${selectedBooking.id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setBookings((prev) => prev.filter((b) => b.id !== selectedBooking.id));
      showToast('✅ Maksu onnistui!');
      sessionStorage.setItem('selectedConversationId', res.data.conversationId);
      setTimeout(() => {
        navigate('/viestit', { state: { fromPayment: true } });
      }, 1500);
    } catch (err: any) {
      console.error('❌ Payment failed:', err);

      if (err?.response?.status === 409) {
        // Booking was already paid
        showToast('Tämä varaus on jo maksettu.');
        const conversationId = err?.response?.data?.conversationId;
        if (conversationId) {
          setTimeout(() => {
            navigate(`/viestit/${conversationId}`);
          }, 1500);
        }
      } else {
        showToast('❌ Maksu epäonnistui. Yritä uudelleen.');
      }
    } finally {
      setShowPaymentModal(false);
      setPaying(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!selectedBooking) return;
    try {
      const token = getToken();
      await axios.delete(`/api/bookings/${selectedBooking.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBookings((prev) => prev.filter((b) => b.id !== selectedBooking.id));
    } catch (err) {
      console.error('❌ Peruutus epäonnistui:', err);
      showToast('❌ Peruutus epäonnistui. Yritä uudelleen.');
    } finally {
      setShowCancelModal(false);
    }
  };

  if (error) {
    return (
      <div className="fixed z-50 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg animate-slide-in left-1/2 -translate-x-1/2 bottom-4 w-[90vw] max-w-sm">
        {error}
      </div>
    );
  }

  if (loading) return (
    <div className="flex flex-col gap-4 px-4 py-10 items-center">
      <div className="spinner mb-4" />
      <div className="w-full max-w-md flex flex-col gap-4">
        {[1,2,3].map((i) => (
          <div key={i} className="animate-pulse bg-white/10 rounded-xl h-28 w-full" />
        ))}
      </div>
      <div className="text-white/40 mt-6 text-lg font-semibold tracking-wide">Ladataan varauspyyntöjä...</div>
    </div>
  );
  if (!bookings || bookings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-white/40 text-sm pt-20">
        <span>Ei lähetettyjä varauspyyntöjä</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 px-4 py-4">
      <AnimatePresence>
        {bookings.map((b) => {
          const formattedBookingDate = new Date(b.date).toLocaleDateString('fi-FI');
          const formattedCreatedAt = new Date(b.createdAt).toLocaleDateString('fi-FI');
          return (
            <motion.div
              key={b.id}
              initial={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              onClick={() => {
                if (onSelect) onSelect(b);
                else {
                  navigate(`/palvelut/${b.palveluId}`, {
                    state: { returnTo: 'VARAUSPYYNNÖT' },
                  });
                }
              }}
              className={`cursor-pointer p-4 rounded-xl text-white border border-white/10 bg-white/5 hover:bg-white/10 ${
                selectedId === b.id ? 'ring-2 ring-white/40' : ''
              }`}
            >
              <div className="flex justify-between text-sm text-white/60 uppercase font-anton mb-2">
                <span>Palvelu</span>
                <span>Lähetetty: {formattedCreatedAt}</span>
              </div>
              <div className="border-t border-white/10 mb-2" />
              <div className="text-white font-anton py-1 text-base mb-1">
                {b.palveluTitle || 'Tuntematon'}
              </div>
              <div className="flex justify-between items-center font-anton text-sm text-white">
                <span>Päivämäärälle: {formattedBookingDate}</span>
                <span className="text-white text-3xl px-7 ml-2">→</span>
              </div>
              <div className="mt-2 font-anton text-sm text-white">
                <span className="text-white">Tila:</span>{' '}
                {b.status === 'approved' ? (
                  <span className="text-green-400">Hyväksytty</span>
                ) : b.status === 'rejected' ? (
                  <span className="text-red-400">Ei hyväksytty</span>
                ) : (
                  <span className="text-white/60">Odotetaan vastausta tekijältä</span>
                )}
              </div>
              {(b.status === 'approved' || b.status === 'pending') && !b.paymentCompleted && (
                <div className="mt-4 flex justify-between items-center gap-4">
                  {b.status === 'approved' && (
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedBooking(b);
                        setShowPaymentModal(true);
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white px-10 py-2 rounded flex items-center justify-center gap-2"
                      disabled={paying}
                    >
                      {paying && selectedBooking?.id === b.id ? (
                        <>
                          <span className="spinner w-5 h-5 border-2 border-t-transparent border-white mr-2" />
                          Maksamassa...
                        </>
                      ) : 'Maksa varaus'}
                    </motion.button>
                  )}
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedBooking(b);
                      setShowCancelModal(true);
                    }}
                    className="text-sm text-red-400 border border-red-400 px-6 py-2 rounded hover:bg-red-400 hover:text-white"
                  >
                    Peruuta varaus
                  </motion.button>
                </div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
      {showCancelModal && selectedBooking && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm text-black">
            <h2 className="text-lg font-semibold mb-4">Peruuta varaus</h2>
            <p>Haluatko varmasti peruuttaa varauksen palveluun:</p>
            <p className="font-bold my-2">{selectedBooking.palveluTitle}</p>
            <div className="mt-6 flex justify-end gap-4">
              <button onClick={() => setShowCancelModal(false)} className="text-gray-600">
                Peruuta
              </button>
              <button
                onClick={handleConfirmCancel}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
              >
                Vahvista peruutus
              </button>
            </div>
          </div>
        </div>
      )}
      {showPaymentModal && selectedBooking && (
        <ConfirmPaymentModal
          open={true}
          price={selectedBooking.price || 0}
          onClose={() => {
            setShowPaymentModal(false);
            setPaying(false);
          }}
          onConfirm={handleConfirmPay}
        />
      )}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.4 }}
            className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white text-black px-6 py-3 rounded-lg shadow-lg z-50"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SentBookingList;
