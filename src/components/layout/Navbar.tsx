import React from 'react';
import { Bell, Shield, Plus, RefreshCw, AlertTriangle, LogOut, KeyRound, Cloud } from 'lucide-react';
import { SystemNotification, UserAccount, Nikhom } from '../../types';
import { storageService } from '../../services/storageService';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  currentUser: UserAccount;
  allAccounts: UserAccount[];
  nikhoms: Nikhom[];
  onSwitchAccount: (account: UserAccount) => void;
  onLogout: () => void;
  notifications: SystemNotification[];
  onOpenNotifications: () => void;
  onOpenNewBeneficiaryModal: () => void;
  criticalIRPCount: number;
  onResetData: () => void;
  onRefreshData?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  currentUser,
  allAccounts,
  nikhoms,
  onSwitchAccount,
  onLogout,
  notifications,
  onOpenNotifications,
  onOpenNewBeneficiaryModal,
  criticalIRPCount,
  onResetData,
  onRefreshData,
}) => {
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const userNikhom = nikhoms.find((n) => n.id === currentUser.nikhomId);
  const cloudStatus = storageService.getCloudSyncStatus();

  const navItems = [
    { id: 'dashboard', label: 'แดชบอร์ดภาพรวม' },
    { id: 'beneficiaries', label: 'ทะเบียนประวัติ (ท.ป.๑) & IRP' },
    { id: 'monthly_report', label: 'สรุปรายงานประจำเดือน' },
    { id: 'nikhoms', label: 'นิคม 18 แห่ง' },
    { id: 'cloud_sync', label: 'ฐานข้อมูล Cloud & Drive' },
    ...(currentUser.role === 'super_admin'
      ? [{ id: 'users', label: 'จัดการ ID ผู้ใช้งาน' }]
      : [{ id: 'timeline', label: 'ไทม์ไลน์โครงการ' }]),
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 no-print">
      {/* Critical Alert Bar if any IRP < 50% */}
      {criticalIRPCount > 0 && (
        <div className="bg-rose-50 border-b border-rose-200 px-4 py-1.5 text-xs text-rose-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-semibold">ระบบแจ้งเตือนอัตโนมัติ:</span>
            <span>
              พบผู้ใช้บริการที่มีคะแนน IRP ต่ำกว่า 50% จำนวน {criticalIRPCount} ราย จำเป็นต้องเร่งปรับปรุงแผนฟื้นฟูสมรรถภาพ
            </span>
          </div>
          <button
            onClick={() => setCurrentTab('beneficiaries')}
            className="text-xs font-semibold text-rose-700 underline hover:text-rose-900 cursor-pointer whitespace-nowrap ml-2"
          >
            ตรวจสอบกลุ่มวิกฤต
          </button>
        </div>
      )}

      {/* Top Bar 3 Zones Contract */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Brand Wordmark */}
        <button
          onClick={() => setCurrentTab('dashboard')}
          className="text-left font-bold text-lg tracking-tight text-slate-900 whitespace-nowrap shrink-0 cursor-pointer"
        >
          บ้านน้อยในนิคม
        </button>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden lg:flex items-center gap-5 text-sm font-medium text-slate-600">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`transition-colors whitespace-nowrap shrink-0 py-1 cursor-pointer border-b-2 ${
                  isActive
                    ? 'text-amber-800 font-semibold border-amber-600'
                    : 'text-slate-600 hover:text-slate-900 border-transparent'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Actions, Notifications & Account Menu */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Quick Cloud & Drive Sync Status Button */}
          <button
            onClick={() => setCurrentTab('cloud_sync')}
            title="จัดการฐานข้อมูล Cloud (Firebase) & ซิงค์ Google Drive"
            className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              cloudStatus.isAuthenticatedGoogle
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Cloud
              className={`w-3.5 h-3.5 ${
                cloudStatus.isAuthenticatedGoogle
                  ? 'text-emerald-600'
                  : 'text-slate-500'
              }`}
            />
            <span>
              {cloudStatus.isAuthenticatedGoogle
                ? 'Cloud & Drive ซิงค์แล้ว'
                : 'ซิงค์ Google Drive'}
            </span>
          </button>

          <button
            onClick={onOpenNewBeneficiaryModal}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors shadow-2xs cursor-pointer whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>รับเข้า / ท.ป.๑</span>
          </button>

          {/* Quick Refresh App Button */}
          <button
            onClick={() => {
              if (onRefreshData) {
                onRefreshData();
              } else {
                window.location.reload();
              }
            }}
            title="รีเฟรชข้อมูลระบบ (Refresh App)"
            aria-label="รีเฟรชข้อมูลระบบ"
            className="p-2 text-slate-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer group"
          >
            <RefreshCw className="w-4 h-4 text-slate-600 group-hover:text-amber-700 transition-transform active:rotate-180 duration-300" />
          </button>

          {/* Notification Bell */}
          <button
            onClick={onOpenNotifications}
            aria-label="การแจ้งเตือน"
            className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Account & Role Switcher Dropdown */}
          <div className="relative group">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs hover:bg-slate-100 transition-colors cursor-pointer">
              <Shield className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <div className="hidden md:block text-left">
                <div className="font-semibold text-slate-900 text-[11px] leading-tight whitespace-nowrap">
                  {currentUser.role === 'super_admin'
                    ? `Super Admin (${currentUser.username})`
                    : currentUser.role === 'central_admin'
                    ? `แอดมินส่วนกลาง (${currentUser.username})`
                    : `หน่วย: ${userNikhom?.shortName || currentUser.username}`}
                </div>
                <div className="text-[10px] text-slate-500 leading-none truncate max-w-[140px]">
                  {currentUser.name}
                </div>
              </div>
            </div>

            {/* Dropdown Menu */}
            <div className="absolute right-0 mt-1 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-2.5 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all z-50">
              <div className="px-2 py-1.5 border-b border-slate-100 mb-1.5">
                <div className="text-xs font-bold text-slate-900">{currentUser.name}</div>
                <div className="text-[11px] text-slate-500 font-mono">ID: {currentUser.username}</div>
                <div className="text-[10px] text-amber-700 font-medium mt-0.5">
                  {currentUser.role === 'unit_officer'
                    ? `สังกัด: ${userNikhom?.name || '-'} (แก้ไขได้เฉพาะหน่วยตนเอง)`
                    : 'สิทธิ์ส่วนกลาง: เข้าถึงและแก้ไขได้ทุกหน่วย'}
                </div>
              </div>

              {currentUser.role === 'super_admin' && (
                <button
                  onClick={() => setCurrentTab('users')}
                  className="w-full text-left px-2.5 py-2 text-xs font-semibold text-purple-800 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors cursor-pointer flex items-center gap-2 mb-1.5"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>จัดการ ID แอดมินและเจ้าหน้าที่ทุกหน่วย</span>
                </button>
              )}

              <div className="text-[10px] font-semibold text-slate-400 px-2 py-1 uppercase tracking-wider">
                สลับบัญชีทดสอบด่วน (Quick Switch)
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                {allAccounts.slice(0, 8).map((acc) => (
                  <button
                    key={acc.id}
                    onClick={() => onSwitchAccount(acc)}
                    className={`w-full text-left px-2 py-1.5 text-xs rounded-lg transition-colors cursor-pointer flex items-center justify-between ${
                      currentUser.id === acc.id
                        ? 'bg-amber-50 text-amber-900 font-semibold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="truncate pr-2">
                      <span className="font-mono text-[11px] font-bold">{acc.username}</span>
                      <span className="text-[11px] text-slate-500 ml-1.5">({acc.name})</span>
                    </div>
                    {currentUser.id === acc.id && <span className="text-amber-600 font-bold">✓</span>}
                  </button>
                ))}
              </div>

              <div className="my-1.5 border-t border-slate-100" />
              <button
                onClick={onResetData}
                className="w-full text-left px-2.5 py-1.5 text-[11px] text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>รีเซ็ตข้อมูลตัวอย่างเริ่มต้น</span>
              </button>

              <button
                onClick={onLogout}
                className="w-full text-left px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer mt-0.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>ออกจากระบบ / เปลี่ยน ID</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
