/**
 * src/lib/pdf/generator.ts
 * Motor de Geração de PDFs - Layout "Bureau Padrão Ouro"
 * Atualização: Instrução de Rastreio embutida no rodapé do documento.
 */
import jsPDF from 'jspdf';

interface PDFData {
  orderId: string;
  issuedAt: string;
  deliveryDate?: string | null;
  customer: {
    name: string;
    whatsapp: string;
  };
  items: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
  grossValue: number;
  discountValue: number;
  finalValue: number;
  paidValue: number;
  remainingValue: number;
  storeSettings?: {
    name: string;
    address: string;
    phone: string;
    pixKey: string;
  };
}

const loadLogo = async (): Promise<{ data: string, width: number, height: number } | null> => {
  try {
    const response = await fetch('/logo.png');
    const blob = await response.blob();
    
    const base64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });

    return await new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const ratio = img.width / img.height;
        let w = 50; 
        let h = w / ratio;
        if (h > 25) { 
          h = 25;
          w = h * ratio;
        }
        resolve({ data: base64, width: w, height: h });
      };
      img.onerror = () => resolve(null);
      img.src = base64;
    });
  } catch (e) {
    return null;
  }
};

export const downloadOrderPdf = async (
  type: 'QUOTATION' | 'SERVICE_ORDER' | 'RECEIPT',
  data: PDFData,
  fileName: string
) => {
  const doc = new jsPDF();
  const margin = 10;
  let y = margin;

  const logo = await loadLogo();

  doc.setDrawColor(180);
  doc.setLineWidth(0.3);

  const clientName = data.customer?.name || 'Consumidor Final';
  const clientPhone = data.customer?.whatsapp || 'Não Informado';

  // 1. CABEÇALHO
  doc.roundedRect(margin, y, 190, 35, 2, 2);

  doc.setTextColor(0);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  
  const isQuotation = type === 'QUOTATION';
  const emissionDate = new Date(data.issuedAt).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  
  doc.text(`João Pessoa, ${emissionDate}`, margin + 5, y + 8);
  doc.text(`À ${clientName}`, margin + 5, y + 14);
  doc.text(`Fone: ${clientPhone}`, margin + 5, y + 20);
  
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text('Instagram: @graficagramame', margin + 5, y + 26);
  doc.text('Site: www.graficagramame.com.br', margin + 5, y + 31);

  if (logo) {
    const logoX = 200 - logo.width - 5; 
    doc.addImage(logo.data, 'PNG', logoX, y + 5, logo.width, logo.height, undefined, 'FAST');
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text("GRÁFICA GRAMAME", 145, y + 20);
  }

  y += 45;

  // 2. TEXTO DE INTRODUÇÃO
  doc.setFontSize(10);
  doc.setTextColor(0);
  doc.setFont('helvetica', 'normal');
  
  if (isQuotation) {
    doc.text('Apresentamos a seguir, nossa proposta comercial referente aos itens solicitados.', margin, y);
  } else {
    doc.text('Apresentamos a seguir, os detalhes da sua ordem de serviço / pedido.', margin, y);
  }
  y += 6;
  doc.text(`Item(ns) solicitado(s) do documento: ${data.orderId.slice(0, 6).toUpperCase()}`, margin, y);
  
  y += 6;

  // 3. CAIXA DOS ITENS
  let startYItems = y;
  let currentY = y + 8; 

  const drawItemsBox = (startY: number, endY: number) => {
    doc.setDrawColor(180);
    doc.roundedRect(margin, startY, 190, endY - startY, 2, 2);
  };

  data.items.forEach((item, index) => {
    if (currentY > 230) {
      drawItemsBox(startYItems, currentY + 5);
      doc.addPage();
      startYItems = margin;
      currentY = margin + 8;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    const title = `${String(index + 1).padStart(2, '0')}) ${item.quantity}x ${item.description}`;
    const splitTitle = doc.splitTextToSize(title, 180);
    doc.text(splitTitle, margin + 5, currentY);
    
    currentY += (splitTitle.length * 5) + 2;

    const totalFormatado = `R$ ${item.total_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    const unitFormatado = `R$ ${item.unit_price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
    const prazoStr = data.deliveryDate ? new Date(data.deliveryDate).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : 'A Combinar';

    doc.setFont('helvetica', 'bold');
    doc.text(`Total: ${totalFormatado}`, margin + 10, currentY);
    doc.text(`Unit: ${unitFormatado}`, margin + 60, currentY);
    doc.text(`Entrega: ${prazoStr}`, margin + 120, currentY);
    
    currentY += 8;

    if (index < data.items.length - 1) {
      doc.setDrawColor(220); 
      doc.line(margin, currentY - 4, margin + 190, currentY - 4);
    }
  });

  doc.setDrawColor(180);
  doc.line(margin, currentY - 4, margin + 190, currentY - 4);
  
  currentY += 4;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Subtotal: R$ ${data.grossValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, margin + 5, currentY);
  doc.text(`Desconto: R$ ${data.discountValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, margin + 50, currentY);
  
  doc.setFont('helvetica', 'bold');
  doc.text(`TOTAL GERAL: R$ ${data.finalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, margin + 110, currentY);

  if (type === 'RECEIPT' || data.paidValue > 0) {
    currentY += 6;
    doc.setTextColor(34, 197, 94); 
    doc.text(`VALOR PAGO: R$ ${data.paidValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, margin + 5, currentY);
    doc.setTextColor(220, 38, 38); 
    doc.text(`SALDO PENDENTE: R$ ${data.remainingValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, margin + 110, currentY);
    doc.setTextColor(0);
  }

  currentY += 6;
  drawItemsBox(startYItems, currentY); 
  currentY += 5;

  // 4. RODAPÉ CONTRATUAL E ASSINATURAS
  if (currentY > 235) {
    doc.addPage();
    currentY = margin;
  }

  doc.roundedRect(margin, currentY, 190, 45, 2, 2);
  doc.line(margin + 95, currentY, margin + 95, currentY + 45); 
  doc.line(margin, currentY + 25, margin + 190, currentY + 25); 

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Vendedor: Atendimento Gráfica Gramame', margin + 5, currentY + 6);
  doc.text('WhatsApp: (83) 99847-4211', margin + 5, currentY + 12);
  doc.text('Horário: Seg a Sex das 09h às 19h', margin + 5, currentY + 18);

  doc.setFontSize(8);
  const termos = [
    '- Validade da proposta: 15 dias.',
    '- As quantidades poderão variar 5% para mais ou para menos.',
    '- Não nos responsabilizamos por erros após aprovação da arte.'
  ];
  termos.forEach((t, i) => {
    doc.text(t, margin + 100, currentY + 6 + (i * 5));
  });

  doc.setFontSize(9);
  doc.text('Atenciosamente,', margin + 5, currentY + 31);
  doc.setFont('helvetica', 'bold');
  doc.text('Gráfica Gramame', margin + 15, currentY + 41);

  doc.setFont('helvetica', 'normal');
  doc.text('Autorizo a confecção do(s) item(ns) acima assinalado(s),', margin + 100, currentY + 31);
  doc.setFont('helvetica', 'bold');
  doc.text(clientName, margin + 115, currentY + 41);

  // 5. RODAPÉ ABSOLUTO DA PÁGINA (Endereço, Rastreio e Versículo)
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text('R. do Arco, 872 - loja B - Colinas do Sul, João Pessoa - PB, 58069-349', 105, 282, { align: 'center' });
  
  // INSTRUÇÃO DE RASTREIO INJETADA AQUI
  doc.setTextColor(59, 130, 246); // Azul
  doc.setFont('helvetica', 'bold');
  doc.text(`Rastreie seu pedido em: graficagramame.com.br/rastreio/${data.orderId.split('-')[0]}`, 105, 286, { align: 'center' });

  doc.setFontSize(9);
  doc.setTextColor(50);
  doc.text('"Até aqui o Senhor nos ajudou" - 1 Samuel 7:12', 105, 292, { align: 'center' });

  doc.save(fileName);
};