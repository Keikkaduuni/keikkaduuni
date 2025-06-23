import React from 'react';
import axios from 'axios';

interface Props {
  request: {
    id: number;
    date: string;
    hours: number;
    palveluTitle: string;
    status: 'pending' | 'approved' | 'rejected';
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

  // ✅ DEBUG: Log to verify the button should show or not
  console.log('BookingDetailsPanel → isMobile:', isMobile, 'showBackButton:', showBackButton);

  return (
    <div
      className={`text-white flex flex-col ${
        isMobile ? 'fixed inset-0 z-50 bg-[#121212]' : 'h-full w-full bg-transparent'
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
          <p className="mb-1">
            Päivämäärä: <strong>{new Date(request.date).toLocaleDateString()}</strong>
          </p>
          <p className="mb-4">
            Kesto: <strong>{request.hours} tuntia</strong>
          </p>

          {request.status === 'pending' ? (
            <div className="flex gap-10 mt-4">
              <button
                onClick={async () => {
                  try {
                    await fetch(`http://localhost:5001/api/bookings/${request.id}/approve`, {
                      method: 'POST',
                      headers: {
                        Authorization: `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token')}`,
                      },
                    });
                    onApprove();
                  } catch (err) {
                    console.error('❌ Approval failed:', err);
                  }
                }}
                className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg"
              >
                Hyväksy
              </button>
              <button
                onClick={onReject}
                className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg"
              >
                Hylkää
              </button>
            </div>
          ) : request.status === 'accepted_pending_payment' ? (
            <p className="text-yellow-400 mt-4 text-center text-sm">
              Varauspyyntö hyväksytty, kun asiakas on tehnyt maksuvarauksen, pääsette chattaamaan!
            </p>
          ) : (
            <p className="text-green-400 mt-4">
              Tila: {request.status === 'approved' ? 'Hyväksytty' : 'Hylätty'}
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
    </div>
  );
};

export default BookingDetailsPanel;
