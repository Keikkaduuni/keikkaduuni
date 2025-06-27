import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { BACKEND_URL } from '../config';
import { Link } from 'react-router-dom';
import { Loader2, CheckCircle, XCircle, Clock, ArrowRight, User, Briefcase } from 'lucide-react';
import BookingRequestList from '../components/BookingRequestList';
import OfferRequestList from '../components/OfferRequestList';

const statusColors: Record<string, string> = {
  pending: 'text-yellow-500',
  accepted: 'text-green-600',
  completed: 'text-blue-600',
  rejected: 'text-red-500',
  cancelled: 'text-gray-400',
};

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return isMobile;
};

const MyWorkPage: React.FC = () => {
  const { user } = useContext(AuthContext);
  const [bookings, setBookings] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('bookings');
  const [selectedOverviewBox, setSelectedOverviewBox] = useState<string | null>(null);

  // New main tabs for the dashboard
  const mainTabs = [
    { id: 'overview', label: 'Yleiskatsaus' },
    { id: 'sent', label: 'Lähetetyt' },
    { id: 'received', label: 'Saapuneet' },
    { id: 'notifications', label: 'Ilmoitukset' },
  ];
  const [mainTab, setMainTab] = useState('overview');

  // Mock summary and activity data for overview
  const summary = [
    { label: 'Kokonaistulot', value: '0€', icon: <span className="text-green-400">↑</span> },
    { label: 'Aktiiviset', value: '1', icon: <Clock className="inline w-5 h-5 text-blue-400" /> },
    { label: 'Odottavat', value: '1', icon: <Clock className="inline w-5 h-5 text-yellow-400" /> },
    { label: 'Valmiit', value: '0', icon: <CheckCircle className="inline w-5 h-5 text-purple-400" /> },
  ];
  const recent = [
    { type: 'Lähetetty varaus', amount: '2500€', date: '21.1.2024', status: 'Vahvistettu' },
    { type: 'Saapunut varaus', amount: '600€', date: '21.1.2024', status: 'Odottaa' },
  ];

  // For Kokonaistulot filter
  const [filterYear, setFilterYear] = useState<number>(new Date().getFullYear());
  const [filterMonth, setFilterMonth] = useState<string>('');
  const [filteredStats, setFilteredStats] = useState<{ date: string; amount: number }[]>([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [serviceYears, setServiceYears] = useState<number[]>([new Date().getFullYear()]);
  const [loadingEarnings, setLoadingEarnings] = useState(false);

  // Helper to get user's creation year (fallback to 2024 if not present)
  const userCreatedYear = user?.createdAt ? new Date(user.createdAt).getFullYear() : 2024;

  // Define months array at the top
  const months = [
    { value: '', label: 'Kaikki' },
    { value: '01', label: 'Tammikuu' },
    { value: '02', label: 'Helmikuu' },
    { value: '03', label: 'Maaliskuu' },
    { value: '04', label: 'Huhtikuu' },
    { value: '05', label: 'Toukokuu' },
    { value: '06', label: 'Kesäkuu' },
    { value: '07', label: 'Heinäkuu' },
    { value: '08', label: 'Elokuu' },
    { value: '09', label: 'Syyskuu' },
    { value: '10', label: 'Lokakuu' },
    { value: '11', label: 'Marraskuu' },
    { value: '12', label: 'Joulukuu' },
  ];

  // Aktiiviset state
  const [activeProviderJobs, setActiveProviderJobs] = useState<any[]>([]);
  const [activeClientJobs, setActiveClientJobs] = useState<any[]>([]);
  const [loadingActive, setLoadingActive] = useState(false);

  // State for showing all active jobs in right panel
  const [showAllActive, setShowAllActive] = useState(false);

  // Add state for search query
  const [activeJobsSearch, setActiveJobsSearch] = useState('');

  // Add state for Odottavat search
  const [pendingJobsSearch, setPendingJobsSearch] = useState('');

  // Add state for Odottavat tab
  const [pendingTab, setPendingTab] = useState<'action' | 'waiting'>('action');

  // Add state for Valmiit search
  const [completedJobsSearch, setCompletedJobsSearch] = useState('');

  // State for activity feed
  const [showAllActivity, setShowAllActivity] = useState(false);

  // Add rightPanelView state
  const [rightPanelView, setRightPanelView] = useState<string | null>(null);

  // Add state for sent type and search
  const [selectedSentType, setSelectedSentType] = useState<'VARAUSPYYNNÖT' | 'TARJOUKSET'>('VARAUSPYYNNÖT');
  const [sentSearch, setSentSearch] = useState('');

  const [sentBookingRequests, setSentBookingRequests] = useState<any[]>([]);
  const [sentOffers, setSentOffers] = useState<any[]>([]);

  // Add state for received items
  const [receivedBookingRequests, setReceivedBookingRequests] = useState<any[]>([]);
  const [receivedOffers, setReceivedOffers] = useState<any[]>([]);
  const [selectedReceivedType, setSelectedReceivedType] = useState<'VARAUSPYYNNÖT' | 'TARJOUKSET'>('VARAUSPYYNNÖT');
  const [receivedSearch, setReceivedSearch] = useState('');

  // Add state for Saapuneet subtabs
  const [saapuneetSubtab, setSaapuneetSubtab] = useState<'PALVELUT' | 'TARPEET'>('PALVELUT');
  const [selectedPalvelu, setSelectedPalvelu] = useState<any>(null);
  const [selectedTarve, setSelectedTarve] = useState<any>(null);
  const [ownPalvelut, setOwnPalvelut] = useState<any[]>([]);
  const [ownTarpeet, setOwnTarpeet] = useState<any[]>([]);

  // Add state for notifications
  const [notifications, setNotifications] = useState<any[]>([]);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);

  const isMobile = useIsMobile();

  // Lock scroll when mobile overlay is open
  useEffect(() => {
    if (isMobile && showAllActive) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isMobile, showAllActive]);

  // Fetch and aggregate real earnings data
  useEffect(() => {
    if (!user) return;
    const fetchEarnings = async () => {
      setLoadingEarnings(true);
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        // 1. Fetch own services
        const palvelutRes = await fetch(`${BACKEND_URL}/api/palvelut/omat`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const palvelut = palvelutRes.ok ? await palvelutRes.json() : [];
        // 2. Get all years from first palvelu or user creation
        let minYear = userCreatedYear;
        palvelut.forEach((p: any) => {
          if (p.createdAt) {
            const y = new Date(p.createdAt).getFullYear();
            if (y < minYear) minYear = y;
          }
        });
        const yearsArr = [];
        for (let y = minYear; y <= new Date().getFullYear(); y++) yearsArr.push(y);
        setServiceYears(yearsArr);
        // 3. Fetch bookings for each palvelu
        let allBookings: any[] = [];
        for (const palvelu of palvelut) {
          const bookingsRes = await fetch(`${BACKEND_URL}/api/bookings/palvelu/${palvelu.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const bookings = bookingsRes.ok ? await bookingsRes.json() : [];
          // Only include bookings that are paid (paymentCompleted: true)
          bookings.forEach((b: any) => {
            if (b.paymentCompleted && b.createdAt && palvelu.price) {
              allBookings.push({ ...b, price: palvelu.price });
            }
          });
        }
        // 4. Aggregate by year/month
        const stats: { [key: string]: number } = {};
        let total = 0;
        allBookings.forEach((b) => {
          const d = new Date(b.createdAt);
          const y = d.getFullYear();
          const m = d.getMonth() + 1;
          if ((filterYear && y !== filterYear) || (filterMonth && (m !== parseInt(filterMonth)))) return;
          const key = `${y}/${m}`;
          stats[key] = (stats[key] || 0) + (b.price || 0);
          total += b.price || 0;
        });
        // 5. Format for display
        const statArr = Object.entries(stats)
          .sort(([a], [b]) => (a < b ? 1 : -1))
          .map(([date, amount]) => ({ date, amount }));
        setFilteredStats(statArr);
        setTotalEarnings(total);
      } catch (err) {
        setFilteredStats([]);
        setTotalEarnings(0);
      } finally {
        setLoadingEarnings(false);
      }
    };
    if (selectedOverviewBox === 'Kokonaistulot') fetchEarnings();
  }, [user, filterYear, filterMonth, selectedOverviewBox]);

  // Fetch active jobs for provider and client
  useEffect(() => {
    if (mainTab !== 'overview' && mainTab !== 'sent' && mainTab !== 'received' && mainTab !== 'notifications' && mainTab !== 'aktiiviset') return;
    if (!user) return;
    const fetchActiveJobs = async () => {
      setLoadingActive(true);
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        // Provider jobs
        const palvelutRes = await fetch(`${BACKEND_URL}/api/palvelut/omat`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const palvelut = palvelutRes.ok ? await palvelutRes.json() : [];
        let providerJobs: any[] = [];
        for (const palvelu of palvelut) {
          const bookingsRes = await fetch(`${BACKEND_URL}/api/bookings/palvelu/${palvelu.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const bookings = bookingsRes.ok ? await bookingsRes.json() : [];
          bookings.forEach((b: any) => {
            if (['pending', 'accepted'].includes((b.status || '').toLowerCase())) {
              providerJobs.push({ ...b, palvelu });
            }
          });
        }
        setActiveProviderJobs(providerJobs);
        // Client jobs
        const sentRes = await fetch(`${BACKEND_URL}/api/bookings/sent`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const sentBookings = sentRes.ok ? await sentRes.json() : [];
        let clientJobs: any[] = [];
        sentBookings.forEach((b: any) => {
          if (['pending', 'accepted'].includes((b.status || '').toLowerCase())) {
            clientJobs.push(b);
          }
        });
        setActiveClientJobs(clientJobs);
      } catch (err) {
        setActiveProviderJobs([]);
        setActiveClientJobs([]);
      } finally {
        setLoadingActive(false);
      }
    };
    if (mainTab === 'aktiiviset') fetchActiveJobs();
  }, [mainTab, user]);

  useEffect(() => {
    if (mainTab !== 'sent') return;
    const fetchSent = async () => {
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        // Fetch sent bookings
        const bookingsRes = await fetch(`${BACKEND_URL}/api/bookings/sent`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const bookings = bookingsRes.ok ? await bookingsRes.json() : [];
        setSentBookingRequests(bookings);
        // Fetch sent offers
        const offersRes = await fetch(`${BACKEND_URL}/api/offers/sent`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const offers = offersRes.ok ? await offersRes.json() : [];
        setSentOffers(offers);
      } catch (err) {
        setSentBookingRequests([]);
        setSentOffers([]);
      }
    };
    fetchSent();
  }, [mainTab]);

  // Fetch received bookings and offers when Saapuneet tab is active
  useEffect(() => {
    if (mainTab !== 'received') return;
    const fetchReceived = async () => {
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        // Fetch received bookings
        const bookingsRes = await fetch(`${BACKEND_URL}/api/bookings/received`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const bookings = bookingsRes.ok ? await bookingsRes.json() : [];
        setReceivedBookingRequests(bookings);
        // Fetch received offers
        const offersRes = await fetch(`${BACKEND_URL}/api/offers/received`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const offers = offersRes.ok ? await offersRes.json() : [];
        setReceivedOffers(offers);
      } catch (err) {
        setReceivedBookingRequests([]);
        setReceivedOffers([]);
      }
    };
    fetchReceived();
  }, [mainTab]);

  // Fetch own services and needs when Saapuneet tab is active
  useEffect(() => {
    if (mainTab !== 'received') return;
    const fetchOwn = async () => {
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        // Fetch own services
        const palvelutRes = await fetch(`${BACKEND_URL}/api/palvelut/omat`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const palvelut = palvelutRes.ok ? await palvelutRes.json() : [];
        setOwnPalvelut(palvelut);
        // Fetch own needs
        const tarpeetRes = await fetch(`${BACKEND_URL}/api/tarpeet/omat`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const tarpeet = tarpeetRes.ok ? await tarpeetRes.json() : [];
        setOwnTarpeet(tarpeet);
      } catch (err) {
        setOwnPalvelut([]);
        setOwnTarpeet([]);
      }
    };
    fetchOwn();
  }, [mainTab]);

  // Refetch notifications when the Ilmoitukset tab is opened
  useEffect(() => {
    if (mainTab !== 'notifications') return;
    const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
    if (!token) return;
    fetch('http://localhost:5001/api/notifications', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        setNotifications(data);
        setHasUnreadNotifications(data.some((n: any) => !n.isRead));
      });
  }, [mainTab]);

  // Helper: check for unread bookings/offers
  const hasUnreadReceivedBookings = receivedBookingRequests.some((b) => !b.isRead);
  const hasUnreadReceivedOffers = receivedOffers.some((o) => !o.isRead);
  const hasUnreadInSaapuneet = hasUnreadReceivedBookings || hasUnreadReceivedOffers;

  const handleShowStats = () => {
    // No-op, handled by useEffect
  };
  const handleResetFilter = () => {
    setFilterYear(serviceYears[0] || new Date().getFullYear());
    setFilterMonth('');
  };
  // CSV copy feature
  const handleCopyCSV = () => {
    const csv = 'Päivä,Tulot (EUR)\n' + filteredStats.map(s => `${s.date},${s.amount}€`).join('\n');
    navigator.clipboard.writeText(csv);
    alert('Kopioitu CSV leikepöydälle!');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-center">
          <p className="text-lg">Kirjaudu sisään nähdäksesi työsi.</p>
          <Link to="/kirjaudu" className="mt-4 inline-block bg-accent text-black px-6 py-2 rounded-lg font-anton uppercase hover:bg-accent/90 transition">Kirjaudu</Link>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'bookings', label: 'Varaukset', count: bookings.length },
    { id: 'offers', label: 'Tarjoukset', count: offers.length },
  ];

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Odottaa';
      case 'ACCEPTED': return 'Hyväksytty';
      case 'REJECTED': return 'Hylätty';
      case 'COMPLETED': return 'Valmis';
      case 'CANCELLED': return 'Peruutettu';
      default: return status;
    }
  };

  const getOfferStatusText = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Odottaa';
      case 'ACCEPTED': return 'Hyväksytty';
      case 'REJECTED': return 'Hylätty';
      default: return status;
    }
  };

  // Filtered active jobs
  const filteredActiveJobs = [...activeProviderJobs, ...activeClientJobs].filter(job => {
    const q = activeJobsSearch.trim().toLowerCase();
    if (!q) return true;
    const title = (job.palvelu?.title || job.palveluTitle || '').toLowerCase();
    const category = (job.palvelu?.category || job.unit || '').toLowerCase();
    const provider = (job.user?.name || job.palveluProviderName || '').toLowerCase();
    return title.includes(q) || category.includes(q) || provider.includes(q);
  });

  // Compute pending jobs (provider + client)
  const pendingProviderJobs = activeProviderJobs.filter(job => (job.status || '').toLowerCase() === 'pending');
  const pendingClientJobs = activeClientJobs.filter(job => (job.status || '').toLowerCase() === 'pending');
  const allPendingJobs = [...pendingProviderJobs, ...pendingClientJobs];

  // Split pending jobs by role
  const pendingProviderAction = activeProviderJobs.filter(job => (job.status || '').toLowerCase() === 'pending');
  const pendingClientWaiting = activeClientJobs.filter(job => (job.status || '').toLowerCase() === 'pending');

  // Filtered by search
  const filteredPendingProviderAction = pendingProviderAction.filter(job => {
    const q = pendingJobsSearch.trim().toLowerCase();
    if (!q) return true;
    const title = (job.palvelu?.title || job.palveluTitle || '').toLowerCase();
    const category = (job.palvelu?.category || job.unit || '').toLowerCase();
    const user = (job.user?.name || job.palveluProviderName || '').toLowerCase();
    return title.includes(q) || category.includes(q) || user.includes(q);
  });
  const filteredPendingClientWaiting = pendingClientWaiting.filter(job => {
    const q = pendingJobsSearch.trim().toLowerCase();
    if (!q) return true;
    const title = (job.palvelu?.title || job.palveluTitle || '').toLowerCase();
    const category = (job.palvelu?.category || job.unit || '').toLowerCase();
    const user = (job.palveluProviderName || '').toLowerCase();
    return title.includes(q) || category.includes(q) || user.includes(q);
  });

  // When opening Odottavat, default to 'action' tab
  useEffect(() => {
    if (selectedOverviewBox === 'Odottavat') setPendingTab('action');
  }, [selectedOverviewBox]);

  // Compute completed jobs (provider + client)
  const completedProviderJobs = activeProviderJobs.filter(job => (job.status || '').toLowerCase() === 'completed');
  const completedClientJobs = activeClientJobs.filter(job => (job.status || '').toLowerCase() === 'completed');

  // Filtered completed jobs
  const filteredCompletedProviderJobs = completedProviderJobs.filter(job => {
    const q = completedJobsSearch.trim().toLowerCase();
    if (!q) return true;
    const title = (job.palvelu?.title || job.palveluTitle || '').toLowerCase();
    const category = (job.palvelu?.category || job.unit || '').toLowerCase();
    const user = (job.user?.name || job.palveluProviderName || '').toLowerCase();
    return title.includes(q) || category.includes(q) || user.includes(q);
  });
  const filteredCompletedClientJobs = completedClientJobs.filter(job => {
    const q = completedJobsSearch.trim().toLowerCase();
    if (!q) return true;
    const title = (job.palvelu?.title || job.palveluTitle || '').toLowerCase();
    const category = (job.palvelu?.category || job.unit || '').toLowerCase();
    const user = (job.palveluProviderName || '').toLowerCase();
    return title.includes(q) || category.includes(q) || user.includes(q);
  });

  // Helper: combine and map recent activity
  const recentActivity = [
    // Completed gigs (provider)
    ...activeProviderJobs.filter(j => (j.status || '').toLowerCase() === 'completed').map(j => ({
      type: 'completed',
      title: j.palvelu?.title || j.palveluTitle,
      date: j.date,
      amount: j.palvelu?.price || j.price,
      status: 'Valmis',
      icon: <CheckCircle className="inline w-5 h-5 text-purple-400 mr-2" />, // completed icon
      subtitle: 'Omat keikat (tarjoajana)'
    })),
    // Completed gigs (client)
    ...activeClientJobs.filter(j => (j.status || '').toLowerCase() === 'completed').map(j => ({
      type: 'completed',
      title: j.palvelu?.title || j.palveluTitle,
      date: j.date,
      amount: j.price,
      status: 'Valmis',
      icon: <CheckCircle className="inline w-5 h-5 text-purple-400 mr-2" />, // completed icon
      subtitle: 'Omat varaukset (asiakkaana)'
    })),
    // Pending bookings (provider)
    ...activeProviderJobs.filter(j => (j.status || '').toLowerCase() === 'pending').map(j => ({
      type: 'booking_received',
      title: j.palvelu?.title || j.palveluTitle,
      date: j.date,
      amount: j.palvelu?.price || j.price,
      status: 'Odottaa',
      icon: <Clock className="inline w-5 h-5 text-yellow-400 mr-2" />, // clock icon
      subtitle: 'Uusi varaus (tarjoajana)'
    })),
    // Pending bookings (client)
    ...activeClientJobs.filter(j => (j.status || '').toLowerCase() === 'pending').map(j => ({
      type: 'booking_sent',
      title: j.palvelu?.title || j.palveluTitle,
      date: j.date,
      amount: j.price,
      status: 'Odottaa',
      icon: <Clock className="inline w-5 h-5 text-yellow-400 mr-2" />, // clock icon
      subtitle: 'Lähetetty varaus (asiakkaana)'
    })),
    // Offers (add more as needed)
    // ...
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const activityToShow = showAllActivity ? recentActivity : recentActivity.slice(0, 2);

  // Add filtered arrays for search
  const sentBookingRequestsFiltered = sentBookingRequests.filter(req => req.title.toLowerCase().includes(sentSearch.toLowerCase()));
  const sentOffersFiltered = sentOffers.filter(offer => offer.title.toLowerCase().includes(sentSearch.toLowerCase()));

  // Filtered arrays for search
  const receivedBookingRequestsFiltered = receivedBookingRequests.filter(req => (req.title || req.palveluTitle || '').toLowerCase().includes(receivedSearch.toLowerCase()));
  const receivedOffersFiltered = receivedOffers.filter(offer => (offer.title || '').toLowerCase().includes(receivedSearch.toLowerCase()));

  return (
    <div className="fixed inset-0 pt-[60px] z-10 overflow-hidden bg-black">
      <div className="max-w-6xl h-full mx-auto flex flex-col bg-white/5 border border-white/10 rounded-2xl text-white shadow-xl overflow-hidden">
        {/* Header and Main Tabs */}
        <div className="p-6 border-b border-white/10 shrink-0">
          <h1 className="text-3xl sm:text-4xl font-anton uppercase tracking-widest text-white mb-2">TYÖT</h1>
          {/* Main Tabs */}
          <div className="flex gap-2 mt-6 flex-wrap">
            {mainTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setMainTab(tab.id); setRightPanelView(null); setSelectedOverviewBox(null); setShowAllActive(false); }}
                className={`relative px-3 py-1.5 text-sm uppercase rounded-full transition border font-anton ${
                  mainTab === tab.id
                    ? 'bg-white text-black border-white'
                    : 'bg-transparent text-white border-white/20 hover:border-white/40'
                }`}
              >
                {tab.label}
                {/* Red dot for Saapuneet and Ilmoitukset */}
                {tab.id === 'received' && hasUnreadInSaapuneet && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                )}
                {tab.id === 'notifications' && notifications.length > 0 && hasUnreadNotifications && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>
        {/* Main Content: Split Panels */}
        <div className="flex flex-1 overflow-hidden divide-x divide-white/10 flex-col md:flex-row">
          {/* Left Panel */}
          <div className="w-full md:w-[35%] max-w-full md:max-w-[410px] border-r border-white/10 flex flex-col overflow-y-auto">
            <div className="flex-1 p-6">
              {mainTab === 'overview' && (
                <>
                  {/* Summary cards - vertical layout */}
                  <div className="flex flex-col gap-4 mb-8 w-full">
                    {summary.map((item) => (
                      <button
                        key={item.label}
                        onClick={() => {
                          if (item.label === 'Kokonaistulot') setRightPanelView('earnings');
                          else if (item.label === 'Aktiiviset') setRightPanelView('active');
                          else if (item.label === 'Odottavat') setRightPanelView('pending');
                          else if (item.label === 'Valmiit') setRightPanelView('completed');
                        }}
                        className={`bg-white/10 rounded-xl p-4 flex flex-row items-center justify-between border border-white/10 w-full text-left transition focus:outline-none hover:bg-white/20 active:bg-white/20 ${
                          rightPanelView === item.label.toLowerCase() ? 'ring-2 ring-accent border-accent bg-white/20' : ''
                        }`}
                      >
                        <div>
                          <div className="text-2xl font-bold mb-1">{item.label === 'Aktiiviset' ? activeProviderJobs.length + activeClientJobs.length : item.value}</div>
                          <div className="text-xs uppercase tracking-widest font-anton">{item.label}</div>
                        </div>
                        <div className="text-xl">{item.icon}</div>
                      </button>
                    ))}
                  </div>
                  {/* Recent activity */}
                  <div>
                    <h3 className="text-lg font-anton uppercase mb-2">Viimeaikainen toiminta</h3>
                    <button
                      onClick={() => setRightPanelView('activity')}
                      className="mb-3 bg-white/10 text-white font-anton px-4 py-1 rounded-full uppercase text-xs tracking-widest border border-white/20 hover:border-accent hover:text-accent focus:border-accent focus:text-accent transition"
                    >
                      Näytä kaikki
                    </button>
                    <div className="space-y-3">
                      {activityToShow.length === 0 && (
                        <div className="text-gray-500 text-xs flex items-center justify-center min-h-[80px]">Ei viimeaikaista toimintaa</div>
                      )}
                      {activityToShow.map((item, i) => (
                        <div key={i} className="bg-white/10 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between border border-white/10">
                          <div className="flex-1 flex items-center gap-2">
                            {item.icon}
                            <div>
                              <div className="font-semibold">{item.subtitle}: {item.title}</div>
                              <div className="text-xs text-gray-400">{new Date(item.date).toLocaleDateString('fi-FI')}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 mt-2 sm:mt-0">
                            {item.amount && <span className="font-bold text-accent">{item.amount}€</span>}
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${item.status === 'Valmis' ? 'bg-purple-600 text-purple-100' : 'bg-yellow-600 text-yellow-100'}`}>{item.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
              {mainTab === 'sent' && (
                <>
                  {/* Lähetetyt summary cards - vertical */}
                  <div className="flex flex-col gap-4 w-full">
                    <button
                      onClick={() => setSelectedSentType('VARAUSPYYNNÖT')}
                      className={`bg-white/10 rounded-xl p-4 flex flex-col items-center border border-white/10 text-left transition focus:outline-none hover:bg-white/20 active:bg-white/20 ${selectedSentType === 'VARAUSPYYNNÖT' ? 'ring-2 ring-accent border-accent bg-white/20' : ''}`}
                    >
                      <div className="text-2xl font-bold mb-1">{sentBookingRequests.length}</div>
                      <div className="text-xs uppercase tracking-widest font-anton">Varauspyynnöt</div>
                    </button>
                    <button
                      onClick={() => setSelectedSentType('TARJOUKSET')}
                      className={`bg-white/10 rounded-xl p-4 flex flex-col items-center border border-white/10 text-left transition focus:outline-none hover:bg-white/20 active:bg-white/20 ${selectedSentType === 'TARJOUKSET' ? 'ring-2 ring-accent border-accent bg-white/20' : ''}`}
                    >
                      <div className="text-2xl font-bold mb-1">{sentOffers.length}</div>
                      <div className="text-xs uppercase tracking-widest font-anton">Tarjoukset</div>
                    </button>
                  </div>
                </>
              )}
              {mainTab === 'received' && (
                <>
                  {/* Saapuneet: subtabs + palvelut/tarpeet list ONLY */}
                  <div className="flex gap-2 mb-4 mt-4">
                    <button
                      onClick={() => { setSaapuneetSubtab('PALVELUT'); setSelectedPalvelu(null); setSelectedTarve(null); }}
                      className={`px-5 py-2 text-sm uppercase rounded-full transition border font-anton tracking-widest ${saapuneetSubtab === 'PALVELUT' ? 'bg-white text-black border-white' : 'bg-transparent text-white border-white/20 hover:border-white/40'}`}
                    >
                      Omat palvelut
                    </button>
                    <button
                      onClick={() => { setSaapuneetSubtab('TARPEET'); setSelectedPalvelu(null); setSelectedTarve(null); }}
                      className={`px-5 py-2 text-sm uppercase rounded-full transition border font-anton tracking-widest ${saapuneetSubtab === 'TARPEET' ? 'bg-white text-black border-white' : 'bg-transparent text-white border-white/20 hover:border-white/40'}`}
                    >
                      Omat tarpeet
                    </button>
                  </div>
                  <div className="flex flex-col gap-2 pb-6">
                    {saapuneetSubtab === 'PALVELUT' ? (
                      ownPalvelut.length === 0 ? (
                        <div className="text-gray-500 text-xs flex items-center justify-center min-h-[80px]">Ei omia palveluita</div>
                      ) : (
                        ownPalvelut.map((p, i) => (
                          <div
                            key={p.id || i}
                            className={`bg-white/10 rounded-lg p-4 border border-white/10 flex flex-col gap-1 cursor-pointer hover:bg-white/20 transition-all ${selectedPalvelu?.id === p.id ? 'ring-2 ring-accent border-accent bg-white/20' : ''}`}
                            onClick={() => { setSelectedPalvelu(p); setSelectedTarve(null); }}
                          >
                            <div className="font-semibold text-white">{p.title}</div>
                            <div className="text-xs text-gray-400">{p.category}</div>
                            <div className="text-xs text-gray-400">{p.price} €</div>
                            {/* Red dot if any unread bookings for this palvelu */}
                            {receivedBookingRequests.some(b => b.palveluId === p.id && !b.isRead) && (
                              <span className="inline-block mt-1 w-2 h-2 bg-red-500 rounded-full align-middle" />
                            )}
                          </div>
                        ))
                      )
                    ) : (
                      ownTarpeet.length === 0 ? (
                        <div className="text-gray-500 text-xs flex items-center justify-center min-h-[80px]">Ei omia tarpeita</div>
                      ) : (
                        ownTarpeet.map((t, i) => (
                          <div
                            key={t.id || i}
                            className={`bg-white/10 rounded-lg p-4 border border-white/10 flex flex-col gap-1 cursor-pointer hover:bg-white/20 transition-all ${selectedTarve?.id === t.id ? 'ring-2 ring-accent border-accent bg-white/20' : ''}`}
                            onClick={() => { setSelectedTarve(t); setSelectedPalvelu(null); }}
                          >
                            <div className="font-semibold text-white">{t.title}</div>
                            <div className="text-xs text-gray-400">{t.category}</div>
                            <div className="text-xs text-gray-400">{t.budget} €</div>
                            {/* Red dot if any unread offers for this tarve */}
                            {receivedOffers.some(o => o.tarveId === t.id && !o.isRead) && (
                              <span className="inline-block mt-1 w-2 h-2 bg-red-500 rounded-full align-middle" />
                            )}
                          </div>
                        ))
                      )
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
          {/* Right Panel: Shows selected detail view or Saapuneet requests */}
          <div className="flex-1 flex flex-col p-6 overflow-y-auto">
            {mainTab === 'received' ? (
              saapuneetSubtab === 'PALVELUT' && selectedPalvelu ? (
                <BookingRequestList
                  requests={receivedBookingRequests.filter(b => b.palveluId === selectedPalvelu.id)}
                />
              ) : saapuneetSubtab === 'TARPEET' && selectedTarve ? (
                <OfferRequestList
                  offers={receivedOffers.filter(o => o.tarveId === selectedTarve.id)}
                />
              ) : (
                <div className="text-gray-500 text-lg">Valitse vasemmalta nähdäksesi pyynnöt</div>
              )
            ) : (
              rightPanelView === 'earnings' && (
                <div className="w-full max-w-lg mx-auto">
                  <h2 className="text-2xl font-anton uppercase mb-4 text-white">Kokonaistulot</h2>
                  {/* Filter row */}
                  <div className="flex flex-col sm:flex-row gap-2 mb-6 items-stretch sm:items-end">
                    <div className="flex-1 flex gap-2">
                      <select value={filterYear} onChange={e => setFilterYear(Number(e.target.value))} className="bg-black border border-white/20 rounded-lg px-3 py-2 text-white focus:border-accent outline-none w-full">
                        {serviceYears.map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                      <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="bg-black border border-white/20 rounded-lg px-3 py-2 text-white focus:border-accent outline-none w-full">
                        {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                      </select>
                    </div>
                    <button onClick={handleShowStats} className="bg-accent text-black font-anton px-4 py-2 rounded-lg uppercase tracking-widest hover:bg-accent/90 transition">Näytä</button>
                    <button onClick={handleResetFilter} className="bg-white/10 text-white font-anton px-4 py-2 rounded-lg uppercase tracking-widest border border-white/20 hover:bg-white/20 transition">Tyhjennä</button>
                  </div>
                  {/* Stats card */}
                  <div className="bg-white/10 rounded-2xl p-8 mb-6 border border-white/10 flex flex-col items-center">
                    {loadingEarnings ? (
                      <Loader2 className="w-8 h-8 animate-spin text-accent" />
                    ) : (
                      <>
                        <div className="text-5xl font-bold text-white mb-2">{totalEarnings}€</div>
                        <div className="text-sm text-gray-400 mb-2">Kaikki tulot yhteensä</div>
                      </>
                    )}
                  </div>
                  {/* Earnings by period */}
                  <div>
                    <div className="text-xs font-anton uppercase text-gray-400 mb-2">Tulot valitulla ajanjaksolla</div>
                    <div className="divide-y divide-white/10">
                      {filteredStats.length === 0 && !loadingEarnings && (
                        <div className="py-4 text-center text-gray-500">Ei tuloja valitulla ajanjaksolla</div>
                      )}
                      {filteredStats.map((stat, i) => (
                        <div key={i} className="flex justify-between py-2 text-sm">
                          <span className="text-gray-300">{stat.date}</span>
                          <span className="text-white font-bold">{stat.amount}€</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            )}
            {rightPanelView === 'active' && (
              <div className="w-full max-w-2xl mx-auto flex flex-col items-center justify-start min-h-[60vh] relative animate-fade-in">
                <div className="w-full flex flex-col gap-3 mt-2">
                  <div className="flex items-center mb-3">
                    <input
                      type="text"
                      placeholder="Etsi töitä..."
                      value={activeJobsSearch}
                      onChange={e => setActiveJobsSearch(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:border-accent outline-none"
                    />
                  </div>
                  <h2 className="text-2xl font-anton uppercase text-white font-extrabold tracking-widest mb-2">Aktiiviset työt</h2>
                  <div className="flex flex-col gap-4">
                    {filteredActiveJobs.map((job, i) => (
                      <div key={i} className="bg-black/30 rounded-xl p-4 border border-white/10 flex flex-col gap-2 shadow hover:bg-white/10 transition-all duration-200">
                        <div className="flex items-center gap-3 mb-2">
                          <img src={job.palvelu?.photoUrl ? (job.palvelu.photoUrl.startsWith('http') ? job.palvelu.photoUrl : `${BACKEND_URL}${job.palvelu.photoUrl}`) : '/default-thumbnail.svg'} alt="service" className="w-10 h-10 rounded-lg object-cover bg-gray-800" />
                          <div>
                            <div className="font-anton text-base text-white truncate max-w-[120px]">{job.palvelu?.title || job.palveluTitle}</div>
                            <div className="text-xs text-gray-400">{job.palvelu?.category || job.unit || ''}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <User className="w-4 h-4 text-accent" />
                          <span className="text-white">{job.user?.name || job.palveluProviderName || 'Asiakas'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4 text-accent" />
                          <span className="text-white">{new Date(job.date).toLocaleDateString('fi-FI')}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-white font-bold">{job.palvelu?.price ? `${job.palvelu.price}€` : job.price ? `${job.price}€` : 'Ei hintaa'}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold animate-pulse ${job.status === 'PENDING' ? 'bg-yellow-600 text-yellow-100' : 'bg-green-600 text-green-100'}`}>{job.status === 'PENDING' ? 'Odottaa' : 'Hyväksytty'}</span>
                        </div>
                        <div className="flex gap-2 mt-2">
                          <button className="bg-accent text-black font-anton px-3 py-1 rounded-lg uppercase text-xs tracking-widest hover:bg-accent/90 transition">Näytä</button>
                          <button className="bg-white/10 text-white font-anton px-3 py-1 rounded-lg uppercase text-xs tracking-widest border border-white/20 hover:bg-white/20 transition">Viestit</button>
                        </div>
                      </div>
                    ))}
                    {filteredActiveJobs.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-16">
                        <Briefcase className="w-12 h-12 text-gray-700 mb-4" />
                        <div className="text-gray-400 text-lg font-semibold text-center">Ei aktiivisia töitä</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            {rightPanelView === 'pending' && (
              <div className="w-full max-w-2xl mx-auto flex flex-col items-center justify-start min-h-[60vh] relative animate-fade-in mt-2">
                <div className="w-full flex flex-col gap-3">
                  <div className="flex items-center mb-3">
                    <input
                      type="text"
                      placeholder="Etsi töitä..."
                      value={pendingJobsSearch}
                      onChange={e => setPendingJobsSearch(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:border-accent outline-none"
                    />
                  </div>
                  <div className="flex gap-2 mb-2">
                    <button
                      onClick={() => setPendingTab('action')}
                      className={`px-4 py-2 rounded-full font-anton uppercase text-xs tracking-widest border transition focus:outline-none ${pendingTab === 'action' ? 'bg-white text-black border-white' : 'bg-transparent text-white border-white/20 hover:border-white/40'}`}
                    >
                      Sinulta odotetaan
                    </button>
                    <button
                      onClick={() => setPendingTab('waiting')}
                      className={`px-4 py-2 rounded-full font-anton uppercase text-xs tracking-widest border transition focus:outline-none ${pendingTab === 'waiting' ? 'bg-white text-black border-white' : 'bg-transparent text-white border-white/20 hover:border-white/40'}`}
                    >
                      Odottaa vastausta
                    </button>
                  </div>
                  <div className="flex flex-col gap-4">
                    {pendingTab === 'action' ? (
                      filteredPendingProviderAction.length > 0 ? (
                        filteredPendingProviderAction.map((job, i) => (
                          <div key={i} className="bg-black/30 rounded-xl p-4 border border-yellow-600/30 flex flex-col gap-2 shadow hover:bg-white/10 transition-all duration-200">
                            <div className="flex items-center gap-3 mb-2">
                              <img src={job.palvelu?.photoUrl ? (job.palvelu.photoUrl.startsWith('http') ? job.palvelu.photoUrl : `${BACKEND_URL}${job.palvelu.photoUrl}`) : '/default-thumbnail.svg'} alt="service" className="w-10 h-10 rounded-lg object-cover bg-gray-800" />
                              <div>
                                <div className="font-anton text-base text-white truncate max-w-[120px]">{job.palvelu?.title || job.palveluTitle}</div>
                                <div className="text-xs text-gray-400">{job.palvelu?.category || job.unit || ''}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <User className="w-4 h-4 text-accent" />
                              <span className="text-white">{job.user?.name || job.palveluProviderName || 'Asiakas'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Clock className="w-4 h-4 text-accent" />
                              <span className="text-white">{new Date(job.date).toLocaleDateString('fi-FI')}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-white font-bold">{job.palvelu?.price ? `${job.palvelu.price}€` : job.price ? `${job.price}€` : 'Ei hintaa'}</span>
                              <span className="px-2 py-1 rounded-full text-xs font-semibold bg-yellow-600 text-yellow-100">Odottaa hyväksyntää</span>
                            </div>
                            <div className="flex gap-2 mt-2">
                              <button className="bg-accent text-black font-anton px-3 py-1 rounded-lg uppercase text-xs tracking-widest hover:bg-accent/90 transition">Hyväksy</button>
                              <button className="bg-white/10 text-white font-anton px-3 py-1 rounded-lg uppercase text-xs tracking-widest border border-white/20 hover:bg-white/20 transition">Hylkää</button>
                              <button className="bg-white/10 text-white font-anton px-3 py-1 rounded-lg uppercase text-xs tracking-widest border border-white/20 hover:bg-white/20 transition">Viestit</button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="flex flex-col items-center justify-center py-16">
                          <Clock className="w-12 h-12 text-yellow-600 mb-4" />
                          <div className="text-gray-400 text-lg font-semibold text-center">Ei odottavia töitä</div>
                        </div>
                      )
                    ) : (
                      filteredPendingClientWaiting.length > 0 ? (
                        filteredPendingClientWaiting.map((job, i) => (
                          <div key={i} className="bg-black/30 rounded-xl p-4 border border-yellow-600/30 flex flex-col gap-2 shadow hover:bg-white/10 transition-all duration-200">
                            <div className="flex items-center gap-3 mb-2">
                              <img src={job.palvelu?.photoUrl ? (job.palvelu.photoUrl.startsWith('http') ? job.palvelu.photoUrl : `${BACKEND_URL}${job.palvelu.photoUrl}`) : '/default-thumbnail.svg'} alt="service" className="w-10 h-10 rounded-lg object-cover bg-gray-800" />
                              <div>
                                <div className="font-anton text-base text-white truncate max-w-[120px]">{job.palvelu?.title || job.palveluTitle}</div>
                                <div className="text-xs text-gray-400">{job.palvelu?.category || job.unit || ''}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <User className="w-4 h-4 text-accent" />
                              <span className="text-white">{job.palveluProviderName || 'Palveluntarjoaja'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Clock className="w-4 h-4 text-accent" />
                              <span className="text-white">{new Date(job.date).toLocaleDateString('fi-FI')}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-white font-bold">{job.price ? `${job.price}€` : 'Ei hintaa'}</span>
                              <span className="px-2 py-1 rounded-full text-xs font-semibold bg-yellow-600 text-yellow-100">Odottaa palveluntarjoajaa</span>
                            </div>
                            <div className="flex gap-2 mt-2">
                              <button className="bg-accent text-black font-anton px-3 py-1 rounded-lg uppercase text-xs tracking-widest hover:bg-accent/90 transition">Näytä</button>
                              <button className="bg-white/10 text-white font-anton px-3 py-1 rounded-lg uppercase text-xs tracking-widest border border-white/20 hover:bg-white/20 transition">Viestit</button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="flex flex-col items-center justify-center py-16">
                          <Clock className="w-12 h-12 text-yellow-600 mb-4" />
                          <div className="text-gray-400 text-lg font-semibold text-center">Ei odottavia töitä</div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            )}
            {rightPanelView === 'completed' && (
              <div className="w-full max-w-2xl mx-auto flex flex-col items-center justify-start min-h-[60vh] relative animate-fade-in mt-2">
                <div className="w-full flex flex-col gap-3">
                  <div className="flex items-center mb-3">
                    <input
                      type="text"
                      placeholder="Etsi töitä..."
                      value={completedJobsSearch}
                      onChange={e => setCompletedJobsSearch(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:border-accent outline-none"
                    />
                  </div>
                  <h2 className="text-2xl font-anton uppercase text-white font-extrabold tracking-widest mb-2">Valmiit työt</h2>
                  {filteredCompletedProviderJobs.length > 0 && (
                    <>
                      <div className="text-xs uppercase text-accent font-anton mb-2">Omat keikat (tarjoajana)</div>
                      <div className="flex flex-col gap-4 mb-4">
                        {filteredCompletedProviderJobs.map((job, i) => (
                          <div key={i} className="bg-black/30 rounded-xl p-4 border border-purple-600/30 flex flex-col gap-2 shadow hover:bg-white/10 transition-all duration-200">
                            <div className="flex items-center gap-3 mb-2">
                              <img src={job.palvelu?.photoUrl ? (job.palvelu.photoUrl.startsWith('http') ? job.palvelu.photoUrl : `${BACKEND_URL}${job.palvelu.photoUrl}`) : '/default-thumbnail.svg'} alt="service" className="w-10 h-10 rounded-lg object-cover bg-gray-800" />
                              <div>
                                <div className="font-anton text-base text-white truncate max-w-[120px]">{job.palvelu?.title || job.palveluTitle}</div>
                                <div className="text-xs text-gray-400">{job.palvelu?.category || job.unit || ''}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <User className="w-4 h-4 text-accent" />
                              <span className="text-white">{job.user?.name || job.palveluProviderName || 'Asiakas'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Clock className="w-4 h-4 text-accent" />
                              <span className="text-white">{new Date(job.date).toLocaleDateString('fi-FI')}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-white font-bold">{job.palvelu?.price ? `${job.palvelu.price}€` : job.price ? `${job.price}€` : 'Ei hintaa'}</span>
                              <span className="px-2 py-1 rounded-full text-xs font-semibold bg-purple-600 text-purple-100">Valmis</span>
                            </div>
                            <div className="flex gap-2 mt-2">
                              <button className="bg-accent text-black font-anton px-3 py-1 rounded-lg uppercase text-xs tracking-widest hover:bg-accent/90 transition">Näytä</button>
                              <button className="bg-white/10 text-white font-anton px-3 py-1 rounded-lg uppercase text-xs tracking-widest border border-white/20 hover:bg-white/20 transition">Viestit</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                  {filteredCompletedClientJobs.length > 0 && (
                    <>
                      <div className="text-xs uppercase text-accent font-anton mb-2">Omat varaukset (asiakkaana)</div>
                      <div className="flex flex-col gap-4 mb-4">
                        {filteredCompletedClientJobs.map((job, i) => (
                          <div key={i} className="bg-black/30 rounded-xl p-4 border border-purple-600/30 flex flex-col gap-2 shadow hover:bg-white/10 transition-all duration-200">
                            <div className="flex items-center gap-3 mb-2">
                              <img src={job.palvelu?.photoUrl ? (job.palvelu.photoUrl.startsWith('http') ? job.palvelu.photoUrl : `${BACKEND_URL}${job.palvelu.photoUrl}`) : '/default-thumbnail.svg'} alt="service" className="w-10 h-10 rounded-lg object-cover bg-gray-800" />
                              <div>
                                <div className="font-anton text-base text-white truncate max-w-[120px]">{job.palvelu?.title || job.palveluTitle}</div>
                                <div className="text-xs text-gray-400">{job.palvelu?.category || job.unit || ''}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <User className="w-4 h-4 text-accent" />
                              <span className="text-white">{job.palveluProviderName || 'Palveluntarjoaja'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Clock className="w-4 h-4 text-accent" />
                              <span className="text-white">{new Date(job.date).toLocaleDateString('fi-FI')}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-white font-bold">{job.price ? `${job.price}€` : 'Ei hintaa'}</span>
                              <span className="px-2 py-1 rounded-full text-xs font-semibold bg-purple-600 text-purple-100">Valmis</span>
                            </div>
                            <div className="flex gap-2 mt-2">
                              <button className="bg-accent text-black font-anton px-3 py-1 rounded-lg uppercase text-xs tracking-widest hover:bg-accent/90 transition">Näytä</button>
                              <button className="bg-white/10 text-white font-anton px-3 py-1 rounded-lg uppercase text-xs tracking-widest border border-white/20 hover:bg-white/20 transition">Viestit</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                  {filteredCompletedProviderJobs.length === 0 && filteredCompletedClientJobs.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16">
                      <CheckCircle className="w-12 h-12 text-purple-600 mb-4" />
                      <div className="text-gray-400 text-lg font-semibold text-center">Ei valmiita töitä</div>
                    </div>
                  )}
                </div>
              </div>
            )}
            {rightPanelView === 'activity' && (
              <div className="flex-1 flex flex-col items-center justify-start p-6 animate-fade-in w-full">
                <h2 className="text-2xl font-anton uppercase mb-6 text-white">Kaikki viimeaikainen toiminta</h2>
                <div className="space-y-3 max-h-[60vh] overflow-y-auto w-full">
                  {recentActivity.length === 0 && <div className="text-gray-500 text-xs flex items-center justify-center min-h-[200px]">Ei viimeaikaista toimintaa</div>}
                  {recentActivity.map((item, i) => (
                    <div key={i} className="bg-white/10 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between border border-white/10">
                      <div className="flex-1 flex items-center gap-2">
                        {item.icon}
                        <div>
                          <div className="font-semibold">{item.subtitle}: {item.title}</div>
                          <div className="text-xs text-gray-400">{new Date(item.date).toLocaleDateString('fi-FI')}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-2 sm:mt-0">
                        {item.amount && <span className="font-bold text-accent">{item.amount}€</span>}
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${item.status === 'Valmis' ? 'bg-purple-600 text-purple-100' : 'bg-yellow-600 text-yellow-100'}`}>{item.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyWorkPage; 