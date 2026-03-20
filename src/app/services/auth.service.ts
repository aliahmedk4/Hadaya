import { Injectable } from '@angular/core';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
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
