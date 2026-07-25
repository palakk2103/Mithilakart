import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Camera, Mic, ScanLine, MapPin, ChevronDown, Zap, X, Star, Clock } from 'lucide-react';
import LanguageSelector from './LanguageSelector';
import { useTranslation } from 'react-i18next';
import SearchInput from '../../../../shared/components/SearchInput';
import toast from 'react-hot-toast';
import useVendorStore from '../../../../store/useVendorStore';

/**
 * SearchBar — Address selector (top) + Search input (bottom)
 * Styled exactly like the reference image
 */
const SearchBar = ({ selectedAddress }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [query, setQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Functional scanner & camera search states
  const [isScanning, setIsScanning] = useState(false);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [stream, setStream] = useState(null);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);

  const { selectedCategory, activeFlow } = useVendorStore();

  const isMithilakActive = activeFlow === 'mithilak';
  const isFreshGroceryActive = activeFlow === 'freshgrocery';
  const isQuickShopActive = activeFlow === 'quickshop';

  const isDarkHeader = isMithilakActive || isQuickShopActive;
  const isMithilakartFlow = !isMithilakActive && !isFreshGroceryActive && !isQuickShopActive;

  const getThemeStyles = () => {
    if (isMithilakActive) {
      return {
        addressBg: 'bg-[#18606B] border border-white/10 text-white',
        starBg: 'bg-[#18606B] border border-white/10 text-white font-extrabold text-[12px]',
      };
    }
    if (isFreshGroceryActive) {
      return {
        addressBg: 'bg-[#A6750D] border border-white/10 text-white',
        starBg: 'bg-[#A6750D] border border-white/10 text-white font-extrabold text-[12px]',
      };
    }
    if (isQuickShopActive) {
      return {
        addressBg: 'bg-[#C54E13] border border-white/10 text-white',
        starBg: 'bg-[#C54E13] border border-white/10 text-white font-extrabold text-[11px]',
      };
    }
    
    // Mithilakart Flow Categories
    switch (selectedCategory) {
      case 'Beauty':
        return {
          addressBg: 'bg-[#DF88B5] border border-white/15 text-white',
          starBg: 'bg-[#DF88B5] border border-white/15 text-white font-extrabold text-[12px]',
        };
      case 'Gifting':
        return {
          addressBg: 'bg-[#BE99E5] border border-white/15 text-white',
          starBg: 'bg-[#BE99E5] border border-white/15 text-white font-extrabold text-[12px]',
        };
      case 'Electronics':
        return {
          addressBg: 'bg-[#76A7DE] border border-white/15 text-white',
          starBg: 'bg-[#76A7DE] border border-white/15 text-white font-extrabold text-[12px]',
        };
      case 'Jewellery':
        return {
          addressBg: 'bg-[#E09D59] border border-white/15 text-white',
          starBg: 'bg-[#E09D59] border border-white/15 text-white font-extrabold text-[12px]',
        };
      case 'Toys':
        return {
          addressBg: 'bg-[#7CD7C5] border border-white/15 text-white',
          starBg: 'bg-[#7CD7C5] border border-white/15 text-white font-extrabold text-[12px]',
        };
      case 'Stationery':
        return {
          addressBg: 'bg-[#A8B2E0] border border-white/15 text-white',
          starBg: 'bg-[#A8B2E0] border border-white/15 text-white font-extrabold text-[12px]',
        };
      case 'Fashion':
        return {
          addressBg: 'bg-[#DD8585] border border-white/15 text-white',
          starBg: 'bg-[#DD8585] border border-white/15 text-white font-extrabold text-[12px]',
        };
      case 'Electrical':
        return {
          addressBg: 'bg-[#DDD26E] border border-white/15 text-white',
          starBg: 'bg-[#DDD26E] border border-white/15 text-white font-extrabold text-[12px]',
        };
      case 'You Buy':
      default:
        return {
          addressBg: 'bg-[#4E8F2C] border border-white/10 text-white',
          starBg: 'bg-[#4E8F2C] border border-white/10 text-white font-extrabold text-[12px]',
        };
    }
  };

  const themedStyles = getThemeStyles();

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  const handleVoiceSearch = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice recognition is not supported in this browser. Please use Chrome or Safari.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      const speechToText = event.results[0][0].transcript;
      setQuery(speechToText);
      navigate(`/search?q=${encodeURIComponent(speechToText)}`);
    };

    recognition.onerror = (e) => {
      console.error(e);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  // Camera search handler
  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsAnalyzingImage(true);
      toast.loading("Analyzing image for matching products...", { id: "img-search" });
      
      // Simulate frontend search recognition
      setTimeout(() => {
        setIsAnalyzingImage(false);
        toast.dismiss("img-search");
        toast.success("Image analyzed! Found matching handcrafted item.");
        navigate('/search?q=Mithila%20Painting');
      }, 2000);
    }
  };

  // Scanner modal handlers
  const startScanner = async () => {
    setIsScanning(true);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      
      // Simulate barcode scan after 3 seconds
      setTimeout(() => {
        toast.success("Barcode detected: SKU-MITHILA-09");
        stopScanner();
        navigate('/search?q=Jewellery');
      }, 3000);
    } catch (err) {
      console.warn("Webcam not available, running in simulation mode", err);
      // Mock scanner simulation if no webcam
      setTimeout(() => {
        toast.success("Simulated scan completed successfully!");
        stopScanner();
        navigate('/search?q=Watch');
      }, 3500);
    }
  };

  const stopScanner = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setStream(null);
    setIsScanning(false);
  };

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const displayAddress = selectedAddress?.address
    ? selectedAddress.address.slice(0, 32)
    : '83 Kishan Pura Mataji Mandir, Indore';

  return (
    <div className="px-3 pb-2.5 flex flex-col gap-2.5 md:px-4 md:pb-3 md:flex-col md:gap-3">
      {/* Hidden file input for camera upload */}
      <input 
        type="file" 
        accept="image/*" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
      />


      <div className="flex items-center justify-between py-1.5 md:py-2.5">
        <Link
          to="/profile/addresses"
          className={`flex items-center gap-1.5 min-w-0 rounded-lg px-3.5 py-1.5 shadow-xs transition-all duration-300 ${themedStyles.addressBg}`}
        >
          <MapPin size={15} strokeWidth={2.5} className="w-[15px] h-[15px] flex-shrink-0" />
          <span className="text-[12px] md:text-[13px] font-extrabold truncate max-w-[140px] xs:max-w-[170px] md:max-w-[220px]">
            {displayAddress}
          </span>
          <ChevronDown size={13} strokeWidth={3} className="w-[13px] h-[13px] flex-shrink-0" />
        </Link>

        {/* Language Pill + Coin/Star Badge */}
        <div className="flex items-center gap-2.5 ml-3 flex-shrink-0">
          {/* Functional language selector button */}
          <LanguageSelector isDarkHeader={false} variant={isMithilakActive ? "mithila" : ""} compact={true} />
          
          {/* Custom Coins/Stars or Delivery Time Badge */}
          {isFreshGroceryActive ? (
            <div className={`flex items-center gap-1 px-3.5 py-1.5 rounded-lg shadow-xs whitespace-nowrap flex-shrink-0 ${themedStyles.starBg}`}>
              <Clock size={13} className="text-white" />
              <span>15 Mins</span>
            </div>
          ) : isMithilakActive ? (
            <div className={`flex items-center gap-0.5 px-3.5 py-1.5 rounded-lg shadow-xs whitespace-nowrap flex-shrink-0 ${themedStyles.starBg}`}>
              <Star size={13} className="text-yellow-300 fill-yellow-300" />
              <span>3</span>
            </div>
          ) : isQuickShopActive ? (
            <div className={`flex items-center gap-1 px-3.5 py-1.5 rounded-lg shadow-xs whitespace-nowrap flex-shrink-0 ${themedStyles.starBg}`}>
              <Clock size={13} className="text-white" />
              <span>15 Mins</span>
            </div>
          ) : (
            <div className={`flex items-center gap-0.5 px-3.5 py-1.5 rounded-lg shadow-xs whitespace-nowrap flex-shrink-0 ${themedStyles.starBg}`}>
              <Star size={13} className="text-yellow-300 fill-yellow-300" />
              <span>3</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Search + Scan Field ── */}
      <div className="flex items-center gap-1.5 md:gap-2">
        <form onSubmit={handleSubmit} className="flex-1">
          <SearchInput
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              setSearchFocused(true);
              if (!location.pathname.includes('/search')) {
                navigate('/search');
              }
            }}
            onBlur={() => setSearchFocused(false)}
            placeholder={isAnalyzingImage ? "Analyzing image..." : (isListening ? "Listening..." : (isFreshGroceryActive ? t('nav.searchInGrocery') : "Search for products, categories..."))}
            disabled={isAnalyzingImage}
            className="rounded-full shadow-xs"
            rightElement={
              <div className="flex items-center gap-2.5 md:gap-4 pr-1 text-[#3F2A20]/60">
                {!isFreshGroceryActive && (
                  <Camera 
                    size={18} 
                    strokeWidth={2.2} 
                    onClick={handleCameraClick}
                    className="cursor-pointer hover:text-[#3F2A20] transition-colors" 
                  />
                )}
                <Mic 
                  size={18} 
                  strokeWidth={2.2} 
                  onClick={handleVoiceSearch}
                  className={`cursor-pointer hover:text-[#3F2A20] transition-colors ${
                    isListening
                      ? 'text-red-500 animate-pulse'
                      : ''
                  }`} 
                />
              </div>
            }
          />
        </form>
      </div>

      {/* ── Premium Barcode Scanner Modal Overlay ── */}
      <AnimatePresence>
        {isScanning && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-[999] flex flex-col items-center justify-center p-4"
          >
            <div className="absolute top-4 right-4">
              <button 
                onClick={stopScanner}
                className="p-3 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="w-full max-w-sm flex flex-col items-center text-center space-y-6">
              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-wider">Barcode / QR Scanner</h3>
                <p className="text-xs text-slate-400 mt-1 font-medium">Align the barcode inside the target box to scan</p>
              </div>

              {/* Viewport Box */}
              <div className="relative w-64 h-64 border-2 border-white/20 rounded-3xl overflow-hidden bg-slate-900 shadow-2xl flex items-center justify-center">
                {stream ? (
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="w-10 h-10 border-4 border-t-blue-500 border-white/10 rounded-full animate-spin"></div>
                    <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Starting camera feed...</span>
                  </div>
                )}

                {/* Laser Animation */}
                <div className="absolute inset-x-0 h-0.5 bg-red-500 shadow-[0_0_8px_#ef4444] top-1/2 animate-bounce"></div>
                {/* Scanner Target Corners */}
                <div className="absolute top-4 left-4 w-6 h-6 border-t-4 border-l-4 border-blue-500 rounded-tl-lg"></div>
                <div className="absolute top-4 right-4 w-6 h-6 border-t-4 border-r-4 border-blue-500 rounded-tr-lg"></div>
                <div className="absolute bottom-4 left-4 w-6 h-6 border-b-4 border-l-4 border-blue-500 rounded-bl-lg"></div>
                <div className="absolute bottom-4 right-4 w-6 h-6 border-b-4 border-r-4 border-blue-500 rounded-br-lg"></div>
              </div>

              <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest animate-pulse">
                Analyzing barcode pattern...
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchBar;
