import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { UserCheck, X, Save, AlertCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onSave: (updates: Partial<User>) => void;
}

export const ProfileEditModal: React.FC<Props> = ({ isOpen, onClose, user, onSave }) => {
  const [name, setName] = useState(user.name || '');
  const [studentId, setStudentId] = useState(user.studentId || '');
  const [course, setCourse] = useState(user.course || '');
  const [department, setDepartment] = useState(user.department || '');
  const [year, setYear] = useState(user.year || '');
  const [universityName, setUniversityName] = useState(user.universityName || 'GLA UNIVERSITY MATHURA');

  useEffect(() => {
    setName(user.name || '');
    setStudentId(user.studentId || '');
    setCourse(user.course || '');
    setDepartment(user.department || '');
    setYear(user.year || '');
    setUniversityName(user.universityName || 'GLA UNIVERSITY MATHURA');
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      studentId,
      course,
      department,
      year,
      universityName,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center text-blue-400">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Student Academic Profile</h3>
              <p className="text-xs text-slate-400">Used to automatically populate HOD leave applications</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <span>
              All fields below are mapped directly into your formal HOD leave application. No fabricated details will ever be submitted.
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Aarav Sharma"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Student ID / Roll No</label>
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                required
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                placeholder="STU-2024-0891"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Year / Semester</label>
              <input
                type="text"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                required
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                placeholder="3rd Year, Semester V"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Course / Program</label>
            <input
              type="text"
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              required
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. B.Tech Computer Science & Engineering"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              required
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Department of Computer Science & Engineering"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">University / Institute</label>
            <input
              type="text"
              value={universityName}
              onChange={(e) => setUniversityName(e.target.value)}
              required
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              placeholder="GLA UNIVERSITY MATHURA"
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl flex items-center gap-1.5 shadow-xs"
            >
              <Save className="w-4 h-4" />
              <span>Save Academic Profile</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
