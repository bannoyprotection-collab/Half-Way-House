import React, { useState } from 'react';
import { 
  FileText, Download, Printer, CheckCircle2, 
  Calendar, Building2, Users, AlertTriangle, Sparkles, Send, ShieldCheck
} from 'lucide-react';
import { MonthlyProgressReport, Nikhom, UserRole } from '../../types';
import { exportMonthlyReportToExcel } from '../../services/exportService';

interface MonthlyReportViewProps {
  report: MonthlyProgressReport;
  nikhoms: Nikhom[];
  userRole: UserRole;
  onUpdateReport: (report: MonthlyProgressReport) => void;
}

export const MonthlyReportView: React.FC<MonthlyReportViewProps> = ({
  report,
  nikhoms,
  userRole,
  onUpdateReport,
}) => {
  const [isEditingNarrative, setIsEditingNarrative] = useState(false);
  const [narrativeText, setNarrativeText] = useState(report.executiveSummaryNarrative);

  const handleSaveNarrative = () => {
    onUpdateReport({
      ...report,
      executiveSummaryNarrative: narrativeText,
    });
    setIsEditingNarrative(false);
  };

  const handleApprove = () => {
    onUpdateReport({
      ...report,
      status: 'approved',
      approvedBy: 'ผู้บริหารระดับสูง (ผู้อำนวยการกองฯ)',
    });
  };

  const handleExportExcel = () => {
    exportMonthlyReportToExcel(report, nikhoms);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Bar Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs no-print">
        <div>
          <div className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            ระบบสรุปรายงานผลรายเดือนอัตโนมัติ
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            รายงานผลการดำเนินงานประจำเดือน {report.monthTh} {report.yearTh}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            รวบรวมข้อมูลตัวชี้วัด อัตราครองเตียง ผลผลิต 6 ด้าน และความก้าวหน้าแผนฟื้นฟู IRP
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>ส่งออก Excel</span>
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>พิมพ์ / บันทึกเป็น PDF</span>
          </button>

          {(userRole === 'super_admin' || userRole === 'central_admin') && report.status !== 'approved' && (
            <button
              onClick={handleApprove}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs cursor-pointer transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>อนุมัติรายงานทางการ</span>
            </button>
          )}
        </div>
      </div>

      {/* Official Form Style Document Area (Printable) */}
      <div className="bg-white p-6 sm:p-10 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        {/* Ministry Letterhead */}
        <div className="text-center border-b-2 border-slate-900/80 pb-6 space-y-1">
          <div className="w-12 h-12 mx-auto rounded-full bg-amber-700 text-white flex items-center justify-center font-bold text-xl mb-2">
            พม
          </div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            รายงานผลการดำเนินงาน &ldquo;โครงการบ้านน้อยในนิคม&rdquo;
          </h2>
          <div className="text-xs text-slate-600">
            กรมพัฒนาสังคมและสวัสดิการ กระทรวงการพัฒนาสังคมและความมั่นคงของมนุษย์
          </div>
          <div className="text-xs font-medium text-slate-700 pt-1">
            ประจำเดือน {report.monthTh} พ.ศ. {report.yearTh} · วันที่สรุปรายงาน {report.reportDate}
          </div>
          {report.status === 'approved' && (
            <div className="inline-block mt-2 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-full">
              ✓ ได้รับการอนุมัติรายงานโดย: {report.approvedBy}
            </div>
          )}
        </div>

        {/* Section 1: Executive Summary Narrative */}
        <div className="bg-slate-50/70 p-5 rounded-xl border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>บทสรุปสำหรับผู้บริหาร (Executive Summary)</span>
            </h3>
            {!isEditingNarrative && (
              <button
                onClick={() => setIsEditingNarrative(true)}
                className="text-xs text-amber-700 hover:text-amber-900 font-semibold cursor-pointer no-print"
              >
                แก้ไขข้อความ
              </button>
            )}
          </div>

          {isEditingNarrative ? (
            <div className="space-y-3">
              <textarea
                rows={6}
                value={narrativeText}
                onChange={(e) => setNarrativeText(e.target.value)}
                className="w-full text-xs leading-relaxed border border-slate-300 rounded-xl p-3 bg-white"
              />
              <div className="flex items-center gap-2 justify-end">
                <button
                  onClick={() => setIsEditingNarrative(false)}
                  className="px-3 py-1 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleSaveNarrative}
                  className="px-3 py-1 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg cursor-pointer"
                >
                  บันทึก
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs leading-relaxed text-slate-700 whitespace-pre-line text-justify">
              {report.executiveSummaryNarrative}
            </p>
          )}
        </div>

        {/* Section 2: Key Operational Metrics Table */}
        <div>
          <h3 className="text-sm font-bold text-slate-900 mb-3">
            1. สรุปตัวชี้วัดสำคัญและการใช้ประโยชน์พื้นที่ (Capacity & Occupancy)
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-slate-500 text-[11px]">อัตราการรองรับทั้งหมด</div>
              <div className="text-xl font-extrabold text-slate-900 mt-0.5 tabular-nums">
                {report.totalCapacity} คน
              </div>
            </div>

            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
              <div className="text-emerald-800 text-[11px] font-medium">เข้าอยู่จริง</div>
              <div className="text-xl font-extrabold text-emerald-950 mt-0.5 tabular-nums">
                {report.totalResidents} คน
              </div>
              <div className="text-[10px] text-emerald-700 mt-0.5">
                ชาย {report.maleCount} · หญิง {report.femaleCount}
              </div>
            </div>

            <div className="p-3 bg-purple-50 rounded-xl border border-purple-200">
              <div className="text-purple-800 text-[11px] font-medium">รองรับได้อีก</div>
              <div className="text-xl font-extrabold text-purple-950 mt-0.5 tabular-nums">
                {report.vacanciesCount} คน
              </div>
              <div className="text-[10px] text-purple-700 mt-0.5">อัตราครองเตียง 86.2%</div>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
              <div className="text-amber-800 text-[11px] font-medium">กลุ่มผู้พิการ & ไร้ที่พึ่ง</div>
              <div className="text-xl font-extrabold text-amber-950 mt-0.5 tabular-nums">
                {report.disabledCount + report.destituteCount} คน
              </div>
              <div className="text-[10px] text-amber-700 mt-0.5">
                พิการ {report.disabledCount} (ซ้ำซ้อน {report.multipleDisabledCount}) · ไร้ที่พึ่ง {report.destituteCount}
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Activities & Income */}
        <div>
          <h3 className="text-sm font-bold text-slate-900 mb-3">
            2. ผลผลิต: การดำเนินกิจกรรมสร้างอาชีพและรายได้
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse border border-slate-200">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 font-semibold text-slate-700">
                  <th className="p-2.5 border-r border-slate-200">หมวดกิจกรรม</th>
                  <th className="p-2.5 border-r border-slate-200 text-center">ผู้เข้าร่วม (ราย)</th>
                  <th className="p-2.5 border-r border-slate-200 text-center">การสร้างรายได้</th>
                  <th className="p-2.5">หมายเหตุการดำเนินงาน</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="p-2.5 border-r border-slate-200 font-medium">การเกษตร</td>
                  <td className="p-2.5 border-r border-slate-200 text-center font-bold tabular-nums">{report.activitiesCount.agriculture}</td>
                  <td className="p-2.5 border-r border-slate-200 text-center text-emerald-700 font-semibold">มีผลผลิตต่อเนื่อง</td>
                  <td className="p-2.5 text-slate-600">แปลงผักไฮโดรโปนิกส์ พืชผักสวนครัว และไม้ผล</td>
                </tr>
                <tr>
                  <td className="p-2.5 border-r border-slate-200 font-medium">ปศุสัตว์</td>
                  <td className="p-2.5 border-r border-slate-200 text-center font-bold tabular-nums">{report.activitiesCount.livestock}</td>
                  <td className="p-2.5 border-r border-slate-200 text-center text-emerald-700 font-semibold">จำหน่ายไข่/เนื้อ</td>
                  <td className="p-2.5 text-slate-600">เลี้ยงไก่ไข่ เป็ดเทศ และปลาดุกในบ่อซีเมนต์/บ่อดิน</td>
                </tr>
                <tr>
                  <td className="p-2.5 border-r border-slate-200 font-medium">หัตถกรรม</td>
                  <td className="p-2.5 border-r border-slate-200 text-center font-bold tabular-nums">{report.activitiesCount.handicraft}</td>
                  <td className="p-2.5 border-r border-slate-200 text-center text-emerald-700 font-semibold">ผลิตภัณฑ์ชุมชน</td>
                  <td className="p-2.5 text-slate-600">จักสานตะกร้า พับถุงกระดาษ และทอเสื่อ</td>
                </tr>
                <tr>
                  <td className="p-2.5 border-r border-slate-200 font-medium">งานบริการ / รับจ้าง</td>
                  <td className="p-2.5 border-r border-slate-200 text-center font-bold tabular-nums">
                    {report.activitiesCount.service + report.activitiesCount.wageLabor}
                  </td>
                  <td className="p-2.5 border-r border-slate-200 text-center text-emerald-700 font-semibold">ค่าจ้างรายวัน/เดือน</td>
                  <td className="p-2.5 text-slate-600">งานช่างซ่อมบำรุง ทำความสะอาด และงานบริการตัดผม</td>
                </tr>
                <tr>
                  <td className="p-2.5 border-r border-slate-200 font-medium">เตรียมความพร้อม ม. 35</td>
                  <td className="p-2.5 border-r border-slate-200 text-center font-bold tabular-nums">{report.careerPrepCounts.section35}</td>
                  <td className="p-2.5 border-r border-slate-200 text-center text-emerald-700 font-bold">9,943 - 10,250 บ.</td>
                  <td className="p-2.5 text-slate-600">การจ้างงานคนพิการตามมาตรา 35 พ.ร.บ.ส่งเสริมฯ</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 4: IRP Quality & Rehabilitation Alerts */}
        <div>
          <h3 className="text-sm font-bold text-slate-900 mb-2">
            3. ผลการฟื้นฟูสมรรถภาพรายบุคคล (IRP) และระบบการแจ้งเตือน
          </h3>
          <div className="bg-rose-50/60 p-4 rounded-xl border border-rose-200 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-rose-950 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>จำนวนผู้ใช้บริการที่ตรวจพบ IRP ต่ำกว่า 50%:</span>
              </span>
              <span className="text-base font-extrabold text-rose-700 tabular-nums">
                {report.irpStats.under50Count} ราย
              </span>
            </div>
            <p className="text-rose-800 text-[11px] leading-relaxed">
              * ผู้ใช้บริการกลุ่มนี้ได้รับการส่งสัญญาณแจ้งเตือนไปยังเจ้าหน้าที่ผู้รับผิดชอบเรียบร้อยแล้ว โดยมีการจัดทำแผนฟื้นฟูสมรรถภาพเข้มข้น 5 ด้าน และติดตามประเมินผลซ้ำทุก 1-3 เดือน เพื่อช่วยเหลือฟื้นฟูให้ก้าวพ้นภาวะพึ่งพิง
            </p>
          </div>
        </div>

        {/* Signatures Area */}
        <div className="pt-10 grid grid-cols-2 gap-8 text-center text-xs">
          <div>
            <div className="border-b border-dotted border-slate-400 w-48 mx-auto mb-2 h-6"></div>
            <div className="font-semibold text-slate-800">
              (......................................................)
            </div>
            <div className="text-slate-500 text-[11px] mt-0.5">ผู้รายงาน / นักสังคมสงเคราะห์</div>
          </div>

          <div>
            <div className="border-b border-dotted border-slate-400 w-48 mx-auto mb-2 h-6"></div>
            <div className="font-semibold text-slate-800">
              (......................................................)
            </div>
            <div className="text-slate-500 text-[11px] mt-0.5">ผู้รับรองรายงาน / ผู้อำนวยการ</div>
          </div>
        </div>
      </div>
    </div>
  );
};
