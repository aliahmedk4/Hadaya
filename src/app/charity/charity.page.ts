import { Component } from '@angular/core';

@Component({
  selector: 'app-charity',
  templateUrl: './charity.page.html',
  styleUrls: ['./charity.page.scss'],
  standalone: false,
})
export class CharityPage {

  causes = [
    {
      title: 'Masjid Renovation',
      description: 'Repair roof and flooring of the main prayer hall',
      icon: 'construct-outline',
      goal: 50000,
      raised: 32000,
      donors: 24,
      urgent: true,
    },
    {
      title: 'Orphan Support',
      description: 'Monthly food & education for 10 orphan children',
      icon: 'happy-outline',
      goal: 20000,
      raised: 14500,
      donors: 18,
      urgent: false,
    },
    {
      title: 'Water Well Project',
      description: 'Build a clean water well in a rural village',
      icon: 'water-outline',
      goal: 35000,
      raised: 8200,
      donors: 11,
      urgent: false,
    },
    {
      title: 'Iftar Meals',
      description: 'Provide iftar meals during Ramadan for 100 families',
      icon: 'restaurant-outline',
      goal: 15000,
      raised: 15000,
      donors: 32,
      urgent: false,
    },
  ];

  getPercent(cause: any): number {
    return Math.min(100, Math.round((cause.raised / cause.goal) * 100));
  }

  totalRaised(): number {
    return this.causes.reduce((sum, c) => sum + c.raised, 0);
  }
}
