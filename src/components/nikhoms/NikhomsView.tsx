import React, { useState } from 'react';
import { Building2, Users, MapPin, Search, CheckCircle, AlertCircle, Plus } from 'lucide-react';
import { Nikhom, Beneficiary, UserRole } from '../../types';

interface NikhomsViewProps {
  nikhoms: Nikhom[];
  beneficiaries: Beneficiary[];
  userRole: UserRole;
  onSelectNikhomFilter: (nikhomId: string) => void;
}

export const NikhomsView: React.FC<NikhomsViewProps> = ({
  nikhoms,
  beneficiaries,
  userRole,
  onSelectNikhomFilter,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = nikhoms.filter(
    (n) =>
      n.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.province.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalCapacity = nikhoms.reduce((a, b) => a + b.capacity, 0);
  const totalResidents = nikhoms.reduce((a, b) => a + b.currentResidents, 0);
  const totalVacancies = nikhoms.reduce((a, b) => a + b.vacancies, 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            สถานะนิคมสร้างตนเองและศูนย์พัฒนาศักยภาพ (18 แห่งทั่วประเทศ)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            ติดตามอัตราการรองรับ ผู้เข้าอยู่จริง และโควตาว่างรายพื้นที่เพื่อการจัดสรรผู้ใช้บริการ
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ค้นหาชื่อนิคม หรือจังหวัด..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:border-amber-500 bg-slate-50"
          />
        </div>
      </div>

      {/* Top Quick Stats */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] text-slate-500 font-medium">อัตราการรองรับรวม</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-0.5 tabular-nums">
            {totalCapacity} <span className="text-xs font-normal text-slate-500">คน</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] text-emerald-700 font-medium">เข้าอยู่จริงทั่วประเทศ</div>
          <div className="text-2xl font-extrabold text-emerald-800 mt-0.5 tabular-nums">
            {totalResidents} <span className="text-xs font-normal text-slate-500">คน</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] text-purple-700 font-medium">โควตาคงเหลือว่าง</div>
          <div className="text-2xl font-extrabold text-purple-900 mt-0.5 tabular-nums">
            {totalVacancies} <span className="text-xs font-normal text-slate-500">คน</span>
          </div>
        </div>
      </div>

      {/* Nikhom Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((nk) => {
          const occupancyRate = (nk.currentResidents / nk.capacity) * 100;
          const residentsInNikhom = beneficiaries.filter(
            (b) => b.nikhomId === nk.id && b.status !== 'discharged'
          );
          const under50InNikhom = residentsInNikhom.filter(
            (b) => b.latestIRP?.isUnder50Percent
          ).length;

          return (
            <div
              key={nk.id}
              className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-amber-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 leading-tight">
                      {nk.name}
                    </h3>
                    <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>จังหวัด{nk.province}</span>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      nk.isFull
                        ? 'bg-slate-100 text-slate-700'
                        : 'bg-lime-100 text-lime-900'
                    }`}
                  >
                    {nk.isFull ? 'เต็มความจุ' : `ว่าง ${nk.vacancies} ที่`}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5 my-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-medium">อัตราครองเตียง</span>
                    <span className="font-extrabold text-slate-900 tabular-nums">
                      {nk.currentResidents} / {nk.capacity} คน ({occupancyRate.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${Math.min(100, occupancyRate)}%` }}
                      className={`h-full rounded-full transition-all ${
                        nk.isFull ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                    />
                  </div>
                </div>

                {/* Critical IRP notice in this nikhom */}
                {under50InNikhom > 0 && (
                  <div className="text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-1 rounded-lg border border-rose-100 flex items-center gap-1.5 mt-2">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>มีผู้ใช้บริการ IRP &lt; 50% จำนวน {under50InNikhom} ราย</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => onSelectNikhomFilter(nk.id)}
                  className="text-xs font-semibold text-amber-700 hover:text-amber-900 cursor-pointer"
                >
                  ดูรายชื่อผู้ใช้บริการ ({nk.currentResidents} คน) →
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
