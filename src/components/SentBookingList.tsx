import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ConfirmPaymentModal from '../components/ConfirmPaymentModal';

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

// ... (imports stay unchanged)

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

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    const fetchBookings = async () => {
      const token = getToken();
      if (!token) return;
      try {
        const res = await fetch('/api/bookings/sent', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setBookings(data);
      } catch (err) {
        console.error('❌ Failed to fetch sent bookings:', err);
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
      setTimeout(() => {
        navigate(`/viestit/${res.data.conversationId}`);
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

  if (loading) return <div className="text-white/40 px-4 py-6">Ladataan...</div>;
  if (!bookings.length) return <div className="text-white/50 px-4 py-10">Ei varauspyyntöjä vielä</div>;

  return (
    <div className="flex flex-col gap-2 px-4 py-4">
      {bookings.map((b) => {
        const formattedBookingDate = new Date(b.date).toLocaleDateString('fi-FI');
        const formattedCreatedAt = new Date(b.createdAt).toLocaleDateString('fi-FI');

        return (
          <div
            key={b.id}
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
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedBooking(b);
                      setShowPaymentModal(true);
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white px-10 py-2 rounded"
                    disabled={paying}
                  >
                    {paying && selectedBooking?.id === b.id ? 'Maksamassa...' : 'Maksa varaus'}
                  </button>
                )}

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedBooking(b);
                    setShowCancelModal(true);
                  }}
                  className="text-sm text-red-400 border border-red-400 px-6 py-2 rounded hover:bg-red-400 hover:text-white"
                >
                  Peruuta varaus
                </button>
              </div>
            )}
          </div>
        );
      })}

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

      {toastMessage && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white text-black px-6 py-3 rounded-lg shadow-lg z-50">
          {toastMessage}
        </div>
      )}
    </div>
  );
};

export default SentBookingList;
