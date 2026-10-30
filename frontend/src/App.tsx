import React, { useState } from 'react';
import { Sidebar, ScreenId } from './layouts/Sidebar';
import { Navbar } from './layouts/Navbar';

// 13 Compliance Screens
import { DashboardPage } from './pages/DashboardPage';
import { CustomersPage } from './pages/CustomersPage';
import { CustomerDetailPage } from './pages/CustomerDetailPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { VerificationsPage } from './pages/VerificationsPage';
import { KYCCompletenessPage } from './pages/KYCCompletenessPage';
import { RiskRatingsPage } from './pages/RiskRatingsPage';
import { BeneficialOwnersPage } from './pages/BeneficialOwnersPage';
import { ReviewCasesPage } from './pages/ReviewCasesPage';
import { ExpiryAlertsPage } from './pages/ExpiryAlertsPage';
import { ExceptionsEvaluationPage } from './pages/ExceptionsEvaluationPage';
import { AuditEventsPage } from './pages/AuditEventsPage';
import { DataValidationPage } from './pages/DataValidationPage';
import { api } from './services/api';

export function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('dashboard');
  const [activeCustomerId, setActiveCustomerId] = useState<string | null>(null);
  const [currentRole, setCurrentRole] = useState<string>('Operations Analyst');
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);

  const handleSelectCustomer = (customerId: string) => {
    setActiveCustomerId(customerId);
    setCurrentScreen('customer_detail');
  };

  const handleBackToCustomers = () => {
    setCurrentScreen('customers');
  };

  const handleRefresh = () => {
    setRefreshKey((k) => k + 1);
  };

  const handleTriggerGenerate = async (preset: 'starter' | 'full') => {
    try {
      setIsGenerating(true);
      setNotification(`Generating and loading ${preset} dataset (Seed: 20261022)...`);
      const res = await api.triggerDataGeneration(preset);
      setNotification(res.message);
      setRefreshKey((k) => k + 1);
      setTimeout(() => setNotification(null), 5000);
    } catch (err) {
      console.error('Error generating dataset:', err);
      setNotification('Failed to generate dataset.');
    } finally {
      setIsGenerating(false);
    }
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'dashboard':
        return <DashboardPage key={refreshKey} />;
      case 'customers':
        return <CustomersPage key={refreshKey} onSelectCustomer={handleSelectCustomer} />;
      case 'customer_detail':
        return activeCustomerId ? (
          <CustomerDetailPage
            key={`${activeCustomerId}-${refreshKey}`}
            customerId={activeCustomerId}
            onBack={handleBackToCustomers}
          />
        ) : (
          <CustomersPage key={refreshKey} onSelectCustomer={handleSelectCustomer} />
        );
      case 'documents':
        return <DocumentsPage key={refreshKey} />;
      case 'verifications':
        return <VerificationsPage key={refreshKey} />;
      case 'completeness':
        return <KYCCompletenessPage key={refreshKey} />;
      case 'risk_ratings':
        return <RiskRatingsPage key={refreshKey} />;
      case 'beneficial_owners':
        return <BeneficialOwnersPage key={refreshKey} />;
      case 'review_cases':
        return <ReviewCasesPage key={refreshKey} />;
      case 'alerts':
        return <ExpiryAlertsPage key={refreshKey} />;
      case 'exceptions':
        return <ExceptionsEvaluationPage key={refreshKey} />;
      case 'audit':
        return <AuditEventsPage key={refreshKey} />;
      case 'validation':
        return <DataValidationPage key={refreshKey} />;
      default:
        return <DashboardPage key={refreshKey} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Fixed Left Sidebar */}
      <Sidebar
        currentScreen={currentScreen}
        onSelectScreen={(screen) => setCurrentScreen(screen)}
        activeCustomerId={activeCustomerId}
      />

      {/* Main Content Area */}
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        <Navbar
          currentRole={currentRole}
          onRoleChange={setCurrentRole}
          onRefresh={handleRefresh}
          onTriggerGenerate={handleTriggerGenerate}
          isGenerating={isGenerating}
        />

        {/* Global Notification Banner */}
        {notification && (
          <div className="mt-16 px-6 pt-4">
            <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 font-medium">
              {notification}
            </div>
          </div>
        )}

        {/* Page Content Container */}
        <main className={`flex-1 p-6 ${notification ? 'pt-2' : 'pt-20'} max-w-7xl mx-auto w-full`}>
          {renderScreen()}
        </main>
      </div>
    </div>
  );
}
export default App;
