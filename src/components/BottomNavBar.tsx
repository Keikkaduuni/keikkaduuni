import { Home, Wrench, User, Plus, MessageCircle } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const tabs = [
  { label: "Etusivu", icon: Home, path: "/" },
  { label: "Työt", icon: Wrench, path: "/my-work" },
  { label: "Profiili", icon: User, path: "/profiili" },
];

export default function BottomNavBar({ onClickUusi }: { onClickUusi?: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-black border-t border-white/10 flex justify-between items-center h-16 sm:hidden px-2">
        <button
          onClick={() => navigate("/")}
          className="flex flex-col items-center flex-1 transition-all duration-200"
        >
          <Home className={`w-6 h-6 mb-0.5 ${location.pathname === "/" ? "text-white scale-110" : "text-white/50"}`} />
          <span className={`text-[11px] font-medium ${location.pathname === "/" ? "text-white" : "text-white/50"}`}>Etusivu</span>
        </button>
        <button
          onClick={() => navigate("/viestit")}
          className="flex flex-col items-center flex-1 transition-all duration-200"
        >
          <MessageCircle className={`w-6 h-6 mb-0.5 ${location.pathname.startsWith("/viestit") ? "text-white scale-110" : "text-white/50"}`} />
          <span className={`text-[11px] font-medium ${location.pathname.startsWith("/viestit") ? "text-white" : "text-white/50"}`}>Viestit</span>
        </button>
        <button
          onClick={onClickUusi}
          className="flex flex-col items-center flex-1 transition-all duration-200"
          aria-label="Luo uusi ilmoitus"
        >
          <Plus className={`w-6 h-6 mb-0.5 ${location.pathname === "/uusi" ? "text-white scale-110" : "text-white/50"}`} />
          <span className={`text-[11px] font-medium ${location.pathname === "/uusi" ? "text-white" : "text-white/50"}`}>Uusi</span>
        </button>
        <button
          onClick={() => navigate("/my-work")}
          className="flex flex-col items-center flex-1 transition-all duration-200"
        >
          <Wrench className={`w-6 h-6 mb-0.5 ${location.pathname.startsWith("/my-work") ? "text-white scale-110" : "text-white/50"}`} />
          <span className={`text-[11px] font-medium ${location.pathname.startsWith("/my-work") ? "text-white" : "text-white/50"}`}>Työt</span>
        </button>
        <button
          onClick={() => navigate("/profiili")}
          className="flex flex-col items-center flex-1 transition-all duration-200"
        >
          <User className={`w-6 h-6 mb-0.5 ${location.pathname.startsWith("/profiili") ? "text-white scale-110" : "text-white/50"}`} />
          <span className={`text-[11px] font-medium ${location.pathname.startsWith("/profiili") ? "text-white" : "text-white/50"}`}>Profiili</span>
        </button>
      </nav>
    </div>
  );
} 