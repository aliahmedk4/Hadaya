import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ActionSheetController, AlertController, ToastController } from '@ionic/angular';
import { DonorService } from '../services/donor.service';
import { AuthService } from '../services/auth.service';
import { AuditService } from '../services/audit.service';

@Component({
  selector: 'app-donors',
  templateUrl: './donors.page.html',
  styleUrls: ['./donors.page.scss'],
  standalone: false,
})
export class DonorsPage implements OnInit {

  selectedMonth: string;
  donors: any[] = [];
  loading = true;

  constructor(
    private donorService: DonorService,
    private router: Router,
    private actionSheet: ActionSheetController,
    private alert: AlertController,
    private toast: ToastController,
    private auditService: AuditService,
    public auth: AuthService
  ) {
    const now = new Date();
    this.selectedMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  ngOnInit() {
    this.donorService.getAllDonors().subscribe(donors => {
      this.donors = donors
        .map(d => ({ ...d, expanded: false, payments: [] }))
        .sort((a, b) => a.name.localeCompare(b.name));
      this.loading = false;
      this.donors.forEach(donor => {
        this.donorService.getPayments(donor.id).subscribe(payments => {
          donor.payments = payments;
        });
      });
    });
  }

  toggle(donor: any) {
    donor.expanded = !donor.expanded;
  }

  isPaid(donor: any) {
    return this.filteredTotal(donor) > 0;
  }

  filteredPayments(donor: any) {
    return (donor.payments || []).filter((p: any) => p.date.startsWith(this.selectedMonth));
  }

  filteredTotal(donor: any) {
    return this.filteredPayments(donor).reduce((sum: number, p: any) => sum + p.amount, 0);
  }

  grandTotal() {
    return this.donors.reduce((sum, donor) => sum + this.filteredTotal(donor), 0);
  }

  addPayment(event: Event, donor: any) {
    event.stopPropagation();
    this.router.navigate(['/add-payment', donor.id], {
      queryParams: { donorName: donor.name }
    });
  }

  async openPaymentActions(event: Event, donor: any, payment: any) {
    event.stopPropagation();
    const sheet = await this.actionSheet.create({
      header: `₹${payment.amount}  ·  ${payment.date.split('T')[0]}`,
      cssClass: 'payment-action-sheet',
      buttons: [
        {
          text: 'Edit Payment',
          icon: 'create-outline',
          handler: () => {
            this.router.navigate(['/add-payment', donor.id], {
              queryParams: {
                donorName: donor.name,
                paymentId: payment.id,
                amount: payment.amount,
                date: payment.date,
                note: payment.note ?? ''
              }
            });
          }
        },
        {
          text: 'Delete Payment',
          icon: 'trash-outline',
          role: 'destructive',
          handler: () => this.confirmDelete(donor, payment)
        },
        { text: 'Cancel', role: 'cancel', icon: 'close-outline' }
      ]
    });
    await sheet.present();
  }

  async confirmDelete(donor: any, payment: any) {
    const a = await this.alert.create({
      header: 'Delete Payment',
      message: `Remove ₹${payment.amount} on ${payment.date}?`,
      cssClass: 'delete-alert',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          role: 'destructive',
          cssClass: 'alert-delete-btn',
          handler: async () => {
            try {
              await this.donorService.deletePayment(donor.id, payment.id);
              await this.auditService.logAudit({
                action: 'PAYMENT_DELETED',
                donorId: donor.id,
                donorName: donor.name,
                details: `Payment deleted: ₹${payment.amount} on ${payment.date.split('T')[0]}`,
                performedBy: this.auth.getUser()?.username ?? 'unknown',
              });
              const t = await this.toast.create({ message: 'Payment deleted', duration: 2000, color: 'danger', position: 'bottom' });
              t.present();
            } catch { }
          }
        }
      ]
    });
    await a.present();
  }

  logout() {
    this.auth.logout();
    this.router.navigateByUrl('/login', { replaceUrl: true });
  }
}
