import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const rawData = `Cliente	Data da Venda	Produto	Valor Total	Nº Parcelas	Valor Parcela	Mês 1	Mês 2	Mês 3	Mês 4	Mês 5	Mês 6	Mês 7	Mês 8	Mês 9	Mês 10
ESRON	12/06/2025	APPLE IPHONE 15 SN	R$ 5.000,00	10	R$ 500,00	12/07/2025	12/08/2025	12/09/2025	12/10/2025	12/11/2025	12/12/2025	12/01/2026	12/02/2026	12/03/2026	12/04/2026
FABIO LEITE	17/09/2025	APPLE 15 PRO 256GB BRANCO SN	R$ 4.400,00	8	R$ 550,00	17/10/2025	17/11/2025	17/12/2025	17/01/2026	17/02/2026	17/03/2026	17/04/2026	17/05/2026
FREDERICO (PRIMO EROS)	10/09/2025	APPLE 16 + FONTE ORIGINAL	R$ 6.070,00	10	R$ 607,00	10/10/2025	10/11/2025	10/12/2025	12/01/2026	12/02/2026	12/03/2026	12/04/2026	12/05/2026	12/06/2026	12/07/2026
JORGINHO BRUM	22/11/2025	APPLE 17 PRO MAX 256GB	R$ 9.100,00	3	R$ 3.033,33	22/12/2025	22/01/2026	22/02/2026
JORGINHO BRUM	10/12/2026	REDMI NOTE NOTE 14 PRO PLUS 256GB	R$ 2.610,00	3	R$ 870,00	10/01/2026	10/02/2026
NILSON DA CONCEIÇÃO (VEREADOR)	11/12/2026	APPLE 17 PRO MAX 256GB SILVER	R$ 8.550,00	3	R$ 2.850,00	21/01/2026	21/02/2026	21/03/2026
JORGINHO BRUM	16/12/2025	APPLE 17 PRO MAX 256GB SILVER	R$ 4.000,00	2	R$ 2.000,00	16/01/2026	16/02/2026
EDUARDO RAMOS	24/12/2025	AIRPODS 3º GERAÇÃO	R$ 2.000,00	2	R$ 1.000,00
JAYME TAVARES	24/12/2025	APPLE 17 PRO MAX 256GB SILVER	R$ 3.600,00	3	R$ 1.200,00	24/01/2026	24/02/2026	24/03/2026
ERIKA MIQUELIM (ESPOSA RICARDO)	02/02/2026	IPHONE LACRADO APPLE APPLE 16 256GB - (Branco) Novo	R$ 1.650,00	4	R$ 412,50	02/03/2026	02/04/2026	02/05/2026	02/06/2026
CALEBE DOS SANTOS XAVIER	10/02/2026	IPHONE LACRADO APPLE APPLE 15 128GB - (AZUL) + PELÍCULA 3D + FONTE USB-C 20W ORIGINAL APPLE + CASE MAGSAFE	R$ 5.000,00	5	R$ 1.000,00	10/03/2026	10/04/2026	10/05/2026	10/06/2026	10/07/2026
JORGINHO BRUM	12/02/2026	APPLE 17 PRO MAX 256GB AZUL	R$ 5.194,00	3	R$ 1.731,33	12/03/2026	12/04/2023	12/05/2023
KELVIN (JORGINHO)	24/01/2026	APPLE 16 PRO 128GB - LC	R$ 7.625,00	6	R$ 1.270,83	24/02/2026	24/03/2026	24/05/2026	24/06/2026	24/07/2026	24/08/2026
MATHEUS LEONE (JORGINHO)	12/02/2026	APPLE 17 PRO MAX 256GB LARANJA	R$ 8.850,00	5	R$ 1.770,00	25/02/2026	25/03/2026	25/04/2023	25/05/2026	25/06/2026
AFIF	24/02/2026	APPLE 16 PRO MAX 256GB 	R$ 6.000,00	3	R$ 2.000,00	24/02/2026	24/03/2026	24/04/2026
JORGINHO BRUM	24/02/2026	APPLE 15 128GB PRETO	R$ 4.000,00	6	R$ 666,67	24/03/2026	24/04/2026	24/05/2026	24/06/2026	24/07/2026	24/05/2026
FLÁVIO AUGUSTO	21/02/2026	APPLE WATCH ULTRA 3	R$ 2.700,00	1	R$ 2.700,00
SANDRO DE CASTRO	17/03/2026	APPLE 17 PRO MAX LARANJA 	R$ 5.330,00	2	R$ 2.665,00	17/04/2026	17/05/2026
SANDRO DE CASTRO	17/03/2026	XIAOMI POCO X7PRO 512GB	R$ 2.600,00	2	R$ 1.300,00	17/04/2026	17/05/2026
DIOGO BARRA	06/03/2026	2 - APPLE 17 PRO MAX LAR/BCO	R$ 18.000,00	6	R$ 3.000,00	06/04/2026	06/05/2026	06/06/2026	06/07/2026	06/08/2026	06/09/2026
ALINE SOUZA(CUNHADA ROGÉRIO)	07/03/2026	2 - APPLE 16 128GB	R$ 8.000,00	4	R$ 2.000,00	07/04/2026	07/05/2026	07/06/2026	07/07/2026
NILSON DA CONCEIÇÃO (VEREADOR)	03/03/2026	APPLE 13 PRO MAX 128GB	R$ 2.400,00	3	R$ 800,00	03/04/2026	03/05/2026	03/06/2026
HELINHO	11/03/2026	REDMI NOTE 14 PRO 256GB	R$ 2.230,00	3	R$ 743,33	11/04/2026	11/05/2026	11/06/2026
ANDERSON VILELA	13/03/2026	2 - 17 PRO MAX 256GB	R$ 11.700,00	4	R$ 2.925,00	13/04/2026	13/05/2026	13/06/2026	13/07/2026
MARIA FERNANDA SOUZA REIS	27/01/2026	APPLE 17 PRO MAX LARANJA 	R$ 6.600,00	10	R$ 660,00	27/02/2026	27/03/2026	27/04/2026	27/05/2026	27/06/2026	27/07/2026	27/08/2026	24/09/2026	27/10/2026	27/11/2026`;

