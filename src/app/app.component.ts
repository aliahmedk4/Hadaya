import { Component } from '@angular/core';
import { MenuController, AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from './services/auth.service';
import { StaffService } from './services/staff.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent {
  constructor(
    public auth: AuthService,
    private menu: MenuController,
    private router: Router,
    private staffService: StaffService,
    private alertCtrl: AlertController
  ) {
    this.staffService.initStaff();
  }

  closeMenu() { this.menu.close(); }

  goToProfile() {
    this.menu.close();
    this.router.navigate(['/admin'], { state: { user: this.auth.getUser() } });
  }

  logout() {
    this.auth.logout();
    this.menu.close();
    this.router.navigateByUrl('/login', { replaceUrl: true });
  }

  async openMyProfile() {
    const u = this.auth.getUser();
    const alert = await this.alertCtrl.create({
      header: 'My Profile',
      inputs: [
        { name: 'firstName', type: 'text',  placeholder: 'First Name',   value: u?.firstName  ?? '' },
        { name: 'lastName',  type: 'text',  placeholder: 'Last Name',    value: u?.lastName   ?? '' },
        { name: 'mobile',    type: 'tel',   placeholder: 'Mobile No.',   value: u?.mobile     ?? '' },
        { name: 'email',     type: 'email', placeholder: 'Email',        value: u?.email      ?? '' },
        { name: 'city',      type: 'text',  placeholder: 'City',         value: u?.city       ?? '' },
        { name: 'role',      type: 'text',  placeholder: 'Role/Title',   value: u?.role       ?? 'Administrator' },
      ],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Save',
          handler: async (data) => {
            await this.auth.updateAdmin(u.id, {
              firstName: data.firstName?.trim(),
              lastName:  data.lastName?.trim(),
              mobile:    data.mobile?.trim(),
              email:     data.email?.trim(),
              city:      data.city?.trim(),
              role:      data.role?.trim() || 'Administrator',
            });
          }
        }
      ]
    });
    this.menu.close();
    await alert.present();
  }
}
