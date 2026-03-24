import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { StaffService, Staff, ExpensePayment } from '../services/staff.service';

@Component({
  selector: 'app-expenses',
  templateUrl: './expenses.page.html',
  styleUrls: ['./expenses.page.scss'],
  standalone: false,
})
export class ExpensesPage implements OnInit {

  selectedMonth: string;
  expenses: (Staff & { payments: ExpensePayment[]; monthTotal: number })[] = [];
  loading = false;

  constructor(private staffService: StaffService, private router: Router) {
    const now = new Date();
    this.selectedMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  ngOnInit() { this.load(); }

  async load() {
    this.loading = true;
    try {
      this.expenses = await this.staffService.getStaffExpenses(this.selectedMonth);
    } catch (e) {
      console.error('Failed to load expenses:', e);
    }
    this.loading = false;
  }

  onMonthChange() { this.load(); }

  grandTotal(): number {
    return this.expenses.reduce((sum, e) => sum + e.monthTotal, 0);
  }

  goAddPayment() { this.router.navigateByUrl('/add-staff-payment'); }
}
