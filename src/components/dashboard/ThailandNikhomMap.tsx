import React, { useState } from 'react';
import { Compass, MapPin, Users, Sparkles, Navigation, Layers, CheckCircle2, AlertCircle } from 'lucide-react';
import { Nikhom } from '../../types';
import thailandProvinces from '../../data/thailandProvincesPath.json';
import neighborCountries from '../../data/neighborCountriesPath.json';

interface ThailandNikhomMapProps {
  nikhoms: Nikhom[];
  onSelectNikhom?: (nikhomId: string) => void;
}

// Thai province name to English GeoJSON feature name mapping
const PROVINCE_THAI_TO_EN: Record<string, string> = {
  'เชียงใหม่': 'Chiang Mai',
  'ลำปาง': 'Lampang',
  'พิษณุโลก': 'Phitsanulok',
  'นครสวรรค์': 'Nakhon Sawan',
  'ลพบุรี': 'Lop Buri',
  'สุพรรณบุรี': 'Suphan Buri',
  'อุดรธานี': 'Udon Thani',
  'หนองบัวลำภู': 'Nong Bua Lam Phu',
  'ขอนแก่น': 'Khon Kaen',
  'มุกดาหาร': 'Mukdahan',
  'นครราชสีมา': 'Nakhon Ratchasima',
  'อุบลราชธานี': 'Ubon Ratchathani',
  'ประจวบคีรีขันธ์': 'Prachuap Khiri Khan',
  'สตูล': 'Satun',
  'สงขลา': 'Songkhla',
};

// Exact English GeoJSON province name to Thai name mapping
const PROVINCE_EN_TO_TH: Record<string, string> = {
  'Chiang Mai': 'เชียงใหม่',
  'Lampang': 'ลำปาง',
  'Phitsanulok': 'พิษณุโลก',
  'Nakhon Sawan': 'นครสวรรค์',
  'Lop Buri': 'ลพบุรี',
  'Suphan Buri': 'สุพรรณบุรี',
  'Udon Thani': 'อุดรธานี',
  'Nong Bua Lam Phu': 'หนองบัวลำภู',
  'Khon Kaen': 'ขอนแก่น',
  'Mukdahan': 'มุกดาหาร',
  'Nakhon Ratchasima': 'นครราชสีมา',
  'Ubon Ratchathani': 'อุบลราชธานี',
  'Prachuap Khiri Khan': 'ประจวบคีรีขันธ์',
  'Satun': 'สตูล',
  'Songkhla': 'สงขลา',
};

