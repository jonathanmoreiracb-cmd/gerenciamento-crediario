import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function GET() {
  try {
    if (!supabase) {
      return NextResponse.json({
        success: true,
        operators: [
          { id: '1', nome: 'Jonathan Moreira', username: 'jonathan' },
          { id: '2', nome: 'Operador 1', username: 'operador1' },
          { id: '3', nome: 'Operador 2', username: 'operador2' }
        ]
      });
    }

    const { data, error } = await supabase
      .from('usuarios')
      .select('id, nome, username')
      .order('nome', { ascending: true });

    if (error) {
      throw error;
    }

    // If database is empty, return seed fallbacks
    if (!data || data.length === 0) {
      return NextResponse.json({
        success: true,
        operators: [
          { id: '1', nome: 'Jonathan Moreira', username: 'jonathan' },
          { id: '2', nome: 'Operador 1', username: 'operador1' },
          { id: '3', nome: 'Operador 2', username: 'operador2' }
        ]
      });
    }

    return NextResponse.json({ success: true, operators: data });
  } catch (error: any) {
    console.error('Erro ao listar operadores:', error);
    return NextResponse.json({
      success: true,
      operators: [
        { id: '1', nome: 'Jonathan Moreira', username: 'jonathan' },
        { id: '2', nome: 'Operador 1', username: 'operador1' },
        { id: '3', nome: 'Operador 2', username: 'operador2' }
      ]
    });
  }
}
