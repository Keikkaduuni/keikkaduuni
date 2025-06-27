3// src/pages/TarveDetail.tsx

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaMapMarkerAlt } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { getToken } from '../utils/token'; // ✅ Add this
import { Settings } from 'lucide-react';
import MuokkaaTarveModal from '../components/MuokkaaTarveModal';




const BACKEND_URL = 'http://localhost:5001';

const TarveDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tarve, setTarve] = useState<Tarve | null>(null);
  const location = useLocation();
  const fromTab = location.state?.fromTab;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [offerData, setOfferData] = useState({ price: '', date: '' });
  const [priceError, setPriceError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [hasOffered, setHasOffered] = useState(false);
  const [offerDate, setOfferDate] = useState<string | null>(null);
  const [showReportSuccess, setShowReportSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittingReport, setSubmittingReport] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showUpdateToast, setShowUpdateToast] = useState(false);

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;




  
    interface Tarve {
      id: number;
      title: string;
      description: string;
      category?: string;
      location?: string;
      photoUrl?: string;
      userId: string;         // flat user ID field
      userName?: string;      // optionally add if you send it or want to fetch separately
      userProfilePhoto?: string; // same as above
      createdAt: string;
    }



  

    
    
  useEffect(() => {
    if (!id) {
      setError('Virheellinen ID');
      setLoading(false);
      return;
    }

    fetch(`${BACKEND_URL}/api/tarpeet/${id}`)
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || 'Virhe haettaessa tietoja');
        }
        return res.json();
      })
      .then((data: any) => {
        setTarve(data);
      })
      .catch((e: Error) => {
        console.error('TarveDetail error:', e);
        setError(e.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
  if (!user || !id) return;
  const token = getToken();
  if (!token) return;
  axios
    .get(`${BACKEND_URL}/api/offers/check?tarveId=${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((res) => {
      if (res.data?.hasOffered) {
        setHasOffered(true);
        setOfferDate(res.data.date);
      }
    })
    .catch((err) => console.warn('Offer check failed:', err));
  }, [user, id]);


  useEffect(() => {
    if (showOfferModal || showReportModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [showOfferModal, showReportModal]);

  const resetOfferModal = () => {
    setOfferData({ price: '', date: '' });
    setPriceError(null);
  };
  
    const fetchTarve = () => {
      if (!id) return;
      fetch(`${BACKEND_URL}/api/tarpeet/${id}`)
        .then(async (res) => {
          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || 'Virhe haettaessa tietoja');
          }
          return res.json();
        })
        .then((data: any) => {
          setTarve(data);
        })
        .catch((e: Error) => {
          console.error('TarveDetail error:', e);
          setError(e.message);
        })
        .finally(() => {
          setLoading(false);
        });
    };

    
  const dismissSuccess = () => setShowSuccess(false);

  if (loading) return <div className="p-6">Ladataan tarve...</div>;
  if (error) return <div className="p-6 text-red-600">Virhe: {error}</div>;
  if (!tarve) return <div className="p-6">Tarvetta ei löytynyt.</div>;

  const photoSrc = tarve.photoUrl?.startsWith('http')
    ? tarve.photoUrl
    : `${BACKEND_URL}/uploads/${tarve.photoUrl}`;

    const userPhotoSrc = tarve.userProfilePhoto?.startsWith('http')
      ? tarve.userProfilePhoto
      : `${BACKEND_URL}/uploads/${tarve.userProfilePhoto}`;
    

    
    const isOwner = user && tarve.userId && String(user.id) === String(tarve.userId);


  
    console.log("🔍 user.id:", user?.id);
    console.log("📦 tarve.userId:", tarve?.userId);
    console.log("✅ isOwner:", isOwner);


  return (
    <div className="min-h-screen bg-gray-50 px-4 md:px-6 pt-8 pb-36 space-y-8">
          <div className="max-w-5xl mx-auto px-6 mb-4 flex justify-between items-center">
            <button
              onClick={() => {
                if (fromTab === 'tarpeet' || fromTab === 'TARPEET') {
                  navigate('/', { state: { showTab: 'tarpeet' } });
                } else {
                  navigate(-1);
                }
              }}
              className="flex items-center gap-2 text-base px-1 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition"
            >
              <span className="text-xl">←</span> Takaisin
            </button>

          {user && tarve && (
            isOwner ? (
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
                      onClick={() => setShowEditModal(true)}
                      className="block w-full text-left px-4 py-3 hover:bg-gray-100 text-sm text-black font-medium"
                    >
                      Muokkaa tarvetta
                    </button>
                    <button
                      onClick={async () => {
                        const confirmed = window.confirm("Haluatko varmasti poistaa tämän tarpeen?");
                        if (!confirmed) return;

                        try {
                          const token = getToken();
                          await axios.delete(`${BACKEND_URL}/api/tarpeet/${tarve.id}`, {
                            headers: { Authorization: `Bearer ${token}` },
                          });
                           navigate('/', {
                           state: { deleted: true, showTab: 'TARPEET' },
                          });

                        } catch (err) {
                          console.error('Poisto epäonnistui:', err);
                          alert('Tarpeen poistaminen epäonnistui.');
                        }
                      }}
                      className="block w-full text-left px-4 py-3 hover:bg-gray-100 text-sm font-medium text-red-600"
                    >
                      Poista tarve
                    </button>
                  </div>
                )}
              </div>
            ) : (
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


      <div className="max-w-5xl mx-auto px-2">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold text-black">TARPEEN TIEDOT</h2>
          {user && tarve && String(user.id) !== String(tarve.userId) && !hasOffered && (
                <button
                  onClick={() => setShowOfferModal(true)}
                  className="bg-black text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-800 transition"
                >
                  Tee tarjous
                </button>
              )}
            </div>
          </div>
      

            {user && hasOffered && (
              <div className="max-w-5xl mx-auto text-center  mt-4">
                <p className="text-green-600 font-semibold text-base">Olet tehnyt tarjouksen</p>
                {offerDate && (
                  <p className="text-gray-500 text-sm">
                     {new Date(offerDate).toLocaleDateString('fi-FI')}
                  </p>
                )}
             </div>
           )}

       <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col md:flex-row mt-1">


 
        <div className="md:w-1/2">
          {tarve.photoUrl ? (
            <img
              src={photoSrc}
              alt={tarve.title}
              className="w-full h-[350px] object-cover"
              onError={(e) => (e.currentTarget.style.display = 'none')}
            />
          ) : (
            <div className="w-full h-[350px] bg-gray-200 flex items-center justify-center text-gray-500">
              Ei kuvaa saatavilla
            </div>
          )}
        </div>

        <div className="md:w-1/2 p-7 flex flex-col justify-center space-y-5">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{tarve.title}</h1>
            <div className="mt-4 text-[15px] text-gray-600 space-y-2">
              <div><FaMapMarkerAlt className="inline mr-1" />{tarve.location}</div>
              <div>Kategoria: {tarve.category}</div>
              <div>Julkaistu: {new Date(tarve.createdAt).toLocaleDateString('fi-FI')}</div>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-4">
            {userPhotoSrc && (
              <div className="relative w-12 h-12">
                <img
                  src={userPhotoSrc}
                  alt={tarve.userName}
                  className="w-12 h-12 rounded-full object-cover filter blur-sm"
                />
                <div className="absolute inset-0 rounded-full border border-white"></div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto">
        <h2 className="text-xl text-black font-bold mb-3">Kuvaus</h2>
        <div className="bg-white p-6 rounded-2xl shadow-sm">
          <p className={`text-gray-700 text-[15px] whitespace-pre-line break-words ${expanded ? '' : 'line-clamp-6'}`}>{tarve.description}</p>
          {tarve.description && tarve.description.length > 200 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-3 text-sm text-black underline"
            >
              {expanded ? 'Näytä vähemmän' : 'Näytä lisää'}
            </button>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto">
        <h2 className="text-xl text-black font-bold mb-3">Ehdot ja käytännöt</h2>
        <div className="bg-white p-6 rounded-2xl shadow-sm">
          <p className="text-gray-600 text-sm leading-relaxed">
            Tämä on esimerkki tarjouspyynnön ehdoista. Tähän voit lisätä tietoa aikataulusta, työehdoista tai muista käytännöistä, jotka ovat tärkeitä työn toteutukselle.
          </p>
        </div>
      </div>

          {user && tarve && (
            <div className="fixed bottom-6 left-0 right-0 flex justify-center z-50">
              <div className="bg-white border shadow-lg rounded-2xl px-6 py-4 w-full max-w-sm mx-auto">
                {isOwner ? (
                  <button
                    onClick={() => setShowEditModal(true)}
                    className="w-full bg-black text-white py-3 rounded-xl text-lg font-semibold hover:bg-gray-800 transition flex items-center justify-center gap-2"
                  >
                    <Settings className="w-6 h-6" /> Muokkaa tarvetta
                  </button>

                ) : hasOffered ? (
                  <button
                    disabled
                    className="w-full bg-green-100 text-green-600 py-3 rounded-xl text-lg font-semibold cursor-default"
                  >
                    Olet tehnyt tarjouksen
                  </button>
                ) : (
                  <button
                    onClick={() => setShowOfferModal(true)}
                    className="w-full bg-black text-white py-3 rounded-xl text-lg font-semibold hover:bg-gray-800 transition"
                  >
                    Tee tarjous
                  </button>
                )}
              </div>
            </div>
          )}



      {/* Report Modal */}
{showReportModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-lg relative">
      <button
        onClick={() => setShowReportModal(false)}
        className="absolute top-2 right-2 text-gray-400 hover:text-black text-xl"
      >
        ×
      </button>
      <h2 className="text-lg font-bold mb-4 text-black">Ilmoita väärinkäytöksestä</h2>
      <textarea
        className="w-full border rounded p-2 h-32 text-black"
        placeholder="Kerro, mitä ilmoitat..."
        value={reportReason}
        onChange={(e) => setReportReason(e.target.value)}
      />
      <div className="mt-4 flex justify-end gap-2">
        <button
          onClick={() => setShowReportModal(false)}
          className="text-gray-600 font-medium"
        >
          Peruuta
        </button>
          <button
  onClick={async () => {
    if (!reportReason.trim()) {
      alert('Syötä ilmoituksen syy.');
      return;
    }

    const token = getToken();
    if (!token || !id) {
      alert('Kirjaudu sisään lähettääksesi ilmoituksen.');
      return;
    }

    try {
      setSubmittingReport(true); // 🔄 start loading

      await axios.post(
        `${BACKEND_URL}/api/reports`,
        { tarveId: id, reason: reportReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setShowReportModal(false);
      setReportReason('');
      setShowReportSuccess(true);
      setTimeout(() => setShowReportSuccess(false), 3000);
    } catch (err) {
      console.error('Report failed:', err);
      alert('Ilmoituksen lähettäminen epäonnistui.');
    } finally {
      setSubmittingReport(false); // ✅ stop loading
    }
  }}
  disabled={submittingReport}
  className={`bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition ${
    submittingReport ? 'opacity-50 cursor-not-allowed' : ''
  }`}
>
  {submittingReport ? 'Lähetetään...' : 'Lähetä'}
</button>

      </div>
    </div>
  </div>
)}


             
   {/* Offer Modal */}
      {showOfferModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-hidden">
          <div className="bg-white rounded-xl p-6 pt-8 w-full max-w-md shadow-lg relative">
            <button
              onClick={() => {
                setShowOfferModal(false);
                resetOfferModal();
              }}
              className="absolute top-3 right-3 text-gray-500 hover:text-black text-3xl"
            >
              ×
            </button>
            <h2 className="text-xl font-bold mb-4 text-black">TEE TARJOUS</h2>

            <label className="block mb-1 text-sm text-black">Millä hinnalla teet (€)</label>
            <input
              type="number"
              min="10"
              className="w-full border p-2 rounded mb-1 text-black"
              value={offerData.price}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setOfferData({ ...offerData, price: e.target.value });
                setPriceError(val < 10 ? 'Hinnan tulee olla vähintään 10 €' : null);
              }}
              placeholder="Esim. 120"
            />
            {priceError && <p className="text-red-600 text-sm mb-3">{priceError}</p>}

            <label className="block mb-1 text-sm text-black">Päivämäärä jolloin voisit tehdä</label>
            <DatePicker
              selected={offerData.date ? new Date(offerData.date) : null}
              onChange={(date: Date) => setOfferData({ ...offerData, date: date.toISOString().split('T')[0] })}
              dateFormat="dd.MM.yyyy"
              className="w-full border p-2 rounded mb-3 text-black cursor-pointer bg-white"
              placeholderText="Valitse päivämäärä kalenterista"
              showPopperArrow={false}
              autoComplete="off"
              openToDate={new Date()}
            />

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowOfferModal(false);
                  resetOfferModal();
                }}
                className="text-gray-600"
              >
                Peruuta
              </button>
              <button
  onClick={async () => {
    const price = parseFloat(offerData.price);
    if (!offerData.date) {
      setPriceError('Valitse päivämäärä');
      return;
    }
    if (isNaN(price) || price < 10) {
      setPriceError('Hinnan tulee olla vähintään 10 €');
      return;
    }

    const token = getToken();
    if (!token) {
      alert('Kirjaudu sisään tehdäksesi tarjouksen.');
      return;
    }

    try {
      setSubmitting(true); // 🔄 Start loading

      await axios.post(
        `${BACKEND_URL}/api/offers`,
        {
          tarveId: id,
          date: offerData.date,
          price,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      fetchTarve();
        
      setShowOfferModal(false);
      resetOfferModal();
      setShowSuccess(true);
      setHasOffered(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      console.error('Tarjouksen lähetys epäonnistui:', err);
      alert('Tarjouksen lähetys epäonnistui.');
    } finally {
      setSubmitting(false); // 🔄 End loading
    }
  }}
  disabled={submitting}
  className={`bg-black text-white px-4 py-2 rounded hover:scale-105 transition-transform ${
    submitting ? 'opacity-50 cursor-not-allowed' : ''
  }`}
>
  {submitting ? 'Lähetetään...' : 'Lähetä tarjous'}
</button>

            </div>
          </div>
        </div>
      )}

      {/* Tarjous lähetetty notification */}
      {showSuccess && (
        <div className={
          'fixed z-50 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-3 animate-slide-in ' +
          (isMobile ? 'left-1/2 -translate-x-1/2 bottom-4 w-[90vw] max-w-sm' : 'top-6 right-6')
        }>
          <span>Tarjous lähetetty onnistuneesti</span>
          <button onClick={dismissSuccess} className="text-white text-lg leading-none">×</button>
        </div>
      )}
        {showReportSuccess && (
  <div className={
    'fixed z-50 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-3 animate-slide-in ' +
    (isMobile ? 'left-1/2 -translate-x-1/2 bottom-4 w-[90vw] max-w-sm' : 'top-6 right-6')
  }>
    <span>Kiitos ilmoituksesta! Keikkaduunin tiimi reagoi siihen ❤️</span>
    <button onClick={() => setShowReportSuccess(false)} className="text-white text-lg leading-none">×</button>
  </div>
)}
     {showEditModal && tarve && (
  <MuokkaaTarveModal
    tarve={tarve}
    onClose={() => setShowEditModal(false)}
    onUpdated={() => {
      fetchTarve();
      setShowUpdateToast(true);
      setTimeout(() => setShowUpdateToast(false), 3000);
    }}
  />
)}
        {showUpdateToast && (
  <div className={
    'fixed z-50 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-3 animate-slide-in ' +
    (isMobile ? 'left-1/2 -translate-x-1/2 bottom-4 w-[90vw] max-w-sm' : 'top-6 right-6')
  }>
    <span>Tarve päivitetty onnistuneesti</span>
    <button onClick={() => setShowUpdateToast(false)} className="text-white text-lg leading-none">×</button>
  </div>
)}


    </div>
  );
};

export default TarveDetail;
