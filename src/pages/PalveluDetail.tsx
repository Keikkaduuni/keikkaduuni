import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaStar, FaMapMarkerAlt } from 'react-icons/fa';
import axios from 'axios';
import { jwtDecode } from "jwt-decode";
import { useAuth } from '../context/AuthContext'; // adjust the path if needed
import { Settings } from 'lucide-react'; // at the top with other imports
import { Calendar } from 'lucide-react'; // Make sure to import this at the top
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useLocation } from 'react-router-dom';
import { getToken } from '../utils/token';
import MuokkaaPalveluModal from '../components/MuokkaaPalveluModal';
import { BACKEND_URL } from '../config';







const PalveluDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [palvelu, setPalvelu] = useState(null);
  const [showBooking, setShowBooking] = useState(false);
  const [bookingData, setBookingData] = useState({ date: '', message: '' });
  const [expanded, setExpanded] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState('');
  const [hasBooked, setHasBooked] = useState(false);
  const { user } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportSuccess, setReportSuccess] = useState(false);
  const location = useLocation();
  const fromTab = location.state?.fromTab;
  const returnTo = location.state?.returnTo;
  const showTab = location.state?.showTab; //
  const [showReportSuccess, setShowReportSuccess] = useState(false);
  const token = getToken();
  const [showBookingSuccessToast, setShowBookingSuccessToast] = useState(false);
  const [bookingDate, setBookingDate] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<number | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showUpdateToast, setShowUpdateToast] = useState(false);
  const [showDeleteToast, setShowDeleteToast] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [bookingErrorToast, setBookingErrorToast] = useState('');
  const [showBookingCancelledToast, setShowBookingCancelledToast] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;








    // 2. Fetch palvelu and reviews immediately
    useEffect(() => {
      const fetchPalvelu = async () => {
        try {
            const token = getToken();
            const response = await axios.get(`${BACKEND_URL}/api/palvelut/${id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
          
          const normalized = {
            ...response.data,
            userId: response.data.userId || response.data.user_id, // ✅ normalize snake_case → camelCase
          };

          setPalvelu(normalized);
        } catch (error) {
          console.error('Failed to fetch palvelu:', error);
          navigate('/');
        }
      };

      const fetchReviews = async () => {
        try {
          const res = await axios.get(`${BACKEND_URL}/palvelut/${id}/reviews`);
          setReviews(res.data);
        } catch (err) {
          console.warn('Arvostelut puuttuvat — ei huolta.');
        }
      };

      fetchPalvelu();
      fetchReviews();
    }, [id, navigate]);


    const checkBooking = async () => {
      if (!palvelu || !user || !token) return;
      if (String(palvelu.userId) === String(user.id)) return;

      try {
        const bookingRes = await axios.get(
          `${BACKEND_URL}/api/bookings/check?palveluId=${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (bookingRes.data.hasBooked) {
          setHasBooked(true);
          setBookingDate(bookingRes.data.date);
          setBookingId(bookingRes.data.bookingId);
        } else {
          setHasBooked(false);
          setBookingDate(null);
          setBookingId(null);
        }
      } catch (err) {
        console.error('❌ Booking check failed:', err);
      }
    };

    useEffect(() => {
      checkBooking();
    }, [palvelu, user, token, id]);




    // 4. Lock scroll when modal is open
    useEffect(() => {
      document.body.style.overflow = showBooking ? 'hidden' : '';
      return () => {
        document.body.style.overflow = '';
      };
    }, [showBooking]);

    // Date formatting
    const today = new Date().toISOString().split('T')[0];

    

 const photoSrc = palvelu?.photoUrl?.startsWith('http')
  ? palvelu.photoUrl
  : palvelu?.photoUrl
    ? `${BACKEND_URL}/uploads/${palvelu.photoUrl}`
    : '';

const userPhotoSrc = palvelu?.userProfilePhoto?.startsWith('http')
  ? palvelu.userProfilePhoto
  : palvelu?.userProfilePhoto
    ? `${BACKEND_URL}/uploads/${palvelu.userProfilePhoto}`
    : '';


  const reviewCount = palvelu?.reviewCount ?? 0;
  const averageRating = palvelu?.averageRating ?? 0;
  
    console.log("User:", user);
    console.log("Palvelu:", palvelu);
    console.log("user.id === palvelu.userId:", user?.id === palvelu?.userId);
    console.log("hasBooked:", hasBooked);
    console.log("🧠 user.id:", user?.id);
    console.log("📦 palvelu.userId:", palvelu?.userId);
    console.log("🟰 Is owner:", String(user?.id) === String(palvelu?.userId));

    useEffect(() => {
  const cancelled = sessionStorage.getItem('bookingCancelled') === 'true';

  let timeout: ReturnType<typeof setTimeout> | null = null;

  if (cancelled) {
    setShowBookingCancelledToast(true);
    sessionStorage.removeItem('bookingCancelled');

    timeout = setTimeout(() => {
      setShowBookingCancelledToast(false);
    }, 3000);
  }

  return () => {
    if (timeout) clearTimeout(timeout);
  };
}, []);





return (
        <div className="min-h-screen bg-gray-50 px-4 md:px-6 pt-8 pb-36 space-y-8">
        {/* Top controls row: back + report (like TarveDetail) */}
        <div className="max-w-5xl mx-auto px-6 mb-4 flex justify-between items-center">
          <button
            onClick={() => {
            if (returnTo === 'VARAUSPYYNNÖT') {
  sessionStorage.setItem('lähetetytInitialSubtab', 'VARAUSPYYNNÖT');
  sessionStorage.setItem('viestitInitialTab', 'CONTACTED'); // ✅ ADD THIS
  navigate('/viestit', { state: { showSubtab: 'VARAUSPYYNNÖT' } });


          } else if (showTab === 'PALVELUT' || showTab === 'TARPEET') {
            navigate('/', { state: { showTab } });
          } else {
            navigate(-1); // fallback
          }
        }}

            className="flex items-center gap-2 text-base px-1 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition"
          >
            <span className="text-xl">←</span> Takaisin
          </button>

          {user && palvelu && String(user.id) === String(palvelu.userId) ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center bg-black text-white px-4 py-2 rounded-xl hover:bg-gray-800 transition"
              >
                <Settings className="w-5 h-5" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-lg border z-50 overflow-hidden">
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      setIsEditModalOpen(true);
                    }}
                    className="block w-full text-left px-4 py-3 hover:bg-gray-100 text-sm text-black font-medium"
                  >
                    Muokkaa palvelua
                  </button>

                  <button
                    onClick={async () => {
                      const confirmed = window.confirm("Haluatko varmasti poistaa tämän palvelun?");
                      if (!confirmed) return;

                      try {
                        const token = getToken(); // ✅ changed
                        await axios.delete(`${BACKEND_URL}/api/palvelut/${palvelu.id}`, {
                          headers: { Authorization: `Bearer ${token}` },
                        });
                          navigate('/', {
                           state: { deleted: true, showTab: 'PALVELUT' },
                        });

                      } catch (err) {
                        console.error('Poisto epäonnistui:', err);
                        alert('Palvelun poistaminen epäonnistui.');
                      }
                    }}
                    className="block w-full text-left px-4 py-3 hover:bg-gray-100 text-sm font-medium text-red-600"
                  >
                    Poista palvelu
                  </button>
                </div>
              )}
            </div>
          ) : (
            user && palvelu && (
              <button
                onClick={() => setShowReportModal(true)}
                className="text-sm font-medium text-gray-500 hover:text-black underline flex items-center gap-1"
              >
                <span className="text-sm grayscale">🚩</span>
                Ilmoita väärinkäytöksestä
              </button>
            )
          )}
        </div>
        

        
        {isEditModalOpen && (
          <MuokkaaPalveluModal
            palvelu={palvelu}
            onClose={() => setIsEditModalOpen(false)}
                             onUpdated={async () => {
                               try {
                                 const response = await axios.get(`${BACKEND_URL}/api/palvelut/${id}`);
                                 setPalvelu(response.data);
                                 setShowUpdateToast(true);
                                 setTimeout(() => setShowUpdateToast(false), 3000); // auto-hide
                               } catch (err) {
                                 console.error("Päivityksen jälkeinen fetch epäonnistui:", err);
                               }
                             }}

          />
        )}

        {showUpdateToast && (
          <div className={
            'fixed z-50 bg-green-600 text-white px-4 py-2 rounded-xl shadow-lg flex items-center gap-2 animate-fade-in ' +
            (isMobile ? 'left-1/2 -translate-x-1/2 bottom-4 w-[90vw] max-w-sm' : 'top-6 right-6')
          }>
            <span>Palvelu päivitetty onnistuneesti!</span>
            <button onClick={() => setShowUpdateToast(false)} className="text-white font-bold">×</button>
          </div>
        )}

        
          {/* PALVELUN TIEDOT Title */}
          <div className="max-w-5xl mx-auto px-2 mb-2 mt-2">
  <div className="flex justify-between items-center">
    <h2 className="text-3xl font-bold text-black">PALVELUN TIEDOT</h2>
    {user && palvelu && String(user.id) !== String(palvelu.userId) && !hasBooked && (
      <button
        onClick={() => setShowBooking(true)}
        className="bg-black text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-800 transition"
      >
        Varaa palvelu
      </button>
    )}
  </div>
