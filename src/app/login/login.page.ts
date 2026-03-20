import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false,
})
export class LoginPage {
  user = '';
  password = '';
  loading = false;
  showPassword = false;

  constructor(
    private auth: AuthService,
    private router: Router,
    private toast: ToastController
  ) {}

  async login() {
    if (!this.user.trim() || !this.password) {
      this.showToast('Please enter user and password', 'warning');
      return;
    }
    this.loading = true;
    try {
      const success = await this.auth.login(this.user, this.password);
      if (success) {
        this.router.navigateByUrl('/donors', { replaceUrl: true });
      } else {
        this.showToast('Invalid email or password', 'danger');
      }
    } catch {
      this.showToast('Login failed. Try again.', 'danger');
    } finally {
      this.loading = false;
    }
  }

  private async showToast(message: string, color: string) {
    const t = await this.toast.create({ message, duration: 2500, color, position: 'bottom' });
    await t.present();
  }
}
