import React from 'react';
import { 
  Sprout, Egg, Scissors, Wrench, Briefcase, HeartHandshake, 
  Banknote, Award, Users, TrendingUp, DollarSign, Building2
} from 'lucide-react';
import { MonthlySnapshotData } from '../../types';

interface ActivitiesAndEmploymentBreakdownProps {
  snapshot: MonthlySnapshotData;
}

export const ActivitiesAndEmploymentBreakdown: React.FC<ActivitiesAndEmploymentBreakdownProps> = ({
  snapshot,
}) => {
  const { activitiesCount, employmentAndIncomeSummary } = snapshot;

  // Breakdown of 6 Occupational Therapy Activities
  const occupationalTherapyItems = [
    {
      id: 'agriculture',
      name: 'การเกษตร',
      description: 'ปลูกผักไฮโดรโปนิกส์, เพาะเห็ดนางฟ้า, พืชผักสวนครัว',
      icon: Sprout,
      color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      barColor: 'bg-emerald-500',
      participants: activitiesCount.agriculture || 18,
      incomeBaht: 22500,
    },
    {
      id: 'livestock',
      name: 'ปศุสัตว์',
      description: 'เลี้ยงไก่ไข่อารมณ์ดี, เพาะเลี้ยงปลาดุกในบ่อซีเมนต์',
      icon: Egg,
      color: 'text-amber-700 bg-amber-50 border-amber-200',
      barColor: 'bg-amber-500',
      participants: activitiesCount.livestock || 7,
      incomeBaht: 9800,
    },
    {
      id: 'handicraft',
      name: 'หัตถกรรม / งานฝีมือ',
      description: 'จักสานเส้นพลาสติก, ถักไหมพรม, ผลิตภัณฑ์ชุมชน',
      icon: HeartHandshake,
      color: 'text-teal-700 bg-teal-50 border-teal-200',
      barColor: 'bg-teal-500',
      participants: activitiesCount.handicraft || 5,
      incomeBaht: 6200,
    },
    {
      id: 'service',
      name: 'งานบริการ',
      description: 'ล้างรถ, จัดสถานที่, บริการชุมชนและอาคารสถานที่',
      icon: Scissors,
      color: 'text-purple-700 bg-purple-50 border-purple-200',
      barColor: 'bg-purple-500',
      participants: activitiesCount.service || 4,
      incomeBaht: 5000,
    },
    {
      id: 'wageLabor',
      name: 'รับจ้างทั่วไป',
      description: 'รับจ้างทำความสะอาด, ดูแลภูมิทัศน์และสวนหย่อม',
      icon: Briefcase,
      color: 'text-sky-700 bg-sky-50 border-sky-200',
      barColor: 'bg-sky-500',
      participants: activitiesCount.wageLabor || 3,
      incomeBaht: 3300,
    },
    {
      id: 'other',
      name: 'อื่นๆ (ซ่อมบำรุง / แปรรูป)',
      description: 'ซ่อมแซมอุปกรณ์พื้นฐาน, แปรรูปผลผลิตทางการเกษตร',
      icon: Wrench,
      color: 'text-slate-700 bg-slate-100 border-slate-200',
      barColor: 'bg-slate-500',
      participants: activitiesCount.other || 1,
      incomeBaht: 1200,
    },
  ];

  const totalOccupationalParticipants = occupationalTherapyItems.reduce((acc, it) => acc + it.participants, 0);
  const totalOccupationalIncome = employmentAndIncomeSummary.occupationalTherapyTotalBaht || 48000;

  // Breakdown of 5 Employment Types
  const employmentTypes = [
    {
      id: 'section35',
      name: 'จ้างงานตาม ม.35',
      subtext: 'สัมปทาน / จัดจ้างเหมาบริการคนพิการตาม พ.ร.บ.ฯ',
      count: employmentAndIncomeSummary.section35Count || 12,
      incomeBaht: employmentAndIncomeSummary.section35TotalBaht || 86400,
      avgPerPerson: 7200,
      color: 'border-amber-200 bg-amber-50/60',
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
      barColor: 'bg-amber-500',
    },
    {
      id: 'section33',
      name: 'จ้างงานตาม ม.33',
      subtext: 'การจ้างงานโดยตรงในสถานประกอบการเอกชน/ภาคี',
      count: employmentAndIncomeSummary.section33Count || 5,
      incomeBaht: employmentAndIncomeSummary.section33TotalBaht || 48000,
      avgPerPerson: 9600,
      color: 'border-emerald-200 bg-emerald-50/60',
      badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
      barColor: 'bg-emerald-500',
    },
    {
      id: 'commute',
      name: 'จ้างแบบไป-กลับ',
      subtext: 'เดินทางไปปฏิบัติงาน ณ สถานประกอบการภายนอก',
      count: employmentAndIncomeSummary.commuteCount || 4,
      incomeBaht: employmentAndIncomeSummary.commuteTotalBaht || 22000,
      avgPerPerson: 5500,
      color: 'border-sky-200 bg-sky-50/60',
      badgeColor: 'bg-sky-100 text-sky-900 border-sky-300',
      barColor: 'bg-sky-500',
    },
    {
      id: 'section25',
      name: 'จ้างงานตาม ม.25',
      subtext: 'กองทุนส่งเสริมและพัฒนาคุณภาพชีวิตคนพิการ',
      count: employmentAndIncomeSummary.section25Count || 3,
      incomeBaht: employmentAndIncomeSummary.section25TotalBaht || 18600,
      avgPerPerson: 6200,
      color: 'border-purple-200 bg-purple-50/60',
      badgeColor: 'bg-purple-100 text-purple-900 border-purple-300',
      barColor: 'bg-purple-500',
    },
    {
      id: 'homeWork',
      name: 'จ้างแบบรับงานมาทำ',
      subtext: 'รับชิ้นงานจากสถานประกอบการมาผลิต ณ บ้านน้อยฯ',
      count: employmentAndIncomeSummary.homeWorkCount || 2,
      incomeBaht: employmentAndIncomeSummary.homeWorkTotalBaht || 9000,
      avgPerPerson: 4500,
      color: 'border-indigo-200 bg-indigo-50/60',
      badgeColor: 'bg-indigo-100 text-indigo-900 border-indigo-300',
      barColor: 'bg-indigo-500',
    },
  ];

  const totalEmployedCount = employmentTypes.reduce((acc, it) => acc + it.count, 0);
  const totalEmploymentEarnings = employmentTypes.reduce((acc, it) => acc + it.incomeBaht, 0);

  return (
    <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
      {/* Main Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-600" />
            <h2 className="text-base font-bold text-slate-900">
              สรุปผลการดำเนินงานกิจกรรม: แยกประเภท "อาชีวบำบัด" และ "การจ้างงาน" พร้อมรายได้
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            แสดงจำนวนผู้ใช้บริการที่เข้าร่วมในแต่ละประเภทกิจกรรมและรูปแบบการจ้างงาน พร้อมรายรับประจำเดือน{snapshot.monthLabelTh}
          </p>
        </div>

        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-emerald-950">
          <Banknote className="w-4 h-4 text-emerald-700" />
          <span>รายรับรวมทุกกิจกรรม:</span>
          <strong className="text-sm font-black text-emerald-800 tabular-nums">
            {(totalOccupationalIncome + totalEmploymentEarnings).toLocaleString()} บาท
          </strong>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* PANEL 1 (6 cols): อาชีวบำบัด (Occupational Therapy) */}
        <div className="lg:col-span-6 bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-200/90 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs">
                  บำบัด
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    1. หมวดอาชีวบำบัด (ฝึกทักษะและรับปันผล)
                  </h3>
                  <div className="text-[11px] text-teal-700 font-medium">
                    ผู้ใช้บริการเข้าร่วมรวม {totalOccupationalParticipants} ราย
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-[10px] text-slate-500">เงินปันผล/รายรับรวม</div>
                <div className="text-base font-black text-teal-800 tabular-nums">
                  {totalOccupationalIncome.toLocaleString()} บ.
                </div>
              </div>
            </div>

            {/* List of 6 Activities */}
            <div className="space-y-2.5 pt-3">
              {occupationalTherapyItems.map((item) => {
                const IconComponent = item.icon;
                const percentOfIncome = ((item.incomeBaht / totalOccupationalIncome) * 100).toFixed(0);
                return (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-2 hover:border-teal-300 transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 truncate pr-2">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${item.color}`}>
                          <IconComponent className="w-3.5 h-3.5" />
                        </div>
                        <div className="truncate">
                          <span className="font-bold text-slate-900">{item.name}</span>
                          <div className="text-[10px] text-slate-400 truncate">{item.description}</div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-xs font-black text-slate-900 tabular-nums">
                          {item.participants} ราย
                        </div>
                        <div className="text-[11px] font-bold text-teal-700 tabular-nums">
                          {item.incomeBaht.toLocaleString()} บ.
                        </div>
                      </div>
                    </div>

                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${Math.min(100, Math.max(8, (item.participants / 20) * 100))}%` }}
                        className={`h-full rounded-full ${item.barColor}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
            <span>ผลผลิตเน้นบริโภคในนิคมฯ และจำหน่ายสร้างกองทุน</span>
            <span className="font-semibold text-teal-700">เฉลี่ย ~1,260 บ./ราย</span>
          </div>
        </div>

        {/* PANEL 2 (6 cols): การจ้างงาน (Employment) */}
        <div className="lg:col-span-6 bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-200/90 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                  จ้างงาน
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    2. หมวดการจ้างงาน (5 รูปแบบตามมาตรฐาน)
                  </h3>
                  <div className="text-[11px] text-emerald-700 font-medium">
                    ผู้มีงานทำรวม {totalEmployedCount} คน
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-[10px] text-slate-500">ค่าจ้าง/รายได้รวม</div>
                <div className="text-base font-black text-emerald-800 tabular-nums">
                  {totalEmploymentEarnings.toLocaleString()} บ.
                </div>
              </div>
            </div>

            {/* List of 5 Employment Types */}
            <div className="space-y-2.5 pt-3">
              {employmentTypes.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-2 hover:border-emerald-300 transition-colors"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="truncate pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900">{item.name}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${item.badgeColor}`}>
                          {item.count} คน
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 truncate mt-0.5">{item.subtext}</div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-black text-emerald-800 tabular-nums">
                        {item.incomeBaht.toLocaleString()} บ.
                      </div>
                      <div className="text-[10px] text-slate-500 tabular-nums">
                        เฉลี่ย {item.avgPerPerson.toLocaleString()} บ./คน
                      </div>
                    </div>
                  </div>

                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${Math.min(100, Math.max(10, (item.count / 15) * 100))}%` }}
                      className={`h-full rounded-full ${item.barColor}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
            <span>ส่งเสริมการมีงานทำเพื่อการพึ่งพาตนเองอย่างยั่งยืน</span>
            <span className="font-semibold text-emerald-700">เฉลี่ย ~7,076 บ./คน</span>
          </div>
        </div>
      </div>
    </div>
  );
};
