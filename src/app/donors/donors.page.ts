import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DonorService } from '../services/donor.service';

@Component({
  selector: 'app-donors',
  templateUrl: './donors.page.html',
  styleUrls: ['./donors.page.scss'],
  standalone: false,
})
export class DonorsPage implements OnInit {

  selectedMonth: string;
  donors: any[] = [];
  loading = true;

  constructor(private donorService: DonorService, private router: Router) {
    const now = new Date();
    this.selectedMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  ngOnInit() {
    this.donorService.getAllDonors().subscribe(donors => {
      this.donors = donors.map(d => ({ ...d, expanded: false, payments: [] }));
      this.loading = false;
    });
  }

  toggle(donor: any) {
    donor.expanded = !donor.expanded;
    if (donor.expanded && donor.payments.length === 0) {
      this.donorService.getPayments(donor.id).subscribe(payments => {
        donor.payments = payments;
      });
    }
  }

  filteredPayments(donor: any) {
    return (donor.payments || []).filter((p: any) => p.date.startsWith(this.selectedMonth));
  }

  filteredTotal(donor: any) {
    return this.filteredPayments(donor).reduce((sum: number, p: any) => sum + p.amount, 0);
  }

  grandTotal() {
    return this.donors.reduce((sum, donor) => sum + this.filteredTotal(donor), 0);
  }

  addPayment(event: Event, donor: any) {
    event.stopPropagation();
    this.router.navigate(['/add-payment', donor.id], {
      queryParams: { donorName: donor.name }
    });
  }
}
