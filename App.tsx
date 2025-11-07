
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useCamera } from './hooks/useCamera';
import { CameraMode } from './types';
import CameraIcon from './components/CameraIcon';

// Gallery Component
interface GalleryProps {
  capture: string;
  onClose: () => void;
}
const Gallery: React.FC<GalleryProps> = ({ capture, onClose }) => {
  const isVideo = capture.startsWith('blob:');

  return (
    <div 
      className="fixed inset-0 bg-black z-30 flex items-center justify-center" 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <button 
        onClick={onClose} 
        className="absolute top-6 right-6 text-white text-3xl font-bold z-40 w-10 h-10 flex items-center justify-center bg-black bg-opacity-50 rounded-full"
        aria-label="Close gallery"
      >
        &times;
      </button>
      <div className="relative max-w-full max-h-full" onClick={(e) => e.stopPropagation()}>
        {isVideo ? (
          <video src={capture} controls autoPlay className="max-w-[100vw] max-h-[100vh]" />
        ) : (
          <img src={capture} alt="Capture" className="max-w-[100vw] max-h-[100vh]" />
        )}
      </div>
    </div>
  );
};

// Settings Panel Component
interface SettingsPanelProps {
  onClose: () => void;
  onVideoSelect: (file: File) => void;
  onDelayChange: (delay: number) => void;
  delay: number;
  videoName: string | null;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ onClose, onVideoSelect, onDelayChange, delay, videoName }) => {
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-70 z-30 flex items-center justify-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="bg-gray-900 text-white p-6 rounded-lg shadow-xl w-11/12 max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-4 border-b border-gray-700 pb-2">Paramètres de superposition vidéo</h2>
        
        <div className="mb-4">
          <label htmlFor="video-upload" className="block text-sm font-medium text-gray-300 mb-2">
            Choisir une vidéo en superposition
          </label>
          <input 
            id="video-upload"
            type="file" 
            accept="video/*" 
            onChange={(e) => e.target.files && onVideoSelect(e.target.files[0])}
            className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-yellow-400 file:text-black hover:file:bg-yellow-500"
          />
          {videoName && <p className="text-xs text-gray-400 mt-2">Fichier sélectionné : {videoName}</p>}
        </div>

        <div className="mb-6">
          <label htmlFor="delay-input" className="block text-sm font-medium text-gray-300 mb-2">
            Délai de démarrage (secondes)
          </label>
          <input 
            id="delay-input"
            type="number"
            value={delay}
            onChange={(e) => onDelayChange(parseInt(e.target.value, 10))}
            className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            min="0"
          />
        </div>

        <button 
          onClick={onClose}
          className="w-full bg-yellow-400 text-black font-bold py-2 px-4 rounded-lg hover:bg-yellow-500 transition-colors"
        >
          Terminé
        </button>
      </div>
    </div>
  );
};


// Header Component
const CameraHeader: React.FC = () => (
  <header className="absolute top-0 left-0 right-0 h-16 bg-black bg-opacity-40 flex items-center justify-between px-6 z-10">
    <button className="text-white">
      <CameraIcon name="flashOff" className="w-7 h-7" />
    </button>
    <span className="text-yellow-400 text-lg">FHD</span>
    <div className="flex items-center">
      <button className="text-white" aria-label="Paramètres">
        <CameraIcon name="settings" className="w-7 h-7" />
      </button>
    </div>
  </header>
);

