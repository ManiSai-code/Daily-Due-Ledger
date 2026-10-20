import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Person, Transaction } from '../types';

export const generatePersonReportPDF = (person: Person, transactions: Transaction[]) => {
  const doc = new jsPDF();

  // Header Banner
  doc.setFillColor(15, 23, 42); // Dark slate (#0f172a)
  doc.rect(0, 0, 210, 32, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('DAILY DUE LEDGER - ACCOUNT STATEMENT', 14, 18);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated on: ${new Date().toLocaleString('en-IN')}`, 14, 25);

  // Borrower Profile Summary
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Borrower Profile Details', 14, 42);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Full Name: ${person.fullName}`, 14, 50);
  doc.text(`Phone Number: ${person.phoneNumber}`, 14, 56);
  doc.text(`Address: ${person.address || 'N/A'}`, 14, 62);
  doc.text(`Account Status: ${person.status}`, 14, 68);

  // Financial Metrics Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(110, 38, 86, 34, 2, 2, 'FD');

  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('Original Loan:', 114, 46);
  doc.text('Current Balance:', 114, 53);
  doc.text('Daily Payment Target:', 114, 60);
  doc.text('Remaining Days:', 114, 67);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`INR ${person.originalAmount.toLocaleString('en-IN')}`, 155, 46);
  doc.text(`INR ${person.currentBalance.toLocaleString('en-IN')}`, 155, 53);
  doc.text(`INR ${person.currentDailyAmount.toLocaleString('en-IN')}/day`, 155, 60);
  doc.text(`${person.remainingDays} days`, 155, 67);

  // Payment History Table
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Payment Ledger & Transaction History', 14, 82);

  const tableData = transactions.map((tx) => [
    new Date(tx.paymentDate).toLocaleString('en-IN'),
    `+ INR ${tx.amount.toLocaleString('en-IN')}`,
    `INR ${tx.previousBalance.toLocaleString('en-IN')}`,
    `INR ${tx.newBalance.toLocaleString('en-IN')}`,
    tx.paymentMethod,
    tx.notes || '-',
  ]);

  autoTable(doc, {
    startY: 86,
    head: [['Date & Time', 'Amount Paid', 'Prev Balance', 'New Balance', 'Method', 'Notes']],
    body: tableData,
    headStyles: {
      fillColor: [79, 70, 229], // Indigo 600
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [30, 41, 59],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: 14, right: 14 },
  });

  // Save the PDF
  const fileName = `${person.fullName.replace(/\s+/g, '_')}_Account_Statement.pdf`;
  doc.save(fileName);
};