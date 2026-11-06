import React, { useState, useEffect, useRef } from 'react';
import {
  Cloud,
  Database,
  FileSpreadsheet,
  HardDrive,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Upload,
  Download,
  Trash2,
  Copy,
  Check,
  ShieldCheck,
  ArrowRightLeft,
  LogOut,
  FolderSync,
} from 'lucide-react';
import {
  currentFirebaseConfig,
  isFirebaseConfigured,
  googleSignIn,
  logoutGoogle,
  subscribeGoogleAuth,
} from '../../lib/firebase';
import {
  storageService,
  CloudSyncStatus,
  DriveSyncConfigState,
} from '../../services/storageService';
import {
  createMasterGoogleSheet,
  syncToExistingGoogleSheet,
  restoreFromGoogleSheet,
  uploadJsonBackupToDrive,
  listDriveBackupFiles,
  downloadDriveBackupFile,
  deleteDriveBackupFile,
  DriveBackupFile,
  extractSpreadsheetId,
  FullDatabaseSnapshot,
} from '../../services/googleDriveSyncService';
import { Beneficiary, Nikhom } from '../../types';

interface CloudSyncViewProps {
  nikhoms: Nikhom[];
  beneficiaries: Beneficiary[];
  onDataRestored: () => void;
}

interface PendingConfirmAction {
  title: string;
  description: string;
  affectedSummary: string;
  confirmLabel: string;
  isDanger?: boolean;
  onConfirm: () => Promise<void>;
}

