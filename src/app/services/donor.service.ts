import { Injectable } from '@angular/core';
import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore, collection, query, orderBy,
  onSnapshot, addDoc, Firestore, doc, getDoc, getDocs
} from 'firebase/firestore';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Donor {
  id?: string;
  name: string;
  nickname?: string;
  showNickname?: boolean;
  mobile?: string;
  pledgeAmount?: number;
  address?: string;
  isActive?: boolean;
  // runtime-only: summed from payments subcollection
  amount: number;
  status: 'Paid' | 'Pending';
  date: string;
}

export interface Payment {
  id?: string;
  amount: number;
  date: string;
  note?: string;
}

@Injectable({ providedIn: 'root' })
export class DonorService {
  private db: Firestore;

  constructor() {
    const app = getApps().length ? getApps()[0] : initializeApp(environment.firebase);
    this.db = getFirestore(app);
  }

  getAllDonors(): Observable<Donor[]> {
    return new Observable(observer => {
      const q = query(collection(this.db, 'Donor'));
      const unsub = onSnapshot(q,
        snapshot => {
          const donors = snapshot.docs.map(doc => {
            const d = doc.data();
            return {
              id: doc.id,
              name: d['name'] ?? d['Name'] ?? '',
              amount: Number(d['amount'] ?? d['Amount'] ?? 0),
              status: d['status'] ?? d['Status'] ?? 'Pending',
              date: d['date'] ?? d['Date'] ?? '',
            } as Donor;
          });
          observer.next(donors);
        },
        err => observer.error(err)
      );
      return () => unsub();
    });
  }

  getDonorById(donorId: string): Observable<Donor> {
    return new Observable(observer => {
      getDoc(doc(this.db, 'Donor', donorId)).then(snap => {
        if (snap.exists()) {
          const d = snap.data();
          observer.next({
            id: snap.id,
            name: d['name'] ?? d['Name'] ?? '',
            amount: d['amount'] ?? d['Amount'] ?? 0,
            status: d['status'] ?? d['Status'] ?? 'Pending',
            date: d['date'] ?? d['Date'] ?? '',
          } as Donor);
        }
        observer.complete();
      }).catch(err => observer.error(err));
    });
  }

  getPayments(donorId: string): Observable<Payment[]> {
    return new Observable(observer => {
      const q = query(
        collection(this.db, 'Donor', donorId, 'payments'),
        orderBy('date', 'desc')
      );
      const unsub = onSnapshot(q,
        snapshot => {
          const payments = snapshot.docs.map(d => ({
            id: d.id,
            amount: d.data()['amount'] ?? 0,
            date: d.data()['date'] ?? '',
            note: d.data()['note'] ?? '',
          } as Payment));
          observer.next(payments);
        },
        err => observer.error(err)
      );
      return () => unsub();
    });
  }

  async getCurrentMonthData(): Promise<{ total: number; donors: Donor[] }> {
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const donorsSnap = await getDocs(collection(this.db, 'Donor'));
    let total = 0;
    const donors: Donor[] = [];
    for (const d of donorsSnap.docs) {
      const data = d.data();
      const paymentsSnap = await getDocs(collection(this.db, 'Donor', d.id, 'payments'));
      let donorMonthTotal = 0;
      paymentsSnap.forEach(p => {
        if ((p.data()['date'] ?? '').startsWith(month)) {
          donorMonthTotal += Number(p.data()['amount'] ?? 0);
        }
      });
      if (donorMonthTotal > 0) {
        total += donorMonthTotal;
        donors.push({
          id: d.id,
          name: data['name'] ?? data['Name'] ?? '',
          amount: donorMonthTotal,
          status: data['status'] ?? data['Status'] ?? 'Pending',
          date: data['date'] ?? data['Date'] ?? '',
        });
      }
    }
    return { total, donors };
  }

  async addPayment(donorId: string, payment: Payment): Promise<void> {
    await addDoc(collection(this.db, 'Donor', donorId, 'payments'), {
      amount: payment.amount,
      date: payment.date,
      note: payment.note ?? '',
    });
  }
}
