import React, { useState } from 'react';
import { Clock, Calendar, CheckCircle, AlertTriangle, ArrowRight, Filter, Download, Plus } from 'lucide-react';
import { UserRole } from '../../types';

interface ProjectTimelineViewProps {
  userRole: UserRole;
}

interface ProjectEvent {
  id: string;
  date: string;
  monthTh: string;
  yearTh: number;
  title: string;
  category: 'policy' | 'evaluation' | 'career' | 'capacity' | 'achievement';
  description: string;
  badge: string;
  badgeColor: string;
  keyMetrics?: string;
}

export const ProjectTimelineView: React.FC<ProjectTimelineViewProps> = ({ userRole }) => {
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const events: ProjectEvent[] = [
    {
      id: 'pe-1',
      date: '2026-11-03',
      monthTh: 'พฤศจิกายน',
      yearTh: 2569,
      title: 'ประมวลผลสรุปรายงานผลการดำเนินงานระดับประเทศ ประจำเดือนตุลาคม 2569',
      category: 'evaluation',
      badge: 'รายงานประจำเดือน',
      badgeColor: 'bg-emerald-100 text-emerald-800',
      description: 'ระบบประมวลผลข้อมูลผู้อยู่อาศัย 213 รายทั่วประเทศ อัตราครองเตียง 86.23% และส่งออกข้อมูลผู้ใช้บริการที่มีคะแนน IRP ต่ำกว่า 50% จำนวน 18 ราย เพื่อเข้าสู่กระบวนการฟื้นฟูเร่งด่วน',
      keyMetrics: 'ผู้เข้าอยู่จริง 213 คน · รองรับได้อีก 34 คน',
    },
    {
      id: 'pe-2',
      date: '2026-10-25',
      monthTh: 'ตุลาคม',
      yearTh: 2569,
      title: 'ระบบแจ้งเตือนอัตโนมัติ IRP ต่ำกว่า 50% รายกรณี ณ นิคมฯ ห้วยหลวง',
      category: 'evaluation',
      badge: 'แจ้งเตือน IRP วิกฤต',
      badgeColor: 'bg-rose-100 text-rose-800',
      description: 'ตรวจพบคะแนน IRP ราย นายวิชัย รุ่งอรุณ ได้ 24.28% ส่งสัญญาณเตือนถึงนักสังคมสงเคราะห์ทันที พร้อมจัดทำแผนฟื้นฟูสุขอนามัยและจิตบำบัด',
      keyMetrics: 'IRP 34/140 (24.28%)',
    },
    {
      id: 'pe-3',
      date: '2026-10-15',
      monthTh: 'ตุลาคม',
      yearTh: 2569,
      title: 'ขยายความร่วมมือการจ้างงานคนพิการตามมาตรา 35 สู่นิคมฯ บางระกำ และเชียงพิณ',
      category: 'career',
      badge: 'ส่งเสริมอาชีพ ม.35',
      badgeColor: 'bg-amber-100 text-amber-800',
      description: 'ลงนามความร่วมมือกับภาคเอกชนในการจัดจ้างคนพิการในบ้านน้อยในนิคม เพื่อส่งเสริมทักษะการเกษตรผสมผสานและระบบดูแลน้ำประปา ได้รับค่าตอบแทนตามกฎหมาย',
      keyMetrics: 'สร้างรายได้ 9,943 - 10,250 บาท/เดือน',
    },
    {
      id: 'pe-4',
      date: '2026-09-20',
      monthTh: 'กันยายน',
      yearTh: 2569,
      title: 'โครงการอบรมเชิงปฏิบัติการพัฒนาศักยภาพผู้ดูแลและนักสังคมสงเคราะห์',
      category: 'policy',
      badge: 'พัฒนาบุคลากร',
      badgeColor: 'bg-sky-100 text-sky-800',
      description: 'การใช้เกณฑ์แบบประเมินสมรรถภาพรายบุคคล (IRP 140 คะแนน) และการออกแบบแผนฟื้นฟู 5 มิติ เพื่อมาตรฐานการบริการทางสังคมแบบมุ่งผลสัมฤทธิ์',
      keyMetrics: 'ผู้เข้าร่วมอบรม 120 คน จาก 18 นิคม',
    },
    {
      id: 'pe-5',
      date: '2026-08-10',
      monthTh: 'สิงหาคม',
      yearTh: 2569,
      title: 'เปิดใช้อาคารที่พักอาศัยบ้านน้อยในนิคมเพิ่มเติม ณ นิคมฯ บางระกำ จ.พิษณุโลก',
      category: 'capacity',
      badge: 'ขยายอัตราการรองรับ',
      badgeColor: 'bg-purple-100 text-purple-800',
      description: 'เพิ่มอัตราการรองรับผู้ใช้บริการกลุ่มคนไร้ที่พึ่งและคนพิการที่มีศักยภาพสู่ชุมชน รองรับได้เพิ่ม 10 คน พร้อมแปลงเกษตรกรรมสาธิต',
      keyMetrics: 'ความจุเพิ่มเป็น 20 คน',
    },
    {
      id: 'pe-6',
      date: '2026-05-18',
      monthTh: 'พฤษภาคม',
      yearTh: 2569,
      title: 'จัดตั้งหน่วยสืบหาญาติและตรวจพิสูจน์สถานะทางทะเบียนราษฎรเชิงรุก',
      category: 'achievement',
      badge: 'คุ้มครองสิทธิบุคคล',
      badgeColor: 'bg-teal-100 text-teal-800',
      description: 'บูรณาการร่วมกับกรมการปกครองและสถาบันนิติวิทยาศาสตร์ ในการตรวจลายนิ้วมือและตรวจ DNA สำหรับผู้ใช้บริการที่ไม่มีบัตรประชาชน',
      keyMetrics: 'ช่วยให้ผู้ใช้บริการได้รับบัตรประชาชนแล้ว 89%',
    },
  ];

  const filteredEvents = events.filter((ev) => {
    if (filterCategory === 'all') return true;
    return ev.category === filterCategory;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            ไทม์ไลน์การดำเนินงานโครงการ (Project Milestones Timeline)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            ลำดับเหตุการณ์สำคัญ การขยายผล และความก้าวหน้าการดำเนินโครงการบ้านน้อยในนิคม
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            aria-label="กรองประเภทเหตุการณ์"
            className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-slate-50 font-medium cursor-pointer"
          >
            <option value="all">เหตุการณ์ทั้งหมด</option>
            <option value="evaluation">การประเมิน & รายงานผล</option>
            <option value="career">การส่งเสริมอาชีพ & รายได้</option>
            <option value="capacity">การขยายพื้นที่รองรับ</option>
            <option value="policy">นโยบายและการพัฒนาบุคลากร</option>
            <option value="achievement">สิทธิและสถานะบุคคล</option>
          </select>
        </div>
      </div>

      {/* Timeline Stream */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-3 sm:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {filteredEvents.map((ev) => (
            <div key={ev.id} className="relative group">
              {/* Dot */}
              <div className="absolute -left-6 sm:-left-8 top-1.5 w-6 h-6 rounded-full bg-white border-2 border-amber-600 flex items-center justify-center shadow-xs">
                <span className="w-2 h-2 rounded-full bg-amber-600"></span>
              </div>

              {/* Content Card */}
              <div className="bg-slate-50/80 hover:bg-slate-50 p-4 sm:p-5 rounded-xl border border-slate-200 transition-all shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-2.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${ev.badgeColor}`}>
                      {ev.badge}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">{ev.title}</h3>
                  </div>
                  <span className="text-xs font-medium text-slate-500 font-mono">
                    {ev.date}
                  </span>
                </div>

                <p className="text-xs text-slate-700 mt-2.5 leading-relaxed">
                  {ev.description}
                </p>

                {ev.keyMetrics && (
                  <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-amber-900 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200/60">
                    <span>ผลลัพธ์สำคัญ:</span>
                    <span>{ev.keyMetrics}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
