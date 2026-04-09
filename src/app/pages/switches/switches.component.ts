import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-switches',
  standalone: true,
  imports: [
    CommonModule, 
    MatTableModule, 
    MatCardModule,
    MatInputModule, 
    MatFormFieldModule,
    MatProgressSpinnerModule, 
    MatSelectModule, 
    MatChipsModule,
    FormsModule,
  ],
  templateUrl: './switches.component.html',
  styleUrl: './switches.component.css'
})
export class SwitchesComponent implements OnInit {
  switches: any[] = [];
  filteredSwitches: any[] = [];
  pagedSwitches: any[] = [];
  loading = true;

  // Search criteria
  nameSearch = '';
  ipSearch = '';
  modelSearch = '';
  routerSearch = '';

  pageSize = 25;
  currentPage = 0;

  // EXACT match to Django JSON keys
  columns = ['name', 'loopback_ip', 'interface_sw', 'connected_router', 'interface_rt', 'model'];

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.getSwitches().subscribe({
      next: (data: any) => {
        // Adjust if your API wraps it in { results: [...] }
        this.switches = Array.isArray(data) ? data : (data.results || data.data || []);
        this.filteredSwitches = this.switches;
        this.updatePagedSwitches();
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to fetch switches', err);
        this.loading = false;
      }
    });
  }

  get totalPages(): number {
    return Math.ceil(this.filteredSwitches.length / this.pageSize);
  }

  prevPage() {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.updatePagedSwitches();
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage++;
      this.updatePagedSwitches();
    }
  }

  applyFilter() {
    let result = this.switches;

    if (this.nameSearch) {
      const term = this.nameSearch.toLowerCase().trim();
      result = result.filter(s => s.name?.toLowerCase().includes(term));
    }

    if (this.ipSearch) {
      const term = this.ipSearch.toLowerCase().trim();
      result = result.filter(s => s.loopback_ip?.toLowerCase().includes(term));
    }

    if (this.modelSearch) {
      const term = this.modelSearch.toLowerCase().trim();
      result = result.filter(s => s.model?.toLowerCase().includes(term));
    }

    if (this.routerSearch) {
      const term = this.routerSearch.toLowerCase().trim();
      // Converting ID to string for searching
      result = result.filter(s => s.connected_router?.toString().includes(term));
    }

    this.filteredSwitches = result;
    this.currentPage = 0;
    this.updatePagedSwitches();
  }

  updatePagedSwitches() {
    const start = this.currentPage * this.pageSize;
    this.pagedSwitches = this.filteredSwitches.slice(start, start + this.pageSize);
  }
}