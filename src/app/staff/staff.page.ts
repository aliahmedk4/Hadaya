import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, ActionSheetController } from '@ionic/angular';
import { StaffService, Staff, ExpensePayment } from '../services/staff.service';
import { AuthService } from '../services/auth.service';
import { AuditService } from '../services/audit.service';

const ICON_OPTIONS = [
  'book-outline', 'megaphone-outline', 'sparkles-outline', 'shield-checkmark-outline',
  'construct-outline', 'person-outline', 'briefcase-outline', 'hammer-outline'
];

@Component({
  selector: 'app-staff',
  templateUrl: './staff.page.html',
  styleUrls: ['./staff.page.scss'],
  standalone: false,
})
export class StaffPage implements OnInit {

  staffList: (Staff & { payments: ExpensePayment[]; expanded: boolean })[] = [];
  selectedMonth: string;
  loading = true;

  constructor(
    private staffService: StaffService,
    private router: Router,
    private alertCtrl: AlertController,
    private actionSheetCtrl: ActionSheetController,
    private audit: AuditService,
    public auth: AuthService
  ) {
    const now = new Date();
    this.selectedMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  ngOnInit() {
    this.staffService.getStaff().subscribe(staff => {
      this.staffList = staff.map(s => ({ ...s, payments: [], expanded: false }));
      this.loading = false;
      if (this.auth.isLoggedIn()) {
        this.staffList.forEach(s => {
          this.staffService.getExpensesByMapping(s.id!).subscribe(payments => {
            s.payments = payments;
          });
        });
      }
    });
  }

  toggle(s: any) { s.expanded = !s.expanded; }

  filteredPayments(s: any): ExpensePayment[] {
    return (s.payments || []).filter((p: ExpensePayment) => p.date.startsWith(this.selectedMonth));
  }

  paidAmount(s: any): number {
    return this.filteredPayments(s).reduce((sum, p) => sum + p.amount, 0);
  }

  totalPaid(): number {
    return this.staffList.reduce((sum, s) => sum + this.paidAmount(s), 0);
  }

  goAddPayment(event: Event, s: any) {
    event.stopPropagation();
    this.router.navigate(['/add-staff-payment'], { queryParams: { staffId: s.id } });
  }

  async openPaymentActions(event: Event, s: Staff & { payments: ExpensePayment[]; expanded: boolean }, p: ExpensePayment) {
    event.stopPropagation();
    const sheet = await this.actionSheetCtrl.create({
      header: `₹${p.amount} · ${p.date.split('T')[0]}`,
      buttons: [
        {
          text: 'Edit Payment',
          icon: 'create-outline',
          handler: () => {
            this.router.navigate(['/add-staff-payment'], {
              queryParams: {
                staffId:   s.id,
                paymentId: p.id,
                amount:    p.amount,
                date:      p.date,
                note:      p.note ?? '',
              }
            });
          }
        },
        {
          text: 'Delete Payment',
          icon: 'trash-outline',
          role: 'destructive',
          handler: () => this.confirmDeletePayment(s, p)
        },
        { text: 'Cancel', role: 'cancel' }
      ]
    });
    await sheet.present();
  }

  async confirmDeletePayment(s: Staff, p: ExpensePayment) {
    const alert = await this.alertCtrl.create({
      header: 'Delete Payment',
      message: `Delete ₹${p.amount} payment on ${p.date.split('T')[0]}?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          role: 'destructive',
          handler: async () => {
            await this.staffService.deleteExpensePayment(p.id!);
            await this.audit.logAudit({
              action: 'STAFF_PAYMENT_DELETED',
              donorId:   s.id!,
              donorName: s.name,
              details:   `Payment deleted: ₹${p.amount} for ${s.name} on ${p.date.split('T')[0]}`,
              performedBy: this.auth.getUser()?.username ?? 'unknown',
            });
          }
        }
      ]
    });
    await alert.present();
  }

  async openStaffForm(existing?: Staff & { payments: ExpensePayment[]; expanded: boolean }) {
    const alert = await this.alertCtrl.create({
      header: existing ? 'Edit Staff' : 'Add Staff',
      inputs: [
        { name: 'name',  type: 'text',  placeholder: 'Full name',  value: existing?.name  ?? '' },
        { name: 'role',  type: 'text',  placeholder: 'Role (e.g. Imam)', value: existing?.role ?? '' },
        {
          name: 'icon', type: 'text',
          placeholder: 'Icon (e.g. book-outline)',
          value: existing?.icon ?? 'person-outline'
        },
      ],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: existing ? 'Update' : 'Add',
          handler: async (data) => {
            if (!data.name?.trim() || !data.role?.trim()) return false;
            const payload = {
              name: data.name.trim(),
              role: data.role.trim(),
              icon: data.icon?.trim() || 'person-outline'
            };
            if (existing) {
              await this.staffService.updateStaff(existing.id!, payload);
              await this.audit.logAudit({
                action: 'STAFF_UPDATED',
                donorId: existing.id!,
                donorName: payload.name,
                details: `Staff updated: ${payload.name} (${payload.role})`,
                performedBy: this.auth.getUser()?.username ?? 'unknown',
              });
            } else {
              await this.staffService.addStaff(payload);
              await this.audit.logAudit({
                action: 'STAFF_CREATED',
                donorId: '',
                donorName: payload.name,
                details: `Staff added: ${payload.name} (${payload.role})`,
                performedBy: this.auth.getUser()?.username ?? 'unknown',
              });
            }
            return true;
          }
        }
      ]
    });
    await alert.present();
  }

  async openStaffActions(event: Event, s: Staff & { payments: ExpensePayment[]; expanded: boolean }) {
    event.stopPropagation();
    const sheet = await this.actionSheetCtrl.create({
      header: s.name,
      buttons: [
        {
          text: 'Edit Details',
          icon: 'create-outline',
          handler: () => this.openStaffForm(s)
        },
        {
          text: 'Delete Staff',
          icon: 'trash-outline',
          role: 'destructive',
          handler: () => this.confirmDelete(s)
        },
        { text: 'Cancel', role: 'cancel' }
      ]
    });
    await sheet.present();
  }

  async confirmDelete(s: Staff) {
    const alert = await this.alertCtrl.create({
      header: 'Delete Staff',
      message: `Remove ${s.name} from staff?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          role: 'destructive',
          handler: async () => {
            await this.staffService.deleteStaff(s.id!);
            await this.audit.logAudit({
              action: 'STAFF_DELETED',
              donorId: s.id!,
              donorName: s.name,
              details: `Staff deleted: ${s.name} (${s.role})`,
              performedBy: this.auth.getUser()?.username ?? 'unknown',
            });
          }
        }
      ]
    });
    await alert.present();
  }
}
