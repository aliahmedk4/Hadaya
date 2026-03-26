import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, LoadingController, ToastController } from '@ionic/angular';
import { AuthService } from '../services/auth.service';
import { ConfigService, ConfigKey } from '../services/config.service';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.page.html',
  styleUrls: ['./admin.page.scss'],
  standalone: false,
})
export class AdminPage implements OnInit {
  private router       = inject(Router);
  private alertCtrl    = inject(AlertController);
  private loadingCtrl  = inject(LoadingController);
  private toastCtrl    = inject(ToastController);
  auth                 = inject(AuthService);
  private configSvc    = inject(ConfigService);

  user = (this.router.getCurrentNavigation()?.extras?.state?.['user']) ?? this.auth.getUser();

  qrImageUrl: string | null = null;
  upiId: string | null = null;
  payName: string | null = null;

  get initials(): string {
    return (this.user?.username ?? 'A')[0].toUpperCase();
  }

  async ngOnInit() {
    if (this.auth.isAli()) {
      this.qrImageUrl = await this.configSvc.get(ConfigKey.QR_IMAGE);
      this.upiId      = await this.configSvc.get(ConfigKey.UPI_ID);
      this.payName    = await this.configSvc.get(ConfigKey.PAY_NAME);
    }
  }

  async onQrFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const loading = await this.loadingCtrl.create({ message: 'Uploading QR...' });
    await loading.present();
    try {
      this.qrImageUrl = await this.configSvc.uploadQrImage(file);
      await this.toast('QR image updated ✓');
    } catch {
      await this.toast('Upload failed', 'danger');
    } finally {
      await loading.dismiss();
    }
  }

  async editPaymentInfo() {
    const alert = await this.alertCtrl.create({
      header: 'Payment Info',
      inputs: [
        { name: 'upiId',   type: 'text', placeholder: 'UPI ID (e.g. name@upi)', value: this.upiId   ?? '' },
        { name: 'payName', type: 'text', placeholder: 'Display Name',           value: this.payName ?? '' },
      ],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Save',
          handler: async (d) => {
            await this.configSvc.set(ConfigKey.UPI_ID,   d.upiId?.trim()   ?? '');
            await this.configSvc.set(ConfigKey.PAY_NAME, d.payName?.trim() ?? '');
            this.upiId   = d.upiId?.trim();
            this.payName = d.payName?.trim();
            await this.toast('Payment info saved ✓');
          }
        }
      ]
    });
    await alert.present();
  }

  async openEdit() {
    const alert = await this.alertCtrl.create({
      header: 'Edit Admin',
      inputs: [
        { name: 'username',  type: 'text',  placeholder: 'Username *',  value: this.user?.username  ?? '' },
        { name: 'password',  type: 'text',  placeholder: 'Password *',  value: this.user?.password  ?? '' },
        { name: 'firstName', type: 'text',  placeholder: 'First Name',  value: this.user?.firstName ?? '' },
        { name: 'lastName',  type: 'text',  placeholder: 'Last Name',   value: this.user?.lastName  ?? '' },
        { name: 'mobile',    type: 'tel',   placeholder: 'Mobile No.',  value: this.user?.mobile    ?? '' },
        { name: 'email',     type: 'email', placeholder: 'Email',       value: this.user?.email     ?? '' },
        { name: 'city',      type: 'text',  placeholder: 'City',        value: this.user?.city      ?? '' },
        { name: 'role',      type: 'text',  placeholder: 'Role/Title',  value: this.user?.role      ?? 'Administrator' },
      ],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Save',
          handler: async (d) => {
            if (!d.username?.trim() || !d.password?.trim()) return false;
            const payload = {
              username:  d.username.trim().toLowerCase(),
              password:  d.password.trim(),
              firstName: d.firstName?.trim() ?? '',
              lastName:  d.lastName?.trim()  ?? '',
              mobile:    d.mobile?.trim()    ?? '',
              email:     d.email?.trim()     ?? '',
              city:      d.city?.trim()      ?? '',
              role:      d.role?.trim()      || 'Administrator',
            };
            await this.auth.updateAdmin(this.user.id, payload);
            this.user = { ...this.user, ...payload };
            return true;
          }
        }
      ]
    });
    await alert.present();
  }

  private async toast(msg: string, color = 'success') {
    const t = await this.toastCtrl.create({ message: msg, duration: 2000, color, position: 'bottom' });
    await t.present();
  }
}