export const CloudSyncView: React.FC<CloudSyncViewProps> = ({
  nikhoms,
  beneficiaries,
  onDataRestored,
}) => {
  const [cloudStatus, setCloudStatus] = useState<CloudSyncStatus>(
    storageService.getCloudSyncStatus()
  );
  const [driveConfig, setDriveConfig] = useState<DriveSyncConfigState | null>(
    storageService.getDriveSyncConfig()
  );
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [statusBanner, setStatusBanner] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  // Sheet Title & Custom Sheet Link inputs
  const [customSheetTitle, setCustomSheetTitle] = useState(
    `ฐานข้อมูลโครงการบ้านน้อยในนิคม_พม_18_แห่ง`
  );
  const [linkSheetInput, setLinkSheetInput] = useState(
    driveConfig?.spreadsheetUrl || driveConfig?.spreadsheetId || ''
  );

  // Google Drive JSON Backups list
  const [driveBackups, setDriveBackups] = useState<DriveBackupFile[]>([]);
  const [isLoadingBackups, setIsLoadingBackups] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  // Explicit Confirmation Modal State (Required for mutating/destructive operations)
  const [pendingAction, setPendingAction] =
    useState<PendingConfirmAction | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const unsubStorage = storageService.subscribe(() => {
      setCloudStatus(storageService.getCloudSyncStatus());
      const latestDrive = storageService.getDriveSyncConfig();
      setDriveConfig(latestDrive);
      if (latestDrive && !linkSheetInput) {
        setLinkSheetInput(latestDrive.spreadsheetUrl || latestDrive.spreadsheetId);
      }
    });

    const unsubAuth = subscribeGoogleAuth((_user, token) => {
      setAccessToken(token);
      setCloudStatus(storageService.getCloudSyncStatus());
    });

    return () => {
      unsubStorage();
      unsubAuth();
    };
  }, []);

  useEffect(() => {
    if (accessToken) {
      void handleLoadDriveBackups();
    }
  }, [accessToken]);

  const handleGoogleLogin = async () => {
    setIsSigningIn(true);
    setStatusBanner(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setAccessToken(res.accessToken);
        setStatusBanner({
          type: 'success',
          text: `เชื่อมต่อบัญชี Google (${res.user.email}) สำเร็จ! ระบบเปิดใช้งานการซิงค์ฐานข้อมูล Firebase Firestore และ Google Drive / Sheets แล้ว`,
        });
      }
    } catch (err) {
      setStatusBanner({
        type: 'error',
        text:
          err instanceof Error
            ? `การเข้าสู่ระบบด้วย Google ไม่สำเร็จ: ${err.message}`
            : 'การเข้าสู่ระบบด้วย Google ไม่สำเร็จ',
      });
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleGoogleLogout = async () => {
    await logoutGoogle();
    setDriveBackups([]);
    setStatusBanner({
      type: 'info',
      text: 'ออกจากระบบบัญชี Google เรียบร้อยแล้ว ข้อมูลในเครื่องยังสามารถใช้งานได้ตามปกติ',
    });
  };

  const handleManualFirestoreSync = async () => {
    setIsBusy(true);
    setStatusBanner(null);
    try {
      await storageService.pushAllLocalToFirestore();
      setStatusBanner({
        type: 'success',
        text: `ซิงค์ข้อมูลทั้ง 18 หน่วยงาน และประวัติผู้ใช้บริการ ${beneficiaries.length} ราย ขึ้นฐานข้อมูล Firebase Firestore สำเร็จ!`,
      });
    } catch (err) {
      setStatusBanner({
        type: 'error',
        text:
          err instanceof Error
            ? `ซิงค์ข้อมูลขึ้น Firestore ไม่สำเร็จ: ${err.message}`
            : 'ซิงค์ข้อมูลขึ้น Firestore ไม่สำเร็จ',
      });
    } finally {
      setIsBusy(false);
    }
  };

  const handleCreateNewGoogleSheet = async () => {
    if (!accessToken) {
      await handleGoogleLogin();
      return;
    }
    setIsBusy(true);
    setStatusBanner(null);
    try {
      const snapshot = storageService.exportFullDatabaseSnapshot();
      const created = await createMasterGoogleSheet(snapshot, customSheetTitle);
      const newConfig: DriveSyncConfigState = {
        id: 'master_drive_config',
        spreadsheetId: created.spreadsheetId,
        spreadsheetUrl: created.spreadsheetUrl,
        spreadsheetTitle: created.spreadsheetTitle,
        lastSyncedAt: new Date().toLocaleString('th-TH'),
        syncedByEmail: cloudStatus.googleUserEmail || '-',
        autoSyncEnabled: true,
      };
      await storageService.saveDriveSyncConfig(newConfig);
      setLinkSheetInput(created.spreadsheetUrl);
      setStatusBanner({
        type: 'success',
        text: `สร้างไฟล์ Google Sheets "${created.spreadsheetTitle}" บน Google Drive พร้อมซิงค์ข้อมูลครบทั้ง 7 แท็บเรียบร้อยแล้ว!`,
      });
    } catch (err) {
      setStatusBanner({
        type: 'error',
        text: err instanceof Error ? err.message : 'สร้างไฟล์ Google Sheets ไม่สำเร็จ',
      });
    } finally {
      setIsBusy(false);
    }
  };

  const requestSyncOverwriteGoogleSheet = () => {
    const targetId = extractSpreadsheetId(
      linkSheetInput || driveConfig?.spreadsheetId || ''
    );
    if (!targetId) {
      setStatusBanner({
        type: 'error',
        text: 'กรุณาระบุลิงก์หรือรหัสไฟล์ Google Sheets หรือกดปุ่ม "สร้างไฟล์ Google Sheets ใหม่"',
      });
      return;
    }

    setPendingAction({
      title: 'ยืนยันการอัปเดตข้อมูลทับในไฟล์ Google Sheets',
      description:
        'ระบบจะทำการเขียนข้อมูลปัจจุบันจากแอปพลิเคชันลงในไฟล์ Google Sheets ทั้ง 7 แท็บ (รวมถึงข้อมูลสรุป 18 หน่วยงาน ทะเบียนประวัติ ท.ป.1 และผลประเมิน IRP)',
      affectedSummary: `ไฟล์เป้าหมาย: ${
        driveConfig?.spreadsheetTitle || targetId
      } • ข้อมูลนิคม 18 แห่ง • ผู้ใช้บริการ ${beneficiaries.length} ราย`,
      confirmLabel: 'ยืนยันการซิงค์ข้อมูลลง Google Sheets',
      onConfirm: async () => {
        setIsBusy(true);
        setStatusBanner(null);
        try {
          const snapshot = storageService.exportFullDatabaseSnapshot();
          const updated = await syncToExistingGoogleSheet(targetId, snapshot);
          const newConfig: DriveSyncConfigState = {
            id: 'master_drive_config',
            spreadsheetId: updated.spreadsheetId,
            spreadsheetUrl: updated.spreadsheetUrl,
            spreadsheetTitle: updated.spreadsheetTitle,
            lastSyncedAt: new Date().toLocaleString('th-TH'),
            syncedByEmail: cloudStatus.googleUserEmail || '-',
            autoSyncEnabled: true,
          };
          await storageService.saveDriveSyncConfig(newConfig);
          setStatusBanner({
            type: 'success',
            text: `ซิงค์ข้อมูลล่าสุดลงไฟล์ Google Sheets "${updated.spreadsheetTitle}" เรียบร้อยแล้ว!`,
          });
        } catch (err) {
          setStatusBanner({
            type: 'error',
            text:
              err instanceof Error
                ? err.message
                : 'ซิงค์ข้อมูลลง Google Sheets ไม่สำเร็จ',
          });
        } finally {
          setIsBusy(false);
        }
      },
    });
  };

  const requestRestoreFromGoogleSheet = () => {
    const targetId = extractSpreadsheetId(
      linkSheetInput || driveConfig?.spreadsheetId || ''
    );
    if (!targetId) {
      setStatusBanner({
        type: 'error',
        text: 'กรุณาวางลิงก์ (URL) หรือ Spreadsheet ID ของไฟล์ Google Sheets ที่ต้องการดึงข้อมูล',
      });
      return;
    }

    setPendingAction({
      title: 'ยืนยันการดึงข้อมูลจาก Google Sheets กลับมาทับในระบบ',
      description:
        'ข้อมูลในแอปพลิเคชันปัจจุบันจะถูกแทนที่ด้วยข้อมูลจากไฟล์ Google Sheets ที่ระบุ และซิงค์ขึ้นฐานข้อมูล Firebase Firestore ของบัญชีนี้ทันที',
      affectedSummary: `ดึงข้อมูลจาก Spreadsheet ID: ${targetId}`,
      confirmLabel: 'ยืนยันการกู้คืนข้อมูลจาก Google Sheets',
      isDanger: true,
      onConfirm: async () => {
        setIsBusy(true);
        setStatusBanner(null);
        try {
          const restored = await restoreFromGoogleSheet(targetId);
          await storageService.importFullDatabaseSnapshot(restored);
          onDataRestored();
          setStatusBanner({
            type: 'success',
            text: `กู้คืนข้อมูลจาก Google Sheets สำเร็จ! (หน่วยงาน ${restored.nikhoms.length} แห่ง, ผู้ใช้บริการ ${restored.beneficiaries.length} ราย)`,
          });
        } catch (err) {
          setStatusBanner({
            type: 'error',
            text:
              err instanceof Error
                ? err.message
                : 'ดึงข้อมูลจาก Google Sheets ไม่สำเร็จ',
          });
        } finally {
          setIsBusy(false);
        }
      },
    });
  };

  const handleLoadDriveBackups = async () => {
    if (!accessToken) return;
    setIsLoadingBackups(true);
    try {
      const files = await listDriveBackupFiles();
      setDriveBackups(files);
    } catch (err) {
      console.error('Failed to list Drive backups:', err);
    } finally {
      setIsLoadingBackups(false);
    }
  };

  const handleCreateDriveJsonBackup = async () => {
    if (!accessToken) {
      await handleGoogleLogin();
      return;
    }
    setIsBusy(true);
    setStatusBanner(null);
    try {
      const snapshot = storageService.exportFullDatabaseSnapshot();
      const uploaded = await uploadJsonBackupToDrive(snapshot);
      await handleLoadDriveBackups();
      setStatusBanner({
        type: 'success',
        text: `สำรองไฟล์ฐานข้อมูล "${uploaded.name}" ลงใน Google Drive ของคุณเรียบร้อยแล้ว!`,
      });
    } catch (err) {
      setStatusBanner({
        type: 'error',
        text:
          err instanceof Error
            ? err.message
            : 'อัปโหลดไฟล์สำรองขึ้น Google Drive ไม่สำเร็จ',
      });
    } finally {
      setIsBusy(false);
    }
  };

  const requestRestoreDriveBackupFile = (file: DriveBackupFile) => {
    setPendingAction({
      title: 'ยืนยันการกู้คืนฐานข้อมูลจากไฟล์สำรองบน Google Drive',
      description:
        'ระบบจะนำข้อมูลจากไฟล์สำรองที่เลือกมาแทนที่ข้อมูลปัจจุบันในระบบ และอัปเดตฐานข้อมูล Firebase Firestore',
      affectedSummary: `ไฟล์สำรอง: ${file.name} (สร้างเมื่อ ${new Date(
        file.createdTime
      ).toLocaleString('th-TH')})`,
      confirmLabel: 'ยืนยันการกู้คืนข้อมูล',
      isDanger: true,
      onConfirm: async () => {
        setIsBusy(true);
        setStatusBanner(null);
        try {
          const snapshot = await downloadDriveBackupFile(file.id);
          await storageService.importFullDatabaseSnapshot(snapshot);
          onDataRestored();
          setStatusBanner({
            type: 'success',
            text: `กู้คืนฐานข้อมูลจากไฟล์ "${file.name}" สำเร็จเรียบร้อยแล้ว!`,
          });
        } catch (err) {
          setStatusBanner({
            type: 'error',
            text:
              err instanceof Error
                ? err.message
                : 'กู้คืนข้อมูลจาก Google Drive ไม่สำเร็จ',
          });
        } finally {
          setIsBusy(false);
        }
      },
    });
  };

  const requestDeleteDriveBackupFile = (file: DriveBackupFile) => {
    setPendingAction({
      title: 'ยืนยันการลบไฟล์สำรองออกจาก Google Drive',
      description:
        'การดำเนินการนี้จะลบไฟล์สำรองฐานข้อมูลนี้ออกจาก Google Drive ของคุณอย่างถาวร ไม่สามารถเรียกคืนได้',
      affectedSummary: `ไฟล์ที่จะลบ: ${file.name}`,
      confirmLabel: 'ยืนยันการลบไฟล์ถาวร',
      isDanger: true,
      onConfirm: async () => {
        setIsBusy(true);
        setStatusBanner(null);
        try {
          await deleteDriveBackupFile(file.id);
          await handleLoadDriveBackups();
          setStatusBanner({
            type: 'info',
            text: `ลบไฟล์สำรอง "${file.name}" ออกจาก Google Drive เรียบร้อยแล้ว`,
          });
        } catch (err) {
          setStatusBanner({
            type: 'error',
            text:
              err instanceof Error
                ? err.message
                : 'ลบไฟล์ใน Google Drive ไม่สำเร็จ',
          });
        } finally {
          setIsBusy(false);
        }
      },
    });
  };

  const handleDownloadLocalJson = () => {
    const snapshot = storageService.exportFullDatabaseSnapshot();
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `BannoiNikhom_Database_${dateStr}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleUploadLocalJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(
          String(reader.result)
        ) as FullDatabaseSnapshot;
        if (
          !Array.isArray(parsed.nikhoms) ||
          !Array.isArray(parsed.beneficiaries)
        ) {
          throw new Error('โครงสร้างไฟล์ JSON ไม่ถูกต้อง');
        }
        setPendingAction({
          title: 'ยืนยันการนำเข้าฐานข้อมูลจากไฟล์ .JSON ในเครื่อง',
          description:
            'ข้อมูลจากไฟล์ที่คุณเลือกจะถูกนำเข้าสู่แอปพลิเคชันและซิงค์ขึ้นฐานข้อมูล Firebase Firestore',
          affectedSummary: `ไฟล์: ${file.name} • นิคม ${parsed.nikhoms.length} แห่ง • ผู้ใช้บริการ ${parsed.beneficiaries.length} ราย`,
          confirmLabel: 'ยืนยันการนำเข้าข้อมูล',
          isDanger: true,
          onConfirm: async () => {
            await storageService.importFullDatabaseSnapshot(parsed);
            onDataRestored();
            setStatusBanner({
              type: 'success',
              text: `นำเข้าฐานข้อมูลจากไฟล์ "${file.name}" สำเร็จเรียบร้อยแล้ว!`,
            });
          },
        });
      } catch (err) {
        setStatusBanner({
          type: 'error',
          text:
            err instanceof Error
              ? `อ่านไฟล์ไม่สำเร็จ: ${err.message}`
              : 'อ่านไฟล์ JSON ไม่สำเร็จ',
        });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const copySpreadsheetId = () => {
    if (!driveConfig?.spreadsheetId) return;
    navigator.clipboard.writeText(driveConfig.spreadsheetId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 rounded-2xl p-6 text-white shadow-lg border border-slate-700/60">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-semibold">
              <Cloud className="w-3.5 h-3.5" />
              <span>
                ระบบฐานข้อมูลแบบผสมผสาน (Hybrid Cloud: Firebase Firestore + Google Drive & Sheets)
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              ศูนย์จัดการฐานข้อมูล Cloud และการซิงค์ Google Drive (รองรับการย้ายข้าม Google ID)
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl">
              จัดเก็บข้อมูลแบบเรียลไทม์บน Firebase Firestore พร้อมซิงค์ออกเป็นตาราง Google Sheets 7 แท็บ
              และไฟล์สำรองบน Google Drive ของคุณโดยตรง เพื่อให้คุณสามารถย้าย Web App ไปยัง Google ID อื่นได้โดยข้อมูลไม่สูญหาย
            </p>
          </div>

          {/* Official Google Sign-In / Connected Account Area */}
          <div className="shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {cloudStatus.isAuthenticatedGoogle && accessToken ? (
              <div className="bg-slate-800/90 border border-emerald-500/40 rounded-xl p-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 font-bold text-sm">
                  ✓
                </div>
                <div className="text-xs">
                  <div className="text-emerald-300 font-semibold flex items-center gap-1.5">
                    <span>เชื่อมต่อ Google Drive & Cloud แล้ว</span>
                  </div>
                  <div className="text-slate-300 font-mono text-[11px]">
                    {cloudStatus.googleUserEmail}
                  </div>
                </div>
                <button
                  onClick={handleGoogleLogout}
                  className="ml-2 px-2.5 py-1.5 rounded-lg bg-slate-700 hover:bg-rose-600/80 text-slate-200 hover:text-white text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer"
                  title="สลับบัญชี Google"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>สลับบัญชี</span>
                </button>
              </div>
            ) : (
              <button
                onClick={handleGoogleLogin}
                disabled={isSigningIn}
                className="inline-flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-slate-800 font-medium text-sm px-4 py-2.5 rounded-full shadow-md border border-slate-300 transition-all cursor-pointer disabled:opacity-60"
              >
                <div className="w-5 h-5 shrink-0">
                  <svg
                    version="1.1"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 48 48"
                    className="w-full h-full block"
                  >
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                    ></path>
                    <path
                      fill="#4285F4"
                      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                    ></path>
                    <path
                      fill="#FBBC05"
                      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                    ></path>
                    <path
                      fill="#34A853"
                      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                    ></path>
                    <path fill="none" d="M0 0h48v48H0z"></path>
                  </svg>
                </div>
                <span className="font-semibold">
                  {isSigningIn
                    ? 'กำลังเชื่อมต่อ Google...'
                    : 'Sign in with Google (เชื่อมต่อ Drive & Cloud)'}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Status Alert Banner */}
      {statusBanner && (
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 text-sm ${
            statusBanner.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : statusBanner.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : 'bg-blue-50 border-blue-200 text-blue-900'
          }`}
        >
          {statusBanner.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 font-medium">{statusBanner.text}</div>
          <button
            onClick={() => setStatusBanner(null)}
            className="text-xs font-semibold underline opacity-75 hover:opacity-100 cursor-pointer"
          >
            ปิด
          </button>
        </div>
      )}

      {/* 3 Main Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card 1: Firebase Firestore Primary Database */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 text-sm">
                    1. ฐานข้อมูลหลัก (Firebase Firestore)
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    ซิงค์ข้อมูลแบบเรียลไทม์อัตโนมัติทุกครั้งที่บันทึก
                  </p>
                </div>
              </div>
              <span
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                  isFirebaseConfigured
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {isFirebaseConfigured ? 'พร้อมใช้งาน' : 'รอกำหนดค่าโปรเจกต์'}
              </span>
            </div>

            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Project ID ปัจจุบัน:</span>
                <span className="font-mono font-semibold text-slate-800">
                  {currentFirebaseConfig?.projectId || 'ยังไม่ผูกโปรเจกต์'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">สถานะการเชื่อมต่อ Google:</span>
                <span className="font-semibold text-slate-800">
                  {cloudStatus.isAuthenticatedGoogle
                    ? `เชื่อมต่อแล้ว (${cloudStatus.googleUserEmail})`
                    : 'โหมดออฟไลน์ / รอ Sign in'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">จำนวนข้อมูลในระบบ:</span>
                <span className="font-semibold text-amber-800">
                  {nikhoms.length} หน่วยงาน • {beneficiaries.length} ผู้ใช้บริการ
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">ซิงค์ Firestore ล่าสุด:</span>
                <span className="font-medium text-slate-700">
                  {cloudStatus.lastFirestoreSyncAt || 'อัตโนมัติเมื่อล็อกอิน'}
                </span>
              </div>
            </div>

            <div className="text-[11px] text-slate-600 leading-relaxed bg-amber-50/70 border border-amber-200/70 rounded-xl p-3">
              <strong className="text-amber-900">ข้อดีของระบบผสมผสาน:</strong>{' '}
              เมื่อเจ้าหน้าที่บันทึกผลประเมิน IRP หรือรับเข้าผู้ใช้บริการ ข้อมูลจะถูกจัดเก็บลง{' '}
              <strong>Firebase Firestore</strong> ทันทีโดยไม่ชนขีดจำกัดความเร็วของ Google Drive
            </div>
          </div>

          <button
            onClick={
              cloudStatus.isAuthenticatedGoogle
                ? handleManualFirestoreSync
                : handleGoogleLogin
            }
            disabled={isBusy}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw
              className={`w-4 h-4 ${
                cloudStatus.isSyncingFirestore || isBusy ? 'animate-spin' : ''
              }`}
            />
            <span>
              {cloudStatus.isAuthenticatedGoogle
                ? 'ซิงค์ข้อมูลทั้งหมดขึ้น Cloud Firestore ทันที'
                : 'เข้าสู่ระบบด้วย Google เพื่อเปิดซิงค์ Firestore'}
            </span>
          </button>
        </div>

        {/* Card 2: Google Sheets 7-Tab Master Sync */}
        <div className="bg-white rounded-2xl border border-emerald-200 p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 text-sm">
                    2. ซิงค์ตาราง Google Sheets บน Google Drive
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    แยก 7 แท็บอัตโนมัติ เปิดดู/แก้ไข/กู้คืนข้าม Google ID ได้ทันที
                  </p>
                </div>
              </div>
            </div>

            {driveConfig?.spreadsheetId ? (
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-900 truncate pr-2">
                    {driveConfig.spreadsheetTitle}
                  </span>
                  <a
                    href={driveConfig.spreadsheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-950 font-semibold underline shrink-0"
                  >
                    <span>เปิดไฟล์ใน Sheets</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
                <div className="flex items-center justify-between text-[11px] text-emerald-800">
                  <span className="font-mono truncate max-w-[190px]">
                    ID: {driveConfig.spreadsheetId}
                  </span>
                  <button
                    onClick={copySpreadsheetId}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white border border-emerald-200 text-emerald-800 hover:bg-emerald-100 cursor-pointer"
                  >
                    {copiedId ? (
                      <>
                        <Check className="w-3 h-3" />
                        <span>คัดลอกแล้ว</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>คัดลอก ID</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="text-[10px] text-emerald-700">
                  ซิงค์ล่าสุด: {driveConfig.lastSyncedAt} ({driveConfig.syncedByEmail})
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold text-slate-700">
                  ชื่อไฟล์ Google Sheets ที่จะสร้างใน Google Drive:
                </label>
                <input
                  type="text"
                  value={customSheetTitle}
                  onChange={(e) => setCustomSheetTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-emerald-600"
                  placeholder="ชื่อไฟล์ Google Sheets..."
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-slate-700">
                ลิงก์ (URL) หรือ Spreadsheet ID ของไฟล์ Google Sheets:
              </label>
              <input
                type="text"
                value={linkSheetInput}
                onChange={(e) => setLinkSheetInput(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-emerald-600 font-mono"
                placeholder="วางลิงก์ Google Sheets หรือ Spreadsheet ID ที่นี่..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <button
              onClick={handleCreateNewGoogleSheet}
              disabled={isBusy}
              className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>สร้างไฟล์ Google Sheets ใหม่บน Google Drive (7 แท็บ)</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={requestSyncOverwriteGoogleSheet}
                disabled={isBusy}
                className="py-2 px-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>อัปเดตลง Sheets</span>
              </button>
              <button
                onClick={requestRestoreFromGoogleSheet}
                disabled={isBusy}
                className="py-2 px-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>ดึงข้อมูลจาก Sheets</span>
              </button>
            </div>
          </div>
        </div>

        {/* Card 3: Google Drive JSON Backup & Offline Migration */}
        <div className="bg-white rounded-2xl border border-blue-200 p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
                  <HardDrive className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 text-sm">
                    3. สำรองไฟล์ฐานข้อมูลบน Google Drive (.JSON)
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    เก็บไฟล์ Snapshot บน Google Drive หรือดาวน์โหลดลงเครื่อง
                  </p>
                </div>
              </div>
              {accessToken && (
                <button
                  onClick={handleLoadDriveBackups}
                  className="p-1.5 text-slate-500 hover:text-blue-700 rounded-lg hover:bg-blue-50 cursor-pointer"
                  title="รีเฟรชรายการไฟล์ใน Google Drive"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${isLoadingBackups ? 'animate-spin' : ''}`}
                  />
                </button>
              )}
            </div>

            <div className="bg-slate-50 rounded-xl border border-slate-200 p-3 max-h-44 overflow-y-auto space-y-2">
              {!accessToken ? (
                <div className="text-center py-6 text-xs text-slate-500">
                  กดปุ่ม <strong>Sign in with Google</strong> ด้านบนเพื่อดูและจัดการไฟล์สำรองใน Google Drive ของคุณ
                </div>
              ) : driveBackups.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500">
                  ยังไม่มีไฟล์สำรอง .JSON ใน Google Drive ของบัญชีนี้
                </div>
              ) : (
                driveBackups.map((file) => (
                  <div
                    key={file.id}
                    className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-800 truncate">
                        {file.name}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {new Date(file.createdTime).toLocaleString('th-TH')}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => requestRestoreDriveBackupFile(file)}
                        className="px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-800 font-semibold text-[11px] cursor-pointer"
                        title="กู้คืนจากไฟล์นี้"
                      >
                        กู้คืน
                      </button>
                      <button
                        onClick={() => requestDeleteDriveBackupFile(file)}
                        className="p-1 rounded text-rose-600 hover:bg-rose-50 cursor-pointer"
                        title="ลบไฟล์ออกจาก Google Drive"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="space-y-2">
            <button
              onClick={handleCreateDriveJsonBackup}
              disabled={isBusy}
              className="w-full py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
            >
              <FolderSync className="w-4 h-4" />
              <span>สำรองฐานข้อมูลขึ้น Google Drive ทันที (.JSON)</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleDownloadLocalJson}
                className="py-2 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>ดาวน์โหลด .JSON</span>
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="py-2 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>นำเข้าไฟล์ .JSON</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleUploadLocalJson}
                className="hidden"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Multi-ID Portability Guide Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700">
            <ArrowRightLeft className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">
              คู่มือการนำ Web App นี้ไปใช้งานกับอีก Google ID หนึ่ง (ย้ายข้ามบัญชีได้ใน 3 ขั้นตอน)
            </h3>
            <p className="text-xs text-slate-500">
              สถาปัตยกรรมถูกออกแบบให้รองรับการคัดลอก (Remix / Share) ไปยังบัญชี Google ปลายทางได้อย่างสมบูรณ์
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-1.5">
            <div className="font-bold text-amber-800 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-amber-600 text-white text-[11px] flex items-center justify-center">
                1
              </span>
              <span>ส่งออกข้อมูลจาก ID ต้นทาง</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              ในหน้านี้ ให้กดปุ่ม <strong>"สร้างไฟล์ Google Sheets ใหม่บน Google Drive"</strong>{' '}
              (แล้วแชร์ไฟล์ Sheets นั้นให้ Google ID ใหม่) หรือกดปุ่ม{' '}
              <strong>"ดาวน์โหลด .JSON"</strong> เก็บไว้ในเครื่อง
            </p>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-1.5">
            <div className="font-bold text-emerald-800 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] flex items-center justify-center">
                2
              </span>
              <span>เปิด Web App ใน Google ID ใหม่</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              เมื่อคัดลอกแอปไปยัง Google ID ใหม่แล้ว ให้กดปุ่ม{' '}
              <strong>Sign in with Google</strong> ด้วยบัญชีใหม่ ระบบจะสร้างพื้นที่ฐานข้อมูลแยกสำหรับบัญชีใหม่โดยอัตโนมัติ
            </p>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-1.5">
            <div className="font-bold text-blue-800 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] flex items-center justify-center">
                3
              </span>
              <span>ดึงข้อมูลเข้าสู่ Google ID ใหม่ทันที</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              วางลิงก์ Google Sheets แล้วกด <strong>"ดึงข้อมูลจาก Sheets"</strong> หรือกด{' '}
              <strong>"นำเข้าไฟล์ .JSON"</strong> ข้อมูลทั้ง 18 นิคมและประวัติ ท.ป.1 / IRP ทั้งหมดจะพร้อมใช้งานใน ID ใหม่ทันที 100%
            </p>
          </div>
        </div>
      </div>

      {/* Explicit User Confirmation Modal for Destructive/Mutating Operations */}
      {pendingAction && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  pendingAction.isDanger
                    ? 'bg-rose-100 text-rose-700'
                    : 'bg-amber-100 text-amber-700'
                }`}
              >
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-slate-900 text-base">
                  {pendingAction.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {pendingAction.description}
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium text-slate-800">
              {pendingAction.affectedSummary}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setPendingAction(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
              >
                ยกเลิก (Cancel)
              </button>
              <button
                onClick={async () => {
                  const action = pendingAction;
                  setPendingAction(null);
                  await action.onConfirm();
                }}
                className={`px-4 py-2 rounded-xl text-white text-xs font-semibold cursor-pointer ${
                  pendingAction.isDanger
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {pendingAction.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
