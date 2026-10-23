import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { CollectionReport, PaymentReceipt, Person, Transaction } from '../types';

const downloadFile = (content: BlobPart, fileName: string, type: string) => {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};

export const generateCollectionReportCSV = (report: CollectionReport) => {
  const escape = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
  const rows = [
    ['Collection Report', `${report.from} to ${report.to}`],
    ['Total Collected', report.totalCollected],
    ['Total Outstanding', report.totalOutstanding],
    ['Payment Count', report.paymentCount],
    ['Expected Collection', report.expectedCollection],
    ['Actual Collection', report.actualCollection],
    ['Missed Amount', report.missedAmount],
    ['Collection Percentage', `${report.collectionPercentage}%`],
    ['Missed Payments', report.missedPayments],
    [],
    ['Payment Method', 'Amount'],
    ...report.paymentMethodBreakdown.map((item) => [item.method, item.amount]),
    [],
    ['Top Borrower', 'Amount Collected'],
    ...report.topBorrowers.map((item) => [item.name, item.amount]),
    [],
    ['Missed Borrower', 'Missed Dates', 'Expected Amount'],
    ...report.missedBorrowers.map((item) => [
      item.name,
      item.missedDates.join('; '),
      item.expectedAmount,
    ]),
  ];

  downloadFile(
    rows.map((row) => row.map((value) => escape(value || '')).join(',')).join('\r\n'),
    `collection-report-${report.from}-to-${report.to}.csv`,
    'text/csv;charset=utf-8'
  );
};

export const generateCollectionReportPDF = (report: CollectionReport) => {
  const doc = new jsPDF();
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 30, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(17);
  doc.setFont('helvetica', 'bold');
  doc.text('DAILY DUE LEDGER - COLLECTION REPORT', 14, 16);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`${report.from} to ${report.to}`, 14, 23);

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Summary', 14, 42);
  autoTable(doc, {
    startY: 46,
    head: [['Metric', 'Value']],
    body: [
      ['Total Collected', `INR ${report.totalCollected.toLocaleString('en-IN')}`],
      ['Total Outstanding', `INR ${report.totalOutstanding.toLocaleString('en-IN')}`],
      ['Payment Count', report.paymentCount],
      ['Expected Collection', `INR ${report.expectedCollection.toLocaleString('en-IN')}`],
      ['Actual Collection', `INR ${report.actualCollection.toLocaleString('en-IN')}`],
      ['Missed Amount', `INR ${report.missedAmount.toLocaleString('en-IN')}`],
      ['Collection Percentage', `${report.collectionPercentage}%`],
      ['Missed Payments', report.missedPayments],
    ],
    theme: 'grid',
    headStyles: { fillColor: [79, 70, 229] },
  });

  autoTable(doc, {
    startY: 92,
    head: [['Payment Method', 'Amount']],
    body: report.paymentMethodBreakdown.map((item) => [
      item.method,
      `INR ${item.amount.toLocaleString('en-IN')}`,
    ]),
    theme: 'grid',
    headStyles: { fillColor: [5, 150, 105] },
  });

  autoTable(doc, {
    head: [['Top Borrower', 'Amount Collected']],
    body: report.topBorrowers.map((item) => [
      item.name,
      `INR ${item.amount.toLocaleString('en-IN')}`,
    ]),
    theme: 'grid',
    headStyles: { fillColor: [79, 70, 229] },
  });

  autoTable(doc, {
    head: [['Missed Borrower', 'Missed Dates', 'Expected Amount']],
    body: report.missedBorrowers.map((item) => [
      item.name,
      item.missedDates.join(', '),
      `INR ${item.expectedAmount.toLocaleString('en-IN')}`,
    ]),
    theme: 'grid',
    headStyles: { fillColor: [225, 29, 72] },
  });

  doc.save(`collection-report-${report.from}-to-${report.to}.pdf`);
};

export const generatePeopleCSV = (people: Person[]) => {
  const escape = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
  const rows = [
    [
      'Borrower',
      'Phone',
      'Original Amount',
      'Current Balance',
      'Daily Target',
      'Remaining Days',
      'Estimated Clearance',
      'Status',
    ],
    ...people.map((person) => [
      person.fullName,
      person.phoneNumber,
      person.originalAmount,
      person.currentBalance,
      person.currentDailyAmount,
      person.remainingDays,
      person.estimatedClearanceDate || 'Settled',
      person.status,
    ]),
  ];
  downloadFile(
    rows.map((row) => row.map((value) => escape(value)).join(',')).join('\r\n'),
    `borrowers-${new Date().toISOString().slice(0, 10)}.csv`,
    'text/csv;charset=utf-8'
  );
};

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

export const generatePaymentReceiptPDF = (receipt: PaymentReceipt) => {
  const doc = new jsPDF();
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 34, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('DAILY DUE LEDGER - PAYMENT RECEIPT', 14, 17);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Receipt: ${receipt.receiptNumber}`, 14, 26);
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Payment Details', 14, 48);
  autoTable(doc, {
    startY: 53,
    theme: 'grid',
    head: [['Field', 'Details']],
    body: [
      ['Borrower', receipt.personName],
      ['Phone', receipt.phoneNumber || 'N/A'],
      ['Payment Date', new Date(receipt.paymentDate).toLocaleString('en-IN')],
      ['Payment Method', receipt.paymentMethod],
      ['Amount Paid', `INR ${receipt.amount.toLocaleString('en-IN')}`],
      ['Previous Balance', `INR ${receipt.previousBalance.toLocaleString('en-IN')}`],
      ['Remaining Balance', `INR ${receipt.newBalance.toLocaleString('en-IN')}`],
      ['Notes', receipt.notes || '-'],
    ],
    headStyles: { fillColor: [79, 70, 229] },
  });
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('Thank you for your payment.', 14, 125);
  doc.save(`${receipt.receiptNumber}.pdf`);
};

export const sharePaymentReceiptWhatsApp = (receipt: PaymentReceipt) => {
  const text = [
    `Payment receipt: ${receipt.receiptNumber}`,
    `Borrower: ${receipt.personName}`,
    `Amount paid: INR ${receipt.amount.toLocaleString('en-IN')}`,
    `Remaining balance: INR ${receipt.newBalance.toLocaleString('en-IN')}`,
    `Date: ${new Date(receipt.paymentDate).toLocaleString('en-IN')}`,
    `Method: ${receipt.paymentMethod}`,
  ].join('\n');
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
};