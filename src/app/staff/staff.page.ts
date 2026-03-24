import { Component } from '@angular/core';

@Component({
  selector: 'app-staff',
  templateUrl: './staff.page.html',
  styleUrls: ['./staff.page.scss'],
  standalone: false,
})
export class StaffPage {

  staffList = [
    { name: 'Maulana Rashid', role: 'Imam',      amount: 8000, icon: 'book-outline',             status: 'Paid' },
    { name: 'Bilal Azaan',    role: 'Muezzin',   amount: 5850, icon: 'megaphone-outline',         status: 'Paid' },
    { name: 'Farhan Ali',     role: 'Caretaker',   amount: 4500, icon: 'sparkles-outline',          status: 'Pending' },
    { name: 'Usman Qadri',   role: 'Caretaker', amount: 5850, icon: 'shield-checkmark-outline',  status: 'Paid' },
  ];

  totalPayout() {
    return this.staffList.reduce((sum, s) => sum + s.amount, 0);
  }
}
