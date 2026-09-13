import React, { useState } from "react";
import {
  Sparkles,
  ChevronDown,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Send,
  Calendar,
  Megaphone,
  Bell,
  Search,
  X,
  ExternalLink,
  ShieldCheck,
  CheckSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp } from "@/context/AppContext";
import { QA_NOTIFICATION_SCENARIOS } from "@/data/qaNotificationScenarios";
import { QaScenario } from "@/types/qaNotification";
import { motion, AnimatePresence } from "motion/react";

interface NotificationQaSwitcherProps {
  onApplyScenario: (scenario: QaScenario) => void;
  onResetToDefault: () => void;
  onSimulatePushTap: (scenario: QaScenario) => void;
}

export default function NotificationQaSwitcher({
  onApplyScenario,
  onResetToDefault,
  onSimulatePushTap,
}: NotificationQaSwitcherProps) {
  const { qaNotificationScenario, qaDiagnosticResult, setQaDiagnosticResult } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [showPushBanner, setShowPushBanner] = useState(false);

  const filteredScenarios = QA_NOTIFICATION_SCENARIOS.filter((s) => {
    const matchesCategory =
      selectedCategory === "ALL" || s.category === selectedCategory;
    const matchesSearch =
      s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.targetEntityId &&
        s.targetEntityId.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleSelectScenario = (scenario: QaScenario) => {
    setQaDiagnosticResult(null);
    onApplyScenario(scenario);
    setIsOpen(false);
    if (scenario.id === "QA-19") {
      setShowPushBanner(true);
    } else {
      setShowPushBanner(false);
    }
  };

  const handleReset = () => {
    setQaDiagnosticResult(null);
    setShowPushBanner(false);
    onResetToDefault();
  };

  return (
    <div className="w-full bg-slate-900 text-white border-b-2 border-slate-700 shadow-md">
      {/* Push Notification Banner Simulation (QA-19 or Triggered) */}
      <AnimatePresence>
        {showPushBanner && qaNotificationScenario && (
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            className="p-3 bg-gradient-to-r from-slate-900 to-indigo-950 border-b border-indigo-500/40"
          >
            <div className="max-w-md mx-auto bg-slate-800/90 backdrop-blur-md rounded-2xl p-3 border border-indigo-400/30 shadow-xl flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shrink-0 shadow-sm">
                <Bell className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider">
                    HMK HRM • PUSH NOTIFICATION
                  </span>
                  <span className="text-[10px] text-slate-400">Vừa xong</span>
                </div>
                <h4 className="text-xs font-bold text-white mt-0.5 truncate">
                  {qaNotificationScenario.title}
                </h4>
                <p className="text-[11px] text-slate-300 line-clamp-1 mt-0.5">
                  Target: {qaNotificationScenario.targetEntityId || "N/A"} • Chạm để mở theo resolver
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <button
                    onClick={() => {
                      setShowPushBanner(false);
                      onSimulatePushTap(qaNotificationScenario);
                    }}
                    className="px-3 py-1 bg-primary hover:bg-primary/90 text-white text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Chạm để mở (Mô phỏng Push)
                  </button>
                  <button
                    onClick={() => setShowPushBanner(false)}
                    className="px-2 py-1 text-slate-400 hover:text-white text-[11px]"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Switcher Header Bar */}
      <div className="px-3 py-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-black uppercase tracking-wider shrink-0">
            MOCK / QA ONLY
          </span>
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-xs font-bold px-2.5 py-1.5 rounded-lg border border-slate-600 transition-colors truncate"
          >
            <span className="text-slate-300">QA Scenario:</span>
            <span className="text-amber-400 font-extrabold truncate max-w-[170px]">
              {qaNotificationScenario
                ? `${qaNotificationScenario.id}`
                : "Mặc định (Chưa chọn)"}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-0.5" />
          </button>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {qaNotificationScenario && (
            <button
              onClick={() => setShowPushBanner(true)}
              title="Mô phỏng nhận Push Notification"
              className="p-1.5 rounded-lg bg-indigo-900/60 hover:bg-indigo-800 text-indigo-300 border border-indigo-700/50 text-[11px] font-bold flex items-center gap-1"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Test Push</span>
            </button>
          )}
          <button
            onClick={handleReset}
            title="Khôi phục trạng thái thông báo mặc định"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Active Diagnostic Status Panel (Section 24 & 25) */}
      {qaNotificationScenario && (
        <div className="px-3 pb-2.5 pt-1 text-xs border-t border-slate-800 bg-slate-950/60">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 truncate">
                <span className="font-extrabold text-amber-400">
                  {qaNotificationScenario.id}:
                </span>
                <span className="font-semibold text-slate-200 truncate">
                  {qaNotificationScenario.title}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 shrink-0 font-mono bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                Target: {qaNotificationScenario.targetEntityId || "null"}
              </span>
            </div>

            {/* Snapshot vs Current State Pills */}
            <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
              <span className="text-slate-400 font-medium">Snapshot:</span>
              <span className="px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800/60 font-semibold">
                {qaNotificationScenario.snapshotState}
              </span>
              <span className="text-slate-500">→</span>
              <span className="text-slate-400 font-medium">Current:</span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 font-semibold">
                {qaNotificationScenario.currentState}
              </span>
            </div>

            {/* Expected Route description */}
            <div className="text-[10px] text-slate-300 leading-snug bg-slate-900/90 p-1.5 rounded border border-slate-800">
              <span className="text-slate-400 font-bold">Kỳ vọng: </span>
              {qaNotificationScenario.expectedDestination}
            </div>

            {/* QA Note */}
            {qaNotificationScenario.qaNote && (
              <p className="text-[10px] text-amber-200/80 italic">
                * QA Note: {qaNotificationScenario.qaNote}
              </p>
            )}

            {/* Test Result Indicator (Section 25) */}
            {qaDiagnosticResult ? (
              <div
                className={cn(
                  "flex items-center gap-2 p-1.5 rounded-md border text-[11px] font-medium",
                  qaDiagnosticResult.status === "PASS"
                    ? "bg-emerald-950/80 text-emerald-300 border-emerald-700"
                    : "bg-red-950/80 text-red-300 border-red-700",
                )}
              >
                {qaDiagnosticResult.status === "PASS" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <span className="font-bold mr-1">
                    {qaDiagnosticResult.status}:
                  </span>
                  <span>{qaDiagnosticResult.details}</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                <span className="flex items-center gap-1 text-slate-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse inline-block"></span>
                  Sẵn sàng kiểm thử: Chạm thông báo bên dưới để kích hoạt điều hướng
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Scenario Picker Drawer / Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/75 z-50 flex justify-center items-end"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 w-full max-w-md rounded-t-2xl flex flex-col max-h-[85vh] border-t border-slate-700 shadow-2xl text-white overflow-hidden"
            >
              {/* Drawer Handle & Header */}
              <div className="p-4 border-b border-slate-800 shrink-0">
                <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto mb-3"></div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-black uppercase tracking-wider">
                        MOCK / QA ONLY
                      </span>
                      <h3 className="text-base font-bold text-white">
                        Chọn Kịch Bản Kiểm Thử
                      </h3>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Contextual Navigation & Target Locator Test Harness
                    </p>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Search Bar */}
                <div className="mt-3 relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm kiếm mã QA, ID thẻ, ca..."
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-primary"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Category Filter Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar mt-3 pt-1">
                  {[
                    { id: "ALL", label: "Tất cả (19)" },
                    { id: "TICKET", label: "Yêu cầu (Ticket)" },
                    { id: "SHIFT", label: "Ca làm (Shift)" },
                    { id: "SHIFT_BRIEFING", label: "Bảng tin" },
                    { id: "GENERAL", label: "Chung" },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors border",
                        selectedCategory === cat.id
                          ? "bg-primary text-white border-primary"
                          : "bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600",
                      )}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scenarios List */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {filteredScenarios.length > 0 ? (
                  filteredScenarios.map((scenario) => {
                    const isSelected = qaNotificationScenario?.id === scenario.id;
                    return (
                      <div
                        key={scenario.id}
                        onClick={() => handleSelectScenario(scenario)}
                        className={cn(
                          "p-3 rounded-xl border text-left cursor-pointer transition-all active:scale-[0.99]",
                          isSelected
                            ? "bg-indigo-950/60 border-indigo-500 shadow-md ring-1 ring-indigo-500"
                            : "bg-slate-800/80 border-slate-700/80 hover:bg-slate-800 hover:border-slate-600",
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-amber-400 font-mono">
                              {scenario.id}
                            </span>
                            <span className="text-xs font-bold text-white">
                              {scenario.title}
                            </span>
                          </div>
                          {scenario.targetEntityId && (
                            <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-700 shrink-0">
                              {scenario.targetEntityId}
                            </span>
                          )}
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px]">
                          <span className="text-slate-400 font-medium">Snapshot:</span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-900 text-amber-300 border border-slate-700">
                            {scenario.snapshotState}
                          </span>
                          <span className="text-slate-500">→</span>
                          <span className="text-slate-400 font-medium">Current:</span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-900 text-emerald-300 border border-slate-700">
                            {scenario.currentState}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-300 mt-2 line-clamp-2 leading-relaxed bg-slate-900/60 p-1.5 rounded border border-slate-800">
                          <strong className="text-slate-400">Kỳ vọng: </strong>
                          {scenario.expectedDestination}
                        </p>

                        <div className="mt-2 flex items-center justify-between pt-1 border-t border-slate-700/50">
                          <span className="text-[10px] text-slate-400">
                            Nhóm: <strong className="text-slate-200">{scenario.category}</strong>
                          </span>
                          <span className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1">
                            Chọn kịch bản →
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-slate-500 text-xs">
                    Không tìm thấy kịch bản phù hợp với tìm kiếm
                  </div>
                )}
              </div>

              {/* Reset to default CTA */}
              <div className="p-3 border-t border-slate-800 shrink-0 bg-slate-950 flex items-center justify-between">
                <button
                  onClick={handleReset}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 border border-slate-700 flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Khôi phục mặc định
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-xs font-bold text-white shadow-sm"
                >
                  Đóng
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
