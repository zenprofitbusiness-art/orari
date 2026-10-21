import React, { useState } from 'react';
import {
  X,
  Calendar,
  Download,
  ChevronLeft,
  ChevronRight,
  Moon,
  Sparkles,
  Info,
  Clock,
  RotateCcw,
} from 'lucide-react';
import { CalculationSettings, LocationData, PrayerTimeItem } from '../types/prayer';
import {
  calculateAllPrayerTimes,
  getHijriDate,
  getHijriMonthDays,
  HIJRI_MONTHS,
  IslamicHolidayInfo,
} from '../utils/prayerEngine';

interface MonthlyScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  location: LocationData;
  settings: CalculationSettings;
}

interface HijriDayItem {
  hijriDay: number;
  date: Date;
  solarDayNum: number;
  solarMonthShort: string;
  solarFullStr: string;
  weekdayShort: string;
  isToday: boolean;
  holiday?: IslamicHolidayInfo;
  prayers: PrayerTimeItem[];
  midnightStr: string;
  lastThirdStr: string;
}

export const MonthlyScheduleModal: React.FC<MonthlyScheduleModalProps> = ({
  isOpen,
  onClose,
  location,
  settings,
}) => {
  // Current active date
  const today = new Date();
  const currentHijriToday = getHijriDate(today);

  // Active viewed Hijri Month & Year
  const [viewedHijriYear, setViewedHijriYear] = useState<number>(currentHijriToday.year);
  const [viewedHijriMonth, setViewedHijriMonth] = useState<number>(currentHijriToday.monthIndex);
  const [activeTab, setActiveTab] = useState<'grid' | 'table' | 'holidays'>('grid');
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  // Active Month Info
  const currentMonthInfo = HIJRI_MONTHS[viewedHijriMonth - 1] || HIJRI_MONTHS[0];

  // Generate the full days of the lunar month (1 to 29 or 30)
  const rawMonthDays = getHijriMonthDays(viewedHijriYear, viewedHijriMonth);

  const monthDays: HijriDayItem[] = rawMonthDays.map((item) => {
    const d = item.date;
    const { prayers, night } = calculateAllPrayerTimes(d, location, settings);

    const isToday =
      today.getFullYear() === d.getFullYear() &&
      today.getMonth() === d.getMonth() &&
      today.getDate() === d.getDate();

    return {
      hijriDay: item.hijriDay,
      date: d,
      solarDayNum: d.getDate(),
      solarMonthShort: d.toLocaleDateString('it-IT', { month: 'short' }),
      solarFullStr: d.toLocaleDateString('it-IT', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
      weekdayShort: d.toLocaleDateString('it-IT', { weekday: 'short' }),
      isToday,
      holiday: item.holiday,
      prayers,
      midnightStr: night.midnight.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      lastThirdStr: night.lastThirdStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  });

  // Calculate leading blanks so day 1 aligns with correct weekday (Lun=0 ... Dom=6)
  const firstDay = monthDays[0];
  const leadingBlankDays = firstDay ? (firstDay.date.getDay() + 6) % 7 : 0;

  // Gregorian interval covered (e.g. "14 Ottobre - 12 Novembre 2026")
  const solarSpanStr =
    monthDays.length > 0
      ? `${monthDays[0].date.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })} - ${monthDays[
          monthDays.length - 1
        ].date.toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })}`
      : '';

  // Currently selected day for bottom detail card (defaults to today if in this month, else day 1)
  const activeSelectedDay =
    selectedDayIndex !== null
      ? monthDays[selectedDayIndex]
      : monthDays.find((d) => d.isToday) || monthDays[0];

  // Navigate Hijri Months
  const handlePrevMonth = () => {
    setSelectedDayIndex(null);
    if (viewedHijriMonth === 1) {
      setViewedHijriMonth(12);
      setViewedHijriYear((y) => y - 1);
    } else {
      setViewedHijriMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    setSelectedDayIndex(null);
    if (viewedHijriMonth === 12) {
      setViewedHijriMonth(1);
      setViewedHijriYear((y) => y + 1);
    } else {
      setViewedHijriMonth((m) => m + 1);
    }
  };

  const handleResetToCurrentMonth = () => {
    setSelectedDayIndex(null);
    setViewedHijriYear(currentHijriToday.year);
    setViewedHijriMonth(currentHijriToday.monthIndex);
  };

  const handleExportCsv = () => {
    const headers = [
      'Giorno Lunare',
      'Mese Lunare',
      'Anno Hijri',
      'Data Solare (Gregoriana)',
      'Festa / Occasione',
      'Fajr (Alba)',
      'Shuruq (Sole)',
      'Dhuhr',
      'Asr',
      'Maghrib (Iftar)',
      'Isha',
      'Metà Notte',
      'Ultimo Terzo (Tahajjud)',
    ];

    const rows = monthDays.map((r) => {
      const getP = (key: string) => r.prayers.find((p) => p.key === key)?.timeString || '--:--';
      return [
        r.hijriDay,
        currentMonthInfo.it,
        viewedHijriYear,
        r.date.toISOString().split('T')[0],
        r.holiday?.name ? `"${r.holiday.name}"` : '""',
        getP('fajr'),
        getP('sunrise'),
        getP('dhuhr'),
        getP('asr'),
        getP('maghrib'),
        getP('isha'),
        r.midnightStr,
        r.lastThirdStr,
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Calendario_Lunare_${currentMonthInfo.it}_${viewedHijriYear}_${location.city}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const weekDays = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

  // Major Islamic holidays guide
  const MAJOR_HOLIDAYS_GUIDE = [
    {
      name: 'Capodanno Islamico (Ra\'s al-Sana)',
      hijriDate: '1 Muharram',
      arabicName: 'رأس السنة الهجرية',
      description: 'Primo giorno del calendario lunare islamico in memoria della migrazione (Hijra) del Profeta da Mecca a Medina.',
      badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300',
    },
    {
      name: 'Giorno di Ashura',
      hijriDate: '10 Muharram',
      arabicName: 'يوم عاشوراء',
      description: 'Giorno sacro in cui Mosè fu salvato. Il digiuno cancella i peccati di un intero anno passato.',
      badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-300',
    },
    {
      name: 'Mawlid an-Nabi',
      hijriDate: '12 Rabi\' al-Awwal',
      arabicName: 'المولد النبوي الشريف',
      description: 'Nascita benedetta del Profeta Muhammad ﷺ, misericordia per l\'umanità.',
      badgeColor: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-300',
    },
    {
      name: 'Isra e Mi\'raj',
      hijriDate: '27 Rajab',
      arabicName: 'الإسراء والمعراج',
      description: 'Il Viaggio Notturno da Mecca a Gerusalemme e l\'Ascensione nei Cieli.',
      badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300',
    },
    {
      name: 'Metà Sha\'ban (Laylat al-Bara\'at)',
      hijriDate: '15 Sha\'ban',
      arabicName: 'ليلة النصف من شعبان',
      description: 'Notte di perdono, preghiera notturna e misericordia prima del Ramadan.',
      badgeColor: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border-teal-300',
    },
    {
      name: 'Inizio del Mese Sacro di Ramadan',
      hijriDate: '1 Ramadan',
      arabicName: 'أول أيام شهر رمضان',
      description: 'Inizio del mese del digiuno sacro dall\'alba al tramonto, del Corano e della carità.',
      badgeColor: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border-amber-300 font-bold',
    },
    {
      name: 'Laylat al-Qadr (Notte del Destino)',
      hijriDate: '27 Ramadan',
      arabicName: 'ليلة القدر المباركة',
      description: 'La Notte del Destino e della discesa del Corano, migliore di mille mesi.',
      badgeColor: 'bg-amber-200 text-amber-950 dark:bg-amber-900 dark:text-amber-200 border-amber-400 font-bold',
    },
    {
      name: 'Eid al-Fitr (Festa di Fine Digiuno)',
      hijriDate: '1 Shawwal',
      arabicName: 'عيد الفطر المبارك',
      description: 'Grande celebrazione islamica per la fine del Ramadan, con preghiera dell\'Eid e Zakat al-Fitr.',
      badgeColor: 'bg-emerald-200 text-emerald-950 dark:bg-emerald-900 dark:text-emerald-200 border-emerald-400 font-bold',
    },
    {
      name: 'Giorno di Arafah',
      hijriDate: '9 Dhu al-Hijjah',
      arabicName: 'يوم عرفة',
      description: 'Il giorno clou del pellegrinaggio Hajj. Il digiuno cancella i peccati di due anni (passato e futuro).',
      badgeColor: 'bg-purple-200 text-purple-950 dark:bg-purple-900 dark:text-purple-200 border-purple-400',
    },
    {
      name: 'Eid al-Adha (Festa del Sacrificio)',
      hijriDate: '10 Dhu al-Hijjah',
      arabicName: 'عيد الأضحى المبارك',
      description: 'La festa del sacrificio in onore del profeta Abramo (Ibrahim), con distribuzione della carne.',
      badgeColor: 'bg-emerald-200 text-emerald-950 dark:bg-emerald-900 dark:text-emerald-200 border-emerald-400 font-bold',
    },
    {
      name: 'Giorni di Tashriq',
      hijriDate: '11, 12, 13 Dhu al-Hijjah',
      arabicName: 'أيام التشريق',
      description: 'Tre giorni di festa, cibo, bevanda e dhikr successivi a Eid al-Adha.',
      badgeColor: 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-300',
    },
    {
      name: 'Giorni Bianchi (Ayyam al-Bid)',
      hijriDate: '13, 14, 15 di ogni mese',
      arabicName: 'أيام البيض',
      description: 'Digiuno raccomandato (Sunnah) nei tre giorni di luna piena di ogni mese lunare.',
      badgeColor: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border-sky-300',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl text-slate-900 dark:text-white overflow-hidden transition-colors">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-2xl shadow-md shrink-0">
              <Moon className="w-5 h-5" />
            </div>
            <div className="truncate">
              <h3 className="text-base sm:text-lg font-bold flex items-center gap-2 truncate">
                <span>Calendario Lunare Islamico (dal 1 al {monthDays.length})</span>
                <span className="text-xs font-serif text-amber-600 dark:text-amber-400 hidden sm:inline">
                  التقويم الهجري
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                Mese lunare dal 1 al {monthDays.length} con corrispondenza solare e feste · {location.city}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleExportCsv}
              title="Esporta orari e calendario in CSV"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Esporta</span> CSV
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* LUNAR MONTH CONTROLLER (Navigatore Mese Lunare) */}
        <div className="p-3 sm:px-6 bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Previous / Next Month Navigator */}
          <div className="flex items-center justify-between w-full md:w-auto gap-3">
            <div className="flex items-center gap-1.5">
              <button
                onClick={handlePrevMonth}
                title="Mese lunare precedente"
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors shadow-2xs"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextMonth}
                title="Mese lunare successivo"
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors shadow-2xs"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Mese Lunare Prominente (1 to 29/30) */}
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-base sm:text-xl font-extrabold text-slate-900 dark:text-white">
                  {currentMonthInfo.it} {viewedHijriYear} AH
                </span>
                <span className="text-sm font-serif text-amber-600 dark:text-amber-400 font-semibold">
                  {currentMonthInfo.ar}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                {solarSpanStr} · {monthDays.length} giorni
              </div>
            </div>

            {/* Pulsante Oggi */}
            <button
              onClick={handleResetToCurrentMonth}
              title="Torna al mese lunare corrente"
              className="px-2.5 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-900/50 rounded-lg hover:bg-indigo-100 transition-colors cursor-pointer shrink-0"
            >
              Mese Corrente
            </button>
          </div>

          {/* Quick Tabs */}
          <div className="flex items-center p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs w-full md:w-auto">
            <button
              onClick={() => setActiveTab('grid')}
              className={`flex-1 md:flex-initial px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'grid'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Griglia Lunare (1-{monthDays.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('table')}
              className={`flex-1 md:flex-initial px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'table'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Tabella Orari</span>
            </button>
            <button
              onClick={() => setActiveTab('holidays')}
              className={`flex-1 md:flex-initial px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'holidays'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Feste Islamiche</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4">
          {/* TAB 1: GRIGLIA MESE LUNARE (1 AL 29/30) */}
          {activeTab === 'grid' && (
            <div className="space-y-3">
              {/* Weekday headers */}
              <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-xs font-bold text-slate-500 dark:text-slate-400">
                {weekDays.map((wd) => (
                  <div key={wd} className="py-1 uppercase tracking-wider text-[11px]">
                    {wd}
                  </div>
                ))}
              </div>

              {/* The Month Grid */}
              <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {/* Leading blank slots before Day 1 */}
                {Array.from({ length: leadingBlankDays }).map((_, i) => (
                  <div
                    key={`blank-${i}`}
                    className="min-h-[80px] sm:min-h-[96px] rounded-2xl bg-slate-100/40 dark:bg-slate-950/20 border border-transparent"
                  />
                ))}

                {/* Day cells (1 to 29 or 30) */}
                {monthDays.map((cell, idx) => {
                  const isSelected =
                    activeSelectedDay &&
                    activeSelectedDay.hijriDay === cell.hijriDay &&
                    activeSelectedDay.date.getTime() === cell.date.getTime();

                  const hasHoliday = !!cell.holiday;
                  const isMajor = cell.holiday?.isMajor;

                  return (
                    <button
                      key={cell.hijriDay}
                      onClick={() => setSelectedDayIndex(idx)}
                      className={`min-h-[80px] sm:min-h-[96px] p-2 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer relative ${
                        cell.isToday
                          ? 'border-2 border-emerald-500 bg-emerald-50/90 dark:bg-emerald-950/50 shadow-md ring-2 ring-emerald-500/20'
                          : isSelected
                          ? 'border-2 border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/50 shadow-xs'
                          : hasHoliday
                          ? isMajor
                            ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800/80 hover:border-amber-400'
                            : 'bg-purple-50/60 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800/60 hover:border-purple-300'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      {/* Top: Giorno lunare (in grande: 1, 2, ..., 29/30) */}
                      <div className="flex items-start justify-between w-full">
                        <span
                          className={`text-lg sm:text-2xl font-extrabold font-mono tabular-nums leading-none ${
                            cell.isToday
                              ? 'text-emerald-700 dark:text-emerald-300'
                              : hasHoliday
                              ? 'text-amber-800 dark:text-amber-300'
                              : 'text-slate-900 dark:text-white'
                          }`}
                        >
                          {cell.hijriDay}
                        </span>

                        {cell.isToday && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
                        )}
                      </div>

                      {/* Middle: Badge Festa Islamica se presente */}
                      {cell.holiday && (
                        <div
                          className={`text-[9px] sm:text-[10px] font-bold px-1 py-0.5 rounded truncate w-full text-center border my-0.5 ${
                            cell.holiday.category === 'eid'
                              ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-100 border-emerald-300'
                              : cell.holiday.category === 'ramadan'
                              ? 'bg-amber-100 text-amber-900 dark:bg-amber-900 dark:text-amber-100 border-amber-300'
                              : cell.holiday.category === 'fast'
                              ? 'bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200 border-sky-300'
                              : 'bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-200 border-purple-300'
                          }`}
                          title={`${cell.holiday.name}: ${cell.holiday.description}`}
                        >
                          {cell.holiday.shortTag}
                        </div>
                      )}

                      {/* Bottom: In basso scrittura piccola numero solare tipo "19 ott" SENZA scritte solare lunare */}
                      <div className="w-full text-right pt-1 border-t border-slate-100 dark:border-slate-800/80">
                        <span
                          className={`text-[11px] font-mono font-semibold block leading-tight ${
                            cell.isToday
                              ? 'text-emerald-800 dark:text-emerald-300'
                              : 'text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          {cell.solarDayNum} {cell.solarMonthShort}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Day Details Card (Selected Day) */}
              {activeSelectedDay && (
                <div className="p-4 bg-gradient-to-br from-slate-50 via-indigo-50/20 to-slate-50 dark:from-slate-950 dark:via-indigo-950/20 dark:to-slate-950 border border-indigo-200/80 dark:border-indigo-900/60 rounded-3xl space-y-3 shadow-sm animate-in fade-in duration-150">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-100 dark:border-indigo-950 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs uppercase tracking-wider font-bold text-indigo-700 dark:text-indigo-400">
                          Giorno {activeSelectedDay.hijriDay} di {currentMonthInfo.it} {viewedHijriYear} AH
                        </span>
                        {activeSelectedDay.isToday && (
                          <span className="px-2 py-0.5 text-[10px] font-bold text-white bg-emerald-600 rounded-md">
                            Oggi
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-baseline gap-2 mt-0.5">
                        <h4 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white capitalize">
                          {activeSelectedDay.solarFullStr}
                        </h4>
                      </div>
                    </div>

                    {activeSelectedDay.holiday && (
                      <div className="p-2 px-3 rounded-xl bg-amber-100 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs">
                        <div className="font-bold flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                          <span>{activeSelectedDay.holiday.name}</span>
                          <span className="font-serif text-[11px]">({activeSelectedDay.holiday.arabicName})</span>
                        </div>
                        <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5">
                          {activeSelectedDay.holiday.description}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Prayer times on this day */}
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold block pb-2">
                      Orari di preghiera ({location.city}):
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 text-center text-xs">
                      {['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'].map((key) => {
                        const p = activeSelectedDay.prayers.find((item) => item.key === key);
                        return (
                          <div
                            key={key}
                            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs"
                          >
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">
                              {p?.name.split(' ')[0] || key}
                            </span>
                            <span className="text-sm font-bold font-mono text-slate-900 dark:text-white">
                              {p?.timeString || '--:--'}
                            </span>
                          </div>
                        );
                      })}

                      <div className="p-2 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-900/60 shadow-2xs">
                        <span className="text-[10px] text-indigo-700 dark:text-indigo-400 block font-medium">
                          Ultimo 1/3
                        </span>
                        <span className="text-sm font-bold font-mono text-indigo-900 dark:text-indigo-300">
                          {activeSelectedDay.lastThirdStr}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: TABELLA ORARI */}
          {activeTab === 'table' && (
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                      <th className="p-3">Giorno Lunare</th>
                      <th className="p-3">Data Solare</th>
                      <th className="p-3">Festa / Occasione</th>
                      <th className="p-3">Fajr (Alba)</th>
                      <th className="p-3">Shuruq</th>
                      <th className="p-3">Dhuhr</th>
                      <th className="p-3">Asr</th>
                      <th className="p-3">Maghrib</th>
                      <th className="p-3">Isha</th>
                      <th className="p-3">Ultimo Terzo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {monthDays.map((row) => {
                      const getP = (key: string) => row.prayers.find((p) => p.key === key)?.timeString || '--:--';
                      return (
                        <tr
                          key={row.hijriDay}
                          className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                            row.isToday
                              ? 'bg-emerald-50/80 dark:bg-emerald-950/40 font-semibold'
                              : row.holiday
                              ? 'bg-amber-50/40 dark:bg-amber-950/20'
                              : ''
                          }`}
                        >
                          <td className="p-3 whitespace-nowrap font-mono font-bold text-slate-900 dark:text-white">
                            {row.hijriDay} {currentMonthInfo.it}
                            {row.isToday && (
                              <span className="ml-1 text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">
                                (Oggi)
                              </span>
                            )}
                          </td>
                          <td className="p-3 whitespace-nowrap font-mono text-slate-600 dark:text-slate-300">
                            {row.solarDayNum} {row.solarMonthShort} ({row.weekdayShort})
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            {row.holiday ? (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-300">
                                {row.holiday.shortTag}
                              </span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="p-3 font-mono font-medium">{getP('fajr')}</td>
                          <td className="p-3 font-mono text-slate-500">{getP('sunrise')}</td>
                          <td className="p-3 font-mono font-medium">{getP('dhuhr')}</td>
                          <td className="p-3 font-mono font-medium">{getP('asr')}</td>
                          <td className="p-3 font-mono font-bold text-emerald-700 dark:text-emerald-400">{getP('maghrib')}</td>
                          <td className="p-3 font-mono font-medium">{getP('isha')}</td>
                          <td className="p-3 font-mono font-semibold text-indigo-700 dark:text-indigo-400">{row.lastThirdStr}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: GUIDA ALLE FESTE ISLAMICHE */}
          {activeTab === 'holidays' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-emerald-950 dark:text-emerald-200">
                    Guida alle Festività e Ricorrenze Islamiche
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Tutte le festività religiose canoniche con il giorno lunare esatto e significato spirituale.
                  </p>
                </div>
                <Sparkles className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {MAJOR_HOLIDAYS_GUIDE.map((h) => (
                  <div
                    key={h.name}
                    className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md border ${h.badgeColor}`}>
                          {h.hijriDate}
                        </span>
                        <h5 className="font-bold text-sm text-slate-900 dark:text-white mt-1.5">
                          {h.name}
                        </h5>
                      </div>
                      <span className="text-xs font-serif text-slate-500 dark:text-slate-400 shrink-0">
                        {h.arabicName}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {h.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
