import { Component } from '@angular/core';
import { MenuController } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent {
  constructor(public auth: AuthService, private menu: MenuController, private router: Router) {}

  closeMenu() { this.menu.close(); }

  logout() {
    this.auth.logout();
    this.menu.close();
    this.router.navigateByUrl('/login', { replaceUrl: true });
  }
}
