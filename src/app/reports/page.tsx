"use client";

import { useState, useCallback } from "react";
import { 
  ReportsList, 
  ReportViewer, 
  ReportBuilder,
  ReportToastProvider,
  useReportToast,
  createReportToasts,
  type Report 
} from "@/components/reports";

// ============================================
// Demo Data
// ============================================

const demoReports: Report[] = [
  {
    id: "1",
    title: "Monatlicher Umsatzbericht",
    description: "Übersicht aller Umsätze und Transaktionen des aktuellen Monats mit Vergleich zum Vormonat.",
    type: "bar",
    status: "published",
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-02-01"),
    viewCount: 234,
    author: { name: "Dieter" },
  },
  {
    id: "2",
    title: "Kundenakquise Q1",
    description: "Analyse der Neukundengewinnung im ersten Quartal.",
    type: "line",
    status: "published",
    createdAt: new Date("2024-01-20"),
    updatedAt: new Date("2024-01-28"),
    viewCount: 156,
    author: { name: "Dieter" },
  },
  {
    id: "3",
    title: "Traffic Analyse",
    description: "Website Traffic und Conversion Rates.",
    type: "mixed",
    status: "draft",
    createdAt: new Date("2024-02-01"),
    updatedAt: new Date("2024-02-05"),
    viewCount: 42,
    author: { name: "Dieter" },
  },
  {
    id: "4",
    title: "Produkt Performance",
    description: "Verkaufszahlen nach Produktkategorien.",
    type: "pie",
    status: "published",
    createdAt: new Date("2024-01-10"),
    updatedAt: new Date("2024-02-03"),
    viewCount: 89,
    author: { name: "Dieter" },
  },
];

const demoStats = [
  { id: "1", label: "Gesamtumsatz", value: "€124.500", change: 12.5, changeLabel: "vs. Vormonat" },
  { id: "2", label: "Neue Kunden", value: "47", change: 8.3, changeLabel: "vs. Vormonat" },
  { id: "3", label: "Conversion Rate", value: "3.2%", change: -2.1, changeLabel: "vs. Vormonat" },
  { id: "4", label: "Avg. Order Value", value: "€89", change: 5.7, changeLabel: "vs. Vormonat" },
];

// ============================================
// View Types
// ============================================

type View = "list" | "viewer" | "builder";

// ============================================
// Main Page Content
// ============================================

function ReportsPageContent() {
  const [view, setView] = useState<View>("list");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [reports, setReports] = useState<Report[]>(demoReports);
  const [isLoading, setIsLoading] = useState(false);

  const { showToast } = useReportToast();
  const toasts = createReportToasts(showToast);

  const handleCreateReport = useCallback(() => {
    setSelectedReport(null);
    setView("builder");
  }, []);

  const handleViewReport = useCallback((report: Report) => {
    setSelectedReport(report);
    setView("viewer");
  }, []);

  const handleEditReport = useCallback((report: Report) => {
    setSelectedReport(report);
    setView("builder");
  }, []);

  const handleDeleteReport = useCallback((report: Report) => {
    setReports(prev => prev.filter(r => r.id !== report.id));
    toasts.reportDeleted(report.title);
  }, [toasts]);

  const handleBack = useCallback(() => {
    setView("list");
    setSelectedReport(null);
  }, []);

  const handleSave = useCallback((data: { title: string; description: string; chartType: string }) => {
    toasts.reportSaved();
  }, [toasts]);

  const handlePublish = useCallback((data: { title: string; description: string; chartType: string }) => {
    const newReport: Report = {
      id: Date.now().toString(),
      title: data.title,
      description: data.description,
      type: data.chartType as Report["type"],
      status: "published",
      createdAt: new Date(),
      updatedAt: new Date(),
      viewCount: 0,
      author: { name: "Dieter" },
    };
    
    setReports(prev => [newReport, ...prev]);
    toasts.reportPublished(data.title);
    setView("list");
  }, [toasts]);

  // Simulate loading for demo
  const simulateLoading = useCallback(() => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1500);
  }, []);

  if (view === "builder") {
    return (
      <div className="h-[calc(100vh-4rem)]">
        <ReportBuilder
          initialData={selectedReport ? {
            title: selectedReport.title,
            description: selectedReport.description,
            chartType: selectedReport.type,
          } : undefined}
          onBack={handleBack}
          onSave={handleSave}
          onPublish={handlePublish}
        />
      </div>
    );
  }

  if (view === "viewer" && selectedReport) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <ReportViewer
          report={selectedReport}
          stats={demoStats}
          onBack={handleBack}
          onEdit={() => handleEditReport(selectedReport)}
          onShare={() => showToast({ type: "info", title: "Link kopiert", description: "Der Share-Link wurde in die Zwischenablage kopiert." })}
          onExport={() => showToast({ type: "success", title: "Export gestartet", description: "Dein Report wird als PDF exportiert." })}
          onRefresh={() => simulateLoading()}
          isLoading={isLoading}
        />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <ReportsList
        reports={reports}
        isLoading={isLoading}
        onCreateReport={handleCreateReport}
        onViewReport={handleViewReport}
        onEditReport={handleEditReport}
        onDeleteReport={handleDeleteReport}
      />
    </div>
  );
}

// ============================================
// Page with Provider
// ============================================

export default function ReportsPage() {
  return (
    <ReportToastProvider>
      <ReportsPageContent />
    </ReportToastProvider>
  );
}
