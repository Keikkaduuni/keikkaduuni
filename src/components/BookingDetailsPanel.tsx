import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface Props {
  request: {
    id: number;
    date: string;
    hours: number;
    palveluTitle: string;
    status: 'pending' | 'approved' | 'rejected';
    userId?: string;
    userName?: string;
    userProfilePhoto?: string;
    paymentCompleted?: boolean;
  };
  onApprove: () => void;
  onReject: () => void;
  onBack: () => void;
  onMarkedAsRead?: (bookingId: number) => void;
  showBackButton?: boolean;
}

const useIsMobile = () => {
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);
  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return isMobile;
};

const BookingDetailsPanel: React.FC<Props> = ({
  request,
  onApprove,
  onReject,
  onBack,
  onMarkedAsRead,
  showBackButton = false,
}) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const showToast = (message: string, isError = false) => {
    if (isError) {
      setErrorToast(message);
      setTimeout(() => setErrorToast(null), 4000);
    } else {
      setSuccessToast(message);
      setTimeout(() => setSuccessToast(null), 3000);
    }
  };

  React.useEffect(() => {
    const markAsRead = async () => {
      try {
        await axios.patch(
          `http://localhost:5001/api/bookings/${request.id}/read`,
          {},
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token')}`,
            },
          }
        );
        onMarkedAsRead?.(request.id);
      } catch (err) {
        console.error('Failed to mark booking as read:', err);
      }
    };
    markAsRead();
  }, [request.id, onMarkedAsRead]);

  const handleApprove = async () => {
    setIsLoading(true);
    try {
      await fetch(`http://localhost:5001/api/bookings/${request.id}/approve`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token')}`,
        },
      });
      onApprove();
      showToast('Varauspyyntö hyväksytty onnistuneesti!');
    } catch (err) {
      console.error('❌ Approval failed:', err);
      showToast('Varauspyynnön hyväksyminen epäonnistui. Yritä uudelleen.', true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    setIsLoading(true);
    try {
      await fetch(`http://localhost:5001/api/bookings/${request.id}/reject`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token')}`,
        },
      });
      onReject();
      showToast('Varauspyyntö hylätty.');
    } catch (err) {
      console.error('❌ Rejection failed:', err);
      showToast('Varauspyynnön hylkäys epäonnistui. Yritä uudelleen.', true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoToChat = async () => {
    setIsLoading(true);
    try {
      // Find the conversation for this booking
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await axios.get(`http://localhost:5001/api/conversations/booking/${request.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.data.conversationId) {
        navigate(`/viestit/${response.data.conversationId}`);
      } else {
        showToast('Keskustelua ei löytynyt. Yritä uudelleen.', true);
      }
    } catch (err) {
      console.error('Failed to find conversation:', err);
      showToast('Keskustelun avaaminen epäonnistui. Yritä uudelleen.', true);
    } finally {
      setIsLoading(false);
    }
  };

  const userPhotoSrc = request.userProfilePhoto?.startsWith('http')
    ? request.userProfilePhoto
    : request.userProfilePhoto
      ? `http://localhost:5001/uploads/${request.userProfilePhoto}`
      : '';

  return (
    <div
      className={`text-white flex flex-col ${
        isMobile ? 'fixed inset-0 z-50 bg-black' : 'h-full w-full bg-black'
      }`}
    >
      <div className="h-[60px] w-full" />

      {/* ✅ Show TAKAISIN only on mobile and when showBackButton is true */}
      {isMobile && showBackButton && (
        <div className="border-y border-white/10 px-6 py-5 w-full flex items-center">
          <button
            onClick={onBack}
            className="text-white text-base font-anton flex items-center gap-2"
          >
            <span className="text-xl">←</span> TAKAISIN
          </button>
        </div>
      )}

      <div className="flex-1 flex flex-col justify-top items-center px-6 py-8 gap-1">
        {!isMobile && (
          <p className="text-white/70 text-sm text-center mb-6 max-w-md">
            Varauspyynnön hyväksyttyäsi pääset olemaan yhteydessä varaajaan!
          </p>
        )}

        <div className="bg-black border border-white/10 rounded-2xl p-6 w-full max-w-md">
          <h3 className="text-2xl font-bold mb-2">{request.palveluTitle}</h3>
          
          {/* User info section */}
          {request.userName && (
            <div className="flex items-center gap-3 mb-4 p-3 bg-white/5 rounded-lg">
              {userPhotoSrc ? (
                <img
                  src={userPhotoSrc}
                  alt={request.userName}
                  className="w-10 h-10 rounded-full object-cover"
                  onError={(e) => (e.currentTarget.style.display = 'none')}
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <span className="text-white/60 text-sm">
                    {request.userName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <p className="text-white font-medium">{request.userName}</p>
                <p className="text-white/60 text-sm">Varaaja</p>
              </div>
            </div>
          )}

          <p className="mb-1">
            Päivämäärä: <strong>{new Date(request.date).toLocaleDateString()}</strong>
          </p>
          <p className="mb-4">
            Kesto: <strong>{request.hours} tuntia</strong>
          </p>

          {request.status === 'pending' ? (
            <div className="flex gap-4 mt-4">
              <button
                onClick={handleApprove}
                disabled={isLoading}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
                  isLoading
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {isLoading ? 'Käsitellään...' : 'Hyväksy'}
              </button>
              <button
                onClick={handleReject}
                disabled={isLoading}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
                  isLoading
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {isLoading ? 'Käsitellään...' : 'Hylkää'}
              </button>
            </div>
          ) : request.status === 'approved' && request.paymentCompleted ? (
            <div className="space-y-3 mt-4">
              <p className="text-green-400 text-center text-sm">
                ✅ Varaus hyväksytty ja maksettu
              </p>
              <button
                onClick={handleGoToChat}
                disabled={isLoading}
                className={`w-full bg-blue-600 hover:bg-blue-700 px-4 py-3 rounded-lg font-medium transition ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isLoading ? 'Avaan keskustelua...' : '💬 Siirry keskusteluun'}
              </button>
            </div>
          ) : request.status === 'approved' ? (
            <p className="text-yellow-400 mt-4 text-center text-sm">
              Varauspyyntö hyväksytty, kun asiakas on tehnyt maksuvarauksen, pääsette chattaamaan!
            </p>
          ) : (
            <p className="text-red-400 mt-4 text-center">
              Tila: {request.status === 'rejected' ? 'Hylätty' : 'Tuntematon'}
            </p>
          )}
        </div>

        {isMobile && (
          <div className="w-full mt-6">
            <div className="border-t border-white/10 w-full mb-2" />
            <p className="text-white/70 text-sm text-center px-4 py-3">
              Varauspyynnön hyväksyttyäsi pääset olemaan yhteydessä varaajaan!
            </p>
          </div>
        )}
      </div>

      {/* Error Toast */}
      {errorToast && (
        <div className="fixed z-50 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg animate-slide-in left-1/2 -translate-x-1/2 bottom-4 w-[90vw] max-w-sm">
          <span>{errorToast}</span>
          <button onClick={() => setErrorToast(null)} className="text-white text-lg leading-none ml-4">×</button>
        </div>
      )}

      {/* Success Toast */}
      {successToast && (
        <div className="fixed z-50 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg animate-slide-in left-1/2 -translate-x-1/2 bottom-4 w-[90vw] max-w-sm">
          <span>{successToast}</span>
          <button onClick={() => setSuccessToast(null)} className="text-white text-lg leading-none ml-4">×</button>
        </div>
      )}
    </div>
  );
};

export default BookingDetailsPanel;
