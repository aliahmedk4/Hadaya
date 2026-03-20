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
  selectedMonthLabel: string = '';

  constructor(private donorService: DonorService, private toast: ToastController) {
    const now = new Date();
    this.selectedMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    this.selectedMonthLabel = now.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
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

  onMonthChange() {
    const [year, month] = this.selectedMonth.split('-');
    const d = new Date(Number(year), Number(month) - 1);
    this.selectedMonthLabel = d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
  }

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

  private async savePDF(doc: jsPDF, filename: string) {
    if (Capacitor.isNativePlatform()) {
      const base64 = doc.output('datauristring').split(',')[1];
      const result = await Filesystem.writeFile({ path: filename, data: base64, directory: Directory.Cache });
      await Share.share({ title: filename, url: result.uri, dialogTitle: 'Open or Share PDF' });
    } else {
      doc.save(filename);
      this.showToast('PDF downloaded!', 'success');
    }
  }

  // ── All donors report PDF ─────────────────────────────
  private buildAllReportPDF(): jsPDF {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();

    this.drawHeader(doc, pageW, 'Monthly Report', this.selectedMonthLabel);

    let y = 82;

    // summary card
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(14, y, pageW - 28, 26, 4, 4, 'F');
    doc.setDrawColor(220, 238, 228);
    doc.setLineWidth(0.4);
    doc.roundedRect(14, y, pageW - 28, 26, 4, 4, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(22, 95, 54);
    doc.text(`Total Donors: ${this.donors.length}`, 22, y + 10);
    doc.text(`Total Collected: Rs. ${this.monthTotal}`, 22, y + 19);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(140, 160, 148);
    doc.text(`Period: ${this.selectedMonthLabel}`, pageW - 22, y + 10, { align: 'right' });
    y += 34;

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

      const bg = rowIndex % 2 === 0 ? [255, 255, 255] : [246, 251, 248];
      doc.setFillColor(bg[0], bg[1], bg[2]);
      doc.rect(14, y, pageW - 28, 11, 'F');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(40, 40, 40);
      doc.text(donor.name, 20, y + 7.5);

      doc.setTextColor(100, 100, 100);
      doc.text(String(payments.length), pageW / 2, y + 7.5, { align: 'center' });

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(22, 95, 54);
      doc.text(`Rs. ${total}`, pageW - 20, y + 7.5, { align: 'right' });

      // subtle row separator
      doc.setDrawColor(235, 245, 239);
      doc.setLineWidth(0.3);
      doc.line(14, y + 11, pageW - 14, y + 11);

      y += 11;
      rowIndex++;
    }

    // total row
    doc.setFillColor(22, 95, 54);
    doc.roundedRect(14, y, pageW - 28, 13, 3, 3, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setCharSpace(0.5);
    doc.setTextColor(255, 255, 255);
    doc.text('TOTAL', 20, y + 9);
    doc.setCharSpace(0);
    doc.setFontSize(11);
    doc.text(`Rs. ${this.monthTotal}`, pageW - 20, y + 9, { align: 'right' });

    this.drawFooter(doc, pageW, pageH);
    return doc;
  }

  // ── Single donor invoice PDF ──────────────────────────
  private buildInvoicePDF(donor: DonorWithPayments, payments: Payment[], total: number): jsPDF {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();

    this.drawHeader(doc, pageW, 'Donation Invoice', this.selectedMonthLabel);

    let y = 82;

    // donor info card
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(14, y, pageW - 28, 30, 4, 4, 'F');
    doc.setDrawColor(220, 238, 228);
    doc.setLineWidth(0.4);
    doc.roundedRect(14, y, pageW - 28, 30, 4, 4, 'S');

    // left green accent bar on card
    doc.setFillColor(22, 95, 54);
    doc.roundedRect(14, y, 3, 30, 2, 2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(22, 95, 54);
    doc.text(donor.name, 22, y + 11);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(140, 160, 148);
    doc.text(`ID: ${donor.id}`, 22, y + 19);
    doc.text(`Period: ${this.selectedMonthLabel}`, 22, y + 26);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(22, 95, 54);
    doc.text(`Rs. ${total}`, pageW - 22, y + 13, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(160, 175, 165);
    doc.text('TOTAL THIS MONTH', pageW - 22, y + 20, { align: 'right' });
    y += 38;

    y = this.drawTableHeader(doc, y, pageW, ['Date', 'Note', 'Amount']);

    if (payments.length === 0) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.setTextColor(180, 180, 180);
      doc.text('No payments found for this month.', pageW / 2, y + 12, { align: 'center' });
      y += 22;
    } else {
      payments.forEach((p, i) => {
        const bg = i % 2 === 0 ? [255, 255, 255] : [246, 251, 248];
        doc.setFillColor(bg[0], bg[1], bg[2]);
        doc.rect(14, y, pageW - 28, 11, 'F');

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(40, 40, 40);
        doc.text(new Date(p.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }), 20, y + 7.5);

        doc.setTextColor(120, 120, 120);
        doc.text(p.note || '—', pageW / 2, y + 7.5, { align: 'center' });

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(22, 95, 54);
        doc.text(`Rs. ${p.amount}`, pageW - 20, y + 7.5, { align: 'right' });

        doc.setDrawColor(235, 245, 239);
        doc.setLineWidth(0.3);
        doc.line(14, y + 11, pageW - 14, y + 11);
        y += 11;
      });

      doc.setFillColor(22, 95, 54);
      doc.roundedRect(14, y, pageW - 28, 13, 3, 3, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setCharSpace(0.5);
      doc.setTextColor(255, 255, 255);
      doc.text('TOTAL', 20, y + 9);
      doc.setCharSpace(0);
      doc.setFontSize(11);
      doc.text(`Rs. ${total}`, pageW - 20, y + 9, { align: 'right' });
      y += 20;
    }

    // thank you banner
    doc.setFillColor(236, 248, 241);
    doc.roundedRect(14, y, pageW - 28, 20, 4, 4, 'F');
    doc.setDrawColor(180, 225, 200);
    doc.setLineWidth(0.4);
    doc.roundedRect(14, y, pageW - 28, 20, 4, 4, 'S');
    doc.setFillColor(212, 175, 55);
    doc.circle(pageW / 2 - 28, y + 10, 1.2, 'F');
    doc.circle(pageW / 2 + 28, y + 10, 1.2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(22, 95, 54);
    doc.text('JazakAllah Khair', pageW / 2, y + 9, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 140, 115);
    doc.text('Thank you for your generous contribution to the masjid.', pageW / 2, y + 16, { align: 'center' });

    this.drawFooter(doc, pageW, pageH);
    return doc;
  }

  // ── Typography helpers ────────────────────────────────
  private setLabel(doc: jsPDF)   { doc.setFont('helvetica', 'bold');   doc.setFontSize(8); }
  private setCaption(doc: jsPDF) { doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); }

  // ── Header ────────────────────────────────────────────
  private drawHeader(doc: jsPDF, pageW: number, title: string, subtitle: string) {
    const H = 74;

    // deep green base
    doc.setFillColor(18, 84, 48);
    doc.rect(0, 0, pageW, 52, 'F');

    // brighter green inner band for depth
    doc.setFillColor(26, 107, 60);
    doc.rect(0, 16, pageW, 22, 'F');

    // large wave ellipse cutout
    doc.setFillColor(248, 251, 249);
    doc.ellipse(pageW / 2, 52, pageW * 0.70, 20, 'F');

    // page bg below wave
    doc.setFillColor(248, 251, 249);
    doc.rect(0, 52, pageW, H - 52, 'F');

    // top-left bracket — thick white L
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(1.6);
    doc.line(9, 7, 9, 22);
    doc.line(9, 7, 24, 7);
    // inner bright green hairline
    doc.setDrawColor(80, 200, 130);
    doc.setLineWidth(0.5);
    doc.line(13, 11, 13, 20);
    doc.line(13, 11, 22, 11);

    // top-right bracket — thick white L
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(1.6);
    doc.line(pageW - 9, 7, pageW - 9, 22);
    doc.line(pageW - 24, 7, pageW - 9, 7);
    // inner bright green hairline
    doc.setDrawColor(80, 200, 130);
    doc.setLineWidth(0.5);
    doc.line(pageW - 13, 11, pageW - 13, 20);
    doc.line(pageW - 22, 11, pageW - 13, 11);

    // 5 dot ornament row
    doc.setFillColor(255, 255, 255);
    for (let i = 0; i < 5; i++) {
      doc.circle(pageW / 2 - 16 + i * 8, 9, 1.3, 'F');
    }

    // app name — large centered
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(28);
    doc.setTextColor(255, 255, 255);
    doc.text('SadaqahHub', pageW / 2, 30, { align: 'center' });

    // gold underline bar
    doc.setFillColor(212, 175, 55);
    doc.roundedRect(pageW / 2 - 26, 33, 52, 2.2, 1.1, 1.1, 'F');

    // tagline — wide letter spacing
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setCharSpace(3.0);
    doc.setTextColor(155, 210, 180);
    doc.text('DONATION  TRACKER', (pageW / 2)-18, 38, { align: 'center' });
    doc.setCharSpace(0);

    // document title on wave
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(18, 84, 48);
    doc.text(title, pageW / 2, 61, { align: 'center' });

    // gold flanking dots
    doc.setFillColor(212, 175, 55);
    doc.circle(pageW / 2 - 40, 60, 1.8, 'F');
    doc.circle(pageW / 2 + 40, 60, 1.8, 'F');

    // period
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(130, 165, 140);
    doc.text(subtitle, pageW / 2, 69, { align: 'center' });

    // gold bottom rule — full width
    doc.setDrawColor(212, 175, 55);
    doc.setLineWidth(0.9);
    doc.line(10, H, pageW - 10, H);
  }

  private drawTableHeader(doc: jsPDF, y: number, pageW: number, cols = ['Donor', 'Payments', 'Amount']): number {
    doc.setFillColor(22, 95, 54);
    doc.roundedRect(14, y, pageW - 28, 11, 2, 2, 'F');
    this.setLabel(doc);
    doc.setCharSpace(0.8);
    doc.setTextColor(255, 255, 255);
    doc.text(cols[0].toUpperCase(), 20, y + 7.5);
    doc.text(cols[1].toUpperCase(), pageW / 2, y + 7.5, { align: 'center' });
    doc.text(cols[2].toUpperCase(), pageW - 20, y + 7.5, { align: 'right' });
    doc.setCharSpace(0);
    return y + 11;
  }

  private drawFooter(doc: jsPDF, pageW: number, pageH: number) {
    doc.setFillColor(236, 248, 241);
    doc.rect(0, pageH - 16, pageW, 16, 'F');
    doc.setDrawColor(200, 230, 212);
    doc.setLineWidth(0.4);
    doc.line(0, pageH - 16, pageW, pageH - 16);
    this.setCaption(doc);
    doc.setCharSpace(0.4);
    doc.setTextColor(100, 145, 118);
    doc.text('GENERATED BY SADAQAHHUB', pageW / 2, pageH - 8, { align: 'center' });
    doc.setCharSpace(0);
    doc.setTextColor(160, 190, 172);
    doc.text(new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }), pageW - 14, pageH - 4, { align: 'right' });
  }

  private async showToast(message: string, color: string) {
    const t = await this.toast.create({ message, duration: 2500, color, position: 'bottom' });
    t.present();
  }
}