// Mode Selector Component
interface ModeSelectorProps {
  currentMode: CameraMode;
  onModeChange: (mode: CameraMode) => void;
}
const ModeSelector: React.FC<ModeSelectorProps> = ({ currentMode, onModeChange }) => {
  const modes = Object.values(CameraMode);
  const modeRefs = useRef<Map<CameraMode, HTMLButtonElement | null>>(new Map());

  useEffect(() => {
    const selectedModeElement = modeRefs.current.get(currentMode);
    if (selectedModeElement) {
      selectedModeElement.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    }
  }, [currentMode]);

  const hideScrollbarStyle: React.CSSProperties = {
    scrollbarWidth: 'none', /* Firefox */
    msOverflowStyle: 'none',  /* IE 10+ */
  };

  return (
    <div
      className="absolute bottom-28 left-0 right-0 z-10 overflow-x-auto snap-x snap-mandatory"
      style={hideScrollbarStyle}
    >
      {/* Note: Hiding scrollbar on Webkit browsers (Chrome, Safari) requires a CSS class with a pseudo-selector, 
          which can't be applied via inline styles. Functionality remains the same. */}
      <div 
        className="flex items-baseline space-x-8 text-white px-[50%]"
      >
        {modes.map((mode) => (
          <div key={mode} className="flex flex-col items-center flex-shrink-0 snap-center">
            <button
              // FIX: The ref callback must not return a value. Using a block body `{...}` ensures an implicit `undefined` return.
              ref={(el) => { modeRefs.current.set(mode, el); }}
              onClick={() => onModeChange(mode)}
              className={`capitalize transition-all duration-300 whitespace-nowrap py-1 ${
                currentMode === mode ? 'text-yellow-400 text-lg' : 'text-gray-300 text-base'
              }`}
            >
              {mode}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};


// Controls Component
interface ControlsProps {
    mode: CameraMode;
    isRecording: boolean;
    lastCapture: string | null;
    onShutter: () => void;
    onSwitchCamera: () => void;
    onPreviewClick: () => void;
    countdownProgress: number | null;
}
const CameraControls: React.FC<ControlsProps> = ({ mode, isRecording, lastCapture, onShutter, onSwitchCamera, onPreviewClick, countdownProgress }) => {
    const showRedDotStyle = mode === CameraMode.Video || mode === CameraMode.Photo || mode === CameraMode.Beauty;
    
    const shutterButton = showRedDotStyle ? (
        <button
            onClick={onShutter}
            className="w-20 h-20 rounded-full bg-transparent border-4 border-white flex items-center justify-center transition-transform duration-200 active:scale-90"
            aria-label={mode === CameraMode.Video ? (isRecording ? 'Stop recording' : 'Start recording') : 'Take photo'}
        >
            <div className={`w-16 h-16 rounded-full bg-red-600 transition-all duration-300 ${isRecording && mode === CameraMode.Video ? 'rounded-md w-10 h-10' : ''}`}></div>
        </button>
    ) : (
        <button
            onClick={onShutter}
            className="w-20 h-20 rounded-full bg-white transition-transform duration-200 active:scale-90"
            aria-label="Take photo"
        />
    );

    const CountdownCircle = ({ progress }: { progress: number }) => {
        const radius = 26; // w-14 is 56px, radius 26 leaves 2px for the stroke on each side
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - progress * circumference;

        return (
            <svg
                className="absolute top-0 left-0 w-full h-full transform -rotate-90 pointer-events-none"
                width="56"
                height="56"
                viewBox="0 0 56 56"
            >
                {/* Dotted background */}
                <circle
                    cx="28" cy="28" r={radius}
                    stroke="rgba(255, 255, 255, 0.3)"
                    strokeWidth="3"
                    fill="transparent"
                    strokeDasharray="4 4"
                />
                {/* Progress arc */}
                <circle
                    cx="28" cy="28" r={radius}
                    stroke="white"
                    strokeWidth="3"
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                />
            </svg>
        );
    };


    return (
        <div className="absolute bottom-0 left-0 right-0 h-28 bg-black bg-opacity-60 flex items-center justify-between px-8 z-10">
            <div className="relative w-14 h-14">
                <button onClick={onPreviewClick} aria-label="Open gallery" className="w-full h-full rounded-full border-2 border-white overflow-hidden bg-black">
                     {lastCapture && <img src={lastCapture.startsWith('blob:') ? '/assets/video_placeholder.png' : lastCapture} alt="Last capture" className="w-full h-full object-cover" />}
                </button>
                {countdownProgress !== null && countdownProgress >= 0 && (
                    <CountdownCircle progress={countdownProgress} />
                )}
            </div>
            {shutterButton}
            <button onClick={onSwitchCamera} className="text-white" aria-label="Switch camera">
                <CameraIcon name="switchCamera" className="w-9 h-9" />
            </button>
        </div>
    );
};

// Main App Component
const App: React.FC = () => {
  const [mode, setMode] = useState<CameraMode>(CameraMode.Photo);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [overlayVideoUrl, setOverlayVideoUrl] = useState<string | null>(null);
  const [overlayVideoName, setOverlayVideoName] = useState<string | null>(null);
  const [overlayDelay, setOverlayDelay] = useState(5); // default 5 seconds
  const [isOverlayPlaying, setIsOverlayPlaying] = useState(false);
  const [countdownProgress, setCountdownProgress] = useState<number | null>(null);
  const countdownIntervalRef = useRef<number | null>(null);

  const {
    videoRef,
    isRecording,
    lastCapture,
    error,
    facingMode,
    initializeCamera,
    takePhoto,
    startRecording,
    stopRecording,
    switchCamera,
    zoom,
    zoomCapabilities,
    applyZoom,
  } = useCamera();

  const pinchStartDistance = useRef(0);
  const pinchStartZoom = useRef(1);
  const swipeGesture = useRef<{startY: number, detected: boolean} | null>(null);

  useEffect(() => {
    initializeCamera(facingMode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Initialize camera on first render
  
  // Cleanup object URL and timers to prevent memory leaks
  useEffect(() => {
    return () => {
      if (overlayVideoUrl) {
        URL.revokeObjectURL(overlayVideoUrl);
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [overlayVideoUrl]);

  const handleShutter = useCallback(() => {
    // If a countdown is in progress, cancel it.
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
      setCountdownProgress(null);
      return;
    }

    if (overlayVideoUrl) {
      const startTime = Date.now();
      const duration = overlayDelay * 1000;
      
      setCountdownProgress(0); // Show the circle immediately

      countdownIntervalRef.current = window.setInterval(() => {
        const elapsedTime = Date.now() - startTime;
        const progress = Math.min(elapsedTime / duration, 1);
        setCountdownProgress(progress);

        if (progress >= 1) {
          clearInterval(countdownIntervalRef.current!);
          countdownIntervalRef.current = null;
          setCountdownProgress(null); // Hide circle
          setIsOverlayPlaying(true);
        }
      }, 1000 / 60); // ~60fps for smooth animation
      return;
    }

    if (mode === CameraMode.Video) {
      if (isRecording) {
        stopRecording();
      } else {
        startRecording();
      }
    } else {
      takePhoto();
    }
  }, [mode, isRecording, stopRecording, startRecording, takePhoto, overlayVideoUrl, overlayDelay]);

  const handleRetry = useCallback(() => {
      initializeCamera(facingMode);
  }, [initializeCamera, facingMode]);
  
  const handleVideoSelect = (file: File) => {
    if (overlayVideoUrl) {
      URL.revokeObjectURL(overlayVideoUrl);
    }
    setOverlayVideoUrl(URL.createObjectURL(file));
    setOverlayVideoName(file.name);
  };


  const getDistance = (touches: React.TouchList) => {
    const [touch1, touch2] = [touches[0], touches[1]];
    return Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
  };

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLVideoElement>) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      pinchStartDistance.current = getDistance(e.touches);
      pinchStartZoom.current = zoom;
      swipeGesture.current = { startY: (e.touches[0].clientY + e.touches[1].clientY) / 2, detected: false };
    }
  }, [zoom]);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLVideoElement>) => {
    if (e.touches.length === 2 && pinchStartDistance.current > 0) {
      e.preventDefault();
      const newDistance = getDistance(e.touches);
      const scale = newDistance / pinchStartDistance.current;
      const newZoom = pinchStartZoom.current * scale;
      applyZoom(newZoom);
    }
    
    // Two-finger swipe down logic to open settings
    if (e.touches.length === 2 && swipeGesture.current && !swipeGesture.current.detected) {
      const currentY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      const deltaY = currentY - swipeGesture.current.startY;
      const SWIPE_DOWN_THRESHOLD = 150; // pixels

      if (deltaY > SWIPE_DOWN_THRESHOLD) {
        setIsSettingsOpen(true);
        swipeGesture.current.detected = true; // Prevent re-triggering
      }
    }
  }, [applyZoom]);
  
  const handleTouchEnd = useCallback(() => {
    pinchStartDistance.current = 0;
    swipeGesture.current = null;
  }, []);

  return (
    <div className="relative h-screen w-screen bg-black overflow-hidden font-sans">
      <CameraHeader />

      {isSettingsOpen && (
        <SettingsPanel 
          onClose={() => setIsSettingsOpen(false)}
          onVideoSelect={handleVideoSelect}
          onDelayChange={setOverlayDelay}
          delay={overlayDelay}
          videoName={overlayVideoName}
        />
      )}

      {isGalleryOpen && lastCapture && (
        <Gallery capture={lastCapture} onClose={() => setIsGalleryOpen(false)} />
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-80 text-white text-center p-4 z-20">
          {error === 'PERMISSION_DENIED' ? (
            <div>
              <h2 className="text-xl font-bold mb-2">Accès à la caméra et au micro refusé</h2>
              <p className="mb-2">Cette application nécessite l'accès à votre caméra et à votre microphone pour prendre des photos et enregistrer des vidéos.</p>
              <p>Veuillez accorder l'autorisation dans les paramètres de votre navigateur et cliquer sur "Réessayer".</p>
               <button
                onClick={handleRetry}
                className="mt-4 px-4 py-2 bg-yellow-400 text-black font-bold rounded-lg hover:bg-yellow-500 transition-colors"
              >
                Réessayer
              </button>
            </div>
          ) : (
            <div>
              <h2 className="text-xl font-bold mb-2">Erreur de caméra</h2>
              <p className="mb-4">{error}</p>
              <button
                onClick={handleRetry}
                className="px-4 py-2 bg-yellow-400 text-black font-bold rounded-lg hover:bg-yellow-500 transition-colors"
              >
                Réessayer
              </button>
            </div>
          )}
        </div>
      )}
      
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />

      {isOverlayPlaying && overlayVideoUrl && (
        <video
          key={overlayVideoUrl}
          src={overlayVideoUrl}
          autoPlay
          onEnded={() => setIsOverlayPlaying(false)}
          className="absolute inset-0 w-full h-full object-cover z-20"
        />
      )}

      {zoomCapabilities && (
        <div className="absolute bottom-[12.5rem] left-1/2 -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm z-10 pointer-events-none">
          {zoom.toFixed(1)}x
        </div>
      )}
      
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/50 pointer-events-none"></div>

      <ModeSelector currentMode={mode} onModeChange={setMode} />
      <CameraControls 
        mode={mode}
        isRecording={isRecording}
        lastCapture={lastCapture}
        onShutter={handleShutter}
        onSwitchCamera={switchCamera}
        onPreviewClick={() => lastCapture && setIsGalleryOpen(true)}
        countdownProgress={countdownProgress}
      />
    </div>
  );
};

export default App;
