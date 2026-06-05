import { Component, OnInit, ViewChild, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

export interface StockItem {
  id: number;
  reference: string;
  name: string;
  classification: string;
  vendor: string;
  stock_qte: number;
  transfert_nbr_u: number;
  transfert_qte: number;
}

import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-stock-dashboard',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatTableModule, MatPaginatorModule, MatSortModule,
    MatFormFieldModule, MatInputModule, MatIconModule,
    MatCardModule, MatChipsModule, MatProgressSpinnerModule,
    MatTooltipModule, TranslateModule
  ],
  templateUrl: './stock-dashboard.component.html',
  styleUrls: ['./stock-dashboard.component.css']
})
export class StockDashboardComponent implements OnInit, AfterViewInit {

  private readonly API_URL = 'http://127.0.0.1:8000/api/inventory/stock/';

  // ─── Table ───
  displayedColumns: string[] = [
    'reference', 'name', 'classification', 'vendor',
    'stock_qte', 'transfert_qte'
  ];
  dataSource = new MatTableDataSource<StockItem>([]);

  // ─── State ───
  loading = true;
  error = '';
  searchValue = '';

  // ─── Summary stats ───
  totalItems = 0;
  outOfStock = 0;
  withMovement = 0;
  totalStock = 0;

  // ─── Active filter chip ───
  activeFilter: 'all' | 'out_of_stock' | 'movement' = 'all';

  paginator!: MatPaginator;
  sort!: MatSort;

  @ViewChild(MatPaginator) set matPaginator(mp: MatPaginator) {
    this.paginator = mp;
    this.dataSource.paginator = mp;
    if (mp) {
      // Force change detection when paginator updates so our custom UI stays in sync
      mp.page.subscribe(() => this.cdr.detectChanges());
    }
  }

  @ViewChild(MatSort) set matSort(ms: MatSort) {
    this.sort = ms;
    this.dataSource.sort = ms;
  }

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadStock();
  }

  ngAfterViewInit(): void {
    // Custom filter predicate — searches across all string fields
    this.dataSource.filterPredicate = (item: StockItem, filter: string) => {
      const search = filter.toLowerCase();
      return (
        item.reference.toLowerCase().includes(search) ||
        item.name.toLowerCase().includes(search) ||
        item.classification.toLowerCase().includes(search) ||
        item.vendor.toLowerCase().includes(search)
      );
    };
  }

  loadStock(): void {
    this.loading = true;
    this.error = '';
    this.http.get<StockItem[]>(this.API_URL).subscribe({
      next: (data) => {
        const items = Array.isArray(data) ? data : (data as any).results || [];
        this.dataSource.data = items;
        this.computeStats(items);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = `Failed to load inventory: ${err.status} ${err.statusText}`;
        this.loading = false;
      }
    });
  }

  computeStats(items: StockItem[]): void {
    this.totalItems    = items.length;
    this.outOfStock    = items.filter(i => i.stock_qte === 0).length;
    this.withMovement  = items.filter(i => i.transfert_qte > 0).length;
    this.totalStock    = items.reduce((sum, i) => sum + i.stock_qte, 0);
  }

  // ─── Search ───
  applySearch(value: string): void {
    this.searchValue = value;
    this.dataSource.filter = value.trim().toLowerCase();
    if (this.dataSource.paginator) this.dataSource.paginator.firstPage();
  }

  clearSearch(): void {
    this.searchValue = '';
    this.dataSource.filter = '';
  }

  // ─── Quick filter chips ───
  setFilter(filter: 'all' | 'out_of_stock' | 'movement'): void {
    this.activeFilter = filter;
    this.searchValue = '';

    if (filter === 'all') {
      this.dataSource.filterPredicate = (item, f) => {
        const s = f.toLowerCase();
        return item.reference.toLowerCase().includes(s) ||
               item.name.toLowerCase().includes(s) ||
               item.classification.toLowerCase().includes(s) ||
               item.vendor.toLowerCase().includes(s);
      };
      this.dataSource.filter = '';
    } else if (filter === 'out_of_stock') {
      this.dataSource.filterPredicate = (item) => item.stock_qte === 0;
      this.dataSource.filter = 'out_of_stock'; // non-empty string triggers predicate
    } else if (filter === 'movement') {
      this.dataSource.filterPredicate = (item) => item.transfert_qte > 0;
      this.dataSource.filter = 'movement';
    }

    if (this.dataSource.paginator) this.dataSource.paginator.firstPage();
  }

  // ─── Row CSS helpers ───
  getStockClass(item: StockItem): string {
    if (item.stock_qte === 0) return 'row-rupture';
    if (item.stock_qte <= 10) return 'row-low';
    return '';
  }

  // ─── Custom Pagination ───
  get currentPage(): number {
    return this.paginator ? this.paginator.pageIndex : 0;
  }

  get totalPages(): number {
    return this.paginator && this.paginator.length > 0
      ? Math.ceil(this.paginator.length / this.paginator.pageSize)
      : 1;
  }

  prevPage(): void {
    if (this.paginator && this.paginator.hasPreviousPage()) {
      this.paginator.previousPage();
    }
  }

  nextPage(): void {
    if (this.paginator && this.paginator.hasNextPage()) {
      this.paginator.nextPage();
    }
  }
}
