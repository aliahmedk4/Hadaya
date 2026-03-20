import { Component, OnInit } from '@angular/core';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';

interface Hadith {
  arabic: string;
  english: string;
  source: string;
  narrator: string;
}

@Component({
  selector: 'app-hadith',
  templateUrl: './hadith.page.html',
  styleUrls: ['./hadith.page.scss'],
  standalone: false,
  animations: [
    trigger('cardSwap', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(24px) scale(0.97)' }),
        animate('420ms cubic-bezier(0.34, 1.56, 0.64, 1)',
          style({ opacity: 1, transform: 'translateY(0) scale(1)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in',
          style({ opacity: 0, transform: 'translateY(-16px) scale(0.97)' }))
      ])
    ]),
    trigger('listStagger', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateX(-20px)' }),
          stagger(60, [
            animate('320ms cubic-bezier(0.34, 1.2, 0.64, 1)',
              style({ opacity: 1, transform: 'translateX(0)' }))
          ])
        ], { optional: true })
      ])
    ]),
    trigger('fadeUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('500ms 100ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class HadithPage implements OnInit {

  hadiths: Hadith[] = [
    {
      arabic: `«الصَّدَقَةُ تُطْفِئُ الخَطِيئَةَ كَمَا يُطْفِئُ المَاءُ النَّارَ»`,
      english: `"Charity extinguishes sin just as water extinguishes fire."`,
      source: 'Sunan Ibn Majah',
      narrator: "Narrated by Mu'adh ibn Jabal (رضي الله عنه)"
    },
    {
      arabic: `«مَا نَقَصَتْ صَدَقَةٌ مِنْ مَالٍ، وَمَا زَادَ اللَّهُ عَبْدًا بِعَفْوٍ إِلَّا عِزًّا»`,
      english: `"Charity does not decrease wealth, and Allah does not increase a servant in anything by pardoning except in honour."`,
      source: 'Sahih Muslim',
      narrator: 'Narrated by Abu Hurairah (رضي الله عنه)'
    },
    {
      arabic: `«كُلُّ مَعْرُوفٍ صَدَقَةٌ»`,
      english: `"Every act of kindness is charity."`,
      source: 'Sahih al-Bukhari',
      narrator: 'Narrated by Jabir ibn Abdullah (رضي الله عنه)'
    },
    {
      arabic: `«أَفْضَلُ الصَّدَقَةِ أَنْ تَصَدَّقَ وَأَنْتَ صَحِيحٌ شَحِيحٌ، تَأْمُلُ الغِنَى وَتَخْشَى الفَقْرَ»`,
      english: `"The best charity is that which you give while you are healthy and miserly, hoping for wealth and fearing poverty."`,
      source: 'Sahih al-Bukhari',
      narrator: 'Narrated by Abu Hurairah (رضي الله عنه)'
    },
  ];

  daily!: Hadith;
  activeIndex = 0;
  cardVisible = true;

  ngOnInit() {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    this.activeIndex = dayOfYear % this.hadiths.length;
    this.daily = this.hadiths[this.activeIndex];
  }

  select(i: number) {
    if (i === this.activeIndex) return;
    this.cardVisible = false;
    setTimeout(() => {
      this.activeIndex = i;
      this.daily = this.hadiths[i];
      this.cardVisible = true;
    }, 210);
  }
}
