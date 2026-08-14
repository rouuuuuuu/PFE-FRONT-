import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

const API_URL = `${environment.apiUrl}/api/inventory/stock/`;

export interface StockItem {
  id?: number;
  reference: string;
  name: string;
  classification: string;
  vendor?: string;
  stock_qte: number;
}

@Injectable({
  providedIn: 'root'
})
export class StockService {
  constructor(private http: HttpClient) {}

  getAll(): Observable<StockItem[]> {
    return this.http.get<StockItem[]>(API_URL);
  }

  create(item: StockItem): Observable<StockItem> {
    return this.http.post<StockItem>(API_URL, item);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${API_URL}${id}/`);
  }

  incrementStock(id: number): Observable<any> {
    return this.http.post(`${API_URL}${id}/increment/`, {});
  }

  decrementStock(id: number): Observable<any> {
    return this.http.post(`${API_URL}${id}/decrement/`, {});
  }
}
