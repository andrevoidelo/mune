import jsPDF from 'jspdf';
import { LogEntry } from '../types';

/**
 * Helper to load an image from URL/Base64 and return a Promise.
 */
const loadImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = url;
  });
};

/**
 * Fetches an SVG icon, tints it with a color, and returns it as a Base64 PNG.
 * Takes a full URL (e.g. /icons/sword.svg) or a name.
 */
const getTintedIconBase64 = async (iconUrlOrName: string, color: string): Promise<string | null> => {
  try {
    const url = iconUrlOrName.startsWith('/') ? iconUrlOrName : `/icons/${iconUrlOrName}.svg`;
    const response = await fetch(url);
    let svgText = await response.text();

    // Basic tinting: replace 'currentColor' or black with the target color
    svgText = svgText.replace(/fill="none"/g, 'fill-none="true"'); // protect none
    svgText = svgText.replace(/fill="[^"]*"/g, `fill="${color}"`);
    if (!svgText.includes('fill=')) {
        svgText = svgText.replace('<svg ', `<svg fill="${color}" `);
    }

    const svgBlob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
    const blobUrl = URL.createObjectURL(svgBlob);
    
    const img = await loadImage(blobUrl);
    const canvas = document.createElement('canvas');
    canvas.width = img.width * 2; // High res
    canvas.height = img.height * 2;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const base64 = canvas.toDataURL('image/png');
    
    URL.revokeObjectURL(blobUrl);
    return base64;
  } catch (e) {
    console.error(`Failed to tint icon ${iconUrlOrName}`, e);
    return null;
  }
};

/**
 * Labels for log types (removing emojis to prevent PDF encoding issues)
 */
const TYPE_LABELS: Record<string, string> = {
  ORACLE: 'ORACULO',
  INTERVENTION: 'INTERVENCAO',
  DICE: 'DADOS',
  NOTE: 'DIARIO',
  DRAW: 'BARALHO',
  GENERATOR: 'GERADOR',
  ATTRIBUTE: 'ATRIBUTO',
  ITEM: 'ITEM',
};

/**
 * Gera um documento PDF a partir dos logs da sessão.
 */
export const generateLogPdf = async (
  logs: LogEntry[],
  adventureName: string
): Promise<jsPDF> => {
  const doc = new jsPDF('p', 'mm', 'a4');

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginLeft = 15;
  const marginRight = 15;
  const contentWidth = pageWidth - marginLeft - marginRight;

  let y = 20;

  // Header
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(adventureName || 'Registro de Aventura', pageWidth / 2, y, { align: 'center' });
  y += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Exportado em: ${new Date().toLocaleString('pt-BR')}`, pageWidth / 2, y, { align: 'center' });
  y += 5;

  doc.setDrawColor(200, 200, 200);
  doc.line(marginLeft, y, pageWidth - marginRight, y);
  y += 10;

  doc.setTextColor(0, 0, 0);

  // Process Logs
  for (let i = 0; i < logs.length; i++) {
    const log = logs[i];
    
    // Page break check
    if (y > pageHeight - 30) {
      doc.addPage();
      y = 20;
    }

    const date = new Date(log.timestamp);
    const dateStr = date.toLocaleDateString('pt-BR');
    const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    // Metadata line
    const label = TYPE_LABELS[log.type] || log.type;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(120, 120, 120);
    doc.text(`${label}  |  ${dateStr} - ${timeStr}`, marginLeft, y);
    y += 6;

    // Content container starts here
    const startY = y;
    let iconOffset = 0;

    // 1. Draw Icon if present
    if (log.icon) {
      const iconBase64 = await getTintedIconBase64(log.icon, log.iconColor || '#666666');
      if (iconBase64) {
        doc.addImage(iconBase64, 'PNG', marginLeft, y, 8, 8);
        iconOffset = 12; // Push text to the right
      }
    }

    // 2. Title
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(log.title, marginLeft + iconOffset, y + 4);
    y += 10;

    // 3. Result (Main Text)
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const resultLines = doc.splitTextToSize(log.result, contentWidth - iconOffset);
    doc.text(resultLines, marginLeft + iconOffset, y);
    y += resultLines.length * 5.5;

    // 4. Details
    if (log.details) {
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.setFont('helvetica', 'italic');
      const cleanDetails = log.details.replace(/\*\*/g, '');
      const detailLines = doc.splitTextToSize(cleanDetails, contentWidth - iconOffset);
      doc.text(detailLines, marginLeft + iconOffset, y);
      y += detailLines.length * 4.5;
    }

    // 5. Image Attachment
    if (log.imageUrl) {
      try {
        const img = await loadImage(log.imageUrl);
        const imgWidth = contentWidth - iconOffset;
        const imgHeight = (img.height * imgWidth) / img.width;
        
        // Check if image fits on page
        if (y + imgHeight > pageHeight - 20) {
          doc.addPage();
          y = 20;
        }
        
        doc.addImage(log.imageUrl, 'JPEG', marginLeft + iconOffset, y + 2, imgWidth, imgHeight);
        y += imgHeight + 8;
      } catch (err) {
        console.error("Failed to add image to PDF", err);
      }
    }

    // 6. Visual Portent Icons (Array)
    if (log.visualIcons && log.visualIcons.length > 0) {
      y += 2;
      const iconSize = 12;
      const spacing = 4;
      
      // Page break check for icon group
      if (y + iconSize > pageHeight - 20) {
        doc.addPage();
        y = 20;
      }

      for (let j = 0; i < log.visualIcons.length; j++) {
        // Safety break if loop goes wrong
        if (j >= log.visualIcons.length) break;
        
        const vIcon = log.visualIcons[j];
        const iconBase64 = await getTintedIconBase64(vIcon.url, vIcon.color);
        if (iconBase64) {
          // Draw a subtle background box
          doc.setDrawColor(230, 230, 230);
          doc.setFillColor(245, 245, 245);
          doc.roundedRect(marginLeft + iconOffset + (j * (iconSize + spacing)), y, iconSize, iconSize, 2, 2, 'FD');
          
          // Draw the icon centered in the box
          doc.addImage(iconBase64, 'PNG', marginLeft + iconOffset + (j * (iconSize + spacing)) + 2, y + 2, iconSize - 4, iconSize - 4);
        }
      }
      y += iconSize + 4;
    }

    y += 5; // Spacing between entries
    
    // Separator line
    doc.setDrawColor(240, 240, 240);
    doc.line(marginLeft, y, pageWidth - marginRight, y);
    y += 8;
  }

  // Footer (Page numbers)
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Pagina ${i} de ${totalPages}  -  Mestre Mune`, pageWidth / 2, pageHeight - 10, { align: 'center' });
  }

  return doc;
};

/**
 * Gera PDF e retorna como string base64 (Android)
 */
export const generateLogPdfBase64 = async (
  logs: LogEntry[],
  adventureName: string
): Promise<string> => {
  const doc = await generateLogPdf(logs, adventureName);
  // Return pure base64
  return doc.output('datauristring').split(',')[1];
};

/**
 * Gera PDF e faz download (Browser)
 */
export const downloadLogPdf = async (
  logs: LogEntry[],
  adventureName: string
): Promise<void> => {
  const doc = await generateLogPdf(logs, adventureName);
  const fileName = `${(adventureName || 'aventura').replace(/[^a-z0-9]/gi, '_').toLowerCase()}_log.pdf`;
  doc.save(fileName);
};