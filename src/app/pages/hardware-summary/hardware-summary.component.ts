import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../services/api.service';
import { FilterStatusPipe } from '../../pipes/filter-status.pipe';

@Component({
  selector: 'app-hardware-summary',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatProgressSpinnerModule, FilterStatusPipe],
  templateUrl: './hardware-summary.component.html',
  styleUrl: './hardware-summary.component.css'
})
export class HardwareSummaryComponent implements OnInit {
  ip: string = '';
  verification: any = null;
  loading = true;

  constructor(
    private route: ActivatedRoute, 
    private router: Router,
    private api: ApiService
  ) {}

  ngOnInit() {
    // Read the IP address from the URL
    this.ip = this.route.snapshot.paramMap.get('ip') || '';
    
    if (this.ip) {
      this.api.verifyDevice(this.ip).subscribe({
        next: (data) => {
          this.verification = data;
          this.loading = false;
        },
        error: (err) => {
          console.error(err);
          this.loading = false;
        }
      });
    }
  }

  // Navigate to the third level (the detailed table)
  goToDetails(type: string, status: string) {
    this.router.navigate(['/routers', this.ip, type, status]);
  }

  goBack() {
    this.router.navigate(['/routers']);
  }
}