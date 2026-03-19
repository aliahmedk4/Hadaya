import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-add-donor',
  templateUrl: './add-donor.page.html',
  styleUrls: ['./add-donor.page.scss'],
  standalone: false,
})
export class AddDonorPage {

  name = '';
  amount: number | null = null;
  status: 'Paid' | 'Pending' = 'Paid';
  date = new Date().toISOString().split('T')[0];
  saving = false;

  constructor(private router: Router, private toast: ToastController) {}

  async submit() {
    if (!this.name.trim() || !this.amount || !this.date) {
      this.showToast('Please fill all fields', 'warning');
      return;
    }

    this.saving = true;
    try {
      const app = getApps().length ? getApps()[0] : initializeApp(environment.firebase);
      const db = getFirestore(app);
      await addDoc(collection(db, 'Donor'), {
        name: this.name.trim(),
        amount: Number(this.amount),
        status: this.status,
        date: this.date,
      });
      this.showToast('Donor added successfully!', 'success');
      this.router.navigateByUrl('/donors');
    } catch (err) {
      console.error(err);
      this.showToast('Failed to add donor', 'danger');
    } finally {
      this.saving = false;
    }
  }

  async showToast(message: string, color: string) {
    const t = await this.toast.create({ message, duration: 2000, color, position: 'bottom' });
    await t.present();
  }
}
