import React, { useState } from 'react';
import { 
  X, Save, Camera, Image as ImageIcon, Trash2, AlertCircle, 
  Check, User, Sparkles, Building, HeartPulse, FileText 
} from 'lucide-react';
import { 
  Beneficiary, Nikhom, DisabilityType, DISABILITY_TYPE_LABELS,
  TP1DossierProfile 
} from '../../types';
import { fileToBase64, resizeImageBase64 } from '../../utils/imageUtils';

interface EditBeneficiaryProfileModalProps {
  beneficiary: Beneficiary;
  nikhoms: Nikhom[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: Beneficiary) => void;
}

export const EditBeneficiaryProfileModal: React.FC<EditBeneficiaryProfileModalProps> = ({
  beneficiary,
  nikhoms,
  isOpen,
  onClose,
  onSave,
}) => {
  // Basic info state
  const [fullName, setFullName] = useState(beneficiary.fullName);
  const [nationalId, setNationalId] = useState(beneficiary.nationalId);
  const [gender, setGender] = useState<'male' | 'female'>(beneficiary.gender);
  const [age, setAge] = useState(beneficiary.age);
  const [building, setBuilding] = useState(beneficiary.building);
  const [category, setCategory] = useState<'disabled' | 'destitute'>(beneficiary.category);
  const [disabilityTypes, setDisabilityTypes] = useState<DisabilityType[]>(beneficiary.disabilityTypes || []);
  const [chronicDiseases, setChronicDiseases] = useState(beneficiary.chronicDiseases || '');
  const [personalityTraits, setPersonalityTraits] = useState(beneficiary.personalityTraits || '');
  const [referringAgency, setReferringAgency] = useState(beneficiary.referringAgency || '');

  // Photos state
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(
    beneficiary.photoUrl || beneficiary.tp1Profile?.photoUrl
  );
  const [physicalMarksPhotoUrl, setPhysicalMarksPhotoUrl] = useState<string | undefined>(
    beneficiary.physicalMarksPhotoUrl || beneficiary.tp1Profile?.physicalMarksPhotoUrl
  );
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  // TP1 state
  const [tp1, setTp1] = useState<TP1DossierProfile>(() => ({
    ...beneficiary.tp1Profile,
  }));

  const [activeSubTab, setActiveSubTab] = useState<'general' | 'photos' | 'tp1_front' | 'tp1_back'>('general');

  if (!isOpen) return null;

  const handleProfilePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsProcessingPhoto(true);
      setPhotoError(null);
      const rawBase64 = await fileToBase64(file);
      const optimized = await resizeImageBase64(rawBase64, 600, 600, 0.85);
      setPhotoUrl(optimized);
    } catch (err: any) {
      setPhotoError('ไม่สามารถประมวลผลรูปภาพได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsProcessingPhoto(false);
    }
  };

  const handleMarksPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsProcessingPhoto(true);
      setPhotoError(null);
      const rawBase64 = await fileToBase64(file);
      const optimized = await resizeImageBase64(rawBase64, 800, 800, 0.85);
      setPhysicalMarksPhotoUrl(optimized);
    } catch (err: any) {
      setPhotoError('ไม่สามารถประมวลผลรูปภาพตำหนิได้');
    } finally {
      setIsProcessingPhoto(false);
    }
  };

  const toggleDisabilityType = (type: DisabilityType) => {
    setDisabilityTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const updatedTp1: TP1DossierProfile = {
      ...tp1,
      photoUrl,
      physicalMarksPhotoUrl,
      distinguishingMarks: tp1.distinguishingMarks || beneficiary.tp1Profile?.distinguishingMarks || '',
    };

    const updatedBeneficiary: Beneficiary = {
      ...beneficiary,
      fullName: fullName.trim(),
      nationalId: nationalId.trim() || 'ไม่มี',
      gender,
      age: Number(age) || beneficiary.age,
      building: building.trim(),
      category,
      disabilityTypes,
      hasMultipleDisabilities: disabilityTypes.length > 1,
      chronicDiseases: chronicDiseases.trim(),
      personalityTraits: personalityTraits.trim(),
      referringAgency: referringAgency.trim(),
      photoUrl,
      physicalMarksPhotoUrl,
      tp1Profile: updatedTp1,
    };

    onSave(updatedBeneficiary);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <User className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-base font-bold text-white">
                แก้ไขข้อมูลประวัติและรูปภาพผู้ใช้บริการ
              </h2>
              <div className="text-xs text-slate-300">
                รหัสประจำตัว: {beneficiary.uniquePersonId} · {beneficiary.fullName}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-tab Navigation */}
        <div className="flex items-center gap-1 px-6 bg-slate-50 border-b border-slate-200 text-xs font-semibold overflow-x-auto">
          {[
            { id: 'general', label: '1. ข้อมูลทั่วไป & สุขภาพ' },
            { id: 'photos', label: '2. จัดการรูปถ่ายผู้ใช้บริการ' },
            { id: 'tp1_front', label: '3. บัตรประวัติ ท.ป.๑ (หน้า ๑)' },
            { id: 'tp1_back', label: '4. สรุปความเป็นมา (หน้า ๒)' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`py-3 px-3.5 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                activeSubTab === tab.id
                  ? 'border-amber-600 text-amber-700 bg-white font-bold'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {photoError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{photoError}</span>
            </div>
          )}

          {/* TAB 1: General Info */}
          {activeSubTab === 'general' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ชื่อ - นามสกุล <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    เลขประจำตัวประชาชน (13 หลัก)
                  </label>
                  <input
                    type="text"
                    value={nationalId}
                    onChange={(e) => setNationalId(e.target.value)}
                    placeholder="เช่น 1409900123456 หรือ ระบุไม่มี"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-hidden font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    เพศ
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-hidden"
                  >
                    <option value="male">ชาย</option>
                    <option value="female">หญิง</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    อายุ (ปี)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    อาคาร / เรือนพัก
                  </label>
                  <input
                    type="text"
                    value={building}
                    onChange={(e) => setBuilding(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    หน่วยงานนำส่ง
                  </label>
                  <input
                    type="text"
                    value={referringAgency}
                    onChange={(e) => setReferringAgency(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-hidden"
                  />
                </div>
              </div>

              {/* Category & Disabilities */}
              <div className="pt-3 border-t border-slate-200">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  กลุ่มเป้าหมายผู้ใช้บริการ
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="cat"
                      value="disabled"
                      checked={category === 'disabled'}
                      onChange={() => setCategory('disabled')}
                      className="text-amber-600 focus:ring-amber-500"
                    />
                    <span>คนพิการ</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="cat"
                      value="destitute"
                      checked={category === 'destitute'}
                      onChange={() => setCategory('destitute')}
                      className="text-amber-600 focus:ring-amber-500"
                    />
                    <span>คนไร้ที่พึ่ง</span>
                  </label>
                </div>
              </div>

              {/* Disability Types Checkboxes */}
              {category === 'disabled' && (
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="text-xs font-bold text-slate-800">
                    ประเภทความพิการ (เลือกได้มากกว่า 1 ข้อ ระบบจะจัดเป็นพิการซ้ำซ้อนให้อัตโนมัติ)
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {([1, 2, 3, 4, 5, 6] as DisabilityType[]).map((type) => (
                      <label
                        key={type}
                        className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                          disabilityTypes.includes(type)
                            ? 'bg-amber-50 border-amber-300 text-amber-900 font-semibold'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={disabilityTypes.includes(type)}
                          onChange={() => toggleDisabilityType(type)}
                          className="rounded text-amber-600 focus:ring-amber-500"
                        />
                        <span>{DISABILITY_TYPE_LABELS[type]}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Chronic diseases & Personality */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    โรคประจำตัว / การดูแลทางสุขภาพ
                  </label>
                  <textarea
                    rows={2}
                    value={chronicDiseases}
                    onChange={(e) => setChronicDiseases(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    อุปนิสัย / พฤติกรรมเด่น
                  </label>
                  <textarea
                    rows={2}
                    value={personalityTraits}
                    onChange={(e) => setPersonalityTraits(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-hidden"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Photos Upload */}
          {activeSubTab === 'photos' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* 1. Profile Photo */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">
                      1. รูปถ่ายหน้าตรงผู้ใช้บริการ
                    </span>
                    {photoUrl && (
                      <button
                        type="button"
                        onClick={() => setPhotoUrl(undefined)}
                        className="text-xs text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>ลบรูป</span>
                      </button>
                    )}
                  </div>

                  <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 rounded-xl bg-white min-h-[180px]">
                    {photoUrl ? (
                      <div className="relative group w-32 h-36 rounded-xl overflow-hidden border-2 border-amber-400 shadow-md">
                        <img
                          src={photoUrl}
                          alt="รูปถ่ายหน้าตรง"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="text-center text-slate-400 space-y-2">
                        <Camera className="w-10 h-10 mx-auto text-slate-300" />
                        <div className="text-xs">ยังไม่มีรูปถ่ายหน้าตรง</div>
                      </div>
                    )}

                    <label className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer transition-colors shadow-2xs">
                      <Camera className="w-3.5 h-3.5 text-amber-600" />
                      <span>{photoUrl ? 'เปลี่ยนรูปหน้าตรงใหม่' : 'อัปโหลดรูปหน้าตรง'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleProfilePhotoChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* 2. Physical Marks Photo */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">
                      2. รูปถ่ายตำหนิรูปพรรณ / แผลเป็น
                    </span>
                    {physicalMarksPhotoUrl && (
                      <button
                        type="button"
                        onClick={() => setPhysicalMarksPhotoUrl(undefined)}
                        className="text-xs text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>ลบรูป</span>
                      </button>
                    )}
                  </div>

                  <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 rounded-xl bg-white min-h-[180px]">
                    {physicalMarksPhotoUrl ? (
                      <div className="relative group w-32 h-36 rounded-xl overflow-hidden border-2 border-sky-400 shadow-md">
                        <img
                          src={physicalMarksPhotoUrl}
                          alt="รูปตำหนิรูปพรรณ"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="text-center text-slate-400 space-y-2">
                        <ImageIcon className="w-10 h-10 mx-auto text-slate-300" />
                        <div className="text-xs">ยังไม่มีรูปตำหนิรูปพรรณ</div>
                      </div>
                    )}

                    <label className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer transition-colors shadow-2xs">
                      <ImageIcon className="w-3.5 h-3.5 text-sky-600" />
                      <span>{physicalMarksPhotoUrl ? 'เปลี่ยนรูปตำหนิใหม่' : 'อัปโหลดรูปตำหนิ'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleMarksPhotoChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TP1 Front */}
          {activeSubTab === 'tp1_front' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ตำหนิรูปพรรณสัณฐาน
                  </label>
                  <input
                    type="text"
                    value={tp1.distinguishingMarks || ''}
                    onChange={(e) => setTp1({ ...tp1, distinguishingMarks: e.target.value })}
                    placeholder="เช่น แผลเป็นคิ้วขวา, รอยสักต้นแขน"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ภูมิลำเนาเดิม
                  </label>
                  <input
                    type="text"
                    value={tp1.hometownAddress || ''}
                    onChange={(e) => setTp1({ ...tp1, hometownAddress: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ชื่อบิดา
                  </label>
                  <input
                    type="text"
                    value={tp1.fatherName || ''}
                    onChange={(e) => setTp1({ ...tp1, fatherName: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ชื่อมารดา
                  </label>
                  <input
                    type="text"
                    value={tp1.motherName || ''}
                    onChange={(e) => setTp1({ ...tp1, motherName: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ประวัติการศึกษา
                  </label>
                  <input
                    type="text"
                    value={tp1.educationHistory || ''}
                    onChange={(e) => setTp1({ ...tp1, educationHistory: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    อาชีพเดิม
                  </label>
                  <input
                    type="text"
                    value={tp1.previousOccupation || ''}
                    onChange={(e) => setTp1({ ...tp1, previousOccupation: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ประวัติครอบครัว / ญาติพี่น้อง
                </label>
                <textarea
                  rows={2}
                  value={tp1.familyHistory || ''}
                  onChange={(e) => setTp1({ ...tp1, familyHistory: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-hidden"
                />
              </div>
            </div>
          )}

          {/* TAB 4: TP1 Back */}
          {activeSubTab === 'tp1_back' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  สรุปประวัติความเป็นมา (แบบ ท.ป. ๑ ด้านหลัง ข้อ ๑)
                </label>
                <textarea
                  rows={3}
                  value={tp1.backgroundSummary || ''}
                  onChange={(e) => setTp1({ ...tp1, backgroundSummary: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  การวิเคราะห์ทางสังคมสงเคราะห์ (ข้อ ๒)
                </label>
                <textarea
                  rows={3}
                  value={tp1.socialWorkAnalysis || ''}
                  onChange={(e) => setTp1({ ...tp1, socialWorkAnalysis: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  การฝึกอาชีพระหว่างการสงเคราะห์ (ข้อ ๓)
                </label>
                <textarea
                  rows={2}
                  value={tp1.vocationalTrainingInCare || ''}
                  onChange={(e) => setTp1({ ...tp1, vocationalTrainingInCare: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  การเปลี่ยนแปลงพฤติกรรม (ข้อ ๔)
                </label>
                <textarea
                  rows={2}
                  value={tp1.behaviorChangesNote || ''}
                  onChange={(e) => setTp1({ ...tp1, behaviorChangesNote: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-hidden"
                />
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isProcessingPhoto}
              className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>บันทึกการแก้ไขประวัติ</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
