import React, { useState, useEffect } from 'react';
import { storageService } from './services/storageService';
import { 
  Beneficiary, Nikhom, MonthlyProgressReport,
  SystemNotification, UserAccount, IRPEvaluation, RehabPlan,
  HealthRecordEntry, CivilRegistrationRecord,
  ActivityWorkItem, DischargeRecordTP1
} from './types';
import { Navbar } from './components/layout/Navbar';
import { MobileNav } from './components/layout/MobileNav';
import { LoginView } from './components/auth/LoginView';
import { UserManagementView } from './components/auth/UserManagementView';
import { ExecutiveDashboard } from './components/dashboard/ExecutiveDashboard';
import { BeneficiaryList } from './components/beneficiaries/BeneficiaryList';
import { BeneficiaryDetailModal } from './components/beneficiaries/BeneficiaryDetailModal';
import { IRPEvaluationModal } from './components/irp/IRPEvaluationModal';
import { RehabPlanModal } from './components/rehab/RehabPlanModal';
import { NewBeneficiaryModal } from './components/beneficiaries/NewBeneficiaryModal';
import { MonthlyReportView } from './components/reports/MonthlyReportView';
import { ProjectTimelineView } from './components/timeline/ProjectTimelineView';
import { NikhomsView } from './components/nikhoms/NikhomsView';
import { NotificationDrawer } from './components/notifications/NotificationDrawer';
import { CloudSyncView } from './components/cloud/CloudSyncView';
import { IRP6MonthLoginAlertModal } from './components/irp/IRP6MonthLoginAlertModal';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(storageService.getCurrentUser());
  const [userAccounts, setUserAccounts] = useState<UserAccount[]>(storageService.getUserAccounts());
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [nikhoms, setNikhoms] = useState<Nikhom[]>([]);
  const [monthlyReport, setMonthlyReport] = useState<MonthlyProgressReport>(storageService.getMonthlyReport());
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);

  // Modals state
  const [selectedBeneficiaryId, setSelectedBeneficiaryId] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [evaluatingBeneficiary, setEvaluatingBeneficiary] = useState<Beneficiary | null>(null);
  const [rehabBeneficiary, setRehabBeneficiary] = useState<Beneficiary | null>(null);
  const [isNewBeneficiaryModalOpen, setIsNewBeneficiaryModalOpen] = useState(false);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);

  // Sync state with storageService
  const reloadData = () => {
    setCurrentUser(storageService.getCurrentUser());
    setUserAccounts(storageService.getUserAccounts());
    setBeneficiaries(storageService.getBeneficiaries());
    setNikhoms(storageService.getNikhoms());
    setMonthlyReport(storageService.getMonthlyReport());
    setNotifications(storageService.getNotifications());
  };

  useEffect(() => {
    reloadData();
    const unsubscribe = storageService.subscribe(() => {
      reloadData();
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = (username: string, password: string) => {
    return storageService.login(username, password);
  };

  const handleLogout = () => {
    storageService.logout();
  };

  const handleSwitchAccount = (account: UserAccount) => {
    storageService.setCurrentUser(account);
  };

  const handleCreateUserAccount = (account: Omit<UserAccount, 'id'>) => {
    storageService.createUserAccount(account);
  };

  const handleUpdateUserAccount = (id: string, updates: Partial<UserAccount>) => {
    storageService.updateUserAccount(id, updates);
  };

  const handleResetData = () => {
    storageService.resetData();
    reloadData();
  };

  const canAccessBeneficiary = (targetNikhomId: string): boolean => {
    return storageService.canAccessBeneficiary(currentUser, targetNikhomId);
  };

  const handleOpenBeneficiaryDetail = (id: string) => {
    const target = beneficiaries.find((b) => b.id === id);
    if (!target) return;
    if (!storageService.canAccessBeneficiary(currentUser, target.nikhomId)) {
      return;
    }
    setSelectedBeneficiaryId(id);
    setIsDetailModalOpen(true);
  };

  const [rehabFocusDomains, setRehabFocusDomains] = useState<string[]>([]);

  const handleOpenIRPModal = (b: Beneficiary) => {
    if (!storageService.canAccessBeneficiary(currentUser, b.nikhomId)) return;
    setEvaluatingBeneficiary(b);
  };

  const handleOpenRehabModal = (b: Beneficiary, targetFocusDomains?: string[]) => {
    if (!storageService.canAccessBeneficiary(currentUser, b.nikhomId)) return;
    setRehabBeneficiary(b);
    setRehabFocusDomains(targetFocusDomains || []);
  };

  const handleSaveIRP = (evaluation: Omit<IRPEvaluation, 'id'>) => {
    if (!evaluatingBeneficiary) return;
    storageService.recordIRPEvaluation(evaluatingBeneficiary.id, evaluation);
  };

  const handleSaveRehabPlan = (plan: Omit<RehabPlan, 'id'>) => {
    if (!rehabBeneficiary) return;
    storageService.saveRehabPlan(rehabBeneficiary.id, plan);
    setRehabBeneficiary(null);
    setRehabFocusDomains([]);
  };

  const handleSaveNewBeneficiary = (b: Omit<Beneficiary, 'id' | 'uniquePersonId'> & { uniquePersonId?: string }) => {
    const created = storageService.addBeneficiary(b);
    return created;
  };

  const handleReadmitBeneficiary = (
    beneficiaryId: string,
    params: {
      nikhomId: string;
      building: string;
      admissionDate: string;
      referringAgency: string;
      registrationCode: string;
      healthNote: string;
      bloodPressure?: string;
      weightKg?: number;
    }
  ) => {
    storageService.readmitBeneficiary(beneficiaryId, params);
    setIsNewBeneficiaryModalOpen(false);
  };

  const handleAddHealthUpdate = (beneficiaryId: string, entry: Omit<HealthRecordEntry, 'id'>) => {
    storageService.addHealthUpdate(beneficiaryId, entry);
  };

  const handleUpdateCivilRegistration = (
    beneficiaryId: string,
    civilRegistration: CivilRegistrationRecord
  ) => {
    storageService.updateCivilRegistration(beneficiaryId, civilRegistration);
  };

  const handleUpdateActivitiesAndMonthlyIncome = (
    beneficiaryId: string,
    activityDetails: ActivityWorkItem[],
    monthYearTh: string,
    notes?: string
  ) => {
    storageService.updateActivitiesAndMonthlyIncome(
      beneficiaryId,
      activityDetails,
      monthYearTh,
      notes
    );
  };

  const handleDischargeBeneficiary = (
    beneficiaryId: string,
    params: {
      reason: DischargeRecordTP1['reason'];
      reasonDetail: string;
      dischargeDate: string;
      followUpResult: string;
    }
  ) => {
    storageService.dischargeBeneficiary(beneficiaryId, params);
  };

  const handleUpdateMonthlyReport = (report: MonthlyProgressReport) => {
    storageService.saveMonthlyReport(report);
  };

  // If logged out, show Login Screen
  if (!currentUser) {
    return (
      <LoginView
        accounts={userAccounts}
        nikhoms={nikhoms}
        onLogin={handleLogin}
      />
    );
  }

  // Critical IRP count
  const criticalIRPCount = beneficiaries.filter(
    (b) => b.latestIRP?.isUnder50Percent && b.status !== 'discharged'
  ).length;

  const selectedBeneficiary = beneficiaries.find((b) => b.id === selectedBeneficiaryId);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-['Prompt',sans-serif]">
      {/* Top Navigation */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        currentUser={currentUser}
        allAccounts={userAccounts}
        nikhoms={nikhoms}
        onSwitchAccount={handleSwitchAccount}
        onLogout={handleLogout}
        notifications={notifications}
        onOpenNotifications={() => setIsNotificationDrawerOpen(true)}
        onOpenNewBeneficiaryModal={() => setIsNewBeneficiaryModalOpen(true)}
        criticalIRPCount={criticalIRPCount}
        onResetData={handleResetData}
        onRefreshData={reloadData}
      />

      {/* Main Viewport Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentTab === 'dashboard' && (
          <ExecutiveDashboard
            beneficiaries={beneficiaries}
            nikhoms={nikhoms}
            monthlyReport={monthlyReport}
            currentUser={currentUser}
            canAccessBeneficiary={canAccessBeneficiary}
            onSelectBeneficiary={handleOpenBeneficiaryDetail}
            onNavigateToTab={setCurrentTab}
            onOpenIRPModal={handleOpenIRPModal}
          />
        )}

        {currentTab === 'beneficiaries' && (
          <BeneficiaryList
            beneficiaries={beneficiaries}
            nikhoms={nikhoms}
            currentUser={currentUser}
            canAccessBeneficiary={canAccessBeneficiary}
            onSelectBeneficiary={handleOpenBeneficiaryDetail}
            onOpenNewModal={() => setIsNewBeneficiaryModalOpen(true)}
            onOpenIRPModal={handleOpenIRPModal}
            onOpenRehabModal={handleOpenRehabModal}
          />
        )}

        {currentTab === 'monthly_report' && (
          <MonthlyReportView
            report={monthlyReport}
            nikhoms={nikhoms}
            userRole={currentUser.role}
            onUpdateReport={handleUpdateMonthlyReport}
          />
        )}

        {currentTab === 'timeline' && (
          <ProjectTimelineView userRole={currentUser.role} />
        )}

        {currentTab === 'nikhoms' && (
          <NikhomsView
            nikhoms={nikhoms}
            beneficiaries={beneficiaries}
            userRole={currentUser.role}
            onSelectNikhomFilter={() => {
              setCurrentTab('beneficiaries');
            }}
          />
        )}

        {currentTab === 'cloud_sync' && (
          <CloudSyncView
            nikhoms={nikhoms}
            beneficiaries={beneficiaries}
            onDataRestored={reloadData}
          />
        )}

        {currentTab === 'users' && currentUser.role === 'super_admin' && (
          <UserManagementView
            currentUser={currentUser}
            accounts={userAccounts}
            nikhoms={nikhoms}
            onCreateAccount={handleCreateUserAccount}
            onUpdateAccount={handleUpdateUserAccount}
          />
        )}
      </main>

      {/* Mobile / Tablet Bottom Navigation */}
      <MobileNav
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenNewBeneficiaryModal={() => setIsNewBeneficiaryModalOpen(true)}
        userRole={currentUser.role}
        criticalIRPCount={criticalIRPCount}
      />

      {/* Beneficiary Dossier & Individual Timeline Modal */}
      {selectedBeneficiary && (
        <BeneficiaryDetailModal
          beneficiary={selectedBeneficiary}
          nikhoms={nikhoms}
          currentUserName={currentUser.name}
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedBeneficiaryId(null);
          }}
          onOpenIRPModal={() => handleOpenIRPModal(selectedBeneficiary)}
          onOpenRehabModal={() => handleOpenRehabModal(selectedBeneficiary)}
          onAddHealthUpdate={handleAddHealthUpdate}
          onUpdateCivilRegistration={handleUpdateCivilRegistration}
          onUpdateActivitiesAndMonthlyIncome={handleUpdateActivitiesAndMonthlyIncome}
          onDischargeBeneficiary={handleDischargeBeneficiary}
          onUpdateBeneficiary={(updated) => {
            reloadData();
          }}
        />
      )}

      {/* 6-Month IRP Cycle Popup Alert Modal on Log In */}
      <IRP6MonthLoginAlertModal
        currentUser={currentUser}
        beneficiaries={beneficiaries}
        nikhoms={nikhoms}
        canAccessBeneficiary={canAccessBeneficiary}
        onOpenIRPModal={handleOpenIRPModal}
        onOpenBeneficiaryDetail={handleOpenBeneficiaryDetail}
      />

      {/* IRP 14-Item Score Sheet Modal */}
      {evaluatingBeneficiary && (
        <IRPEvaluationModal
          beneficiary={evaluatingBeneficiary}
          isOpen={Boolean(evaluatingBeneficiary)}
          onClose={() => setEvaluatingBeneficiary(null)}
          onSave={handleSaveIRP}
          evaluatorDefaultName={currentUser.name}
          onOpenRehabPlan={handleOpenRehabModal}
        />
      )}

      {/* 5-Area Individual Rehabilitation Plan Modal */}
      {rehabBeneficiary && (
        <RehabPlanModal
          beneficiary={rehabBeneficiary}
          isOpen={Boolean(rehabBeneficiary)}
          onClose={() => {
            setRehabBeneficiary(null);
            setRehabFocusDomains([]);
          }}
          onSave={handleSaveRehabPlan}
          plannerDefaultName={currentUser.name}
          targetFocusDomains={rehabFocusDomains}
        />
      )}

      {/* New Beneficiary / Re-admission Modal */}
      <NewBeneficiaryModal
        isOpen={isNewBeneficiaryModalOpen}
        onClose={() => setIsNewBeneficiaryModalOpen(false)}
        nikhoms={nikhoms}
        existingBeneficiaries={beneficiaries}
        currentUser={currentUser}
        onSaveNew={handleSaveNewBeneficiary}
        onReadmitExisting={handleReadmitBeneficiary}
        onOpenBeneficiaryDetail={handleOpenBeneficiaryDetail}
      />

      {/* Notification Center Drawer */}
      <NotificationDrawer
        isOpen={isNotificationDrawerOpen}
        onClose={() => setIsNotificationDrawerOpen(false)}
        notifications={notifications}
        onMarkAsRead={(id) => storageService.markNotificationRead(id)}
        onMarkAllAsRead={() => storageService.markAllNotificationsRead()}
        onSelectBeneficiary={handleOpenBeneficiaryDetail}
      />
    </div>
  );
}
