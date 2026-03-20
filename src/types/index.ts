export type StatusGeralVenda = 'em_aberto' | 'quitado' | 'atrasado';
export type StatusParcela = 'aberto' | 'pago' | 'parcial' | 'atrasado';

export interface Cliente {
  id: string; // uuid
  nome: string;
  whatsapp: string;
  cpf: string;
  data_cadastro?: string; // timestamp
}

export interface Venda {
  id: string; // uuid
  cliente_id: string;
  syscor_id?: string; // NOVO: numero do sistema syscor
  produto_nome: string;
  valor_total: number;
  num_parcelas: number;
  data_venda: string; // timestamp
  status_geral: StatusGeralVenda;
  // relacional
  cliente?: Cliente;
  parcelas?: Parcela[];
}

export interface Parcela {
  id: string; // uuid
  venda_id: string;
  num_parcela: number; // 1, 2, 3...
  valor_parcela: number;
  data_vencimento: string; // date YYYY-MM-DD
  data_pagamento?: string | null; // date
  valor_pago: number;
  status_parcela: StatusParcela;
  // relacional
  venda?: Venda;
}
