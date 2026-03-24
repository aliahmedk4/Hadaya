import { Injectable } from '@angular/core';
import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore, collection, addDoc, query,
  orderBy, onSnapshot, Firestore
} from 'firebase/firestore';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AuditLog {
  id?: string;
  action: 'DONOR_CREATED' | 'PAYMENT_ADDED' | 'PAYMENT_UPDATED' | 'PAYMENT_DELETED' | 'STAFF_PAYMENT_ADDED' | 'STAFF_PAYMENT_UPDATED' | 'STAFF_PAYMENT_DELETED' | 'STAFF_CREATED' | 'STAFF_UPDATED' | 'STAFF_DELETED';
  donorId: string;
  donorName: string;
  details: string;
  performedBy: string;
  timestamp: string;
}

@Injectable({ providedIn: 'root' })
export class AuditService {
  private db: Firestore;

  constructor() {
    const app = getApps().length ? getApps()[0] : initializeApp(environment.firebase);
    this.db = getFirestore(app);
  }

  async logAudit(log: Omit<AuditLog, 'id' | 'timestamp'>): Promise<void> {
    await addDoc(collection(this.db, 'auditLogs'), {
      ...log,
      timestamp: new Date().toISOString(),
    });
  }

  getAuditLogs(): Observable<AuditLog[]> {
    return new Observable(observer => {
      const q = query(collection(this.db, 'auditLogs'), orderBy('timestamp', 'desc'));
      const unsub = onSnapshot(q,
        snap => {
          const logs = snap.docs.map(d => ({
            id: d.id,
            ...d.data()
          } as AuditLog));
          observer.next(logs);
        },
        err => observer.error(err)
      );
      return () => unsub();
    });
  }
}
