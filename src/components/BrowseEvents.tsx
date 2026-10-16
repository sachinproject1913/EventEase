import React, { useState, useEffect, useMemo, useRef } from 'react';
import { User, CampusEvent, EventCategory, SearchFilterParams, EventRegistration } from '../types';
import { apiService } from '../services/apiService';
import { formatEventDateRange } from '../utils/pdfGenerator';
import { 
  Search, 
  X, 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  Filter, 
  ArrowUpDown, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight, 
  FileText, 
  Sparkles,
  Info,
  CalendarDays,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

interface Props {
  currentUser: User;
  onRegisterSuccess: (event: CampusEvent, registration: EventRegistration) => void;
  onGoToLeaveForms: () => void;
}

const CATEGORIES: ('All' | EventCategory)[] = [
  'All',
  'Hackathon',
  'Workshop',
  'Seminar',
  'Cultural',
  'Sports',
  'Technical',
  'Career'
];

export const BrowseEvents: React.FC<Props> = ({ currentUser, onRegisterSuccess, onGoToLeaveForms }) => {
  // Search parameters state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | EventCategory>('All');
  const [selectedDepartment, setSelectedDepartment] = useState('All');
  const [selectedVenue, setSelectedVenue] = useState('All');
  const [dateShortcut, setDateShortcut] = useState<'all' | '7days' | '30days'>('all');
  const [availableOnly, setAvailableOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'upcoming' | 'newest' | 'popularity'>('upcoming');
  const [page, setPage] = useState(0);
  const pageSize = 6;

  // Search results & loading state
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<CampusEvent[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Selected event for details view
  const [selectedEventForModal, setSelectedEventForModal] = useState<CampusEvent | null>(null);

  // Registration loading / error state
  const [isRegistering, setIsRegistering] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Unique filters from dataset
  const departments = useMemo(() => ['All', ...apiService.getUniqueDepartments()], []);
  const venues = useMemo(() => ['All', ...apiService.getUniqueVenues()], []);

  // Debounce timer ref
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Compute date filter strings from shortcut
  const { startDateFilter, endDateFilter } = useMemo(() => {
    const now = new Date();
    if (dateShortcut === '7days') {
      const nextWeek = new Date();
      nextWeek.setDate(now.getDate() + 7);
      return { startDateFilter: now.toISOString(), endDateFilter: nextWeek.toISOString() };
    }
    if (dateShortcut === '30days') {
      const nextMonth = new Date();
      nextMonth.setDate(now.getDate() + 30);
      return { startDateFilter: now.toISOString(), endDateFilter: nextMonth.toISOString() };
    }
    return { startDateFilter: undefined, endDateFilter: undefined };
  }, [dateShortcut]);

  // Execute search function
  const triggerSearch = (resetPage = false) => {
    setLoading(true);
    setErrorMessage(null);

    const activePage = resetPage ? 0 : page;
    if (resetPage) setPage(0);

    const queryParams: SearchFilterParams = {
      q: searchTerm,
      category: selectedCategory,
      department: selectedDepartment,
      venue: selectedVenue,
      startDate: startDateFilter,
      endDate: endDateFilter,
      availableOnly,
      sort: sortBy,
      page: activePage,
      size: pageSize,
    };

    apiService.searchEvents(queryParams)
      .then(res => {
        setSearchResults(res.events);
        setTotalElements(res.totalElements);
        setTotalPages(res.totalPages);
        setLoading(false);
      })
      .catch(err => {
        setErrorMessage(err.message || 'Error fetching events');
        setLoading(false);
      });
  };

  // Debounced search-as-you-type
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      triggerSearch(true);
    }, 280);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchTerm, selectedCategory, selectedDepartment, selectedVenue, dateShortcut, availableOnly, sortBy]);

  // Page changes (direct trigger without reset)
  useEffect(() => {
    triggerSearch(false);
  }, [page]);

  // Reset all filters
  const handleClearAllFilters = () => {
    setSearchTerm('');
    setSelectedCategory('All');
    setSelectedDepartment('All');
    setSelectedVenue('All');
    setDateShortcut('all');
    setAvailableOnly(false);
    setSortBy('upcoming');
    setPage(0);
  };

  // Handle Event Registration
  const handleRegister = (event: CampusEvent) => {
    if (currentUser.role !== 'student') {
      setActionError('Only registered students can participate in event registrations.');
      return;
    }

    setIsRegistering(event.id);
    setActionError(null);

    try {
      const result = apiService.registerForEvent(event.id, currentUser.id);
      setIsRegistering(null);
      // Trigger success workflow
      onRegisterSuccess(result.event, result.registration);
      // Refresh current search view
      triggerSearch(false);
    } catch (err: unknown) {
      setIsRegistering(null);
      setActionError(err instanceof Error ? err.message : 'Registration failed');
    }
  };

  const isAlreadyRegistered = (eventId: string) => {
    return apiService.isStudentRegistered(eventId, currentUser.id);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Banner / Title & Search Hero */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Discover University Events & Hackathons</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Explore, Participate, and Automate Your Leave.
          </h1>
          <p className="text-blue-100/80 text-sm sm:text-base leading-relaxed">
            Search verified campus events, claim your seat with 1-click registration, and instantly download personalized HOD leave applications.
          </p>

          {/* Prominent Search Bar */}
          <div className="pt-2">
            <div className="relative flex items-center bg-white rounded-2xl shadow-2xl p-1.5 focus-within:ring-4 focus-within:ring-blue-400/50 transition-all">
              <Search className="w-6 h-6 text-slate-400 ml-3.5 shrink-0" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search hackathons, workshops, seminars, clubs, or venues…"
                className="w-full px-3 py-3 text-slate-900 placeholder-slate-400 text-sm sm:text-base bg-transparent border-none focus:outline-hidden"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors mr-1"
                  title="Clear search"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={() => triggerSearch(true)}
                className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors shrink-0"
              >
                Search
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Category Chips Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-1 shrink-0">
          Categories:
        </span>
        {CATEGORIES.map(cat => {
          const isActive = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span>{cat}</span>
            </button>
          );
        })}
      </div>

      {/* Advanced Filter & Sorting Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          
          {/* Left filters: Department, Venue, Date, Availability */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
              <Filter className="w-4 h-4 text-slate-400" />
              <span>Filters:</span>
            </div>

            {/* Department Filter */}
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Departments</option>
              {departments.filter(d => d !== 'All').map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>

            {/* Venue Filter */}
            <select
              value={selectedVenue}
              onChange={(e) => setSelectedVenue(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Venues</option>
              {venues.filter(v => v !== 'All').map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>

            {/* Date shortcuts */}
            <div className="inline-flex rounded-xl bg-slate-100 p-0.5 text-xs border border-slate-200">
              <button
                onClick={() => setDateShortcut('all')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${dateShortcut === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Anytime
              </button>
              <button
                onClick={() => setDateShortcut('7days')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${dateShortcut === '7days' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Next 7 Days
              </button>
              <button
                onClick={() => setDateShortcut('30days')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${dateShortcut === '30days' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Next 30 Days
              </button>
            </div>

            {/* Available Only Toggle */}
            <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer select-none ml-1 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors">
              <input
                type="checkbox"
                checked={availableOnly}
                onChange={(e) => setAvailableOnly(e.target.checked)}
                className="rounded-sm text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
              />
              <span className="font-semibold">Available Seats Only</span>
            </label>
          </div>

          {/* Right Sort dropdown */}
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>Sort by:</span>
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'upcoming' | 'newest' | 'popularity')}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-800 font-semibold focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="upcoming">Upcoming Date</option>
              <option value="popularity">Popularity (Most Registered)</option>
              <option value="newest">Newest Added</option>
            </select>
          </div>

        </div>

        {/* Active search filter tags / clear all button */}
        {(searchTerm || selectedCategory !== 'All' || selectedDepartment !== 'All' || selectedVenue !== 'All' || dateShortcut !== 'all' || availableOnly) && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-slate-400">Active filters:</span>
              {searchTerm && (
                <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                  "{searchTerm}"
                </span>
              )}
              {selectedCategory !== 'All' && (
                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                  Category: {selectedCategory}
                </span>
              )}
              {selectedDepartment !== 'All' && (
                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                  {selectedDepartment}
                </span>
              )}
              {selectedVenue !== 'All' && (
                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                  {selectedVenue}
                </span>
              )}
              {availableOnly && (
                <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-medium">
                  Open Seats Only
                </span>
              )}
            </div>
            <button
              onClick={handleClearAllFilters}
              className="text-blue-600 hover:text-blue-800 font-bold hover:underline"
            >
              Reset all filters
            </button>
          </div>
        )}
      </div>

      {/* Global Action Error */}
      {actionError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between text-xs text-red-700">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="text-red-500 hover:text-red-700 font-bold">
            Dismiss
          </button>
        </div>
      )}

      {/* Results Header */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
          {loading ? 'Searching campus events...' : `Found ${totalElements} Events`}
        </span>
        <span className="text-xs text-slate-500">
          Showing Page {page + 1} of {Math.max(1, totalPages)}
        </span>
      </div>

      {/* Loading Skeleton State */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs animate-pulse">
              <div className="h-44 bg-slate-200"></div>
              <div className="p-5 space-y-3">
                <div className="h-4 bg-slate-200 rounded-sm w-1/3"></div>
                <div className="h-6 bg-slate-200 rounded-sm w-3/4"></div>
                <div className="h-4 bg-slate-200 rounded-sm w-full"></div>
                <div className="h-10 bg-slate-200 rounded-xl mt-4"></div>
              </div>
            </div>
          ))}
        </div>
      ) : searchResults.length === 0 ? (
        /* No Results State */
        <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <Search className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">No Matching Events Found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              We couldn't find any events matching your current search query and filters. Try adjusting your search term or clearing filters.
            </p>
          </div>
          <button
            onClick={handleClearAllFilters}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
          >
            Clear All Filters & Show All Events
          </button>
        </div>
      ) : (
        /* Event Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {searchResults.map(event => {
            const registered = isAlreadyRegistered(event.id);
            const isFull = event.registeredCount >= event.maxSeats;
            const percentFilled = Math.min(100, Math.round((event.registeredCount / event.maxSeats) * 100));
            const dateRangeStr = formatEventDateRange(event.startDate, event.endDate);
            const hasOfficialTemplate = event.leaveFormTemplate?.isAvailable;

            return (
              <div 
                key={event.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col group"
              >
                {/* Event Banner */}
                <div className="relative h-44 overflow-hidden bg-slate-800">
                  <img
                    src={event.bannerImage}
                    alt={event.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/30"></div>
                  
                  {/* Category Chip Badge */}
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white/90 backdrop-blur-md text-slate-900 shadow-xs">
                      {event.category}
                    </span>
                  </div>

                  {/* Leave form ready indicator */}
                  <div className="absolute top-3 right-3">
                    {hasOfficialTemplate ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-600/90 backdrop-blur-md text-white shadow-xs">
                        <FileText className="w-3 h-3" />
                        <span>Official Form Ready</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-medium bg-black/50 backdrop-blur-md text-slate-300">
                        Form Pending
                      </span>
                    )}
                  </div>

                  {/* Venue badge on banner */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs">
                    <span className="flex items-center gap-1 text-slate-200 line-clamp-1">
                      <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      {event.venue}
                    </span>
                    <span className="text-[11px] text-slate-300 font-mono">
                      {event.registeredCount}/{event.maxSeats} Seats
                    </span>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2.5">
                    
                    {/* Club & Organizer */}
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="font-semibold text-blue-700 truncate max-w-[200px]">
                        {event.organizerClub}
                      </span>
                      <span className="text-[11px]">{event.department.replace('Department of ', '')}</span>
                    </div>

                    {/* Title */}
                    <h3 className="text-base font-bold text-slate-900 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">
                      {event.title}
                    </h3>

                    {/* Date and time */}
                    <div className="flex items-start gap-2 text-xs text-slate-600">
                      <Calendar className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <span>{dateRangeStr}</span>
                    </div>

                    {/* Registration deadline */}
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>
                        Deadline: {new Date(event.registrationDeadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                      </span>
                    </div>

                    {/* Seats Capacity Progress Bar */}
                    <div className="pt-1 space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-500">Seats Reserved:</span>
                        <span className="font-semibold text-slate-700">{percentFilled}% Filled</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            percentFilled >= 100 
                              ? 'bg-rose-500' 
                              : percentFilled > 80 
                              ? 'bg-amber-500' 
                              : 'bg-blue-600'
                          }`}
                          style={{ width: `${percentFilled}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                    <button
                      onClick={() => setSelectedEventForModal(event)}
                      className="px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200"
                    >
                      Details
                    </button>

                    {registered ? (
                      <button
                        onClick={onGoToLeaveForms}
                        className="flex-1 py-2 px-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Registered &bull; View Leave Form</span>
                      </button>
                    ) : isFull ? (
                      <button
                        disabled
                        className="flex-1 py-2 px-3 bg-slate-100 text-slate-400 rounded-xl text-xs font-bold cursor-not-allowed text-center"
                      >
                        Seats Full
                      </button>
                    ) : (
                      <button
                        onClick={() => handleRegister(event)}
                        disabled={isRegistering === event.id}
                        className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all"
                      >
                        {isRegistering === event.id ? (
                          <span>Registering...</span>
                        ) : (
                          <span>Register</span>
                        )}
                      </button>
                    )}
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <p className="text-xs text-slate-500">
            Page {page + 1} of {totalPages} ({totalElements} total events)
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-slate-800 px-2">
              {page + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="p-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* View Event Details Modal */}
      {selectedEventForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="relative h-48 bg-slate-900 shrink-0">
              <img
                src={selectedEventForModal.bannerImage}
                alt={selectedEventForModal.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>
              <button
                onClick={() => setSelectedEventForModal(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="absolute bottom-4 left-6 right-6 text-white">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white uppercase tracking-wider">
                  {selectedEventForModal.category}
                </span>
                <h2 className="text-xl font-bold mt-1.5 leading-snug">
                  {selectedEventForModal.title}
                </h2>
              </div>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Schedule</span>
                  <p className="font-semibold text-slate-800">
                    {formatEventDateRange(selectedEventForModal.startDate, selectedEventForModal.endDate)}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Venue</span>
                  <p className="font-semibold text-slate-800">{selectedEventForModal.venue}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Organizer</span>
                  <p className="font-semibold text-slate-800">
                    {selectedEventForModal.organizerClub} &bull; {selectedEventForModal.organizerName}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Department</span>
                  <p className="font-semibold text-slate-800">{selectedEventForModal.department}</p>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1.5">About This Event</h4>
                <p className="text-slate-600 leading-relaxed text-xs">
                  {selectedEventForModal.description}
                </p>
              </div>

              {/* Leave Form Workflow Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span className="font-bold text-blue-950 text-xs">CampusGuard Attendance Exemption:</span>
                </div>
                <p className="text-blue-900/90 leading-relaxed text-[11px]">
                  When you register for this event, you will receive a <strong>Unique Registration ID</strong>. Scan the event QR code at the venue and enter your unique registration number to verify attendance. Your official leave form and HOD application are generated and unlocked once your attendance is marked <strong>PRESENT</strong>.
                </p>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center shrink-0">
              <button
                onClick={() => setSelectedEventForModal(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                Close
              </button>
              {isAlreadyRegistered(selectedEventForModal.id) ? (
                <button
                  onClick={() => {
                    setSelectedEventForModal(null);
                    onGoToLeaveForms();
                  }}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold"
                >
                  View My Leave Forms
                </button>
              ) : (
                <button
                  onClick={() => {
                    const evt = selectedEventForModal;
                    setSelectedEventForModal(null);
                    handleRegister(evt);
                  }}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs"
                >
                  Register
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
