import { prisma } from './prisma';

export const paymentMockGateway = {
  async processar(pedidoId: string, simularStatus: 'APROVADO' | 'RECUSADO') {
    await new Promise(resolve => setTimeout(resolve, Number(process.env.PAYMENT_MOCK_DELAY_MS) || 800));

    const gatewayRef = `mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const payload = { 
      code: simularStatus === 'APROVADO' ? '200' : '402', 
      message: `Simulação de pagamento: ${simularStatus}`,
      timestamp: new Date().toISOString()
    };

    await prisma.pagamento.create({
      data: {
        pedidoId,
        gatewayRef,
        status: simularStatus,
        payload: JSON.stringify(payload)
      }
    });

    const novoStatus = simularStatus === 'APROVADO' ? 'PAGO' : 'CANCELADO';
    await prisma.pedido.update({ 
      where: { id: pedidoId }, 
      data: { status: novoStatus } 
    });

    if (simularStatus === 'RECUSADO') {
      const itens = await prisma.itemPedido.findMany({ where: { pedidoId } });
      for (const item of itens) {
        await prisma.estoque.update({
          where: { produtoId: item.produtoId },
          data: { qtdAtual: { increment: item.quantidade } }
        });
      }
    }

    await prisma.logAuditoria.create({
      data: {
        acao: 'PROCESSAR_PAGAMENTO_MOCK',
        entidade: 'Pagamento',
        entidadeId: gatewayRef,
        detalhes: JSON.stringify({ pedidoId, simularStatus, gatewayRef })
      }
    });

    return { gatewayRef, status: simularStatus, payload };
  }
};
