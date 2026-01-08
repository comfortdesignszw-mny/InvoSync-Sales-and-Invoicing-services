
import { BusinessProfile, Document, LineItem, Client } from '../types.ts';

// Using window.jspdf as the UMD script provides it there
const getJsPDF = () => (window as any).jspdf?.jsPDF || (window as any).jsPDF;

interface jsPDFWithAutoTable {
  addImage(imageData: any, format: string, x: number, y: number, w: number, h: number): this;
  setFontSize(size: number): this;
  setTextColor(r: number, g: number, b: number): this;
  text(text: string | string[], x: number, y: number, options?: any): this;
  autoTable(options: any): this;
  setFont(fontName: string, fontStyle: string): this;
  save(filename: string): void;
  lastAutoTable: { finalY: number };
  rect(x: number, y: number, w: number, h: number, style?: string): this;
  line(x1: number, y1: number, x2: number, y2: number): this;
  setFillColor(r: number, g: number, b: number): this;
  setDrawColor(r: number, g: number, b: number): this;
  setLineWidth(width: number): this;
}

export const generatePdf = (doc: Document, profile: BusinessProfile) => {
  const JsPDFClass = getJsPDF();
  if (!JsPDFClass) {
    console.error("jsPDF library not found. Ensure it is loaded in index.html");
    alert("PDF generator is still loading. Please try again in a moment.");
    return;
  }

  const docPdf = new JsPDFClass() as jsPDFWithAutoTable;
  const docTypeTitle = doc.type.toUpperCase();
  const primaryColor = [79, 70, 229]; // #4f46e5

  // 1. Professional Letterhead Header
  // Top Accent Bar
  docPdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  docPdf.rect(0, 0, 210, 4, 'F');

  // Logo Section
  if (profile.logo) {
    try {
      docPdf.addImage(profile.logo, 'PNG', 15, 12, 40, 18);
    } catch(e) {
      docPdf.setFont('helvetica', 'bold');
      docPdf.setFontSize(24);
      docPdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      docPdf.text(profile.name, 15, 25);
    }
  } else {
    docPdf.setFont('helvetica', 'bold');
    docPdf.setFontSize(24);
    docPdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    docPdf.text(profile.name, 15, 25);
  }
  
  // Business Info (Top Right)
  docPdf.setFontSize(9);
  docPdf.setFont('helvetica', 'normal');
  docPdf.setTextColor(107, 114, 128);
  const bizInfo = [
    profile.address,
    profile.email,
    profile.phone ? `Phone: ${profile.phone}` : '',
    profile.whatsappPhone ? `WhatsApp: ${profile.whatsappPhone}` : ''
  ].filter(Boolean);
  docPdf.text(bizInfo, 195, 15, { align: 'right' });

  // Divider Line
  docPdf.setDrawColor(229, 231, 235);
  docPdf.setLineWidth(0.5);
  docPdf.line(15, 45, 195, 45);

  // 2. Document Details Section
  docPdf.setFont('helvetica', 'bold');
  docPdf.setFontSize(22);
  docPdf.setTextColor(31, 41, 55);
  docPdf.text(docTypeTitle, 15, 60);
  
  docPdf.setFontSize(11);
  docPdf.setTextColor(107, 114, 128);
  docPdf.text(`#${doc.docNumber}`, 15, 67);

  // Billing & Dates (Two Columns)
  // Left Column: Client
  docPdf.setFont('helvetica', 'bold');
  docPdf.setFontSize(10);
  docPdf.setTextColor(79, 70, 229);
  docPdf.text('BILL TO', 15, 80);
  
  docPdf.setFont('helvetica', 'bold');
  docPdf.setFontSize(11);
  docPdf.setTextColor(31, 41, 55);
  docPdf.text(doc.customerName, 15, 86);
  
  docPdf.setFont('helvetica', 'normal');
  docPdf.setFontSize(9);
  docPdf.setTextColor(75, 85, 99);
  docPdf.text([doc.customerAddress, doc.customerEmail].filter(Boolean), 15, 91);

  // Right Column: Dates
  docPdf.setFont('helvetica', 'bold');
  docPdf.setTextColor(79, 70, 229);
  docPdf.text('DATE', 140, 80);
  docPdf.text('DUE DATE', 140, 87);
  
  docPdf.setFont('helvetica', 'normal');
  docPdf.setTextColor(31, 41, 55);
  docPdf.text(doc.issueDate, 195, 80, { align: 'right' });
  docPdf.text(doc.dueDate, 195, 87, { align: 'right' });

  // 3. Items Table
  const tableColumn = ["Item", "Description", "Qty", "Price", "Total"];
  const tableRows: any[] = [];
  let subtotal = 0;

  doc.lineItems.forEach((item: LineItem) => {
    const itemTotal = item.price * item.quantity;
    subtotal += itemTotal;
    tableRows.push([
      item.name,
      item.description,
      item.quantity,
      `$${item.price.toFixed(2)}`,
      `$${itemTotal.toFixed(2)}`
    ]);
  });
  
  docPdf.autoTable({
    head: [tableColumn],
    body: tableRows,
    startY: 105,
    theme: 'striped',
    headStyles: { 
      fillColor: primaryColor,
      fontSize: 10,
      fontStyle: 'bold',
      halign: 'left'
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [55, 65, 81]
    },
    columnStyles: {
      2: { halign: 'center' },
      3: { halign: 'right' },
      4: { halign: 'right', fontStyle: 'bold' }
    }
  });
  
  const finalY = (docPdf as any).lastAutoTable.finalY;
  const tax = subtotal * (profile.taxRate / 100);
  const total = subtotal + tax;

  // 4. Totals & Notes Section
  // Summary Box
  const summaryX = 135;
  docPdf.setFontSize(10);
  docPdf.setTextColor(107, 114, 128);
  docPdf.text(`Subtotal:`, summaryX, finalY + 12);
  docPdf.setTextColor(31, 41, 55);
  docPdf.text(`$${subtotal.toFixed(2)}`, 195, finalY + 12, { align: 'right' });

  if (profile.taxRate > 0) {
    docPdf.setTextColor(107, 114, 128);
    docPdf.text(`Tax (${profile.taxRate}%):`, summaryX, finalY + 19);
    docPdf.setTextColor(31, 41, 55);
    docPdf.text(`$${tax.toFixed(2)}`, 195, finalY + 19, { align: 'right' });
  }

  docPdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  docPdf.rect(summaryX - 5, finalY + 24, 65, 12, 'F');
  docPdf.setFontSize(12);
  docPdf.setFont('helvetica', 'bold');
  docPdf.setTextColor(255, 255, 255);
  docPdf.text(`TOTAL AMOUNT:`, summaryX, finalY + 32);
  docPdf.text(`$${total.toFixed(2)}`, 195, finalY + 32, { align: 'right' });

  // Notes
  if (doc.notes) {
    docPdf.setFontSize(10);
    docPdf.setFont('helvetica', 'bold');
    docPdf.setTextColor(31, 41, 55);
    docPdf.text('NOTES & TERMS', 15, finalY + 15);
    docPdf.setFont('helvetica', 'normal');
    docPdf.setFontSize(9);
    docPdf.setTextColor(75, 85, 99);
    docPdf.text(doc.notes, 15, finalY + 22, { maxWidth: 100 });
  }

  // 5. Professional Footer
  docPdf.setDrawColor(229, 231, 235);
  docPdf.line(15, 275, 195, 275);
  docPdf.setFontSize(8);
  docPdf.setTextColor(156, 163, 175);
  docPdf.text(`Thank you for your business! ${profile.name}`, 105, 282, { align: 'center' });

  docPdf.save(`${doc.docNumber}_${profile.name.replace(/\s+/g, '_')}.pdf`);
};

export const generateClientsPdf = (clients: Client[], profile: BusinessProfile) => {
  const JsPDFClass = getJsPDF();
  if (!JsPDFClass) return;

  const docPdf = new JsPDFClass() as jsPDFWithAutoTable;
  
  docPdf.setFont('helvetica', 'bold');
  docPdf.setFontSize(22);
  docPdf.setTextColor(16, 185, 129); // Emerald
  docPdf.text('Client Directory', 15, 25);
  
  docPdf.setFontSize(10);
  docPdf.setFont('helvetica', 'normal');
  docPdf.setTextColor(107, 114, 128);
  docPdf.text(`Generated by: ${profile.name} | Date: ${new Date().toLocaleDateString()}`, 15, 33);

  const tableColumn = ["Name", "Email", "Phone", "Address"];
  const tableRows = clients.map(c => [c.name, c.email, c.phone, c.address]);

  docPdf.autoTable({
    head: [tableColumn],
    body: tableRows,
    startY: 45,
    theme: 'grid',
    headStyles: { fillColor: [16, 185, 129] },
  });

  docPdf.save(`Client_Report_${new Date().toISOString().split('T')[0]}.pdf`);
};
