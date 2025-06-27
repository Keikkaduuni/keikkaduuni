import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface Offer {
  id: number;
  price: number;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
  isRead: boolean;
  userId: string;
  tarveId: number;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    profilePhoto?: string;
  };
}

interface OfferDetailsPanelProps {
  offer: Offer;
  onApprove: () => void;
  onReject: () => void;
  onBack?: () => void;
  showBackButton?: boolean;
  onMarkedAsRead?: (offerId: number) => void;
}

const OfferDetailsPanel: React.FC<OfferDetailsPanelProps> = ({
  offer,
  onApprove,
  onReject,
  onBack,
  showBackButton = false,
  onMarkedAsRead,
}) => {
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fi-FI', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-green-500';
      case 'rejected':
        return 'text-red-500';
      default:
        return 'text-yellow-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Hyväksytty';
      case 'rejected':
        return 'Hylätty';
      default:
        return 'Odottaa';
    }
  };

  React.useEffect(() => {
    if (onMarkedAsRead && !offer.isRead) {
      onMarkedAsRead(offer.id);
    }
  }, [offer.id, offer.isRead, onMarkedAsRead]);

  const handleApprove = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await axios.post(
        `http://localhost:5001/api/offers/${offer.id}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.status === 204) {
        onApprove();
        showToast('Tarjous hyväksytty onnistuneesti!');
      } else {
        throw new Error('Approval failed');
      }
    } catch (err) {
      console.error('Error approving offer:', err);
      showToast('Tarjouksen hyväksyminen epäonnistui. Yritä uudelleen.', true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await axios.post(
        `http://localhost:5001/api/offers/${offer.id}/reject`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.status === 204) {
        onReject();
        showToast('Tarjous hylätty.');
      } else {
        throw new Error('Rejection failed');
      }
    } catch (err) {
      console.error('Error rejecting offer:', err);
      showToast('Tarjouksen hylkäys epäonnistui. Yritä uudelleen.', true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoToChat = async () => {
    setIsLoading(true);
    try {
      // Find the conversation for this offer
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await axios.get(`http://localhost:5001/api/conversations/offer/${offer.id}`, {
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

  const userPhotoSrc = offer.user?.profilePhoto?.startsWith('http')
    ? offer.user.profilePhoto
    : offer.user?.profilePhoto
      ? `http://localhost:5001/uploads/${offer.user.profilePhoto}`
      : '';

  return (
    <div className="h-full flex flex-col bg-white/5">
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-4">
          {showBackButton && onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-lg border border-white/20 text-white hover:border-white/40 transition"
            >
              ←
            </button>
          )}
          <div>
            <h2 className="text-xl font-bold text-white">Tarjous</h2>
            <p className="text-sm text-gray-400">
              Saatu {formatDate(offer.createdAt)}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 space-y-6">
        {/* User info section */}
        {offer.user?.name && (
          <div className="bg-white/5 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Tarjoaja</h3>
            <div className="flex items-center gap-3">
              {userPhotoSrc ? (
                <img
                  src={userPhotoSrc}
                  alt={offer.user.name}
                  className="w-12 h-12 rounded-full object-cover"
                  onError={(e) => (e.currentTarget.style.display = 'none')}
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                  <span className="text-white/60 text-lg">
                    {offer.user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <p className="text-white font-medium">{offer.user.name}</p>
                <p className="text-white/60 text-sm">Palveluntarjoaja</p>
              </div>
            </div>
          </div>
        )}

        {/* Price */}
        <div className="bg-white/5 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Hinta</h3>
          <p className="text-2xl font-bold text-white">{offer.price}€</p>
        </div>

        {/* Date */}
        <div className="bg-white/5 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Päivämäärä</h3>
          <p className="text-lg text-white">{formatDate(offer.date)}</p>
        </div>

        {/* Status */}
        <div className="bg-white/5 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Tila</h3>
          <p className={`text-lg font-medium ${getStatusColor(offer.status)}`}>
            {getStatusText(offer.status)}
          </p>
        </div>

        {/* Actions */}
        {offer.status === 'pending' && (
          <div className="space-y-3">
            <button
              onClick={handleApprove}
              disabled={isLoading}
              className={`w-full py-3 px-4 rounded-lg font-medium transition ${
                isLoading
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {isLoading ? 'Käsitellään...' : 'Hyväksy tarjous'}
            </button>
            <button
              onClick={handleReject}
              disabled={isLoading}
              className={`w-full py-3 px-4 rounded-lg font-medium transition ${
                isLoading
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}
            >
              {isLoading ? 'Käsitellään...' : 'Hylkää tarjous'}
            </button>
          </div>
        )}

        {/* Go to Chat button for approved offers */}
        {offer.status === 'approved' && (
          <div className="space-y-3">
            <p className="text-green-400 text-center text-sm">
              ✅ Tarjous hyväksytty
            </p>
            <button
              onClick={handleGoToChat}
              disabled={isLoading}
              className={`w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition ${
                isLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? 'Avaan keskustelua...' : '💬 Siirry keskusteluun'}
            </button>
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

export default OfferDetailsPanel; 