// Exact pin positions on the accurate 800 x 1000 province map canvas
const NIKHOM_PRECISE_PINS: Record<string, { x: number; y: number; provinceEn: string; labelOffsetX?: number; labelOffsetY?: number }> = {
  // ภาคเหนือ
  'nk-18': { x: 171, y: 150, provinceEn: 'Chiang Mai', labelOffsetY: -24 },         // ศพพ.เชียงใหม่
  'nk-08': { x: 228, y: 178, provinceEn: 'Lampang', labelOffsetY: -24 },            // กิ่วลม จ.ลำปาง
  'nk-10': { x: 322, y: 236, provinceEn: 'Phitsanulok', labelOffsetY: -24 },        // ทุ่งสาน จ.พิษณุโลก
  'nk-07': { x: 310, y: 268, provinceEn: 'Phitsanulok', labelOffsetX: -40 },        // บางระกำ จ.พิษณุโลก
  // ภาคกลาง
  'nk-13': { x: 274, y: 330, provinceEn: 'Nakhon Sawan', labelOffsetX: -40 },       // ตากฟ้า จ.นครสวรรค์
  'nk-14': { x: 258, y: 396, provinceEn: 'Suphan Buri', labelOffsetX: -42 },        // กระเสียว จ.สุพรรณบุรี
  'nk-05': { x: 363, y: 370, provinceEn: 'Lop Buri', labelOffsetX: 42 },           // ลพบุรี จ.ลพบุรี
  // ภาคตะวันออกเฉียงเหนือ (อีสาน)
  'nk-03': { x: 502, y: 210, provinceEn: 'Udon Thani', labelOffsetY: -24 },         // ห้วยหลวง จ.อุดรธานี
  'nk-01': { x: 522, y: 232, provinceEn: 'Udon Thani', labelOffsetX: 40 },          // เชียงพิณ จ.อุดรธานี
  'nk-04': { x: 464, y: 240, provinceEn: 'Nong Bua Lam Phu', labelOffsetX: -40 },   // โนนสัง จ.หนองบัวลำภู
  'nk-02': { x: 488, y: 288, provinceEn: 'Khon Kaen', labelOffsetY: 24 },           // เขื่อนอุบลรัตน์ จ.ขอนแก่น
  'nk-06': { x: 654, y: 282, provinceEn: 'Mukdahan', labelOffsetX: 40 },           // คำสร้อย จ.มุกดาหาร
  'nk-09': { x: 465, y: 381, provinceEn: 'Nakhon Ratchasima', labelOffsetY: 24 },  // ลำตะคอง จ.นครราชสีมา
  'nk-15': { x: 686, y: 352, provinceEn: 'Ubon Ratchathani', labelOffsetX: 42 },   // ลำโดมน้อย จ.อุบลราชธานี
  'nk-11': { x: 710, y: 375, provinceEn: 'Ubon Ratchathani', labelOffsetY: 24 },   // ลำโดมใหญ่ จ.อุบลราชธานี
  // ภาคใต้
  'nk-12': { x: 246, y: 580, provinceEn: 'Prachuap Khiri Khan', labelOffsetX: 44 }, // ประจวบคีรีขันธ์
  'nk-16': { x: 255, y: 895, provinceEn: 'Satun', labelOffsetX: -44 },              // พัฒนาภาคใต้ จ.สตูล
  'nk-17': { x: 320, y: 871, provinceEn: 'Songkhla', labelOffsetX: 44 },            // รัตภูมิ จ.สงขลา
};

