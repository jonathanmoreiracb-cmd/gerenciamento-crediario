'use client';

import React, { useEffect, useState } from 'react';
import { X, Printer, CheckCircle, FileText, Calendar, DollarSign, User, FileSpreadsheet, Copy, Check, MessageCircle } from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'parcela' | 'quitacao';
  parcela?: {
    id: string;
    num_parcela: number;
    total_parcelas: number;
    valor: number;
    valor_pago: number;
    vencimento: string;
    data_pagamento?: string | null;
    cliente: string;
    cpf?: string;
    produto: string;
    observacao?: string;
    whatsapp?: string;
  } | null;
  venda?: {
    id: string;
    produto_nome: string;
    valor_total: number;
    num_parcelas: number;
    data_venda: string;
    syscor_id?: string;
    cliente?: {
      nome: string;
      cpf?: string;
      whatsapp?: string;
    };
    parcelas?: Array<{
      id: string;
      num_parcela: number;
      valor_parcela: number;
      valor_pago: number;
      data_pagamento?: string | null;
      status_parcela: string;
    }>;
  } | null;
}

export default function ReceiptModal({ isOpen, onClose, type, parcela, venda }: ReceiptModalProps) {
  const { user, logAction } = useAuth();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Prevent background scrolling when modal is open on screen
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePrint = async () => {
    try {
      // Log the audit event
      if (type === 'parcela' && parcela) {
        await logAction(
          'imprimir_comprovante_parcela',
          `Operador imprimiu comprovante da parcela ${parcela.num_parcela}/${parcela.total_parcelas} (R$ ${parcela.valor_pago.toFixed(2)}) do cliente ${parcela.cliente}`,
          { parcela_id: parcela.id, cliente: parcela.cliente, num_parcela: parcela.num_parcela }
        );
      } else if (type === 'quitacao' && venda) {
        const clienteNome = venda.cliente?.nome || 'Cliente';
        await logAction(
          'imprimir_comprovante_quitacao',
          `Operador imprimiu comprovante de quitação total da venda "${venda.produto_nome}" (Total: R$ ${venda.valor_total.toFixed(2)}) do cliente ${clienteNome}`,
          { venda_id: venda.id, cliente: clienteNome, produto: venda.produto_nome }
        );
      }
    } catch (error) {
      console.error('Erro ao registrar log de impressão:', error);
    }

    // Trigger window.print
    window.print();
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '-';
    // Format YYYY-MM-DD or ISO string to DD/MM/YYYY
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const todayStr = new Date().toLocaleDateString('pt-BR');
  const operatorName = user?.nome || 'Operador';

  const getReceiptText = () => {
    if (type === 'parcela' && parcela) {
      return `*COMPROVANTE DE PAGAMENTO - FITCH TECNOLOGIA LTDA*
CNPJ: 52.311.538/0001-10
--------------------------------------------------
*DADOS DO CLIENTE*
Cliente: ${parcela.cliente}
CPF: ${parcela.cpf || 'Não informado'}

*DETALHES DO PAGAMENTO*
Produto: ${parcela.produto}
Parcela: ${parcela.num_parcela} de ${parcela.total_parcelas}
Vencimento: ${formatDate(parcela.vencimento)}
Data do Pagamento: ${formatDate(parcela.data_pagamento)}
Valor da Parcela: ${formatCurrency(parcela.valor)}
*Valor Pago: ${formatCurrency(parcela.valor_pago)}*
--------------------------------------------------
Autenticação: ${parcela.id}
Emitido por: ${operatorName} em ${todayStr}`;
    } else if (type === 'quitacao' && venda) {
      const clienteNome = venda.cliente?.nome || 'Cliente';
      const parcelasList = venda.parcelas
        ? venda.parcelas.map(p => `• Parcela ${p.num_parcela}/${venda.num_parcelas}: ${formatCurrency(p.valor_pago)} em ${formatDate(p.data_pagamento)}`).join('\n')
        : '';
      return `*RECIBO DE QUITAÇÃO TOTAL - FITCH TECNOLOGIA LTDA*
CNPJ: 52.311.538/0001-10
--------------------------------------------------
*DADOS DO CLIENTE*
Cliente: ${clienteNome}
CPF: ${venda.cliente?.cpf || 'Não informado'}

*DETALHES DA COMPRA*
Produto: ${venda.produto_nome}
${venda.syscor_id ? `Nº Venda (Syscor): ${venda.syscor_id}\n` : ''}Data da Compra: ${formatDate(venda.data_venda)}

*HISTÓRICO DE PARCELAS QUITADAS*
${parcelasList}

*STATUS: QUITAÇÃO TOTAL E LIQUIDAÇÃO DE DÉBITO*
A Fitch Tecnologia LTDA declara para os devidos fins a quitação total do débito referente a este contrato.
*Total Pago: ${formatCurrency(venda.valor_total)}*
--------------------------------------------------
Autenticação: ${venda.id}
Emitido por: ${operatorName} em ${todayStr}`;
    }
    return '';
  };

  const handleCopyText = async () => {
    const text = getReceiptText();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      if (type === 'parcela' && parcela) {
        await logAction(
          'copiar_texto_comprovante_parcela',
          `Operador copiou dados do comprovante da parcela ${parcela.num_parcela}/${parcela.total_parcelas} do cliente ${parcela.cliente}`,
          { parcela_id: parcela.id }
        );
      } else if (type === 'quitacao' && venda) {
        await logAction(
          'copiar_texto_comprovante_quitacao',
          `Operador copiou dados de quitação da venda "${venda.produto_nome}" do cliente ${venda.cliente?.nome}`,
          { venda_id: venda.id }
        );
      }
    } catch (err) {
      alert('Erro ao copiar texto.');
    }
  };

  const handleShareWhatsApp = async () => {
    const text = getReceiptText();
    if (!text) return;
    
    let wpp = '';
    if (type === 'parcela' && parcela) {
      wpp = parcela.whatsapp || '';
    } else if (type === 'quitacao' && venda) {
      wpp = venda.cliente?.whatsapp || '';
    }
    
    let wppLimpo = wpp.replace(/\D/g, '');
    if (wppLimpo.length === 11) wppLimpo = `55${wppLimpo}`;

    try {
      if (type === 'parcela' && parcela) {
        await logAction(
          'compartilhar_whatsapp_comprovante_parcela',
          `Operador compartilhou via WhatsApp o comprovante da parcela ${parcela.num_parcela}/${parcela.total_parcelas} do cliente ${parcela.cliente}`,
          { parcela_id: parcela.id }
        );
      } else if (type === 'quitacao' && venda) {
        await logAction(
          'compartilhar_whatsapp_comprovante_quitacao',
          `Operador compartilhou via WhatsApp o comprovante de quitação da venda "${venda.produto_nome}" do cliente ${venda.cliente?.nome}`,
          { venda_id: venda.id }
        );
      }
    } catch (e) {}

    window.open(`https://wa.me/${wppLimpo}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm print-backdrop-active overflow-y-auto">
      <div className="bg-white dark:bg-slate-950 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 dark:border-slate-800 print-modal-box my-8">
        
        {/* On-screen Header Actions (Hidden in Print) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 no-print">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
            <FileText className="w-5 h-5" />
            <span className="font-semibold text-sm sm:text-base">Visualizar Comprovante</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleCopyText}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-semibold transition-colors shadow-xs cursor-pointer"
              title="Copiar texto do comprovante para a área de transferência"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copiar Texto
                </>
              )}
            </button>
            <button
              onClick={handleShareWhatsApp}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs cursor-pointer"
              title="Enviar comprovante formatado via WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              WhatsApp
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm cursor-pointer"
              title="Imprimir ou exportar como PDF nativo"
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimir / PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div className="p-8 sm:p-12 text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-950 relative">
          
          {/* Watermark/Decorative Background Element (Hidden in Print) */}
          <div className="absolute right-8 top-8 opacity-[0.03] pointer-events-none no-print">
            <CheckCircle className="w-64 h-64 text-indigo-600" />
          </div>

          {/* Receipt Content Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-2 border-slate-100 dark:border-slate-800 pb-6 mb-6">
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white uppercase">
                FITCH TECNOLOGIA LTDA
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-1">
                CNPJ: 52.311.538/0001-10
              </p>
            </div>
            <div className="mt-4 sm:mt-0 text-left sm:text-right">
              <span className="inline-block px-3 py-1 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold rounded-full border border-emerald-200 dark:border-emerald-900/40 uppercase tracking-wider">
                {type === 'quitacao' ? 'Quitação Total' : 'Comprovante'}
              </span>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 font-mono">
                Emitido em: {todayStr}
              </p>
            </div>
          </div>

          {/* Client Info Block */}
          <div className="bg-slate-50 dark:bg-slate-900/40 rounded-xl p-5 border border-slate-100 dark:border-slate-900 mb-6">
            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1">
              <User className="w-3.5 h-3.5" /> Dados do Cliente
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-xs">Nome Completo</p>
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  {type === 'parcela' ? parcela?.cliente : venda?.cliente?.nome || 'Não informado'}
                </p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-xs">CPF</p>
                <p className="font-mono text-slate-800 dark:text-slate-200 font-medium">
                  {type === 'parcela' ? (parcela?.cpf || 'Não informado') : (venda?.cliente?.cpf || 'Não informado')}
                </p>
              </div>
            </div>
          </div>

          {/* Details / Payment Info Block */}
          {type === 'parcela' && parcela && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1 border-b border-slate-100 dark:border-slate-800 pb-2">
                <DollarSign className="w-3.5 h-3.5" /> Detalhes do Pagamento da Parcela
              </h3>
              
              <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
                <div>
                  <p className="text-slate-500 dark:text-slate-400 text-xs">Produto</p>
                  <p className="font-semibold">{parcela.produto}</p>
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400 text-xs">Identificação da Parcela</p>
                  <p className="font-semibold">{parcela.num_parcela} de {parcela.total_parcelas}</p>
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400 text-xs">Vencimento Original</p>
                  <p className="font-semibold font-mono">{formatDate(parcela.vencimento)}</p>
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400 text-xs">Data do Pagamento</p>
                  <p className="font-semibold font-mono text-emerald-600 dark:text-emerald-400">
                    {formatDate(parcela.data_pagamento)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400 text-xs">Valor da Parcela</p>
                  <p className="font-semibold">{formatCurrency(parcela.valor)}</p>
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400 text-xs">Valor Pago</p>
                  <p className="font-bold text-lg text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(parcela.valor_pago)}
                  </p>
                </div>
              </div>

              {parcela.observacao && (
                <div className="mt-2 text-xs bg-slate-50 dark:bg-slate-900/20 p-3 rounded-lg border border-dashed border-slate-200 dark:border-slate-800">
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px] mb-1">Observações da Venda</p>
                  <p className="text-slate-600 dark:text-slate-400 italic">"{parcela.observacao}"</p>
                </div>
              )}
            </div>
          )}

          {type === 'quitacao' && venda && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1 border-b border-slate-100 dark:border-slate-800 pb-2">
                <FileSpreadsheet className="w-3.5 h-3.5" /> Detalhes da Compra e Parcelas Quitadas
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div className="col-span-2">
                  <p className="text-slate-500 dark:text-slate-400 text-xs">Produto Adquirido</p>
                  <p className="font-semibold text-slate-800 dark:text-white">{venda.produto_nome}</p>
                </div>
                {venda.syscor_id && (
                  <div>
                    <p className="text-slate-500 dark:text-slate-400 text-xs">Nº Venda (Syscor)</p>
                    <p className="font-semibold font-mono text-indigo-600 dark:text-indigo-400">{venda.syscor_id}</p>
                  </div>
                )}
                <div>
                  <p className="text-slate-500 dark:text-slate-400 text-xs">Data da Compra</p>
                  <p className="font-semibold font-mono">{formatDate(venda.data_venda)}</p>
                </div>
              </div>

              {/* Installments Table */}
              <div className="mt-4 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-4 py-2">Parcela</th>
                      <th className="px-4 py-2">Valor Parcela</th>
                      <th className="px-4 py-2">Valor Pago</th>
                      <th className="px-4 py-2">Data Pagto</th>
                      <th className="px-4 py-2 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono">
                    {venda.parcelas && venda.parcelas.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20">
                        <td className="px-4 py-2 font-semibold text-slate-700 dark:text-slate-300">
                          {p.num_parcela} de {venda.num_parcelas}
                        </td>
                        <td className="px-4 py-2 text-slate-600 dark:text-slate-400">
                          {formatCurrency(p.valor_parcela)}
                        </td>
                        <td className="px-4 py-2 text-emerald-600 dark:text-emerald-400 font-bold">
                          {formatCurrency(p.valor_pago)}
                        </td>
                        <td className="px-4 py-2 text-slate-600 dark:text-slate-400">
                          {formatDate(p.data_pagamento)}
                        </td>
                        <td className="px-4 py-2 text-right">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 uppercase">
                            Pago
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals Summary */}
              <div className="flex justify-between items-center bg-emerald-50/50 dark:bg-emerald-950/10 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/20 mt-4">
                <div>
                  <p className="text-emerald-800 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider">
                    Selo de Quitação Total
                  </p>
                  <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                    A FITCH TECNOLOGIA LTDA declara para os devidos fins a quitação total do débito referente a este contrato.
                  </p>
                </div>
                <div className="text-right whitespace-nowrap pl-4">
                  <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">Total Pago</p>
                  <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(venda.valor_total)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Separation line for printing */}
          <div className="border-t-2 border-dashed border-slate-200 dark:border-slate-800 my-8 pt-8">
            
            {/* Disclaimer / Terms */}
            <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center leading-relaxed max-w-md mx-auto">
              Este recibo serve como comprovante oficial de pagamento da(s) respectiva(s) parcela(s) indicada(s) acima, 
              sendo emitido eletronicamente pela plataforma de gerenciamento Fitch Tecnologia LTDA.
            </p>

            {/* Signature Area */}
            <div className="mt-12 flex flex-col items-center justify-center text-center">
              <div className="w-64 border-b border-slate-300 dark:border-slate-700 pb-1">
                {/* Visual placeholder for signature / stamp */}
                <p className="font-serif italic text-sm text-slate-400 dark:text-slate-500 select-none pb-1">
                  Fitch Tecnologia
                </p>
              </div>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-2 uppercase tracking-wider">
                FITCH TECNOLOGIA LTDA
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                Emitente Autorizado
              </p>
            </div>
          </div>

          {/* Audit Logging Info at the very bottom (Small details) */}
          <div className="flex justify-between items-center text-[9px] text-slate-400 dark:text-slate-600 mt-6 pt-4 border-t border-slate-100 dark:border-slate-900 font-mono">
            <span>Operador: {operatorName}</span>
            <span>Código de Autenticidade: {parcela?.id || venda?.id || 'N/A'}</span>
          </div>

        </div>

        {/* On-screen Footer Close Button (Hidden in Print) */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-end no-print">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            Fechar Visualização
          </button>
        </div>

      </div>
    </div>
  );
}
