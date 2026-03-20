import SaleForm from '@/components/vendas/SaleForm';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NovaVendaPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/" className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
        </Link>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Registrar Venda</h2>
      </div>
      
      <SaleForm />
    </div>
  );
}
