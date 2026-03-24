import { Component, OnInit, inject } from '@angular/core';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { DonorService, Donor } from '../services/donor.service';

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

  recentDonors: Donor[] = [];
  totalCollected = 0;
  totalDonors = 0;
  goalAmount = 40000;
  loading = true;
  notifOpen = false;

  toggleNotifications() { this.notifOpen = !this.notifOpen; }

  staffList = [
    { role: 'Imam',      amount: 5850, icon: 'book-outline' },
    { role: 'Muezzin',   amount: 5850, icon: 'megaphone-outline' },
    { role: 'Caretaker',   amount: 5850, icon: 'sparkles-outline' },
    { role: 'Caretaker', amount: 5850, icon: 'shield-checkmark-outline' },
  ];

  ngOnInit() {
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
}
