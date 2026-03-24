import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { StaffService, Staff, ExpenseType } from '../services/staff.service';
import { AuditService } from '../services/audit.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-add-staff-payment',
  templateUrl: './add-staff-payment.page.html',
  styleUrls: ['./add-staff-payment.page.scss'],
  standalone: false,
})
export class AddStaffPaymentPage implements OnInit {

  staffList: Staff[] = [];
  selectedStaffId = '';
  paymentId = '';
  isEditMode = false;
  originalAmount: number | null = null;
  amount: number | null = null;
  date = new Date().toISOString().split('T')[0];
  note = '';
  saving = false;

  constructor(
    private staffService: StaffService,
    private audit: AuditService,
    private auth: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private toast: ToastController
  ) {}

  ngOnInit() {
    this.staffService.getStaff().subscribe(staff => {
      this.staffList = staff.sort((a, b) => a.name.localeCompare(b.name));
    });

    this.paymentId       = this.route.snapshot.queryParamMap.get('paymentId') ?? '';
    this.selectedStaffId = this.route.snapshot.queryParamMap.get('staffId') ?? '';
    if (this.paymentId) {
      this.isEditMode = true;
      this.originalAmount = Number(this.route.snapshot.queryParamMap.get('amount'));
      this.amount = this.originalAmount;
      this.date   = (this.route.snapshot.queryParamMap.get('date') ?? this.date).split('T')[0];
      this.note   = this.route.snapshot.queryParamMap.get('note') ?? '';
    }
  }

  get selectedStaff(): Staff | undefined {
    return this.staffList.find(s => s.id === this.selectedStaffId);
  }

  async submit() {
    if (!this.selectedStaffId || !this.amount || !this.date) {
      this.showToast('Please fill all required fields', 'warning');
      return;
    }

    this.saving = true;
    const dateWithTime = `${this.date}T${new Date().toTimeString().split(' ')[0]}`;
    try {
      if (this.isEditMode) {
        await this.staffService.updateExpensePayment(this.paymentId, {
          amount: Number(this.amount),
          date:   dateWithTime,
          note:   this.note,
        });
        await this.audit.logAudit({
          action: 'STAFF_PAYMENT_UPDATED',
          donorId:   this.selectedStaffId,
          donorName: this.selectedStaff?.name ?? '',
          details:   `Payment updated: ₹${this.originalAmount} → ₹${this.amount} for ${this.selectedStaff?.name} on ${this.date}${this.note ? ' · ' + this.note : ''}`,
          performedBy: this.auth.getUser()?.username ?? 'unknown',
        });
        this.showToast('Payment updated!', 'success');
      } else {
        await this.staffService.addExpensePayment({
          expenseType:        ExpenseType.STAFF_SALARY,
          expenseMappingId:   this.selectedStaffId,
          expenseDescription: this.selectedStaff?.name ?? '',
          amount:             Number(this.amount),
          date:               dateWithTime,
          note:               this.note,
        });
        await this.audit.logAudit({
          action: 'STAFF_PAYMENT_ADDED',
          donorId:   this.selectedStaffId,
          donorName: this.selectedStaff?.name ?? '',
          details:   `Expense payment: ₹${this.amount} to ${this.selectedStaff?.name} (${this.selectedStaff?.role}) on ${this.date}${this.note ? ' · ' + this.note : ''}`,
          performedBy: this.auth.getUser()?.username ?? 'unknown',
        });
        this.showToast('Payment saved!', 'success');
      }
      this.router.navigateByUrl('/staff-payments');
    } catch (err) {
      console.error(err);
      this.showToast('Failed to save payment', 'danger');
    } finally {
      this.saving = false;
    }
  }

  async showToast(msg: string, color: string) {
    const t = await this.toast.create({ message: msg, duration: 2000, color, position: 'bottom' });
    t.present();
  }
}
