import { Component, OnInit } from '@angular/core';
import { AlertController, LoadingController, ToastController } from '@ionic/angular';
import { GoogleDriveService } from '../services/google-drive.service';
import { DonorService } from '../services/donor.service';
import { StaffService } from '../services/staff.service';
import {
  getFirestore, collection, getDocs, addDoc, doc, setDoc, deleteDoc, writeBatch
} from 'firebase/firestore';
import { getApps, initializeApp } from 'firebase/app';
import { environment } from '../../environments/environment';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-backup',
  templateUrl: './backup.page.html',
  styleUrls: ['./backup.page.scss'],
  standalone: false,
})
export class BackupPage implements OnInit {
  lastBackup: string | null = null;
  isSignedIn = false;

  private db = getFirestore(getApps().length ? getApps()[0] : initializeApp(environment.firebase));

  constructor(
    private drive: GoogleDriveService,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController
  ) {}

  ngOnInit() {
    this.isSignedIn = this.drive.isSignedIn();
    if (this.isSignedIn) this.loadLastBackupTime();
  }

  async loadLastBackupTime() {
    this.lastBackup = await this.drive.getLastBackupTime();
  }

  async signIn() {
    const loading = await this.loadingCtrl.create({ message: 'Signing in…', spinner: 'crescent' });
    await loading.present();
    try {
      await this.drive.signIn();
      this.isSignedIn = true;
      await this.loadLastBackupTime();
    } catch (e: any) {
      this.showToast(e.message || 'Sign-in failed', 'danger');
    } finally { await loading.dismiss(); }
  }

  async signOut() {
    await this.drive.signOut();
    this.isSignedIn = false;
    this.lastBackup = null;
  }

  async backup() {
    const loading = await this.loadingCtrl.create({ message: 'Backing up to Google Drive…', spinner: 'crescent' });
    await loading.present();
    try {
      const [donorsSnap, staffSnap, expensesSnap] = await Promise.all([
        getDocs(collection(this.db, 'Donor')),
        getDocs(collection(this.db, 'Staff')),
        getDocs(collection(this.db, 'ExpensePayments')),
      ]);

      const donors = [];
      for (const d of donorsSnap.docs) {
        const payments = await getDocs(collection(this.db, 'Donor', d.id, 'payments'));
        donors.push({
          id: d.id,
          ...d.data(),
          payments: payments.docs.map(p => ({ id: p.id, ...p.data() })),
        });
      }

      const data = {
        version: 1,
        backedUpAt: new Date().toISOString(),
        donors,
        staff: staffSnap.docs.map(d => ({ id: d.id, ...d.data() })),
        expensePayments: expensesSnap.docs.map(d => ({ id: d.id, ...d.data() })),
      };

      await this.drive.backup(data);
      await this.loadLastBackupTime();
      this.showToast('✅ Backup saved to Google Drive!', 'success');
    } catch (e: any) {
      this.showToast(e.message || 'Backup failed', 'danger');
    } finally { await loading.dismiss(); }
  }

  async restore() {
    const alert = await this.alertCtrl.create({
      header: 'Restore Backup?',
      message: 'This will replace ALL current data with the backup from Google Drive. This cannot be undone.',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        { text: 'Restore', role: 'destructive', handler: () => this.doRestore() }
      ]
    });
    await alert.present();
  }

  private async doRestore() {
    const loading = await this.loadingCtrl.create({ message: 'Restoring from Google Drive…', spinner: 'crescent' });
    await loading.present();
    try {
      const data: any = await this.drive.restore();
      if (!data) { this.showToast('No backup found on Google Drive.', 'warning'); return; }

      // Restore donors + their payments subcollection
      for (const donor of (data.donors || [])) {
        const { id, payments, ...donorData } = donor;
        await setDoc(doc(this.db, 'Donor', id), donorData);
        for (const payment of (payments || [])) {
          const { id: pid, ...paymentData } = payment;
          await setDoc(doc(this.db, 'Donor', id, 'payments', pid), paymentData);
        }
      }

      // Restore staff
      for (const staff of (data.staff || [])) {
        const { id, ...staffData } = staff;
        await setDoc(doc(this.db, 'Staff', id), staffData);
      }

      // Restore expense payments
      for (const expense of (data.expensePayments || [])) {
        const { id, ...expenseData } = expense;
        await setDoc(doc(this.db, 'ExpensePayments', id), expenseData);
      }

      this.showToast('✅ Data restored successfully!', 'success');
    } catch (e: any) {
      this.showToast(e.message || 'Restore failed', 'danger');
    } finally { await loading.dismiss(); }
  }

  private async showToast(message: string, color: string) {
    const t = await this.toastCtrl.create({ message, duration: 3000, position: 'bottom', color });
    await t.present();
  }

  formatDate(iso: string | null): string {
    if (!iso) return 'Never';
    const d = new Date(iso);
    return d.toLocaleDateString() + ' · ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}
