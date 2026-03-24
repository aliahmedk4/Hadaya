import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { DonorService } from '../services/donor.service';

@Component({
  selector: 'app-add-payment',
  templateUrl: './add-payment.page.html',
  styleUrls: ['./add-payment.page.scss'],
  standalone: false,
})
export class AddPaymentPage implements OnInit {

  donorId = '';
  donorName = '';
  paymentId = '';
  isEditMode = false;
  amount: number | null = null;
  date = new Date().toISOString().split('T')[0];
  note = '';
  saving = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private donorService: DonorService,
    private toast: ToastController
  ) {}

  ngOnInit() {
    this.donorId = this.route.snapshot.paramMap.get('donorId') ?? '';
    this.donorName = this.route.snapshot.queryParamMap.get('donorName') ?? 'Donor';
    this.paymentId = this.route.snapshot.queryParamMap.get('paymentId') ?? '';
    if (this.paymentId) {
      this.isEditMode = true;
      this.amount = Number(this.route.snapshot.queryParamMap.get('amount'));
      this.date = (this.route.snapshot.queryParamMap.get('date') ?? this.date).split('T')[0];
      this.note = this.route.snapshot.queryParamMap.get('note') ?? '';
    }
  }

  async submit() {
    if (!this.amount || !this.date) {
      this.showToast('Please fill amount and date', 'warning');
      return;
    }

    this.saving = true;
    try {
      if (this.isEditMode) {
        await this.donorService.updatePayment(this.donorId, this.paymentId, {
          amount: Number(this.amount),
          date: `${this.date}T${new Date().toTimeString().split(' ')[0]}`,
          note: this.note,
        });
        this.showToast('Payment updated!', 'success');
      } else {
        await this.donorService.addPayment(this.donorId, {
          amount: Number(this.amount),
          date: `${this.date}T${new Date().toTimeString().split(' ')[0]}`,
          note: this.note,
        });
        this.showToast('Payment saved!', 'success');
      }
      this.router.navigateByUrl('/donors');
    } catch (err) {
      console.error(err);
      this.showToast('Failed to save payment', 'danger');
    } finally {
      this.saving = false;
    }
  }

  async showToast(message: string, color: string) {
    const t = await this.toast.create({ message, duration: 2000, color, position: 'bottom' });
    await t.present();
  }
}