function parseCurrency(str) {
  if (!str) return 0;
  return parseFloat(str.replace('R$', '').replace(/\./g, '').replace(',', '.').trim()) || 0;
}

function parseDate(str) {
  if (!str) return null;
  const parts = str.trim().split('/');
  if (parts.length === 3) {
    if (parts[2].length === 4) {
      if (parts[2] === '20269') parts[2] = '2026';
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
  }
  return null;
}

function generateRandomCpf() {
    return Math.floor(Math.random() * 90000000000 + 10000000000).toString();
}

async function run() {
  const lines = rawData.split('\n'); // Fixed delimiter
  const headers = lines[0].split('\t');
  const rows = lines.slice(1);

  const clientesMap = new Map();
  let vendasImportadas = 0;

  for (const row of rows) {
    if (!row.trim()) continue;
    const cols = row.split('\t');
    const clienteNome = cols[0]?.trim();
    if (!clienteNome) continue;

    let clienteId = clientesMap.get(clienteNome);
    if (!clienteId) {
       const { data: newCli, error } = await supabase.from('clientes').insert({
          nome: clienteNome,
          whatsapp: '5511000000000',
          cpf: generateRandomCpf()
       }).select().single();
       if (error) {
         console.error('Erro cliente:', error);
         continue;
       }
       clienteId = newCli.id;
       clientesMap.set(clienteNome, clienteId);
       console.log('Cliente criado:', clienteNome);
    }

    const dataVenda = parseDate(cols[1]);
    const produto = cols[2];
    const valorTotal = parseCurrency(cols[3]);
    const numParcelas = parseInt(cols[4]) || 1;
    const valorParcela = parseCurrency(cols[5]);

    const { data: novaVenda, error: vendaErr } = await supabase.from('vendas').insert({
       cliente_id: clienteId,
       produto_nome: produto,
       valor_total: valorTotal,
       num_parcelas: numParcelas,
       data_venda: dataVenda || new Date().toISOString().split('T')[0],
       status_geral: 'em_aberto'
    }).select().single();

    if (vendaErr) {
       console.error('Erro venda:', vendaErr);
       continue;
    }
    vendasImportadas++;

    for (let i = 0; i < numParcelas; i++) {
       const rawVencimento = cols[6 + i];
       let venc = parseDate(rawVencimento);
       
       if (!venc) continue;

       const { error: parErr } = await supabase.from('parcelas').insert({
         venda_id: novaVenda.id,
         num_parcela: i + 1,
         valor_parcela: valorParcela,
         data_vencimento: venc,
         status_parcela: 'aberto',
         valor_pago: 0
       });
       if(parErr) console.error('Erro parcela:', parErr);
    }
  }

  console.log('Migração concluída com sucesso! Total Vendas:', vendasImportadas);
}

run();
