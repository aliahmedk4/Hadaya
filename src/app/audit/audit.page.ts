import { Component, OnInit } from '@angular/core';
import { AuditService, AuditLog } from '../services/audit.service';

@Component({
  selector: 'app-audit',
  templateUrl: './audit.page.html',
  styleUrls: ['./audit.page.scss'],
  standalone: false,
})
export class AuditPage implements OnInit {

  logs: AuditLog[] = [];
  loading = true;

  readonly actionMeta: Record<AuditLog['action'], { label: string; icon: string; color: string }> = {
    DONOR_CREATED:       { label: 'Donor Created',       icon: 'person-add-outline',        color: 'blue'   },
    PAYMENT_ADDED:       { label: 'Payment Added',       icon: 'cash-outline',              color: 'green'  },
    PAYMENT_UPDATED:     { label: 'Payment Updated',     icon: 'create-outline',            color: 'orange' },
    PAYMENT_DELETED:     { label: 'Payment Deleted',     icon: 'trash-outline',             color: 'red'    },
    STAFF_PAYMENT_ADDED:   { label: 'Staff Payment Added',   icon: 'people-outline',        color: 'blue'   },
    STAFF_PAYMENT_UPDATED: { label: 'Staff Payment Updated', icon: 'create-outline',        color: 'orange' },
    STAFF_PAYMENT_DELETED: { label: 'Staff Payment Deleted', icon: 'trash-outline',         color: 'red'    },
    STAFF_CREATED:       { label: 'Staff Added',         icon: 'person-add-outline',        color: 'green'  },
    STAFF_UPDATED:       { label: 'Staff Updated',       icon: 'create-outline',            color: 'orange' },
    STAFF_DELETED:       { label: 'Staff Deleted',       icon: 'person-remove-outline',     color: 'red'    },
  };

  constructor(private auditService: AuditService) {}

  ngOnInit() {
    this.auditService.getAuditLogs().subscribe(logs => {
      this.logs = logs;
      this.loading = false;
    });
  }

  formatTime(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
}
