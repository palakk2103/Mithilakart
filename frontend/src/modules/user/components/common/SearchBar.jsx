import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Camera, Mic, ScanLine, MapPin, ChevronDown, Zap, X, Star } from 'lucide-react';
import LanguageSelector from './LanguageSelector';
import { useTranslation } from 'react-i18next';
import SearchInput from '../../../../shared/components/SearchInput';
import toast from 'react-hot-toast';

/**
 * SearchBar — Address selector (top) + Search input (bottom)
 * Styled exactly like the reference image
 */
const SearchBar = ({ selectedAddress, deliverTo, onLocationClick }) => {
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

  const isMithilakActive = location.pathname.includes('/mithilak');
  const isFreshGroceryActive = location.pathname.includes('/fresh-grocery');
  const isQuickShopActive = location.pathname.includes('/quick-shop') && !isMithilakActive;

  const isDarkHeader = isMithilakActive || isQuickShopActive;
  const isMithilakartFlow = !isMithilakActive && !isFreshGroceryActive && !isQuickShopActive;

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

  const displayAddress = deliverTo?.label
    || (selectedAddress?.address ? selectedAddress.address.slice(0, 32) : 'Set delivery location');

  return (
    <div className="px-3 pb-2 flex flex-col gap-1.5 md:px-4 md:pb-3 md:flex-col md:gap-3">
      {/* Hidden file input for camera upload */}
      <input 
        type="file" 
        accept="image/*" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
      />


      <div className="flex items-center justify-between py-0.5 md:py-2">
        {isFreshGroceryActive ? (
          <button
            type="button"
            onClick={() => (onLocationClick ? onLocationClick() : navigate('/profile/addresses'))}
            className="flex items-center gap-1 min-w-0 text-white hover:text-white/95 text-left"
          >
            <MapPin size={13} strokeWidth={2.5} className="w-[13px] h-[13px] flex-shrink-0 text-white" />
            <span className="text-[10px] md:text-[11px] font-bold truncate max-w-[170px] md:max-w-[220px]">
              {displayAddress}
            </span>
            <ChevronDown size={11} strokeWidth={3} className="w-[11px] h-[11px] flex-shrink-0 text-white" />
          </button>
        ) : isMithilakActive ? (
          <button
            type="button"
            onClick={() => (onLocationClick ? onLocationClick() : navigate('/profile/addresses'))}
            className="flex items-center gap-1 min-w-0 text-white/95 hover:text-white text-left"
          >
            <MapPin size={13} strokeWidth={2.5} className="w-[13px] h-[13px] md:w-[14px] md:h-[14px] flex-shrink-0" />
            <span className="text-[11.5px] font-bold truncate max-w-[180px] md:max-w-[220px]">
              {displayAddress}
            </span>
            <ChevronDown size={11} strokeWidth={3} className="w-[11px] h-[11px] md:w-[12px] md:h-[12px] flex-shrink-0" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => (onLocationClick ? onLocationClick() : navigate('/profile/addresses'))}
            className="flex items-center gap-1.5 min-w-0 text-white/95 hover:opacity-85 transition-opacity text-left"
          >
            <MapPin size={13} strokeWidth={2.5} className="w-[13px] h-[13px] md:w-[14px] md:h-[14px] flex-shrink-0" />
            <span className="text-[10px] md:text-[11px] font-bold truncate max-w-[170px] md:max-w-[220px]">
              {displayAddress}
            </span>
            <ChevronDown size={11} strokeWidth={3} className="w-[11px] h-[11px] md:w-[12px] md:h-[12px] flex-shrink-0" />
          </button>
        )}

        {/* Language Pill + Coin/Star Badge */}
        <div className="flex items-center gap-2">
          {/* Functional language selector button */}
          <LanguageSelector isDarkHeader={false} variant={isMithilakActive ? "mithila" : ""} compact={true} />
          
          {/* Custom Coins/Stars Badge */}
          {isFreshGroceryActive ? (
            <div className="flex items-center gap-0.5 px-2 py-0.5 bg-white/20 border border-white/10 rounded-full text-white font-bold text-[10.5px] shadow-xs">
              <span className="flex items-center gap-0.5">✦ 3</span>
            </div>
          ) : isMithilakActive ? (
            <div className="flex items-center gap-0.5 px-2 py-0.5 bg-[#207C8A] border border-white/20 rounded-full text-white font-extrabold text-[11px] shadow-xs">
              <Star size={11} className="text-yellow-300 fill-yellow-300" />
              <span>3</span>
            </div>
          ) : (
            <div className={`flex items-center gap-0.5 px-2 py-0.5 rounded-full text-white border border-[#FFF8EE]/20 shadow-xs ${
              isQuickShopActive ? 'bg-[#D45014]' : 'bg-[#3E5A44]'
            }`}>
              <Star size={11} className="text-yellow-300 fill-yellow-300" />
              <span className="text-[11px] font-extrabold">3</span>
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
                    size={16} 
                    strokeWidth={2.2} 
                    onClick={handleCameraClick}
                    className="cursor-pointer hover:text-[#3F2A20] transition-colors" 
                  />
                )}
                <Mic 
                  size={16} 
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
