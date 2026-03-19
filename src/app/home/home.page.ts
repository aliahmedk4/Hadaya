import { Component, OnInit, inject } from '@angular/core';
import { DonorService, Donor } from '../services/donor.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage implements OnInit {

  private donorService = inject(DonorService);

  recentDonors: Donor[] = [];
  totalCollected = 0;
  totalDonors = 0;
  goalAmount = 40000;
  loading = true;

  staffList = [
    { role: 'Imam',      amount: 5850, icon: 'book-outline' },
    { role: 'Muezzin',   amount: 5850, icon: 'megaphone-outline' },
    { role: 'Cleaner',   amount: 5850, icon: 'sparkles-outline' },
    { role: 'Caretaker', amount: 5850, icon: 'shield-checkmark-outline' },
  ];

  ngOnInit() {
    this.donorService.getAllDonors().subscribe({
      next: (donors) => {
        this.totalDonors = donors.length;
        this.totalCollected = donors.reduce((sum, d) => sum + Number(d.amount || 0), 0);
        this.recentDonors = donors.slice(0, 5);
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load donors:', err);
        this.loading = false;
      }
    });
  }

  get goalPercent(): number {
    return Math.min(100, Math.round((this.totalCollected / this.goalAmount) * 100));
  }

  get goalRemaining(): number {
    return Math.max(0, this.goalAmount - this.totalCollected);
  }
}
