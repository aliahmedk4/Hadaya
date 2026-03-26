import { Injectable } from '@angular/core';
import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore, doc, getDoc, setDoc
} from 'firebase/firestore';
import { environment } from '../../environments/environment';

export enum ConfigKey {
  QR_IMAGE = 'qr_image',
  UPI_ID    = 'upi_id',
  PAY_NAME  = 'pay_name',
}

export interface ConfigSetting {
  key: ConfigKey;
  value: string;
  updatedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class ConfigService {
  private db  = getFirestore(getApps().length ? getApps()[0] : initializeApp(environment.firebase));
  private COL = 'ConfigurationSettings';

  async get(key: ConfigKey): Promise<string | null> {
    const snap = await getDoc(doc(this.db, this.COL, key));
    return snap.exists() ? (snap.data() as ConfigSetting).value : null;
  }

  async set(key: ConfigKey, value: string): Promise<void> {
    await setDoc(doc(this.db, this.COL, key), {
      key,
      value,
      updatedAt: new Date().toISOString(),
    });
  }

  // Converts file to base64 and stores directly in Firestore — no Storage/CORS needed
  async uploadQrImage(file: File): Promise<string> {
    const base64 = await this.fileToBase64(file);
    await this.set(ConfigKey.QR_IMAGE, base64);
    return base64;
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload  = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}
