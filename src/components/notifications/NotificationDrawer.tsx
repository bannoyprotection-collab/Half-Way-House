import React from 'react';
import { X, Bell, AlertTriangle, CheckCheck, Clock, FileText, UserCheck, ShieldAlert, Check } from 'lucide-react';
import { SystemNotification } from '../../types';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: SystemNotification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onSelectBeneficiary: (beneficiaryId: string) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onSelectBeneficiary,
}) => {
  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const requestPushPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        new Notification('ระบบแจ้งเตือนโครงการบ้านน้อยในนิคม', {
          body: 'เปิดการแจ้งเตือนแบบพุชสำเร็จ! คุณจะได้รับการแจ้งเตือนทันทีเมื่อมี IRP ต่ำกว่า 50%',
        });
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end">
      <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col border-l border-slate-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-600" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">ศูนย์แจ้งเตือนระบบ</h2>
              <div className="text-[11px] text-slate-500">
                แจ้งเตือนอัตโนมัติ IRP & สรุปรายงานประจำเดือน
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="ปิดการแจ้งเตือน"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="px-4 py-2.5 bg-white border-b border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">
            ยังไม่ได้อ่าน {unreadCount} รายการ
          </span>
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllAsRead}
              className="text-amber-700 hover:text-amber-900 font-semibold cursor-pointer flex items-center gap-1"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>อ่านทั้งหมดแล้ว</span>
            </button>
          )}
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* Push permission callout */}
          {typeof window !== 'undefined' && 'Notification' in window && Notification.permission !== 'granted' && (
            <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1.5">
              <div className="font-bold flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-amber-700" />
                <span>เปิดรับการแจ้งเตือนแบบพุช (Push Notifications)</span>
              </div>
              <p className="text-[11px] text-amber-800">
                เพื่อรับการแจ้งเตือนทันทีบนโทรศัพท์มือถือหรือแท็บเล็ตเมื่อตรวจพบ IRP ต่ำกว่า 50% จากพื้นที่จริง
              </p>
              <button
                onClick={requestPushPermission}
                className="mt-1 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg text-[11px] cursor-pointer"
              >
                อนุญาตการแจ้งเตือน
              </button>
            </div>
          )}

          {notifications.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              ไม่มีการแจ้งเตือนใหม่ในขณะนี้
            </div>
          ) : (
            notifications.map((notif) => {
              const isUrgent = notif.priority === 'urgent';
              return (
                <div
                  key={notif.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    !notif.isRead
                      ? isUrgent
                        ? 'bg-rose-50/70 border-rose-300 shadow-2xs'
                        : 'bg-amber-50/50 border-amber-200 shadow-2xs'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      {isUrgent ? (
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      ) : (
                        <Bell className="w-4 h-4 text-amber-600 shrink-0" />
                      )}
                      <h3
                        className={`text-xs font-bold leading-tight ${
                          isUrgent ? 'text-rose-950' : 'text-slate-900'
                        }`}
                      >
                        {notif.title}
                      </h3>
                    </div>

                    {!notif.isRead && (
                      <button
                        onClick={() => onMarkAsRead(notif.id)}
                        title="ทำเครื่องหมายว่าอ่านแล้ว"
                        className="text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <p className="text-xs text-slate-700 mt-1.5 leading-relaxed">
                    {notif.message}
                  </p>

                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                    <span className="font-mono">
                      {new Date(notif.timestamp).toLocaleString('th-TH')}
                    </span>

                    {notif.beneficiaryId && (
                      <button
                        onClick={() => {
                          onSelectBeneficiary(notif.beneficiaryId!);
                          onMarkAsRead(notif.id);
                          onClose();
                        }}
                        className="font-bold text-amber-800 hover:text-amber-950 underline cursor-pointer"
                      >
                        เปิดแฟ้มผู้ใช้บริการ →
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
