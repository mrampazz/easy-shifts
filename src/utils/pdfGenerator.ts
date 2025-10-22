import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, getDaysInMonth } from 'date-fns';
import type { Schedule } from '../types';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: typeof autoTable;
  }
}

const SHIFT_COLORS = [
  [59, 130, 246],   // blue
  [139, 92, 246],   // purple
  [236, 72, 153],   // pink
  [245, 158, 11],   // amber
  [16, 185, 129],   // emerald
  [6, 182, 212],    // cyan
  [249, 115, 22],   // orange
  [99, 102, 241],   // indigo
];

/**
 * Generate a professional PDF of the schedule table
 */
export const generateSchedulePDF = (schedule: Schedule): void => {
  // Use landscape orientation for better table fit
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });
  
  const monthName = format(schedule.month, 'MMMM yyyy');
  const daysInMonth = getDaysInMonth(schedule.month);
  
  // Header
  doc.setFillColor(37, 99, 235); // Blue
  doc.rect(0, 0, 297, 25, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Shift Schedule', 148.5, 12, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(monthName, 148.5, 19, { align: 'center' });
  
  // Build table headers (days of month)
  const headers = ['Staff'];
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(schedule.month.getFullYear(), schedule.month.getMonth(), day);
    const dayName = format(date, 'EEE').substring(0, 2); // Su, Mo, Tu, etc.
    headers.push(`${day}\n${dayName}`);
  }
  
  // Build table rows
  const tableData = schedule.nurses.map((nurse, nurseIndex) => {
    const row = [nurse.name];
    const nurseColor = SHIFT_COLORS[nurseIndex % SHIFT_COLORS.length];
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(schedule.month.getFullYear(), schedule.month.getMonth(), day);
      
      // Check if nurse is unavailable
      const isUnavailable = nurse.constraints?.some(
        c => c.type === 'unavailable' && 
        new Date(c.date).toDateString() === date.toDateString()
      );
      
      if (isUnavailable) {
        row.push('✕');
        continue;
      }
      
      // Find shifts for this nurse on this day
      const dayShifts = schedule.shifts.filter(shift => {
        const shiftDate = new Date(shift.date);
        return shiftDate.getDate() === day &&
               shiftDate.getMonth() === schedule.month.getMonth() &&
               shift.assignedNurses.includes(nurse.id);
      });
      
      if (dayShifts.length === 0) {
        row.push('');
      } else {
        const shiftLabels = dayShifts.map(s => {
          const shiftTime = schedule.rules.shiftStartTimes[s.shiftIndex];
          return shiftTime.abbreviation || shiftTime.label.charAt(0);
        }).join(',');
        row.push(shiftLabels);
      }
    }
    
    return { row, color: nurseColor };
  });
  
  // Create the table
  autoTable(doc, {
    startY: 30,
    head: [headers],
    body: tableData.map(d => d.row),
    theme: 'grid',
    headStyles: {
      fillColor: [71, 85, 105], // Slate gray
      fontSize: 7,
      fontStyle: 'bold',
      halign: 'center',
      valign: 'middle',
      cellPadding: 1.5,
    },
    bodyStyles: {
      fontSize: 8,
      halign: 'center',
      valign: 'middle',
      cellPadding: 2,
    },
    columnStyles: {
      0: { 
        cellWidth: 35,
        fontStyle: 'bold',
        halign: 'left',
        fontSize: 8,
      },
    },
    didParseCell: (data) => {
      if (data.section === 'body') {
        // Color the staff name column
        if (data.column.index === 0) {
          const nurseColor = tableData[data.row.index].color;
          data.cell.styles.fillColor = [
            Math.min(nurseColor[0] + 200, 255),
            Math.min(nurseColor[1] + 200, 255),
            Math.min(nurseColor[2] + 200, 255),
          ];
          data.cell.styles.textColor = [30, 30, 30];
        }
        // Color cells with shifts
        else if (data.cell.text[0] && data.cell.text[0] !== '' && data.cell.text[0] !== '✕') {
          const nurseColor = tableData[data.row.index].color;
          data.cell.styles.fillColor = [nurseColor[0], nurseColor[1], nurseColor[2]];
          data.cell.styles.textColor = [255, 255, 255];
          data.cell.styles.fontStyle = 'bold';
        }
        // Style unavailable cells
        else if (data.cell.text[0] === '✕') {
          data.cell.styles.fillColor = [220, 38, 38]; // Red
          data.cell.styles.textColor = [255, 255, 255];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
    margin: { left: 10, right: 10 },
  });
  
  // Legend at the bottom
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const finalY = (doc as any).lastAutoTable.finalY + 5;
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 30, 30);
  doc.text('Shift Legend:', 10, finalY);
  
  let legendX = 35;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  
  schedule.rules.shiftStartTimes.forEach((shiftTime, index) => {
    const abbreviation = shiftTime.abbreviation || shiftTime.label.charAt(0);
    const text = `${abbreviation} = ${shiftTime.label} (${shiftTime.startTime}-${shiftTime.endTime})`;
    doc.text(text, legendX, finalY);
    legendX += doc.getTextWidth(text) + 10;
    
    // Wrap to next line if needed
    if (legendX > 270 && index < schedule.rules.shiftStartTimes.length - 1) {
      legendX = 35;
      doc.text(text, legendX, finalY + 5);
    }
  });
  
  // Footer
  doc.setFontSize(7);
  doc.setTextColor(100, 100, 100);
  doc.text(
    `Generated on ${format(new Date(), 'MMMM dd, yyyy')}`,
    148.5,
    200,
    { align: 'center' }
  );
  
  // Save the PDF
  doc.save(`schedule-${format(schedule.month, 'yyyy-MM')}.pdf`);
};

