import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, ScanLine, Keyboard, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
  title?: string;
  placeholder?: string;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onScan,
  title = 'Pindai Barcode / QR Code',
  placeholder = 'Contoh: WPL-000001 atau 202410101'
}) => {
  const [manualInput, setManualInput] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Play pleasant beep sound upon successful barcode scan
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.12);
    } catch (e) {
      // ignore audio context restrictions
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      playBeep();
      onScan(manualInput.trim());
      setManualInput('');
      onClose();
    }
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: any) {
      setCameraError('Tidak dapat mengakses kamera perangkat. Silakan gunakan input barcode manual.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setManualInput('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <ScanLine className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-base">{title}</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-5">
            {/* Camera View Area */}
            {isCameraActive ? (
              <div className="relative rounded-xl overflow-hidden bg-black aspect-4/3 flex items-center justify-center border border-slate-800">
                <video ref={videoRef} className="w-full h-full object-cover" />
                {/* Laser animation scanner overlay */}
                <div className="absolute inset-0 border-2 border-blue-500/50 pointer-events-none flex flex-col justify-center items-center">
                  <div className="w-3/4 h-1/2 border-2 border-dashed border-emerald-400 rounded-lg relative">
                    <div className="absolute inset-x-0 top-0 h-0.5 bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse" />
                  </div>
                  <p className="text-white text-xs mt-3 bg-black/60 px-3 py-1 rounded-full">
                    Arahkan barcode / QR buku ke dalam kotak
                  </p>
                </div>
                <button
                  type="button"
                  onClick={stopCamera}
                  className="absolute top-3 right-3 bg-black/70 hover:bg-black text-white p-1.5 rounded-full"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-6 text-center bg-slate-50 dark:bg-slate-900/30 flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-3">
                  <Camera className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Gunakan Kamera Perangkat</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mt-1 mb-4">
                  Pindai barcode fisik pada punggung buku atau kartu anggota menggunakan kamera.
                </p>
                <button
                  type="button"
                  onClick={startCamera}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors shadow-xs"
                >
                  <Camera className="w-4 h-4" />
                  Buka Kamera Pemindai
                </button>
                {cameraError && (
                  <p className="text-xs text-rose-500 mt-2">{cameraError}</p>
                )}
              </div>
            )}

            {/* Quick Manual / USB Scanner Input */}
            <form onSubmit={handleManualSubmit} className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5 font-medium">
                  <Keyboard className="w-3.5 h-3.5" />
                  Input Barcode Manual / USB Scanner
                </span>
                <span className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400">
                  <Volume2 className="w-3 h-3" />
                  Audio feedback aktif
                </span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder={placeholder}
                  autoFocus
                  className="flex-1 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 font-semibold text-xs rounded-xl transition-colors shrink-0"
                >
                  Verifikasi
                </button>
              </div>
            </form>
          </div>

          <div className="px-6 py-3 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 text-right">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            >
              Tutup
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
