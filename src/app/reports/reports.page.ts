import { Component, OnInit } from '@angular/core';
import { DonorService, Donor, Payment } from '../services/donor.service';
import { ToastController } from '@ionic/angular';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import jsPDF from 'jspdf';

interface DonorWithPayments extends Donor {
  payments: Payment[];
  generating: boolean;
}

@Component({
  selector: 'app-reports',
  templateUrl: './reports.page.html',
  styleUrls: ['./reports.page.scss'],
  standalone: false,
})
export class ReportsPage implements OnInit {

  donors: DonorWithPayments[] = [];
  loading = true;
  generating = false;
  selectedMonth: string;

  constructor(private donorService: DonorService, private toast: ToastController) {
    const now = new Date();
    this.selectedMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  ngOnInit() {
    this.donorService.getAllDonors().subscribe(donors => {
      this.donors = donors.map(d => ({ ...d, payments: [], generating: false }));
      this.donors.forEach(donor => {
        this.donorService.getPayments(donor.id!).subscribe(payments => {
          donor.payments = payments;
        });
      });
      this.loading = false;
    });
  }

  onMonthChange() {}

  getMonthPayments(donor: DonorWithPayments): Payment[] {
    return donor.payments.filter(p => p.date.startsWith(this.selectedMonth));
  }

  getMonthTotal(donor: DonorWithPayments): number {
    return this.getMonthPayments(donor).reduce((sum, p) => sum + Number(p.amount), 0);
  }

  get monthTotal(): number {
    return this.donors.reduce((sum, d) => sum + this.getMonthTotal(d), 0);
  }

  async generateInvoice(donor: DonorWithPayments) {
    donor.generating = true;
    try {
      const payments = this.getMonthPayments(donor);
      const total = this.getMonthTotal(donor);
      const doc = this.buildInvoicePDF(donor, payments, total);
      await this.savePDF(doc, `Invoice_${donor.name}_${this.selectedMonth}.pdf`);
    } catch (e) {
      console.error(e);
      this.showToast('Failed to generate PDF', 'danger');
    } finally {
      donor.generating = false;
    }
  }

  async generateAllReport() {
    this.generating = true;
    try {
      const doc = this.buildAllReportPDF();
      await this.savePDF(doc, `SadaqahHub_Report_${this.selectedMonth}.pdf`);
    } catch (e) {
      console.error(e);
      this.showToast('Failed to generate report', 'danger');
    } finally {
      this.generating = false;
    }
  }

  // ── Save PDF: web = download, mobile = share sheet ───
  private async savePDF(doc: jsPDF, filename: string) {
    if (Capacitor.isNativePlatform()) {
      // Get base64 string
      const base64 = doc.output('datauristring').split(',')[1];

      // Write to cache directory
      const result = await Filesystem.writeFile({
        path: filename,
        data: base64,
        directory: Directory.Cache,
      });

      // Share/open via native share sheet
      await Share.share({
        title: filename,
        url: result.uri,
        dialogTitle: 'Open or Share PDF',
      });
    } else {
      // Web browser — normal download
      doc.save(filename);
      this.showToast('PDF downloaded!', 'success');
    }
  }

  // ── All donors report PDF ─────────────────────────────
  private buildAllReportPDF(): jsPDF {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();

    this.drawHeader(doc, pageW, 'Monthly Report', this.selectedMonth);

    let y = 52;

    doc.setFillColor(245, 250, 247);
    doc.roundedRect(14, y, pageW - 28, 22, 4, 4, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(26, 107, 60);
    doc.text(`Total Donors: ${this.donors.length}`, 22, y + 9);
    doc.text(`Total Collected: Rs. ${this.monthTotal}`, 22, y + 17);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`Period: ${this.selectedMonth}`, pageW - 14, y + 9, { align: 'right' });
    y += 30;

    y = this.drawTableHeader(doc, y, pageW);

    let rowIndex = 0;
    for (const donor of this.donors) {
      const payments = this.getMonthPayments(donor);
      const total = this.getMonthTotal(donor);

      if (y > pageH - 30) {
        doc.addPage();
        y = 20;
        y = this.drawTableHeader(doc, y, pageW);
      }

      const bg = rowIndex % 2 === 0 ? [255, 255, 255] : [248, 252, 249];
      doc.setFillColor(bg[0], bg[1], bg[2]);
      doc.rect(14, y, pageW - 28, 10, 'F');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(30, 30, 30);
      doc.text(donor.name, 18, y + 7);
      doc.text(String(payments.length), pageW / 2, y + 7, { align: 'center' });
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(26, 107, 60);
      doc.text(`Rs. ${total}`, pageW - 18, y + 7, { align: 'right' });
      y += 10;
      rowIndex++;
    }

    doc.setFillColor(26, 107, 60);
    doc.rect(14, y, pageW - 28, 11, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text('TOTAL', 18, y + 8);
    doc.text(`Rs. ${this.monthTotal}`, pageW - 18, y + 8, { align: 'right' });

    this.drawFooter(doc, pageW, pageH);
    return doc;
  }

  // ── Single donor invoice PDF ──────────────────────────
  private buildInvoicePDF(donor: DonorWithPayments, payments: Payment[], total: number): jsPDF {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();

    this.drawHeader(doc, pageW, 'Donation Invoice', this.selectedMonth);

    let y = 52;

    doc.setFillColor(245, 250, 247);
    doc.roundedRect(14, y, pageW - 28, 28, 4, 4, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(26, 107, 60);
    doc.text(donor.name, 22, y + 10);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`Donor ID: ${donor.id}`, 22, y + 18);
    doc.text(`Period: ${this.selectedMonth}`, 22, y + 24);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(26, 107, 60);
    doc.text(`Rs. ${total}`, pageW - 18, y + 14, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('Total This Month', pageW - 18, y + 21, { align: 'right' });
    y += 36;

    y = this.drawTableHeader(doc, y, pageW, ['Date', 'Note', 'Amount']);

    if (payments.length === 0) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.setTextColor(150, 150, 150);
      doc.text('No payments found for this month.', pageW / 2, y + 10, { align: 'center' });
      y += 20;
    } else {
      payments.forEach((p, i) => {
        const bg = i % 2 === 0 ? [255, 255, 255] : [248, 252, 249];
        doc.setFillColor(bg[0], bg[1], bg[2]);
        doc.rect(14, y, pageW - 28, 10, 'F');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(30, 30, 30);
        doc.text(p.date, 18, y + 7);
        doc.text(p.note || '—', pageW / 2, y + 7, { align: 'center' });
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(26, 107, 60);
        doc.text(`Rs. ${p.amount}`, pageW - 18, y + 7, { align: 'right' });
        y += 10;
      });

      doc.setFillColor(26, 107, 60);
      doc.rect(14, y, pageW - 28, 11, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.text('TOTAL', 18, y + 8);
      doc.text(`Rs. ${total}`, pageW - 18, y + 8, { align: 'right' });
      y += 18;
    }

    doc.setFillColor(230, 245, 235);
    doc.roundedRect(14, y, pageW - 28, 18, 4, 4, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(26, 107, 60);
    doc.text('JazakAllah Khair', pageW / 2, y + 8, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(80, 120, 90);
    doc.text('Thank you for your generous contribution to the masjid.', pageW / 2, y + 14, { align: 'center' });

    this.drawFooter(doc, pageW, pageH);
    return doc;
  }

  private drawHeader(doc: jsPDF, pageW: number, title: string, subtitle: string) {
    doc.setFillColor(26, 107, 60);
    doc.rect(0, 0, pageW, 36, 'F');
    doc.setFillColor(45, 160, 90);
    doc.circle(pageW - 20, 0, 28, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.text('SadaqahHub', 14, 15);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(180, 230, 200);
    doc.text('Community Donation Tracker', 14, 22);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text(title, 14, 31);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(180, 230, 200);
    doc.text(subtitle, pageW - 14, 31, { align: 'right' });
  }

  private drawTableHeader(doc: jsPDF, y: number, pageW: number, cols = ['Donor', 'Payments', 'Amount']): number {
    doc.setFillColor(26, 107, 60);
    doc.rect(14, y, pageW - 28, 10, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text(cols[0], 18, y + 7);
    doc.text(cols[1], pageW / 2, y + 7, { align: 'center' });
    doc.text(cols[2], pageW - 18, y + 7, { align: 'right' });
    return y + 10;
  }

  private drawFooter(doc: jsPDF, pageW: number, pageH: number) {
    doc.setDrawColor(220, 220, 220);
    doc.line(14, pageH - 16, pageW - 14, pageH - 16);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(160, 160, 160);
    doc.text('Generated by SadaqahHub • Community Donation Tracker', pageW / 2, pageH - 10, { align: 'center' });
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, pageW - 14, pageH - 10, { align: 'right' });
  }

  private async showToast(message: string, color: string) {
    const t = await this.toast.create({ message, duration: 2500, color, position: 'bottom' });
    t.present();
  }
}
