import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { QRCodeSVG } from 'qrcode.react';
import { User, CampusEvent, EventRegistration } from '../types';
import { formatEventDateRange } from '../utils/pdfGenerator';
import { 
  CheckCircle2, 
  Calendar, 
  MapPin, 
  Users, 
  ArrowRight, 
  X, 
  QrCode, 
  Copy, 
  Check, 
  Clock, 
  ShieldAlert
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  event: CampusEvent;
  student: User;
  registration: EventRegistration;
  onGoToLeaveForms: () => void;
  onOpenQrScanner: (event: CampusEvent, registration: EventRegistration) => void;
}

export const RegistrationConfirmModal: React.FC<Props> = ({
  isOpen,
  onClose,
  event,
  student: _student,
  registration,
  onGoToLeaveForms,
  onOpenQrScanner
}) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {
        console.error('Confetti error', e);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const dateRangeStr = formatEventDateRange(event.startDate, event.endDate);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(registration.registrationCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Header Card */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 text-white p-6 relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 text-white shadow-inner">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <span className="text-xs uppercase tracking-wider font-semibold text-emerald-100">Registration Confirmed</span>
              <h2 className="text-xl font-bold text-white">You're Registered!</h2>
            </div>
          </div>
          <p className="text-emerald-50 text-sm mt-1">
            Seat confirmed for <span className="font-semibold">{event.title}</span>.
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          
          {/* Unique Registration Pass Card */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-md relative overflow-hidden border border-slate-800">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-purple-400 block">
                  Your Event Entry & Attendance Pass
                </span>
                <span className="text-xs text-slate-400">Unique Registration Number:</span>
                <div className="text-2xl font-black font-mono tracking-wider text-emerald-400 pt-0.5">
                  {registration.registrationCode}
                </div>
                <p className="text-[11px] text-slate-400 pt-1">
                  Keep this ID safe. When you scan the event QR code, you will be prompted to enter this code to mark attendance.
                </p>
              </div>

              <div className="flex flex-col items-center shrink-0">
                <div className="p-2 bg-white rounded-xl shadow-xs">
                  <QRCodeSVG 
                    value={registration.registrationCode} 
                    size={72} 
                    level="M" 
                  />
                </div>
                <button
                  onClick={handleCopyCode}
                  className="mt-2 text-[10px] text-slate-300 hover:text-white flex items-center gap-1 font-mono bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded-md transition-colors"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied' : 'Copy Code'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Critical Leave Form Generation Rule */}
          <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
              <span className="text-xs font-bold text-amber-950 uppercase tracking-wide">
                Leave Form Unlocks via Organizer Clearance & Unique Key
              </span>
            </div>
            <p className="text-xs text-amber-900 leading-relaxed">
              In accordance with university regulations, your <strong>Official Leave Form</strong> and <strong>HOD Leave Application</strong> are generated after the event organizer approves your participation and issues a <strong>Unique Clearance Key</strong>. Once allowed, paste your unique key inside the Leave Forms portal to unlock and generate your documents.
            </p>
          </div>

          {/* Event Quick Info */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-slate-700">
              <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
              <span><strong>Schedule:</strong> {dateRangeStr}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <MapPin className="w-4 h-4 text-rose-600 shrink-0" />
              <span><strong>Venue:</strong> {event.venue}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <Users className="w-4 h-4 text-purple-600 shrink-0" />
              <span><strong>Host:</strong> {event.organizerClub} ({event.organizerName})</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
            <button
              onClick={() => {
                onClose();
                onOpenQrScanner(event, registration);
              }}
              className="w-full sm:flex-1 py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors"
            >
              <QrCode className="w-4 h-4" />
              <span>Scan Event QR Code / Mark Attendance</span>
            </button>
            <button
              onClick={() => {
                onClose();
                onGoToLeaveForms();
              }}
              className="w-full sm:w-auto py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>View in My Leave Forms</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs">
          <span className="text-[11px] text-slate-500 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Attendance Status: <strong className="text-amber-700">Pending Check-in</strong></span>
          </span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 font-semibold text-slate-600 hover:text-slate-800"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
