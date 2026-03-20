'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, User, DollarSign, Calendar, Package, PlusCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { Cliente } from '@/types';

// Updated Schema to optionally allow creation of a new client
const saleSchema = z.object({
  cliente_id: z.string().min(1, 'Selecione ou crie um cliente'),
  novo_cliente_nome: z.string().optional(),
  novo_cliente_whatsapp: z.string().optional(),
  novo_cliente_cpf: z.string().optional(),
  novo_cliente_is_colaborador: z.boolean().optional().default(false),
  observacao: z.string().optional(),
  syscor_id: z.string().optional(),
  produto_nome: z.string().min(3, 'Nome do produto é obrigatório'),
  valor_total: z.coerce.number().min(1, 'O valor total deve ser maior que zero'),
  num_parcelas: z.coerce.number().min(1, 'No mínimo 1 parcela').max(24, 'No máximo 24 parcelas'),
  data_venda: z.string().min(1, 'A data da venda é obrigatória')
});

type SaleFormValues = z.infer<typeof saleSchema>;

export default function SaleForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [clientes, setClientes] = useState<Cliente[]>([]);

  const { register, handleSubmit, formState: { errors }, watch, reset } = useForm<SaleFormValues>({
    resolver: zodResolver(saleSchema) as any,
    defaultValues: {
      data_venda: new Date().toISOString().split('T')[0],
      num_parcelas: 1,
      cliente_id: ''
    }
  });

  const num_parcelas = watch('num_parcelas') || 1;
  const valor_total = watch('valor_total') || 0;
  const cliente_id = watch('cliente_id');
  const isNovoCliente = cliente_id === 'novo';
  
  const valorParcelaPreview = (valor_total / num_parcelas).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // Fetch Clientes on mount
  useEffect(() => {
    async function loadClientes() {
      if (!supabase) return;
      const { data } = await supabase.from('clientes').select('*').order('nome', { ascending: true });
      if (data) setClientes(data);
    }
    loadClientes();
  }, []);

  const onSubmit = async (data: SaleFormValues) => {
    setIsLoading(true);
    try {
      if (!supabase) throw new Error("Supabase client not initialized.");
      let finalClienteId = data.cliente_id;

      // 1. Creat novo cliente on the fly
      if (isNovoCliente) {
        if (!data.novo_cliente_nome || !data.novo_cliente_whatsapp || !data.novo_cliente_cpf) {
          alert('Preencha os dados do novo cliente!');
          setIsLoading(false);
          return;
        }
        const { data: novoCli, error: errCli } = await supabase.from('clientes').insert({
          nome: data.novo_cliente_nome,
          whatsapp: data.novo_cliente_whatsapp,
          cpf: data.novo_cliente_cpf,
          is_colaborador: data.novo_cliente_is_colaborador
        }).select().single();
        if (errCli) {
            console.error(errCli);
            alert('Erro ao criar cliente. CPF pode já existir.');
            setIsLoading(false);
            return;
        }
        finalClienteId = novoCli.id;
        // Atualiza combo p/ next time
        setClientes(prev => [...prev, novoCli]);
      }

      // 2. Inserir a Venda
      const { data: novaVenda, error: vendaError } = await supabase
        .from('vendas')
        .insert({
          cliente_id: finalClienteId,
          syscor_id: data.syscor_id || null,
          produto_nome: data.produto_nome,
          valor_total: data.valor_total,
          num_parcelas: data.num_parcelas,
          observacao: data.observacao || null,
          data_venda: data.data_venda,
          status_geral: 'em_aberto'
        })
        .select()
        .single();
        
      if (vendaError) throw vendaError;

      // 3. Gerar as Parcelas
      const dataBase = new Date(data.data_venda);
      const valorParcela = Number((data.valor_total / data.num_parcelas).toFixed(2));
      
      const arrayParcelas = Array.from({ length: data.num_parcelas }).map((_, idx) => {
        const vencimento = new Date(dataBase);
        vencimento.setMonth(vencimento.getMonth() + (idx + 1));
        
        return {
          venda_id: novaVenda.id,
          num_parcela: idx + 1,
          valor_parcela: valorParcela,
          data_vencimento: vencimento.toISOString().split('T')[0],
          valor_pago: 0,
          status_parcela: 'aberto'
        };
      });

      // 4. Inserir o array de Parcelas
      const { error: parcelasError } = await supabase.from('parcelas').insert(arrayParcelas);
      if (parcelasError) throw parcelasError;

      alert(`Venda registrada com sucesso! ${data.num_parcelas} parcelas geradas.`);
      reset(); // Limpa formulário
      
    } catch (error) {
      console.error("Falha ao salvar a venda", error);
      alert('Houve um erro ao processar a venda no Supabase.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 overflow-hidden shadow-sm sm:rounded-xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl mx-auto">
      <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold leading-6 text-slate-900 dark:text-slate-100">
            Nova Venda Parcelada
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Preencha os dados e as parcelas serão geradas automaticamente e salvas no banco de dados.
          </p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Cliente Comprador
          </label>
          <div className="relative">
            <User className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
            <select
              {...register('cliente_id')}
              className="pl-10 block w-full rounded-md border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 py-2.5 text-slate-900 dark:text-slate-200 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 border"
            >
              <option value="">Selecione na lista...</option>
              {clientes.map(cli => (
                <option key={cli.id} value={cli.id}>{cli.nome} - {cli.whatsapp}</option>
              ))}
              <option value="novo">+ Criar Novo Cliente</option>
            </select>
          </div>
          {errors.cliente_id && <p className="mt-2 text-sm text-red-600">{errors.cliente_id.message}</p>}
        </div>

        {/* Formulário Embutido Novo Cliente */}
        {isNovoCliente && (
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-indigo-100 dark:border-indigo-900/30 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="col-span-3">
              <h4 className="text-sm font-semibold text-indigo-700 dark:text-indigo-400 flex items-center gap-2">
                <PlusCircle className="w-4 h-4"/> 
                Criando Cliente Rapidamente
              </h4>
            </div>
            <div>
              <label className="block text-xs text-slate-500 dark:text-slate-400">Nome</label>
              <input {...register('novo_cliente_nome')} className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 py-2 px-3 text-sm focus:border-indigo-500 focus:ring-indigo-500 border"/>
            </div>
            <div>
              <label className="block text-xs text-slate-500 dark:text-slate-400">WhatsApp (apenas números)</label>
              <input {...register('novo_cliente_whatsapp')} placeholder="5511999999999" className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 py-2 px-3 text-sm focus:border-indigo-500 focus:ring-indigo-500 border"/>
            </div>
            <div>
              <label className="block text-xs text-slate-500 dark:text-slate-400">CPF</label>
              <input {...register('novo_cliente_cpf')} className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 py-2 px-3 text-sm focus:border-indigo-500 focus:ring-indigo-500 border"/>
            </div>
            <div className="col-span-1 md:col-span-3 flex items-center gap-2 mt-2">
              <input type="checkbox" id="is_colab" {...register('novo_cliente_is_colaborador')} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
              <label htmlFor="is_colab" className="text-sm text-slate-700 dark:text-slate-300">Marcar como Colaborador / Funcionário da Loja</label>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              ID Sistema (Syscor)
            </label>
            <input
              type="text"
              placeholder="Ex. SC-10293"
              {...register('syscor_id')}
              className="block w-full rounded-md border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 py-2.5 px-3 text-slate-900 dark:text-slate-200 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 border"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Produto Vendido
            </label>
            <div className="relative">
              <Package className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Ex. iPhone 13 Pro 128GB"
                {...register('produto_nome')}
                className="pl-10 block w-full rounded-md border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 py-2.5 text-slate-900 dark:text-slate-200 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 border"
              />
            </div>
            {errors.produto_nome && <p className="mt-2 text-sm text-red-600">{errors.produto_nome.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Data da Venda
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
              <input
                type="date"
                {...register('data_venda')}
                className="pl-10 block w-full rounded-md border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 py-2.5 text-slate-900 dark:text-slate-200 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 border"
              />
            </div>
            {errors.data_venda && <p className="mt-2 text-sm text-red-600">{errors.data_venda.message}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Observações / Negociação Específica (Opcional)
          </label>
          <textarea
            rows={2}
            placeholder="Ex: Cliente vai pagar a primeira parcela em dinheiro vivo e o resto no PIX..."
            {...register('observacao')}
            className="block w-full rounded-md border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 py-2.5 px-3 text-slate-900 dark:text-slate-200 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 border"
          />
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-lg border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Valor Total (R$)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register('valor_total')}
                className="pl-10 block w-full rounded-md border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 py-2.5 text-slate-900 dark:text-slate-200 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 border"
              />
            </div>
            {errors.valor_total && <p className="mt-2 text-sm text-red-600">{errors.valor_total.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Em quantas Parcelas?
            </label>
            <input
              type="number"
              min="1"
              max="24"
              {...register('num_parcelas')}
              className="block w-full rounded-md border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 py-2.5 text-slate-900 dark:text-slate-200 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 border"
            />
            {errors.num_parcelas && <p className="mt-2 text-sm text-red-600">{errors.num_parcelas.message}</p>}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-200 dark:border-slate-700 pt-5 gap-4">
          {valor_total > 0 && num_parcelas > 0 ? (
            <div className="text-sm font-medium text-slate-600 dark:text-slate-300 bg-indigo-50 dark:bg-slate-800 p-3 rounded-md w-full sm:w-auto text-center border border-indigo-100 dark:border-indigo-900">
              Geraremos <span className="font-bold text-indigo-600 dark:text-indigo-400">{num_parcelas}</span> parcelas de <span className="font-bold text-indigo-600 dark:text-indigo-400">{valorParcelaPreview}</span>
            </div>
          ) : (
            <div />
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full sm:w-auto inline-flex justify-center items-center gap-2 rounded-md bg-indigo-600 px-8 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isLoading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <><Save className="h-5 w-5" /> Salvar Venda</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
