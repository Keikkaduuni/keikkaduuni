import React from 'react';

interface Offer {
  id: number;
  price: number;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
  isRead: boolean;
  userId: string;
  tarveId: number;
  createdAt: string;
}

interface OfferListProps {
  offers: Offer[];
  onSelect?: (offer: Offer) => void;
}

const OfferList: React.FC<OfferListProps> = ({ offers, onSelect }) => {
  if (offers.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-gray-400">
          <p className="text-sm">Ei tarjouksia vielä</p>
        </div>
      </div>
    );
  }

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

  return (
    <div className="flex-1 overflow-y-auto">
      {offers.map((offer) => (
        <div
          key={offer.id}
          className={`p-4 border-b border-white/10 hover:bg-white/5 transition cursor-pointer ${
            !offer.isRead ? 'bg-white/5' : ''
          }`}
          onClick={() => onSelect?.(offer)}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-white">
                  {offer.price}€
                </span>
                {!offer.isRead && (
                  <span className="w-2 h-2 bg-red-500 rounded-full" />
                )}
              </div>
              <div className="text-sm text-gray-400">
                {formatDate(offer.date)}
              </div>
            </div>
            <div className="text-right">
              <div className={`text-sm font-medium ${getStatusColor(offer.status)}`}>
                {getStatusText(offer.status)}
              </div>
              <div className="text-xs text-gray-400">
                {formatDate(offer.createdAt)}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default OfferList; 