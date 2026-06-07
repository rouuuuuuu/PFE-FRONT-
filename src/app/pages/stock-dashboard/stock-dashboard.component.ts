import { Component, OnInit, ViewChild, AfterViewInit, ChangeDetectorRef, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
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
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

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
    CommonModule, FormsModule, ReactiveFormsModule,
    MatTableModule, MatPaginatorModule, MatSortModule,
    MatFormFieldModule, MatInputModule, MatIconModule,
    MatCardModule, MatChipsModule, MatProgressSpinnerModule,
    MatTooltipModule, TranslateModule, MatButtonModule, MatDialogModule
  ],
  templateUrl: './stock-dashboard.component.html',
  styleUrls: ['./stock-dashboard.component.css']
})
export class StockDashboardComponent implements OnInit, AfterViewInit {

  private readonly API_URL = 'http://127.0.0.1:8000/api/inventory/stock/';

  // ─── Table ───
  isAdmin = true; // Placeholder for RBAC

  get displayedColumnsList(): string[] {
    return this.isAdmin 
      ? ['reference', 'name', 'classification', 'vendor', 'stock_qte', 'transfert_qte', 'actions']
      : ['reference', 'name', 'classification', 'vendor', 'stock_qte', 'transfert_qte'];
  }
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

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef, private dialog: MatDialog) {}

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

  // ─── Stock Actions ───
  openAddItemDialog(): void {
    const dialogRef = this.dialog.open(AddItemDialogComponent, {
      width: '500px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.http.post<StockItem>(this.API_URL, result).subscribe({
          next: (newItem) => {
            this.dataSource.data = [newItem, ...this.dataSource.data];
            this.computeStats(this.dataSource.data);
          },
          error: (err) => console.error('Error adding item', err)
        });
      }
    });
  }

  incrementStock(item: StockItem): void {
    if (item.id === undefined) return;
    this.http.post(`${this.API_URL}${item.id}/increment/`, {}).subscribe({
      next: () => {
        item.stock_qte++;
        this.computeStats(this.dataSource.data);
      },
      error: (err) => console.error('Error incrementing stock', err)
    });
  }

  decrementStock(item: StockItem): void {
    if (item.id === undefined || item.stock_qte <= 0) return;
    this.http.post(`${this.API_URL}${item.id}/decrement/`, {}).subscribe({
      next: () => {
        item.stock_qte--;
        this.computeStats(this.dataSource.data);
      },
      error: (err) => console.error('Error decrementing stock', err)
    });
  }

  deleteItem(item: StockItem): void {
    if (item.id === undefined) return;
    
    const dialogRef = this.dialog.open(ConfirmDeleteDialogComponent, {
      width: '400px',
      data: { name: item.name }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.http.delete(`${this.API_URL}${item.id}/`).subscribe({
          next: () => {
            this.dataSource.data = this.dataSource.data.filter(i => i.id !== item.id);
            this.computeStats(this.dataSource.data);
          },
          error: (err) => console.error('Error deleting item', err)
        });
      }
    });
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

@Component({
  selector: 'app-confirm-delete-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatDialogModule, TranslateModule],
  template: `
    <h2 mat-dialog-title style="margin-top: 0;">{{ 'STOCK.DIALOG_DELETE_TITLE' | translate }}</h2>
    <mat-dialog-content>
      <p>{{ 'STOCK.DIALOG_DELETE_MSG' | translate }} <strong>{{ data.name }}</strong>?</p>
      <p class="text-danger" style="color: #ef4444; font-size: 14px; margin-top: 8px;">{{ 'STOCK.DIALOG_DELETE_WARNING' | translate }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>{{ 'STOCK.DIALOG_CANCEL' | translate }}</button>
      <button mat-raised-button color="warn" [mat-dialog-close]="true">{{ 'STOCK.DIALOG_DELETE_CONFIRM' | translate }}</button>
    </mat-dialog-actions>
  `
})
export class ConfirmDeleteDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: { name: string }) {}
}

@Component({
  selector: 'app-add-item-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatButtonModule, MatDialogModule, MatFormFieldModule, MatInputModule, TranslateModule],
  template: `
    <h2 mat-dialog-title style="margin-top: 0;">{{ 'STOCK.DIALOG_ADD_TITLE' | translate }}</h2>
    <mat-dialog-content>
      <form [formGroup]="itemForm" class="add-item-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>{{ 'STOCK.DIALOG_REF' | translate }}</mat-label>
          <input matInput formControlName="reference" required>
        </mat-form-field>
        
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>{{ 'STOCK.DIALOG_NAME' | translate }}</mat-label>
          <input matInput formControlName="name" required>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>{{ 'STOCK.DIALOG_CLASS' | translate }}</mat-label>
          <input matInput formControlName="classification" required>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>{{ 'STOCK.DIALOG_VENDOR' | translate }}</mat-label>
          <input matInput formControlName="vendor">
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>{{ 'STOCK.DIALOG_STOCK' | translate }}</mat-label>
          <input matInput type="number" formControlName="stock_qte" required min="0">
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>{{ 'STOCK.DIALOG_CANCEL' | translate }}</button>
      <button mat-raised-button color="primary" [disabled]="itemForm.invalid" (click)="submit()">{{ 'STOCK.DIALOG_SUBMIT' | translate }}</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .add-item-form { display: flex; flex-direction: column; gap: 8px; margin-top: 12px; }
    .full-width { width: 100%; }
  `]
})
export class AddItemDialogComponent {
  itemForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AddItemDialogComponent>
  ) {
    this.itemForm = this.fb.group({
      reference: ['', Validators.required],
      name: ['', Validators.required],
      classification: ['', Validators.required],
      vendor: [''],
      stock_qte: [0, [Validators.required, Validators.min(0)]]
    });
  }

  submit(): void {
    if (this.itemForm.valid) {
      this.dialogRef.close(this.itemForm.value);
    }
  }
}
