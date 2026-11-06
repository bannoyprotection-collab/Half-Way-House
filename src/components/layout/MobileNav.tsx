import React from 'react';
import { LayoutDashboard, Users, FileText, Building2, Plus, KeyRound, Cloud } from 'lucide-react';
import { UserRole } from '../../types';

interface MobileNavProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenNewBeneficiaryModal: () => void;
  userRole: UserRole;
  criticalIRPCount: number;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  currentTab,
  setCurrentTab,
  onOpenNewBeneficiaryModal,
  userRole,
  criticalIRPCount,
}) => {
  const tabs = [
    { id: 'dashboard', label: 'ภาพรวม', icon: LayoutDashboard },
    { id: 'beneficiaries', label: 'ผู้ใช้บริการ', icon: Users, badge: criticalIRPCount > 0 ? criticalIRPCount : undefined },
    { id: 'monthly_report', label: 'รายงาน', icon: FileText },
    { id: 'nikhoms', label: '18 หน่วย', icon: Building2 },
    { id: 'cloud_sync', label: 'Google Drive', icon: Cloud },
    ...(userRole === 'super_admin' ? [{ id: 'users', label: 'จัดการ ID', icon: KeyRound }] : []),
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-2 py-1 flex items-center justify-around shadow-lg no-print">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setCurrentTab(tab.id)}
            className={`flex flex-col items-center justify-center py-1.5 px-2 relative min-w-[52px] min-h-[48px] rounded-lg cursor-pointer transition-colors ${
              isActive ? 'text-amber-800 font-semibold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <div className="relative">
              <Icon className="w-5 h-5" />
              {tab.badge && (
                <span className="absolute -top-1 -right-2 w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] font-bold flex items-center justify-center">
                  {tab.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-0.5 whitespace-nowrap">{tab.label}</span>
          </button>
        );
      })}

      <button
        onClick={onOpenNewBeneficiaryModal}
        className="flex flex-col items-center justify-center py-1 px-2 text-white bg-amber-600 rounded-lg min-w-[50px] min-h-[44px] cursor-pointer shadow-xs active:scale-95 transition-all"
      >
        <Plus className="w-5 h-5" />
        <span className="text-[10px] font-medium leading-none mt-0.5">รับเข้า</span>
      </button>
    </div>
  );
};
