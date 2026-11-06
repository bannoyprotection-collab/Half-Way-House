import React, { useState } from 'react';
import { Shield, Lock, User, LogIn, Building2, KeyRound, CheckCircle2, AlertCircle } from 'lucide-react';
import { UserAccount, Nikhom } from '../../types';

interface LoginViewProps {
  accounts: UserAccount[];
  nikhoms: Nikhom[];
  onLogin: (username: string, password: string) => { success: boolean; error?: string };
}

export const LoginView: React.FC<LoginViewProps> = ({ accounts, nikhoms, onLogin }) => {
  const [username, setUsername] = useState('superadmin');
  const [password, setPassword] = useState('password123');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<'all' | 'super_admin' | 'central_admin' | 'unit_officer'>('all');

  const nikhomMap = new Map(nikhoms.map((n) => [n.id, `${n.name} (${n.province})`]));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const res = onLogin(username, password);
    if (!res.success) {
      setErrorMsg(res.error || 'ไม่สามารถเข้าสู่ระบบได้');
    }
  };

  const handleQuickLogin = (acc: UserAccount) => {
    setUsername(acc.username);
    setPassword(acc.password);
    setErrorMsg(null);
    const res = onLogin(acc.username, acc.password);
    if (!res.success) {
      setErrorMsg(res.error || 'ไม่สามารถเข้าสู่ระบบได้');
    }
  };

  const filteredDemoAccounts = accounts.filter((a) => {
    if (selectedRoleFilter === 'all') return true;
    return a.role === selectedRoleFilter;
  });

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8 font-['Prompt',sans-serif]">
      <div className="max-w-5xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left 5 Cols: Login Form Card */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-600 to-amber-800 text-white flex items-center justify-center font-bold text-xl shadow-xs">
                พม
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900 leading-tight">
                  โครงการบ้านน้อยในนิคม
                </h1>
                <p className="text-xs text-slate-500">
                  กรมพัฒนาสังคมและสวัสดิการ · ระบบบริหารและติดตาม IRP
                </p>
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-base font-bold text-slate-900">
                เข้าสู่ระบบสำหรับเจ้าหน้าที่และผู้บริหาร
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                กรุณาระบุชื่อผู้ใช้งาน (ID) และรหัสผ่านตามสิทธิ์ของหน่วยงาน
              </p>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  ชื่อผู้ใช้งาน (User ID)
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="เช่น superadmin, admin_central, unit_01"
                    className="w-full pl-10 pr-3 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:border-amber-600 bg-slate-50/60 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  รหัสผ่าน (Password)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="รหัสผ่าน"
                    className="w-full pl-10 pr-3 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:border-amber-600 bg-slate-50/60 font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>เข้าสู่ระบบ</span>
              </button>
            </form>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-100 space-y-2 text-[11px] text-slate-500">
            <div className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-amber-600" />
              <span>นโยบายการเข้าถึงข้อมูลตามระดับสิทธิ์ (RBAC):</span>
            </div>
            <ul className="space-y-1 pl-4 list-disc">
              <li>
                <span className="font-semibold text-slate-700">Super Admin:</span> สร้าง/แก้ไข ID ของแอดมินส่วนกลาง และเจ้าหน้าที่ทุกหน่วย พร้อมจัดการข้อมูลทั้งระบบ
              </li>
              <li>
                <span className="font-semibold text-slate-700">แอดมินส่วนกลาง:</span> เข้าถึงและแก้ไขข้อมูลผู้ใช้บริการของทุกหน่วยทั่วประเทศได้
              </li>
              <li>
                <span className="font-semibold text-slate-700">เจ้าหน้าที่ประจำหน่วย:</span> ดู Dashboard ภาพรวมทุกหน่วยได้ แต่เข้าถึงและแก้ไขเฉพาะผู้ใช้บริการในหน่วยตนเองเท่านั้น
              </li>
            </ul>
          </div>
        </div>

        {/* Right 7 Cols: Quick Account Selector for Testing All Roles */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-amber-600" />
                  <span>บัญชีผู้ใช้งานในระบบ (คลิกเพื่อเข้าสู่ระบบทันที)</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  แสดงรายการ ID และระดับสิทธิ์ทั้งหมด (Super Admin สามารถสร้างและแก้ไขเพิ่มเติมได้ในระบบ)
                </p>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 my-3 overflow-x-auto pb-1">
              {[
                { id: 'all', label: `ทั้งหมด (${accounts.length})` },
                { id: 'super_admin', label: 'Super Admin' },
                { id: 'central_admin', label: 'แอดมินส่วนกลาง' },
                { id: 'unit_officer', label: 'เจ้าหน้าที่ 18 หน่วย' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedRoleFilter(t.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap cursor-pointer transition-colors ${
                    selectedRoleFilter === t.id
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Account List */}
            <div className="max-h-[420px] overflow-y-auto space-y-2 pr-1">
              {filteredDemoAccounts.map((acc) => {
                const isSelected = username === acc.username;
                const unitLabel = acc.nikhomId ? nikhomMap.get(acc.nikhomId) : 'เข้าถึงได้ทุกหน่วยงานทั่วประเทศ (18 แห่ง)';

                return (
                  <div
                    key={acc.id}
                    onClick={() => handleQuickLogin(acc)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-amber-50/70 border-amber-400 shadow-2xs'
                        : 'bg-slate-50/50 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs text-slate-900">{acc.name}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            acc.role === 'super_admin'
                              ? 'bg-purple-100 text-purple-800'
                              : acc.role === 'central_admin'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-sky-100 text-sky-800'
                          }`}
                        >
                          {acc.role === 'super_admin'
                            ? 'Super Admin'
                            : acc.role === 'central_admin'
                            ? 'แอดมินส่วนกลาง'
                            : 'เจ้าหน้าที่ประจำหน่วย'}
                        </span>
                        {!acc.isActive && (
                          <span className="text-[10px] font-bold bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded">
                            ระงับสิทธิ์
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                        <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-700">
                          ID: {acc.username}
                        </span>
                        <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-700">
                          PW: {acc.password}
                        </span>
                        <span className="truncate text-slate-500">· {unitLabel}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="px-3 py-1.5 text-[11px] font-semibold bg-white border border-slate-200 hover:border-amber-500 hover:text-amber-700 rounded-lg shrink-0 shadow-2xs"
                    >
                      เข้าใช้งาน →
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>กรมพัฒนาสังคมและสวัสดิการ กระทรวงการพัฒนาสังคมและความมั่นคงของมนุษย์</span>
            <span>รหัสผ่านเริ่มต้น: password123</span>
          </div>
        </div>
      </div>
    </div>
  );
};
