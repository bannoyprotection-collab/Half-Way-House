import React, { useState } from 'react';
import { 
  Shield, UserPlus, Edit3, KeyRound, CheckCircle2, 
  XCircle, Search, Building2, Lock, User, Eye, EyeOff, Save, X 
} from 'lucide-react';
import { UserAccount, UserRole, Nikhom } from '../../types';

interface UserManagementViewProps {
  accounts: UserAccount[];
  nikhoms: Nikhom[];
  currentUser: UserAccount;
  onCreateAccount: (account: Omit<UserAccount, 'id'>) => void;
  onUpdateAccount: (id: string, updates: Partial<UserAccount>) => void;
}

export const UserManagementView: React.FC<UserManagementViewProps> = ({
  accounts,
  nikhoms,
  currentUser,
  onCreateAccount,
  onUpdateAccount,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<UserAccount | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);

  // Form states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('password123');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('unit_officer');
  const [nikhomId, setNikhomId] = useState(nikhoms[0]?.id || 'nk-01');
  const [roleTitle, setRoleTitle] = useState('');
  const [department, setDepartment] = useState('');
  const [isActive, setIsActive] = useState(true);

  const nikhomMap = new Map(nikhoms.map((n) => [n.id, `${n.name} (${n.province})`]));

  if (currentUser.role !== 'super_admin') {
    return (
      <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
        <Shield className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-base font-bold text-slate-900">เฉพาะผู้ดูแลระบบสูงสุด (Super Admin) เท่านั้น</h2>
        <p className="text-xs text-slate-500">
          บัญชีของคุณไม่มีสิทธิ์ในการสร้างหรือแก้ไข ID ของผู้ใช้งานในระบบ
        </p>
      </div>
    );
  }

  const openCreateModal = (defaultRole: UserRole = 'unit_officer') => {
    setEditingAccount(null);
    setErrorText(null);
    setUsername('');
    setPassword('password123');
    setName('');
    setRole(defaultRole);
    const defaultNk = nikhoms[0];
    setNikhomId(defaultNk?.id || 'nk-01');
    if (defaultRole === 'central_admin') {
      setRoleTitle('แอดมินส่วนกลาง (เข้าถึงและแก้ไขได้ทุกหน่วย)');
      setDepartment('กองคุ้มครองสวัสดิภาพและเสริมสร้างคุณภาพชีวิต');
    } else if (defaultRole === 'unit_officer' && defaultNk) {
      setRoleTitle(`เจ้าหน้าที่ประจำ${defaultNk.shortName}`);
      setDepartment(`${defaultNk.name} จ.${defaultNk.province}`);
    } else {
      setRoleTitle('ผู้ดูแลระบบสูงสุด (Super Admin)');
      setDepartment('ศูนย์เทคโนโลยีสารสนเทศและการสื่อสาร');
    }
    setIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (acc: UserAccount) => {
    setEditingAccount(acc);
    setErrorText(null);
    setUsername(acc.username);
    setPassword(acc.password);
    setName(acc.name);
    setRole(acc.role);
    setNikhomId(acc.nikhomId || nikhoms[0]?.id || 'nk-01');
    setRoleTitle(acc.roleTitle);
    setDepartment(acc.department);
    setIsActive(acc.isActive);
    setIsModalOpen(true);
  };

  const handleNikhomSelectChange = (newNkId: string) => {
    setNikhomId(newNkId);
    const nk = nikhoms.find((n) => n.id === newNkId);
    if (nk && role === 'unit_officer') {
      setRoleTitle(`เจ้าหน้าที่รับผิดชอบโครงการ (${nk.shortName} จ.${nk.province})`);
      setDepartment(`${nk.name} จ.${nk.province}`);
    }
  };

  const handleRoleSelectChange = (newRole: UserRole) => {
    setRole(newRole);
    if (newRole === 'central_admin') {
      setRoleTitle('แอดมินส่วนกลาง (เข้าถึงและแก้ไขได้ทุกหน่วย)');
      setDepartment('กองคุ้มครองสวัสดิภาพและเสริมสร้างคุณภาพชีวิต');
    } else if (newRole === 'unit_officer') {
      const nk = nikhoms.find((n) => n.id === nikhomId) || nikhoms[0];
      if (nk) {
        setRoleTitle(`เจ้าหน้าที่รับผิดชอบโครงการ (${nk.shortName} จ.${nk.province})`);
        setDepartment(`${nk.name} จ.${nk.province}`);
      }
    } else {
      setRoleTitle('ผู้ดูแลระบบสูงสุด (Super Admin)');
      setDepartment('ศูนย์เทคโนโลยีสารสนเทศและการสื่อสาร');
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText(null);
    try {
      if (editingAccount) {
        onUpdateAccount(editingAccount.id, {
          username,
          password,
          name,
          role,
          roleTitle,
          department,
          nikhomId: role === 'unit_officer' ? nikhomId : undefined,
          isActive,
        });
      } else {
        onCreateAccount({
          username,
          password,
          name,
          role,
          roleTitle,
          department,
          nikhomId: role === 'unit_officer' ? nikhomId : undefined,
          isActive,
        });
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setErrorText(err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
  };

  const filtered = accounts.filter((a) => {
    if (roleFilter !== 'all' && a.role !== roleFilter) return false;
    const q = searchTerm.toLowerCase();
    return (
      a.username.toLowerCase().includes(q) ||
      a.name.toLowerCase().includes(q) ||
      a.department.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="text-xs font-semibold text-purple-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" />
            <span>ระบบบริหารจัดการสิทธิ์ผู้ใช้งาน (Super Admin Console)</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            จัดการ ID และ Password ของแอดมินส่วนกลาง และเจ้าหน้าที่ทั้ง 18 หน่วย
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            สร้างและแก้ไขบัญชีผู้ใช้งาน กำหนดรหัสผ่าน และกำหนดสิทธิ์การเข้าถึงข้อมูลรายหน่วยงาน
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => openCreateModal('central_admin')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-xl transition-colors cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ สร้าง ID แอดมินส่วนกลาง</span>
          </button>

          <button
            onClick={() => openCreateModal('unit_officer')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ สร้าง ID เจ้าหน้าที่หน่วย</span>
          </button>
        </div>
      </div>

      {/* Summary Cards of Roles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-bold text-purple-800">Super Admin</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1 tabular-nums">
            {accounts.filter((a) => a.role === 'super_admin').length} บัญชี
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            สร้าง/แก้ไข ID แอดมินส่วนกลาง และ ID เจ้าหน้าที่ทุกหน่วย รวมถึงแก้ไขข้อมูลได้ทั้งระบบ
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-bold text-emerald-800">แอดมินส่วนกลาง (Central Admin)</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1 tabular-nums">
            {accounts.filter((a) => a.role === 'central_admin').length} บัญชี
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            เข้าถึง ดูรายละเอียด และแก้ไขข้อมูลผู้ใช้บริการของทุกหน่วยทั่วประเทศได้ (18 แห่ง)
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-bold text-sky-800">เจ้าหน้าที่ประจำหน่วย (Unit Officer)</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1 tabular-nums">
            {accounts.filter((a) => a.role === 'unit_officer').length} บัญชี
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            ดู Dashboard ภาพรวมทุกหน่วยได้ แต่เข้าถึงและแก้ไขเฉพาะผู้ใช้บริการในหน่วยตนเองเท่านั้น
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ค้นหา User ID, ชื่อเจ้าหน้าที่, ชื่อนิคม..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:border-amber-500 bg-slate-50"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {[
            { id: 'all', label: 'ทุกบทบาท' },
            { id: 'super_admin', label: 'Super Admin' },
            { id: 'central_admin', label: 'แอดมินส่วนกลาง' },
            { id: 'unit_officer', label: 'เจ้าหน้าที่ประจำหน่วย' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setRoleFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap cursor-pointer transition-colors ${
                roleFilter === tab.id
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Accounts Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-3 px-4">User ID</th>
                <th className="py-3 px-4">Password</th>
                <th className="py-3 px-4">ชื่อ-สกุล / ตำแหน่ง</th>
                <th className="py-3 px-4">ระดับสิทธิ์</th>
                <th className="py-3 px-4">ขอบเขตหน่วยงานที่รับผิดชอบ</th>
                <th className="py-3 px-4 text-center">สถานะ</th>
                <th className="py-3 px-4 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((acc) => {
                const isPwShown = showPasswords[acc.id];
                const unitName = acc.nikhomId
                  ? nikhomMap.get(acc.nikhomId) || acc.nikhomId
                  : 'ทุกหน่วยงานทั่วประเทศ (18 แห่ง)';

                return (
                  <tr key={acc.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {acc.username}
                    </td>

                    <td className="py-3 px-4">
                      <div className="inline-flex items-center gap-1.5 font-mono bg-slate-100 px-2 py-1 rounded border border-slate-200">
                        <span>{isPwShown ? acc.password : '••••••••'}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setShowPasswords((p) => ({ ...p, [acc.id]: !p[acc.id] }))
                          }
                          className="text-slate-400 hover:text-slate-700 cursor-pointer"
                          title="แสดง/ซ่อนรหัสผ่าน"
                        >
                          {isPwShown ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{acc.name}</div>
                      <div className="text-[11px] text-slate-500">{acc.roleTitle}</div>
                    </td>

                    <td className="py-3 px-4">
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
                          : 'เจ้าหน้าที่หน่วย'}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-700">
                      <div className="font-medium">{unitName}</div>
                      <div className="text-[10px] text-slate-400">
                        {acc.role === 'unit_officer'
                          ? 'ดู Dashboard รวมได้ / แก้ไขเฉพาะหน่วยตนเอง'
                          : 'ดูและแก้ไขข้อมูลได้ทุกหน่วย'}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-center">
                      {acc.isActive ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5" /> ปกติ
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600">
                          <XCircle className="w-3.5 h-3.5" /> ระงับ
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => openEditModal(acc)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>แก้ไข ID / รหัสผ่าน</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Account Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-auto">
            <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  {editingAccount ? `แก้ไขบัญชีผู้ใช้งาน (${editingAccount.username})` : 'สร้างบัญชีผู้ใช้งานใหม่ (ID & Password)'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4 text-xs">
              {errorText && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-medium">
                  {errorText}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    User ID (สำหรับเข้าสู่ระบบ) *
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="เช่น unit_01, central_03"
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Password (รหัสผ่าน) *
                  </label>
                  <input
                    type="text"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="กำหนดรหัสผ่าน"
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  ชื่อ-นามสกุล ผู้ใช้งาน *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ระบุชื่อ-นามสกุลเจ้าหน้าที่ หรือแอดมิน"
                  className="w-full p-2.5 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  ระดับสิทธิ์การใช้งาน (Role) *
                </label>
                <select
                  value={role}
                  onChange={(e) => handleRoleSelectChange(e.target.value as UserRole)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-white"
                >
                  <option value="central_admin">แอดมินส่วนกลาง (เข้าถึงและแก้ไขได้ทุกหน่วย)</option>
                  <option value="unit_officer">เจ้าหน้าที่ประจำหน่วย (ดู Dashboard รวม / แก้ไขเฉพาะหน่วยตนเอง)</option>
                  <option value="super_admin">Super Admin (จัดการระบบและบัญชีผู้ใช้งานทั้งหมด)</option>
                </select>
              </div>

              {role === 'unit_officer' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    สังกัดหน่วยงาน (นิคมสร้างตนเอง / ศูนย์พัฒนาพื้นที่สูง) *
                  </label>
                  <select
                    value={nikhomId}
                    onChange={(e) => handleNikhomSelectChange(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-white"
                  >
                    {nikhoms.map((nk) => (
                      <option key={nk.id} value={nk.id}>
                        {nk.name} (จ.{nk.province})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    ตำแหน่ง
                  </label>
                  <input
                    type="text"
                    value={roleTitle}
                    onChange={(e) => setRoleTitle(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    หน่วยงาน/สังกัด
                  </label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="pt-1">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                  />
                  <span className="font-semibold text-slate-700">เปิดใช้งานบัญชีนี้ (Active)</span>
                </label>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 font-medium cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>บันทึกบัญชีผู้ใช้งาน</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
