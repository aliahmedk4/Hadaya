import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, ActionSheetController } from '@ionic/angular';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-admin-list',
  templateUrl: './admin-list.page.html',
  styleUrls: ['./admin-list.page.scss'],
  standalone: false,
})
export class AdminListPage implements OnInit {
  auth       = inject(AuthService);
  private router         = inject(Router);
  private alertCtrl      = inject(AlertController);
  private actionCtrl     = inject(ActionSheetController);

  admins: any[] = [];
  loading = true;

  async ngOnInit() { await this.load(); }

  async load() {
    this.loading = true;
    this.admins  = await this.auth.getAllAdmins();
    this.loading = false;
  }

  getInitial(u: string): string { return (u ?? 'A')[0].toUpperCase(); }
  getFullName(a: any): string {
    return (a.firstName && a.lastName) ? `${a.firstName} ${a.lastName}` : a.username;
  }

  goToDetail(admin: any) {
    this.router.navigate(['/admin'], { state: { user: admin } });
  }

  async openForm(existing?: any) {
    const alert = await this.alertCtrl.create({
      header: existing ? 'Edit Admin' : 'Add Admin',
      inputs: [
        { name: 'username',  type: 'text',  placeholder: 'Username *',   value: existing?.username  ?? '' },
        { name: 'password',  type: 'text',  placeholder: 'Password *',   value: existing?.password  ?? '' },
        { name: 'firstName', type: 'text',  placeholder: 'First Name',   value: existing?.firstName ?? '' },
        { name: 'lastName',  type: 'text',  placeholder: 'Last Name',    value: existing?.lastName  ?? '' },
        { name: 'mobile',    type: 'tel',   placeholder: 'Mobile No.',   value: existing?.mobile    ?? '' },
        { name: 'email',     type: 'email', placeholder: 'Email',        value: existing?.email     ?? '' },
        { name: 'city',      type: 'text',  placeholder: 'City',         value: existing?.city      ?? '' },
        { name: 'role',      type: 'text',  placeholder: 'Role/Title',   value: existing?.role      ?? 'Administrator' },
      ],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: existing ? 'Update' : 'Add',
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
            if (existing) {
              await this.auth.updateAdmin(existing.id, payload);
            } else {
              await this.auth.addAdmin(payload);
            }
            await this.load();
            return true;
          }
        }
      ]
    });
    await alert.present();
  }

  async openActions(event: Event, admin: any) {
    event.stopPropagation();
    const sheet = await this.actionCtrl.create({
      header: this.getFullName(admin),
      buttons: [
        { text: 'Edit',   icon: 'create-outline',  handler: () => this.openForm(admin) },
        { text: 'Delete', icon: 'trash-outline', role: 'destructive', handler: () => this.confirmDelete(admin) },
        { text: 'Cancel', role: 'cancel' },
      ]
    });
    await sheet.present();
  }

  async confirmDelete(admin: any) {
    const alert = await this.alertCtrl.create({
      header: 'Delete Admin',
      message: `Remove ${this.getFullName(admin)}?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        { text: 'Delete', role: 'destructive', handler: async () => {
          await this.auth.deleteAdmin(admin.id);
          await this.load();
        }}
      ]
    });
    await alert.present();
  }
}
