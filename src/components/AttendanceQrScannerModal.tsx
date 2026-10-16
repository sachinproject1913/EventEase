import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import { CampusEvent, EventRegistration } from '../types';
import { apiService } from '../services/apiService';
import { 
  QrCode, 
  CheckCircle2, 
  X, 
  AlertCircle, 
  Sparkles, 
  Calendar, 
  MapPin, 
  FileText
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  event: CampusEvent;
  registration: EventRegistration;
  onAttendanceVerified: () => void;
}

export const AttendanceQrScannerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  event,
  registration,
  onAttendanceVerified
}) => {
  const [enteredCode, setEnteredCode] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  if (!isOpen) return null;

  const isAlreadyPresent = registration.attendanceStatus === 'present';
  const qrDataValue = JSON.stringify({
    campusGuardEventId: event.id,
    eventTitle: event.title,
    venue: event.venue,
    secret: event.eventSecretCode || `CG-QR-${event.id}`,
    timestamp: Date.now()
  });

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!enteredCode.trim()) {
      setErrorMessage('Please enter your unique registration number.');
      return;
    }

    setIsVerifying(true);

    setTimeout(() => {
      const result = apiService.markAttendanceWithQr(
        registration.studentId,
        event.id,
        enteredCode
      );

      setIsVerifying(false);

      if (result.success) {
        setSuccessMessage(result.message);
        try {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
          });
        } catch {
          // ignore
        }
        onAttendanceVerified();
      } else {
        setErrorMessage(result.message);
      }
    }, 400);
  };

  const handleAutoFillMyCode = () => {
    setEnteredCode(registration.registrationCode);
    setErrorMessage(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/30 border border-purple-400/40 flex items-center justify-center text-purple-400">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Event Attendance Check-in</h3>
              <p className="text-xs text-slate-400">Scan QR Code & Validate Unique Registration ID</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          
          {/* Event Mini Banner */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md">
              {event.category}
            </span>
            <h4 className="text-sm font-bold text-slate-900 leading-snug">
              {event.title}
            </h4>
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600 pt-0.5">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                {new Date(event.startDate).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-rose-600" />
                {event.venue}
              </span>
            </div>
          </div>

          {/* If already marked present */}
          {isAlreadyPresent ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-emerald-950">
                  Attendance Already Verified!
                </h4>
                <p className="text-xs text-emerald-800 mt-1">
                  You are confirmed <strong>PRESENT</strong> for this event. Your official leave form and personalized letter are unlocked and ready to download.
                </p>
                {registration.attendanceMarkedAt && (
                  <span className="text-[11px] text-emerald-700 block mt-1 font-mono">
                    Verified at: {new Date(registration.attendanceMarkedAt).toLocaleString()}
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
              >
                Done & View Leave Forms
              </button>
            </div>
          ) : (
            /* Active QR Attendance Verification Flow */
            <div className="space-y-4">
              
              {/* Event QR Code Display */}
              <div className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-3">
                <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-200">
                  <QRCodeSVG 
                    value={qrDataValue} 
                    size={140}
                    level="H"
                    includeMargin={true}
                  />
                </div>
                <div className="text-xs text-slate-600">
                  <span className="font-bold text-slate-900 block text-xs">
                    Official Venue Attendance QR Code
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Displayed at event check-in desk at {event.venue}
                  </span>
                </div>
              </div>

              {/* Requirement Rule Callout */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>University Attendance Policy:</strong> Official leave applications are released only after you attend the event and authenticate with your unique registration number.
                </span>
              </div>

              {/* Prompt to enter Unique Registration Number */}
              <form onSubmit={handleVerify} className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-800">
                      Enter Your Unique Registration Number:
                    </label>
                    <button
                      type="button"
                      onClick={handleAutoFillMyCode}
                      className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold underline flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Auto-fill My Code</span>
                    </button>
                  </div>
                  
                  <input
                    type="text"
                    value={enteredCode}
                    onChange={(e) => setEnteredCode(e.target.value)}
                    placeholder="e.g. CG-REG-XXXX-X"
                    className="w-full text-center tracking-widest font-mono text-base font-bold px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500 uppercase"
                  />
                  
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1 px-1">
                    <span>Your Assigned Code:</span>
                    <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
                      {registration.registrationCode}
                    </span>
                  </div>
                </div>

                {errorMessage && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {successMessage && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{successMessage}</span>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isVerifying}
                    className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors"
                  >
                    {isVerifying ? (
                      <span>Validating Presence...</span>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Verify Registration ID & Mark Attendance</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs">
          <span className="text-[11px] text-slate-500 flex items-center gap-1">
            <FileText className="w-3.5 h-3.5" />
            <span>Leave Form unlocks once marked Present</span>
          </span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 font-semibold text-slate-600 hover:text-slate-800 rounded-lg"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
