import { useState, useRef, useCallback, useEffect } from 'react';

// FIX: Augment MediaTrackConstraintSet to include the non-standard 'zoom' property.
// This resolves the TypeScript error when calling applyConstraints.
declare global {
  interface MediaTrackConstraintSet {
    zoom?: number;
  }
}

type FacingMode = 'user' | 'environment';

// FIX: Define a type for zoom capabilities, as it's an experimental feature and often missing from default TypeScript DOM type definitions.
// This addresses errors related to the 'zoom' property on MediaTrackCapabilities.
type ZoomCapabilities = {
  min: number;
  max: number;
  step: number;
};

export const useCamera = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<FacingMode>('environment');
  const [isRecording, setIsRecording] = useState(false);
  const [lastCapture, setLastCapture] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  // FIX: Use the custom ZoomCapabilities type for the state, correcting the error on line 15.
  const [zoomCapabilities, setZoomCapabilities] = useState<ZoomCapabilities | null>(null);

  const applyZoom = useCallback(async (newZoom: number) => {
    if (stream && zoomCapabilities) {
      const [track] = stream.getVideoTracks();
      const clampedZoom = Math.max(zoomCapabilities.min, Math.min(zoomCapabilities.max, newZoom));
      try {
        await track.applyConstraints({ advanced: [{ zoom: clampedZoom }] });
        setZoom(clampedZoom);
      } catch (err) {
        console.error("Error applying zoom:", err);
      }
    }
  }, [stream, zoomCapabilities]);

  const initializeCamera = useCallback(async (mode: FacingMode) => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode },
        audio: true, // required for video recording
      });
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
      
      const [track] = newStream.getVideoTracks();
      // FIX: Cast capabilities to include the optional 'zoom' property. This resolves TypeScript errors on lines 46, 47, and 48 when accessing capabilities.zoom.
      const capabilities = track.getCapabilities() as MediaTrackCapabilities & { zoom?: ZoomCapabilities };
      if (capabilities.zoom) {
        setZoomCapabilities(capabilities.zoom);
        setZoom(capabilities.zoom.min);
      } else {
        setZoomCapabilities(null);
        setZoom(1);
      }
      
      setError(null);
    } catch (err) {
      console.error("Error accessing camera:", err);
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        setError('PERMISSION_DENIED');
      } else if (err instanceof Error) {
          setError(`Error accessing camera: ${err.message}. Please grant permission.`);
      } else {
          setError("An unknown error occurred while accessing the camera.");
      }
    }
  }, [stream]);

  useEffect(() => {
    // Cleanup stream on unmount
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const switchCamera = useCallback(() => {
    setFacingMode(prev => {
        const newMode = prev === 'user' ? 'environment' : 'user';
        initializeCamera(newMode);
        return newMode;
    });
  }, [initializeCamera]);

  const takePhoto = useCallback(() => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setLastCapture(dataUrl);
      }
    }
  }, [videoRef]);

  const startRecording = useCallback(() => {
    if (stream && videoRef.current) {
      setIsRecording(true);
      const recordedChunks: Blob[] = [];
      mediaRecorderRef.current = new MediaRecorder(stream);
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunks.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(recordedChunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setLastCapture(url);
      };

      mediaRecorderRef.current.start();
    }
  }, [stream]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  return {
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
  };
};