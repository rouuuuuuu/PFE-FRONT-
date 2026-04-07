import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-links',
  standalone: true,
  imports: [
    CommonModule, MatTableModule, MatCardModule,
    MatInputModule, MatFormFieldModule,
    MatProgressSpinnerModule, MatSelectModule, FormsModule,
  ],
  templateUrl: './links.component.html',
  styleUrl: './links.component.css'
})
export class LinksComponent implements OnInit {
  links: any[] = [];
  filteredLinks: any[] = [];
  pagedLinks: any[] = [];
  loading = true;
  searchTerm = '';
  alarmFilter = '';
  pageSize = 25;
  currentPage = 0;

  columns = ['alarm_severity', 'source_ne', 'source_port', 'sink_ne', 'sink_port', 'link_level'];

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.getBackhaulLinks().subscribe({
      next: (data: any) => {
        this.links = Array.isArray(data) ? data : (data.results || []);
        this.filteredLinks = this.links;
        this.updatePagedLinks();
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      }
    });
  }

  get totalPages(): number {
    return Math.ceil(this.filteredLinks.length / this.pageSize);
  }

  prevPage() {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.updatePagedLinks();
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage++;
      this.updatePagedLinks();
    }
  }

  applyFilter() {
    let result = this.links;
    
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(l =>
        l.source_ne.toLowerCase().includes(term) ||
        l.sink_ne.toLowerCase().includes(term)
      );
    }
    
    if (this.alarmFilter) {
      result = result.filter(l => l.alarm_severity === this.alarmFilter);
    }
    
    this.filteredLinks = result;
    this.currentPage = 0;
    this.updatePagedLinks();
  }

  updatePagedLinks() {
    const start = this.currentPage * this.pageSize;
    this.pagedLinks = this.filteredLinks.slice(start, start + this.pageSize);
  }

  getAlarmColor(severity: string): string {
    const colors: any = {
      'normal':   '#4caf50',
      'warning':  '#ff9800',
      'minor':    '#ffc107',
      'major':    '#f44336',
      'critical': '#b71c1c',
    };
    return colors[severity] || '#888';
  }
}