export const ThailandNikhomMap: React.FC<ThailandNikhomMapProps> = ({ nikhoms, onSelectNikhom }) => {
  const [hoveredNikhom, setHoveredNikhom] = useState<Nikhom | null>(nikhoms[0] || null);
  const [hoveredProvinceEn, setHoveredProvinceEn] = useState<string | null>(null);
  const [regionFilter, setRegionFilter] = useState<'all' | 'north' | 'northeast' | 'central' | 'south'>('all');

  const filteredNikhoms = nikhoms.filter((nk) => {
    if (regionFilter === 'all') return true;
    return nk.region === regionFilter;
  });

  const activeNk = hoveredNikhom || nikhoms[0];

  // Group units by province
  const provinceUnitMap = new Map<string, Nikhom[]>();
  nikhoms.forEach((nk) => {
    const provinceEn = PROVINCE_THAI_TO_EN[nk.province];
    if (provinceEn) {
      const list = provinceUnitMap.get(provinceEn) || [];
      list.push(nk);
      provinceUnitMap.set(provinceEn, list);
    }
  });

  /**
   * Heat Map Intensity Calculation Function:
   * Properly handles:
   * 1. Full occupancy (where currentResidents >= capacity, or vacancies === 0) -> High Intensity (#e11d48)
   * 2. High Occupancy Rate (>= 90%) -> Deep crimson/magenta
   * 3. Moderate Occupancy (70% - 89%) -> Medium rose/pink
   * 4. Initial / High Vacancies (< 70%) -> Soft blush pink
   * 5. No project in province -> Crisp subtle light gray-white
   */
  /**
   * Heat Map Intensity Calculation Function:
   * Uses soft, harmonious, professional pastel tones:
   * 1. Full occupancy (currentResidents >= capacity, vacancies === 0) -> Soft peach/coral (#fecdd3 fill, #fb7185 stroke)
   * 2. High Occupancy (75% - 94%) -> Soft warm amber/honey (#fef3c7 fill, #f59e0b stroke)
   * 3. Vacancy Available (< 75%) -> Soft subtle sky/mint (#e0f2fe fill, #38bdf8 stroke)
   * 4. No project in province -> Crisp subtle light off-white (#f8fafc fill, #e2e8f0 stroke)
   */
  const getProvinceHeatStyle = (units: Nikhom[], isSelectedOrHovered: boolean) => {
    if (!units || units.length === 0) {
      return {
        fill: '#f8fafc',
        stroke: '#e2e8f0',
        strokeWidth: 0.8,
        label: 'ไม่มีโครงการในจังหวัด',
        intensity: 'none',
      };
    }

    const totalCapacity = units.reduce((s, u) => s + u.capacity, 0);
    const totalResidents = units.reduce((s, u) => s + u.currentResidents, 0);
    const totalVacancies = Math.max(0, totalCapacity - totalResidents);
    const hasAnyFull = units.some((u) => u.currentResidents >= u.capacity || u.vacancies === 0);
    const isAllFull = totalVacancies === 0 || hasAnyFull;
    const occupancyRate = totalCapacity > 0 ? (totalResidents / totalCapacity) * 100 : 0;

    let fill = '#e0f2fe';
    let stroke = '#7dd3fc';
    let intensity = 'low';

    // Soft, dignified, non-neon palette
    if (isAllFull || occupancyRate >= 95 || totalResidents >= 15) {
      fill = '#fecdd3'; // Soft muted rose/coral
      stroke = '#fb7185';
      intensity = 'full';
    } else if (occupancyRate >= 75 || totalResidents >= 10) {
      fill = '#fef3c7'; // Soft warm amber
      stroke = '#fbbf24';
      intensity = 'moderate';
    } else {
      fill = '#e0f2fe'; // Soft sky blue
      stroke = '#7dd3fc';
      intensity = 'low';
    }

    if (isSelectedOrHovered) {
      stroke = '#0f172a';
      return { fill, stroke, strokeWidth: 2.2, intensity, isAllFull, occupancyRate, totalResidents, totalCapacity };
    }

    return { fill, stroke, strokeWidth: 0.9, intensity, isAllFull, occupancyRate, totalResidents, totalCapacity };
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-amber-600" />
            <h2 className="text-base font-bold text-slate-900">
              แผนที่ประเทศไทย 77 จังหวัด แสดงตำแหน่งที่ตั้งโครงการ "บ้านน้อยในนิคม" 18 แห่ง
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            แผนที่ภูมิศาสตร์จำแนกความพร้อมรองรับและอัตราครองเตียง (แสดงสี Soft สบายตาตามเกณฑ์มาตรฐาน)
          </p>
        </div>

        {/* Region Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs overflow-x-auto">
          {[
            { id: 'all', label: 'ทั่วประเทศ (18)' },
            { id: 'north', label: 'ภาคเหนือ (4)' },
            { id: 'northeast', label: 'ภาคอีสาน (8)' },
            { id: 'central', label: 'ภาคกลาง (3)' },
            { id: 'south', label: 'ภาคใต้ (3)' },
          ].map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setRegionFilter(r.id as any)}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap ${
                regionFilter === r.id
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-4 items-center">
        {/* Left 7 Cols: Complete 77-Province Vector Map of Thailand with verified Satun and Southern Provinces */}
        <div className="lg:col-span-7 relative bg-[#fafbfc] rounded-2xl border border-slate-200/90 p-3 sm:p-5 min-h-[490px] flex items-center justify-center overflow-hidden shadow-inner">
          {/* North Arrow Indicator */}
          <div className="absolute top-3 right-3 pointer-events-none opacity-40 flex flex-col items-center">
            <Navigation className="w-5 h-5 text-slate-500 rotate-12" />
            <span className="text-[9px] font-bold text-slate-400 tracking-widest mt-0.5">N</span>
          </div>

          {/* Choropleth Legend (Soft Elegant Palette) */}
          <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl p-2.5 text-[11px] space-y-1.5 shadow-xs z-10 max-w-[210px]">
            <div className="font-bold text-slate-800 flex items-center gap-1.5 text-[11px]">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>ระดับการครองเตียง</span>
            </div>
            {/* Color Ramp */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-3 h-2.5 rounded-xs bg-[#fecdd3] border border-rose-300 inline-block shrink-0"></span>
                <span className="text-slate-800 font-semibold text-[10px]">เต็มความจุ (100%)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-2.5 rounded-xs bg-[#fef3c7] border border-amber-300 inline-block shrink-0"></span>
                <span className="text-slate-700 text-[10px]">ครองเตียงสูง (75% - 94%)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-2.5 rounded-xs bg-[#e0f2fe] border border-sky-300 inline-block shrink-0"></span>
                <span className="text-slate-600 text-[10px]">มีที่ว่าง (&lt; 75%)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-2.5 rounded-xs bg-[#f8fafc] border border-slate-300 inline-block shrink-0"></span>
                <span className="text-slate-400 text-[10px]">ไม่มีโครงการในจังหวัด</span>
              </div>
            </div>
            <div className="pt-1 border-t border-slate-100 flex items-center gap-2 text-[10px] text-slate-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>เขียว = ว่าง / ส้ม = เต็ม</span>
            </div>
          </div>

          {/* 77-Province SVG Map Canvas with Surrounding International Borders */}
          <div className="relative w-full max-w-[500px] aspect-[800/1000]">
            <svg
              viewBox="0 0 800 1000"
              className="w-full h-full select-none"
              aria-label="แผนที่ 77 จังหวัดของประเทศไทย"
            >
              {/* Surrounding International Country Outlines */}
              <g className="pointer-events-none opacity-45">
                {neighborCountries.map((c, i) => (
                  <path
                    key={`neighbor-${i}`}
                    d={c.d}
                    fill="none"
                    stroke="#cbd5e1"
                    strokeWidth="1.2"
                    strokeDasharray="3 3"
                  />
                ))}
              </g>

              {/* Water Labels */}
              <text x="460" y="670" fontSize="16" fill="#94a3b8" fontWeight="bold" opacity="0.35" textAnchor="middle" letterSpacing="4">
                อ่าวไทย
              </text>
              <text x="140" y="740" fontSize="14" fill="#94a3b8" fontWeight="bold" opacity="0.35" textAnchor="middle" letterSpacing="3">
                ทะเลอันดามัน
              </text>

              {/* All 77 Thailand Provinces Paths */}
              <g>
                {thailandProvinces.map((prov) => {
                  const unitsInProvince = provinceUnitMap.get(prov.name) || [];
                  const hasUnits = unitsInProvince.length > 0;
                  const totalOccupancyInProvince = unitsInProvince.reduce((sum, u) => sum + u.currentResidents, 0);
                  const totalCapacityInProvince = unitsInProvince.reduce((sum, u) => sum + u.capacity, 0);

                  const isProvHovered = hoveredProvinceEn === prov.name;
                  const isUnitSelected = unitsInProvince.some((u) => u.id === activeNk?.id);
                  const isHighlighted = isUnitSelected || isProvHovered;

                  const style = getProvinceHeatStyle(unitsInProvince, isHighlighted);

                  return (
                    <path
                      key={prov.name}
                      d={prov.d}
                      fill={style.fill}
                      stroke={style.stroke}
                      strokeWidth={style.strokeWidth}
                      className="transition-colors duration-150 cursor-pointer hover:opacity-90"
                      onMouseEnter={() => {
                        setHoveredProvinceEn(prov.name);
                        if (hasUnits) {
                          setHoveredNikhom(unitsInProvince[0]);
                        }
                      }}
                      onMouseLeave={() => setHoveredProvinceEn(null)}
                      onClick={() => {
                        if (hasUnits) {
                          setHoveredNikhom(unitsInProvince[0]);
                          if (onSelectNikhom) onSelectNikhom(unitsInProvince[0].id);
                        }
                      }}
                    >
                      <title>
                        {PROVINCE_EN_TO_TH[prov.name] || prov.name}
                        {hasUnits
                          ? ` (${unitsInProvince.map((u) => u.shortName).join(', ')}: อยู่จริง ${totalOccupancyInProvince}/${totalCapacityInProvince} คน${
                              totalOccupancyInProvince >= totalCapacityInProvince ? ' - เต็มความจุ 100%' : ''
                            })`
                          : ''}
                      </title>
                    </path>
                  );
                })}
              </g>

              {/* Thailand Outer Boundary Accent */}
              <g className="pointer-events-none">
                {thailandProvinces.map((prov) => (
                  <path
                    key={`border-${prov.name}`}
                    d={prov.d}
                    fill="none"
                    stroke="#cbd5e1"
                    strokeWidth="0.5"
                  />
                ))}
              </g>
            </svg>

            {/* Interactive Pins Overlay (Exact percentage on 800 x 1000 canvas) */}
            {filteredNikhoms.map((nk) => {
              const pin = NIKHOM_PRECISE_PINS[nk.id];
              if (!pin) return null;

              const leftPercent = (pin.x / 800) * 100;
              const topPercent = (pin.y / 1000) * 100;
              const isSelected = activeNk?.id === nk.id;
              // Proper occupancy check: capacity equals residents means FULL
              const isFull = nk.currentResidents >= nk.capacity || nk.vacancies === 0;
              const hasVacancy = !isFull && nk.vacancies > 0;

              return (
                <div
                  key={nk.id}
                  style={{ left: `${leftPercent}%`, top: `${topPercent}%` }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 transition-transform ${
                    isSelected ? 'z-30 scale-125' : 'z-20 hover:scale-125'
                  }`}
                >
                  <button
                    type="button"
                    onMouseEnter={() => {
                      setHoveredNikhom(nk);
                      setHoveredProvinceEn(pin.provinceEn);
                    }}
                    onFocus={() => {
                      setHoveredNikhom(nk);
                      setHoveredProvinceEn(pin.provinceEn);
                    }}
                    onClick={() => {
                      setHoveredNikhom(nk);
                      setHoveredProvinceEn(pin.provinceEn);
                      if (onSelectNikhom) onSelectNikhom(nk.id);
                    }}
                    className="relative cursor-pointer group focus:outline-none"
                    aria-label={`${nk.name} จ.${nk.province} (${isFull ? 'เต็มความจุ' : `ว่าง ${nk.vacancies} คน`})`}
                  >
                    {/* Pulsing ring on active pin */}
                    {isSelected && (
                      <span
                        className={`absolute -inset-1 rounded-full animate-ping opacity-75 ${
                          hasVacancy ? 'bg-emerald-400' : 'bg-amber-400'
                        }`}
                      />
                    )}

                    {/* Circular Pin Badge showing Occupancy Count (Green if vacant, Amber/Orange if full) */}
                    <span
                      className={`relative flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full text-[9px] sm:text-[10px] font-black text-white shadow-lg border-2 border-white transition-all tabular-nums ${
                        hasVacancy
                          ? isSelected
                            ? 'bg-emerald-600 ring-4 ring-emerald-300'
                            : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/30'
                          : isSelected
                          ? 'bg-amber-600 ring-4 ring-amber-300'
                          : 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/30'
                      }`}
                    >
                      {nk.currentResidents}
                    </span>

                    {/* Clean tooltip label for active or hovered pin */}
                    {(isSelected || hoveredNikhom?.id === nk.id) && (
                      <div className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded-md text-[10px] font-bold shadow-md z-40 pointer-events-none top-7 bg-slate-900 text-white border border-slate-700">
                        {nk.shortName}
                      </div>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 5 Cols: Selected Unit Dossier Card + Fast Unit Directory */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
          {activeNk && (
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-5 rounded-2xl shadow-lg border border-slate-700/80 space-y-4">
              <div className="flex items-start justify-between gap-3 border-b border-slate-700/70 pb-3.5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
                      หน่วยงานที่เลือกบนแผนที่
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white mt-1 leading-snug">
                    {activeNk.name}
                  </h3>
                  <div className="text-xs text-slate-300 flex items-center gap-1.5 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>จังหวัด{activeNk.province} · {activeNk.region === 'north' ? 'ภาคเหนือ' : activeNk.region === 'northeast' ? 'ภาคตะวันออกเฉียงเหนือ' : activeNk.region === 'central' ? 'ภาคกลาง' : 'ภาคใต้'}</span>
                  </div>
                </div>

                <span
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl shrink-0 shadow-xs ${
                    activeNk.currentResidents < activeNk.capacity && activeNk.vacancies > 0
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                  }`}
                >
                  {activeNk.currentResidents < activeNk.capacity && activeNk.vacancies > 0
                    ? `ว่าง ${activeNk.vacancies} ที่`
                    : 'เต็มความจุ'}
                </span>
              </div>

              {/* 3 Large KPI Tiles */}
              <div className="grid grid-cols-3 gap-2.5 text-center">
                <div className="bg-white/10 p-3 rounded-xl border border-white/10 backdrop-blur-xs">
                  <div className="text-[11px] text-slate-300 font-medium">เข้าอยู่จริง</div>
                  <div className="text-2xl font-extrabold text-amber-400 mt-1 tabular-nums">
                    {activeNk.currentResidents}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">คน</div>
                </div>

                <div className="bg-white/10 p-3 rounded-xl border border-white/10 backdrop-blur-xs">
                  <div className="text-[11px] text-slate-300 font-medium">ความจุทั้งหมด</div>
                  <div className="text-2xl font-extrabold text-white mt-1 tabular-nums">
                    {activeNk.capacity}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">คน</div>
                </div>

                <div className="bg-white/10 p-3 rounded-xl border border-white/10 backdrop-blur-xs">
                  <div className="text-[11px] text-slate-300 font-medium">รับได้อีก</div>
                  <div className="text-2xl font-extrabold text-emerald-400 mt-1 tabular-nums">
                    {activeNk.vacancies}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">คน</div>
                </div>
              </div>

              {/* Bed Occupancy Progress Bar */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300">อัตราการครองเตียง</span>
                  <span className="font-extrabold text-white tabular-nums">
                    {((activeNk.currentResidents / activeNk.capacity) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-700/80 rounded-full overflow-hidden p-0.5">
                  <div
                    style={{
                      width: `${Math.min(100, (activeNk.currentResidents / activeNk.capacity) * 100)}%`,
                    }}
                    className={`h-full rounded-full transition-all duration-500 ${
                      activeNk.currentResidents < activeNk.capacity && activeNk.vacancies > 0
                        ? 'bg-emerald-400'
                        : 'bg-amber-400'
                    }`}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Directory of 18 Units */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-3.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2 px-1">
              <span>รายชื่อ 18 หน่วยงาน (แตะเพื่อโฟกัสบนแผนที่)</span>
              <span className="text-[11px] text-slate-400 font-normal">แสดง {filteredNikhoms.length} แห่ง</span>
            </div>
            <div className="max-h-56 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-1.5 pr-1">
              {filteredNikhoms.map((nk) => {
                const isSelected = activeNk?.id === nk.id;
                const isFull = nk.currentResidents >= nk.capacity || nk.vacancies === 0;
                return (
                  <button
                    key={nk.id}
                    type="button"
                    onMouseEnter={() => setHoveredNikhom(nk)}
                    onClick={() => {
                      setHoveredNikhom(nk);
                      if (onSelectNikhom) onSelectNikhom(nk.id);
                    }}
                    className={`p-2 rounded-xl text-left text-xs transition-all cursor-pointer flex items-center justify-between border ${
                      isSelected
                        ? 'bg-rose-50 border-rose-400 text-rose-950 font-semibold shadow-xs'
                        : 'bg-white border-slate-200/80 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <div className="truncate pr-1">
                      <div className="truncate text-[11px]">{nk.shortName}</div>
                      <div className="text-[10px] text-slate-400">จ.{nk.province}</div>
                    </div>
                    <div className="text-right shrink-0 tabular-nums">
                      <div className="text-[11px] font-bold text-slate-900">
                        {nk.currentResidents}/{nk.capacity}
                      </div>
                      <div
                        className={`text-[9px] font-bold ${
                          !isFull ? 'text-emerald-700' : 'text-amber-700'
                        }`}
                      >
                        {!isFull ? `ว่าง ${nk.vacancies}` : 'เต็ม'}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
