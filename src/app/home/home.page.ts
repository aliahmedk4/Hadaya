import { Component, OnInit, inject } from '@angular/core';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { DonorService, Donor } from '../services/donor.service';
import { StaffService, Staff } from '../services/staff.service';
import { AuthService } from '../services/auth.service';
import { ConfigService, ConfigKey } from '../services/config.service';


@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
  animations: [
    trigger('fadeSlideUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(28px)' }),
        animate('480ms cubic-bezier(0.34, 1.2, 0.64, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('staggerCards', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(24px)' }),
          stagger(80, [
            animate('400ms cubic-bezier(0.34, 1.2, 0.64, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ]),
    trigger('scaleIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.88)' }),
        animate('380ms 200ms cubic-bezier(0.34, 1.56, 0.64, 1)', style({ opacity: 1, transform: 'scale(1)' }))
      ])
    ])
  ]
})
export class HomePage implements OnInit {

  private donorService = inject(DonorService);
  private staffService = inject(StaffService);
  private configSvc   = inject(ConfigService);
  auth = inject(AuthService);

  recentDonors: Donor[] = [];
  totalCollected = 0;
  totalDonors = 0;
  goalAmount = 40000;
  loading = true;
  notifOpen = false;
  adminCount = 0;
  qrImageUrl: string | null = null;
  upiId: string | null = null;
  payName: string | null = null;
  qrOpen = false;

  toggleNotifications() { this.notifOpen = !this.notifOpen; }

  staffList: Staff[] = [];

  ngOnInit() {
    if (this.auth.isLoggedIn()) {
      this.auth.getAllAdmins().then(a => this.adminCount = a.length);
    }
    this.configSvc.get(ConfigKey.QR_IMAGE).then(v => this.qrImageUrl = v);
    this.configSvc.get(ConfigKey.UPI_ID).then(v => this.upiId = v);
    this.configSvc.get(ConfigKey.PAY_NAME).then(v => this.payName = v);
    this.staffService.getStaff().subscribe(staff => this.staffList = staff);
    this.donorService.getAllDonors().subscribe({
      next: (donors) => {
        this.totalDonors = donors.length;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load donors:', err);
        this.loading = false;
      }
    });
    this.donorService.getCurrentMonthData().then(({ total, donors }) => {
      this.totalCollected = total;
      this.recentDonors = donors
        .filter(d => d.amount > 0)
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 5);
    });
  }

  get goalPercent(): number {
    return Math.min(100, Math.round((this.totalCollected / this.goalAmount) * 100));
  }

  get goalRemaining(): number {
    return Math.max(0, this.goalAmount - this.totalCollected);
  }

  openPayment() {
    if (!this.upiId) return;
    const name = encodeURIComponent(this.payName || 'Hadaya Donation');
    const upi  = encodeURIComponent(this.upiId);
    const url  = `upi://pay?pa=${upi}&pn=${name}&cu=INR`;
    window.open(url, '_system');
  }

  downloadQr() {
    if (!this.qrImageUrl) return;
    const a = document.createElement('a');
    a.href = this.qrImageUrl;
    a.download = 'hadaya-donation-qr.png';
    a.click();
  }
}
