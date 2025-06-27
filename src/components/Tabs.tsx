import React from 'react';
import classNames from 'classnames';


interface TabsProps {
  activeTab: 'PALVELUT' | 'TARPEET' | 'CONTACTED';
  setActiveTab: (tab: 'PALVELUT' | 'TARPEET' | 'CONTACTED') => void;
  hasUnreadInPalvelutTab: boolean;
  hasUnreadInTarpeetTab: boolean;
}


const Tabs: React.FC<TabsProps> = ({ activeTab, setActiveTab, hasUnreadInPalvelutTab, hasUnreadInTarpeetTab }) => {
  return (
    <div className="flex gap-2 mb-4">
      {(['PALVELUT', 'TARPEET', 'CONTACTED'] as const).map((tab) => {
        const label =
          tab === 'PALVELUT'
            ? 'Omat Palvelut'
            : tab === 'TARPEET'
            ? 'Omat Tarpeet'
            : 'Lähetetyt';

        const showRedDot = 
          (tab === 'PALVELUT' && hasUnreadInPalvelutTab) ||
          (tab === 'TARPEET' && hasUnreadInTarpeetTab);

        return (
          <div className="relative" key={tab}>
            <button
              onClick={() => {
               setActiveTab(tab);
 
               if (typeof window !== 'undefined') {
                  window.dispatchEvent(new Event('clearConversationBooking'));
               }
             }}

              className={classNames(
                'px-4 py-2 rounded-lg uppercase text-sm border transition relative',
                activeTab === tab
                  ? 'bg-white text-black border-white'
                  : 'border-white/20 text-white/70'
              )}
            >
              {label}
            </button>

            {showRedDot && (
              <span className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-red-500 rounded-full z-10" />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default Tabs;
