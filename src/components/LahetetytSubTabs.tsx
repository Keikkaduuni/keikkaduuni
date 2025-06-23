import React from 'react';
import classNames from 'classnames';

interface Props {
  active: 'VARAUSPYYNNÖT' | 'TARJOUKSET' | 'VIESTIT';
  setActive: (tab: 'VARAUSPYYNNÖT' | 'TARJOUKSET' | 'VIESTIT') => void;
  hasUnreadBookings?: boolean;
  hasUnreadOffers?: boolean;
  hasUnreadMessages?: boolean;
}

const LahetetytSubTabs: React.FC<Props> = ({
  active,
  setActive,
  hasUnreadBookings = false,
  hasUnreadOffers = false,
  hasUnreadMessages = false,
}) => {
  return (
    <div className="flex justify-center gap-3 px-4 py-3 border-b border-white/10">
      {[
        { label: 'Varauspyynnöt', value: 'VARAUSPYYNNÖT', showDot: hasUnreadBookings },
        { label: 'Tarjoukset', value: 'TARJOUKSET', showDot: hasUnreadOffers },
        { label: 'Viestit', value: 'VIESTIT', showDot: hasUnreadMessages },
      ].map(({ label, value, showDot }) => (
        <button
          key={value}
          onClick={() => setActive(value as any)}
          className={classNames(
            'relative px-4 py-1.5 text-sm font-anton uppercase rounded-full border transition',
            active === value
              ? 'bg-white text-black border-white'
              : 'text-white/70 border-white/20 hover:border-white/40'
          )}
        >
          {label}
          {showDot && (
            <span className="absolute top-0 right-0 -mt-1 -mr-1 w-2.5 h-2.5 bg-red-500 rounded-full" />
          )}
        </button>
      ))}
    </div>
  );
};

export default LahetetytSubTabs;
