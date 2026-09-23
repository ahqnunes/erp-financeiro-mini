import React, { useState } from 'react';
import { RotateCcw, AlertTriangle, X, Loader2 } from 'lucide-react';

interface ResetConfirmModalProps {
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export const ResetConfirmModal: React.FC<ResetConfirmModalProps> = ({ onClose, onConfirm }) => {
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    try {
      setSubmitting(true);
      await onConfirm();
      onClose();
    } catch {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-50 text-amber-600 rounded-xl border border-amber-200">
                <RotateCcw className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Restaurar Base de Demonstração</h3>
            </div>
            <button
              onClick={onClose}
              disabled={submitting}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="my-5 p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 space-y-1">
              <p className="font-semibold">Atenção: Ação Irreversível</p>
              <p className="text-amber-800 leading-relaxed">
                Esta ação restaura os lançamentos originais, baixas, clientes, fornecedores e plano de contas para o estado inicial de demonstração. Quaisquer dados ou títulos criados manualmente nesta sessão serão redefinidos.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Cancelar
            </button>
            <button
              type="button"
              id="btn-confirmar-reset-modal"
              onClick={handleConfirm}
              disabled={submitting}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 active:bg-amber-800 rounded-lg shadow-sm transition disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Restaurando...</span>
                </>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4" />
                  <span>Confirmar Restauração</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
