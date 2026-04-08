import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Router } from '@angular/router'; // <-- Router imported

@Component({
  selector: 'app-routers',
  standalone: true,
  imports: [
    CommonModule, MatTableModule, MatCardModule,
    MatChipsModule, MatInputModule, MatFormFieldModule,
    MatProgressSpinnerModule, MatSelectModule, FormsModule,
  ],
  templateUrl: './routers.component.html',
  styleUrl: './routers.component.css'
})
export class RoutersComponent implements OnInit {
  routers: any[] = [];
  filteredRouters: any[] = [];
  pagedRouters: any[] = [];
  loading = true;
  searchTerm = '';
  vendorFilter = '';
  
  // Pagination State
  pageSize = 25;
  currentPage = 0;

  columns = ['name', 'loopback_ip', 'model', 'vendor'];

  // <-- Router injected here
  constructor(private api: ApiService, private router: Router) {}

  ngOnInit() {
    this.api.getRouters().subscribe({
      next: (data) => {
        this.routers = Array.isArray(data) ? data : (data.results || []);
        this.filteredRouters = this.routers;
        this.updatePagedRouters();
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      }
    });
  }

  get totalPages(): number {
    return Math.ceil(this.filteredRouters.length / this.pageSize);
  }

  prevPage() {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.updatePagedRouters();
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage++;
      this.updatePagedRouters();
    }
  }

  applyFilter() {
    let result = this.routers;
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(r =>
        r.name.toLowerCase().includes(term) ||
        r.loopback_ip.toLowerCase().includes(term)
      );
    }
    if (this.vendorFilter) {
      result = result.filter(r => r.vendor === this.vendorFilter);
    }
    this.filteredRouters = result;
    this.currentPage = 0;
    this.updatePagedRouters();
  }

  updatePagedRouters() {
    const start = this.currentPage * this.pageSize;
    this.pagedRouters = this.filteredRouters.slice(start, start + this.pageSize);
  }

  // <-- Updated function: Navigates to the Summary Page
  selectRouter(router: any) {
    this.router.navigate(['/routers', router.loopback_ip]);
  }
}