</div>

        
        {user && hasBooked && (
          <div className="max-w-5xl mx-auto text-center mt-4">
            <p className="text-green-600 font-semibold text-base">Olet tehnyt varauspyynnön</p>
            {bookingDate && (
              <p className="text-gray-500 text-sm">
                {new Date(bookingDate).toLocaleDateString('fi-FI')}
              </p>
            )}
          </div>
        )}
       
        
         
       {/* Main Info Box */}
         <div className="relative max-w-5xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col md:flex-row mt-0.5">
            
        
        {/* Left: Photo */}
        <div className="md:w-1/2">
          {photoSrc ? (
            <img
              src={photoSrc}
              alt={palvelu.title}
              className="w-full h-[350px] object-cover"
              onError={(e) => (e.currentTarget.style.display = 'none')}
            />
          ) : (
            <div className="w-full h-[350px] bg-gray-200 flex items-center justify-center text-gray-500">
              Ei kuvaa saatavilla
            </div>
          )}
        </div>

        {/* Right: Info */}
        <div className="md:w-1/2 p-7 flex flex-col justify-between space-y-5">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{palvelu?.title}</h1>

            <div className="mt-4 text-[15px] text-gray-600 space-y-2">
              <div><FaMapMarkerAlt className="inline mr-1" />{palvelu?.location}</div>
              <div>Kategoria: {palvelu?.category}</div>
              <div>Luotu: {new Date(palvelu?.createdAt).toLocaleDateString('fi-FI')}</div>
            </div>

         <div className="mt-4 text-2xl font-extrabold text-black pl-2">
            {palvelu?.price} €
            <span className="mt-1 text-2xl font-extrabold text-black-600">
              / {palvelu?.rateType === 'hour' ? 'tunti' : 'urakka'}
            </span>
          </div>
        </div>
          


          {/* Profile & Rating */}
          <div className="flex items-center gap-4 mt-4">
            {userPhotoSrc && (
              <div className="relative w-12 h-12">
                <img
                  src={userPhotoSrc}
                  alt={palvelu.userName}
                  className="w-12 h-12 rounded-full object-cover filter blur-sm"
                />
                <div className="absolute inset-0 rounded-full border border-white"></div>
              </div>
            )}

            <div className="flex flex-col">
              <div className="text-sm font-medium text-gray-800">{palvelu?.userName}</div>
              <div className="text-xs text-gray-500">Käyttäjän arvostelut</div>
              <div className="flex items-center text-yellow-500 text-sm">
                <FaStar className="mr-1" />
                <span className="text-gray-700 font-semibold">
                  {averageRating.toFixed(1)} / 5 ({reviewCount})
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KUVAUS */}
          <div className="max-w-5xl mx-auto">
            <h2 className="text-xl text-black font-bold mb-3">Kuvaus</h2>
            <div className="bg-white p-6 rounded-2xl shadow-sm">
              <p
                className={`text-gray-700 text-[15px] whitespace-pre-line break-words ${
                  expanded ? '' : 'line-clamp-6'
                }`}
              >
                {palvelu?.description}
              </p>
              {palvelu?.description && palvelu.description.length > 200 && (
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="mt-3 text-sm text-black underline"
                >
                  {expanded ? 'Näytä vähemmän' : 'Näytä lisää'}
                </button>
              )}
            </div>
          </div>


      {/* ARVOSTELUT */}
          <div className="max-w-5xl mx-auto">
            <h2 className="text-xl text-black font-bold mb-3">Arvostelut</h2>
            <div className="bg-white p-6 rounded-2xl shadow-sm max-h-[300px] overflow-y-auto space-y-4">
              {reviews.length === 0 ? (
                <p className="text-sm text-gray-500 italic">Ei vielä arvosteluja.</p>
              ) : (
                reviews.map((review) => (
                  <div key={review.id} className="border-b pb-3">
                    <div className="flex items-center gap-3 mb-1">
                      <img
                        src={`${BACKEND_URL}/uploads/${review.user.profilePhoto}`}
                        alt={review.user.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div>
                        <p className="text-sm font-semibold">{review.user.name}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(review.createdAt).toLocaleDateString('fi-FI')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center text-yellow-500 text-sm mb-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <FaStar key={i} className={i < review.rating ? 'text-yellow-500' : 'text-gray-300'} />
                      ))}
                    </div>
                    <p className="text-sm text-gray-700">{review.comment}</p>
                  </div>
                ))
              )}
            </div>
          </div>


      {/* VARAUSEHDOT */}
      <div className="max-w-5xl mx-auto">
        <h2 className="text-xl text-black font-bold mb-3">Varausehdot</h2>
        <div className="bg-white p-6 rounded-2xl shadow-sm">
          <p className="text-gray-600 text-sm leading-relaxed">
            Tämä on esimerkki varausehdoista. Tähän voit lisätä tietoa varauksen
            maksamisesta, peruutusajasta, tai muista käytännöistä.
          </p>
        </div>
      </div>

      {/* Sticky Booking Button */}
        
        {user && palvelu && !isEditModalOpen && (
          <div className="fixed bottom-6 left-0 right-0 flex justify-center z-50">
            <div className="bg-white border shadow-lg rounded-2xl px-6 py-4 w-full max-w-sm mx-auto">
              {String(user.id) === String(palvelu.userId) ? (
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="w-full bg-black text-white py-3 rounded-xl text-lg font-semibold hover:bg-gray-800 transition flex items-center justify-center gap-2"
                >
                  <Settings className="w-6 h-6" /> Muokkaa palvelua
                </button>
              ) : hasBooked ? (
                <div className="bg-green-100 px-4 py-3 rounded-xl flex justify-between items-center gap-4">
                <span className="text-green-700 font-semibold text-sm">
                  Olet tehnyt varauspyynnön
                </span>

              <button
                onClick={() => setShowCancelConfirm(true)}
                  className="text-sm text-red-600 font-semibold hover:text-red-800"
              >
                   Peruuta
              </button>
             </div>

              ) : (
                <button
                  onClick={() => setShowBooking(true)}
                  className="w-full bg-black text-white py-3 rounded-xl text-lg font-semibold hover:bg-gray-800 transition"
                >
                  Varaa palvelu
                </button>
              )}
            </div>
          </div>
        )}


                             
        {showCancelConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-lg text-center">
              <h2 className="text-lg font-bold mb-4 text-black">
                Haluatko poistaa varauspyynnön?
              </h2>

              <div className="flex justify-center gap-4">
                <button
                  disabled={isCancelling}
                  className={`px-5 py-2 rounded-xl font-medium text-white ${
                    isCancelling
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                  onClick={async () => {
                    setIsCancelling(true);
                    try {
                      const token = getToken();

                      if (!bookingId) {
                        alert('Varausta ei löytynyt.');
                        return;
                      }

                      await axios.delete(`${BACKEND_URL}/api/bookings/${bookingId}`, {
                        headers: { Authorization: `Bearer ${token}` },
                      });

                      setHasBooked(false);
                      setBookingDate(null);
                      setShowCancelConfirm(false);
                      sessionStorage.setItem('bookingCancelled', 'true');

                        if (returnTo === 'VARAUSPYYNNÖT') {
                          sessionStorage.setItem('bookingCancelled', 'true');
                          navigate('/viestit', {
                            state: { fromSubtab: 'VARAUSPYYNNÖT', toast: 'bookingCancelled' },
                          });
                        } else if (showTab === 'PALVELUT' || showTab === 'TARPEET') {
                          sessionStorage.setItem('bookingCancelled', 'true');
                          navigate('/', {
                            state: { showTab: showTab.toUpperCase() },
                          });
                        } else {
                          sessionStorage.setItem('bookingCancelled', 'true');
                          navigate(-1); // fallback
                        }

                    } catch (err) {
                      console.error('❌ Poisto epäonnistui:', err);
                      alert('Varausta ei voitu poistaa.');
                    } finally {
                      setIsCancelling(false);
                    }
                  }}
                >
                  {isCancelling ? 'Peruutetaan...' : 'KYLLÄ'}
                </button>

                <button
                  className="bg-black text-white px-5 py-2 rounded-xl font-medium hover:bg-gray-800"
                  onClick={() => setShowCancelConfirm(false)}
                >
                  EI
                </button>
              </div>
            </div>
          </div>
        )}




          {/* ✅ Success message appears separately, below the card */}
          {bookingSuccess && (
            <div className="mt-3 text-center text-sm text-green-600 font-medium animate-fade-in">
              {bookingSuccess}
            </div>
          )}
         
          
          {showReportModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-lg relative">
                <button
                  onClick={() => setShowReportModal(false)}
                  className="absolute top-2 right-2 text-gray-400 hover:text-black text-xl"
                >
                  ×
                </button>

                <h2 className="text-lg font-semibold mb-4 text-black">Ilmoita väärinkäytöksestä</h2>

                <label className="text-sm text-black mb-1 block">Syy ilmoitukselle</label>
                <textarea
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  rows={4}
                  className="w-full border p-2 rounded-lg mb-4 text-black"
                  placeholder="Kerro lyhyesti syy ilmoitukseen..."
                />

                <button
                  onClick={async () => {
                    if (!reportReason.trim()) return alert('Syytä ei voi jättää tyhjäksi.');

                    try {
                      const token = getToken();
                      await axios.post(
                        'http://localhost:5001/api/reports',
                        {
                          palveluId: palvelu.id,
                          reason: reportReason,
                        },
                        {
                          headers: { Authorization: `Bearer ${token}` },
                        }
                      );

                    
                        setShowReportModal(false);
                        setReportReason('');
                        setReportSuccess(true);
                        setTimeout(() => setReportSuccess(false), 3000);
                      } catch (err) {
                        console.error('Virhe ilmoituksessa:', err);
                        alert('Ilmoituksen lähettäminen epäonnistui.');
                      }
                   }}
                  className="w-full bg-black text-white py-2 rounded-lg hover:bg-gray-800 transition"
                >
                  Lähetä ilmoitus
                </button>

                {reportSuccess && (
                  <p className="text-green-600 text-sm mt-2">Ilmoitus vastaanotettu, kiitos.</p>
                )}
              </div>
            </div>
          )}
        
        {reportSuccess && (
  <div className="fixed top-5 right-5 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg animate-slide-in z-50 flex items-center justify-between gap-4">
    <span>Kiitos ilmoituksesta! Keikkaduunin tiimi reagoi siihen ❤️</span>
    <button onClick={() => setReportSuccess(false)} className="text-white font-bold">×</button>
  </div>
)}


       {/* Booking Modal */}
          {showBooking && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
              <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl relative">
                <button
                  className="absolute top-2 right-2 text-gray-400 hover:text-black"
                  onClick={() => setShowBooking(false)}
                >
                  ✕
                </button>

                <h2 className="text-xl font-semibold mb-4 text-black">Varaa palvelu</h2>

                           <label className="block mb-1 text-sm font-medium text-black">
                             Toivottu päivämäärä <span className="text-red-500">*</span>
                           </label>

                           <DatePicker
                             selected={bookingData.date ? new Date(bookingData.date) : null}
                             onChange={(date: Date) =>
                               setBookingData({ ...bookingData, date: date.toISOString().split('T')[0] })
                             }
                             dateFormat="dd.MM.yyyy"
                             className="w-full border rounded-xl px-4 py-3 text-black text-base bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-black"
                           />



                           {/* Arvioidut tunnit */}
                           <label className="block mb-1 mt-4 text-sm font-medium text-black">
                             Arvioidut tunnit (väh. 1h) <span className="text-red-500">*</span>
                           </label>
                           <input
                             type="text"
                             inputMode="numeric"
                             pattern="[0-9]*"
                             value={bookingData.hours?.toString() ?? ''}
                             onChange={(e) => setBookingData({ ...bookingData, hours: e.target.value })}
                             className="w-full border rounded-xl p-3 mb-2 text-black text-base"
                             placeholder="Esim. 2"
                           />
                           {(!bookingData.hours || isNaN(Number(bookingData.hours)) || Number(bookingData.hours) < 1) && (
                             <p className="text-red-500 text-sm mb-2">Anna vähintään 1 tunti.</p>
                           )}


                 <button
              onClick={async () => {
                const isValidDate = !!bookingData.date;
                const isValidHours = bookingData.hours && !isNaN(Number(bookingData.hours)) && Number(bookingData.hours) >= 1;

                if (!isValidDate || !isValidHours) return;
                if (hasBooked) return;

                setIsBooking(true);
                  try {
                    const token = getToken();
                    await axios.post(
                      `${BACKEND_URL}/api/bookings`,
                      {
                        palveluId: palvelu.id,
                        date: bookingData.date,
                        hours: Number(bookingData.hours),
                      },
                      {
                        headers: { Authorization: `Bearer ${token}` },
                      }
                    );

                    await checkBooking(); // ✅ fetch fresh bookingId

                    const formatted = new Date(bookingData.date).toLocaleDateString('fi-FI');
                    setBookingSuccess(`Olet lähettänyt varauspyynnön päivämäärälle ${formatted}`);
                    setHasBooked(true);
                    setShowBooking(false);

                    setShowBookingSuccessToast(true);
                    setTimeout(() => setShowBookingSuccessToast(false), 3000);
                  } catch (err: any) {
                    console.error('Booking failed:', err);
                    alert(err.response?.data?.error || 'Jokin meni pieleen varauksessa.');
                  } finally {
                    setIsBooking(false);
                  }

              }}
              disabled={isBooking}
              className={`w-full py-2 rounded-lg font-semibold transition ${
                isBooking
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-black text-white hover:bg-gray-800'
              }`}
            >
              {isBooking ? 'Lähetetään...' : 'Lähetä varauspyyntö'}
            </button>
          </div>
        </div>
      )}

            {/* ✅ Top-right toast: Booking Success */}
      {showBookingSuccessToast && (
        <div className={
          'fixed z-50 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-3 animate-slide-in ' +
          (isMobile ? 'left-1/2 -translate-x-1/2 bottom-4 w-[90vw] max-w-sm' : 'top-6 right-6')
        }>
          <span>Varauspyyntö lähetetty onnistuneesti!</span>
          <button onClick={() => setShowBookingSuccessToast(false)} className="text-white text-lg leading-none">×</button>
        </div>
      )}

      {showBookingCancelledToast && (
        <div className={
          'fixed z-50 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-3 animate-slide-in ' +
          (isMobile ? 'left-1/2 -translate-x-1/2 bottom-4 w-[90vw] max-w-sm' : 'top-6 right-6')
        }>
          <span>Varauspyyntö peruttu</span>
          <button
            onClick={() => setShowBookingCancelledToast(false)}
            className="text-white text-lg leading-none"
          >
            ×
          </button>
        </div>
      )}

    </div>
  );
};

export default PalveluDetail;
