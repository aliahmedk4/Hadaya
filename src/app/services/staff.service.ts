import { Injectable } from '@angular/core';
import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore, collection, getDocs, addDoc, query, where,
  onSnapshot, Firestore, doc, updateDoc, deleteDoc, setDoc, getDoc
} from 'firebase/firestore';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export enum ExpenseType {
  STAFF_SALARY = 'STAFF_SALARY',
  MAINTENANCE  = 'MAINTENANCE',
  UTILITIES    = 'UTILITIES',
  OTHER        = 'OTHER',
}

export interface Staff {
  id?: string;
  name: string;
  role: string;
  icon: string;
}

export interface ExpensePayment {
  id?: string;
  expenseType: ExpenseType;
  expenseMappingId: string;
  expenseDescription: string;
  amount: number;
  date: string;
  note?: string;
}

const DEFAULT_STAFF: Omit<Staff, 'id'>[] = [
  { name: 'Maulana Rashid', role: 'Imam',      icon: 'book-outline' },
  { name: 'Bilal Azaan',    role: 'Muezzin',   icon: 'megaphone-outline' },
  { name: 'Farhan Ali',     role: 'Cleaner',   icon: 'sparkles-outline' },
  { name: 'Usman Qadri',   role: 'Caretaker', icon: 'shield-checkmark-outline' },
];

@Injectable({ providedIn: 'root' })
export class StaffService {
  private db: Firestore;

  constructor() {
    const app = getApps().length ? getApps()[0] : initializeApp(environment.firebase);
    this.db = getFirestore(app);
  }

  async initStaff(): Promise<void> {
    const flagRef = doc(this.db, '_config', 'staffSeeded');
    const flag = await getDoc(flagRef);
    if (flag.exists()) return;
    for (const s of DEFAULT_STAFF) {
      await addDoc(collection(this.db, 'Staff'), s);
    }
    await setDoc(flagRef, { seeded: true });
  }

  getStaff(): Observable<Staff[]> {
    return new Observable(observer => {
      const unsub = onSnapshot(collection(this.db, 'Staff'),
        snap => observer.next(snap.docs.map(d => ({ id: d.id, ...d.data() } as Staff))),
        err => observer.error(err)
      );
      return () => unsub();
    });
  }

  // ── ExpensePayments (flat collection) ─────────────────

  getExpensesByMapping(expenseMappingId: string): Observable<ExpensePayment[]> {
    return new Observable(observer => {
      const q = query(
        collection(this.db, 'ExpensePayments'),
        where('expenseMappingId', '==', expenseMappingId)
      );
      const unsub = onSnapshot(q,
        snap => observer.next(
          snap.docs
            .map(d => ({ id: d.id, ...d.data() } as ExpensePayment))
            .sort((a, b) => b.date.localeCompare(a.date))
        ),
        err => observer.error(err)
      );
      return () => unsub();
    });
  }

  async addExpensePayment(payment: ExpensePayment): Promise<void> {
    await addDoc(collection(this.db, 'ExpensePayments'), {
      expenseType:        payment.expenseType,
      expenseMappingId:   payment.expenseMappingId,
      expenseDescription: payment.expenseDescription,
      amount:             payment.amount,
      date:               payment.date,
      note:               payment.note ?? '',
    });
  }

  async updateExpensePayment(paymentId: string, payment: Partial<ExpensePayment>): Promise<void> {
    await updateDoc(doc(this.db, 'ExpensePayments', paymentId), {
      amount: payment.amount,
      date:   payment.date,
      note:   payment.note ?? '',
    });
  }

  async addStaff(staff: Omit<Staff, 'id'>): Promise<void> {
    await addDoc(collection(this.db, 'Staff'), staff);
  }

  async updateStaff(id: string, partial: Partial<Staff>): Promise<void> {
    await updateDoc(doc(this.db, 'Staff', id), partial as any);
  }

  async deleteStaff(id: string): Promise<void> {
    await deleteDoc(doc(this.db, 'Staff', id));
  }

  async deleteExpensePayment(paymentId: string): Promise<void> {
    await deleteDoc(doc(this.db, 'ExpensePayments', paymentId));
  }

  async getStaffExpenses(month: string): Promise<(Staff & { payments: ExpensePayment[]; monthTotal: number })[]> {
    const staffSnap = await getDocs(collection(this.db, 'Staff'));
    const pSnap = await getDocs(
      query(
        collection(this.db, 'ExpensePayments'),
        where('expenseType', '==', ExpenseType.STAFF_SALARY)
      )
    );
    const allPayments = pSnap.docs.map(d => ({ id: d.id, ...d.data() } as ExpensePayment));

    const result = [];
    for (const d of staffSnap.docs) {
      const staff = { id: d.id, ...d.data() } as Staff;
      const monthPayments = allPayments
        .filter(p => p.expenseMappingId === staff.id && p.date.startsWith(month))
        .sort((a, b) => b.date.localeCompare(a.date));
      const monthTotal = monthPayments.reduce((sum, p) => sum + p.amount, 0);
      if (monthTotal > 0) result.push({ ...staff, payments: monthPayments, monthTotal });
    }
    return result;
  }
}
