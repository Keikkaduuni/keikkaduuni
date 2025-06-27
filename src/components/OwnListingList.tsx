import React from 'react';
import classNames from 'classnames';

interface OwnListing {
  id: number;
  title: string;
  image?: string;
  createdAt: string;
  conversationCount?: number;
  hasUnreadBookings?: boolean;
  pendingCount?: number;
  hasUnreadOffers?: boolean;
}

interface Props {
  listings: OwnListing[];
  onSelect: (listingId: number) => void;
  selectedId?: number | null;
  onSelectWithContext?: (listingId: number, defaultTab: 'VIESTIT' | 'VARAUKSET') => void;
}

const OwnListingList: React.FC<Props> = ({ listings, onSelect, selectedId }) => {
  return (
    <div className="flex flex-col gap-2 px-4 py-4">
      {listings.length === 0 ? (
        <div className="text-white/60 text-center py-10">Ei ilmoituksia vielä</div>
      ) : (
        listings.map((item) => (
          <div
            key={item.id}
            onClick={() => onSelect(item.id)}
            className={classNames(
              'relative flex items-center gap-4 p-3 rounded-xl cursor-pointer',
              selectedId === item.id
                ? 'bg-white/10 border border-white'
                : 'bg-white/5 hover:bg-white/10'
            )}
          >
            {item.hasUnreadBookings && (
              <span
                title="Uusi varauspyyntö"
                className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full"
              />
            )}
            {item.hasUnreadOffers && (
              <span
                title="Uusi tarjous"
                className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full"
              />
            )}
            <img
              src={item.image || '/default-thumbnail.svg'}
              alt={item.title}
              className="w-16 h-16 object-cover rounded-lg"
            />
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-white font-semibold truncate max-w-[160px]">
                  {item.title}
                </span>
              </div>
              <span className="text-white/50 text-xs">
                {new Date(item.createdAt).toLocaleDateString('fi-FI')}
              </span>
              {item.conversationCount !== undefined && (
                <span className="text-white/40 text-xs">
                  {item.conversationCount} keskustelu
                  {item.conversationCount === 1 ? '' : 'a'}
                </span>
              )}
              {item.pendingCount !== undefined && item.pendingCount > 0 && (
                <span className="text-white/40 text-xs">
                  {item.pendingCount} tarjous
                  {item.pendingCount === 1 ? '' : 'ta'}
                </span>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default OwnListingList;
