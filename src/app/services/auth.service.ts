import { Injectable } from '@angular/core';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private db = getFirestore(getApps().length ? getApps()[0] : initializeApp(environment.firebase));
  private SESSION_KEY = 'auth_user';

  async login(username: string, password: string): Promise<boolean> {
    const q = query(
      collection(this.db, 'Users'),
      where('username', '==', username.trim().toLowerCase()),
      where('password', '==', password)
    );
    const snap = await getDocs(q);
    if (snap.empty) return false;
    const user = { id: snap.docs[0].id, ...snap.docs[0].data() };
    localStorage.setItem(this.SESSION_KEY, JSON.stringify(user));
    return true;
  }

  async getAllAdmins(): Promise<any[]> {
    const snap = await getDocs(collection(this.db, 'Users'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  async updateAdmin(id: string, data: Partial<AdminProfile>): Promise<void> {
    await updateDoc(doc(this.db, 'Users', id), data as any);
    const current = this.getUser();
    if (current?.id === id) {
      localStorage.setItem(this.SESSION_KEY, JSON.stringify({ ...current, ...data }));
    }
  }

  isAli(): boolean {
    return this.getUser()?.username?.toLowerCase() === 'ali';
  }

  async addAdmin(data: { username: string; password: string } & Partial<AdminProfile>): Promise<void> {
    const { addDoc } = await import('firebase/firestore');
    await addDoc(collection(this.db, 'Users'), data);
  }

  async deleteAdmin(id: string): Promise<void> {
    const { deleteDoc, doc } = await import('firebase/firestore');
    await deleteDoc(doc(this.db, 'Users', id));
  }

  logout() {
    localStorage.removeItem(this.SESSION_KEY);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem(this.SESSION_KEY);
  }

  getUser(): any {
    const u = localStorage.getItem(this.SESSION_KEY);
    return u ? JSON.parse(u) : null;
  }
}

export interface AdminProfile {
  firstName: string;
  lastName: string;
  mobile: string;
  email: string;
  city: string;
  role: string;
}
