// src/app/services/alarm.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AlarmService {
  private apiUrl = 'http://localhost:8000/api/ai/alarm-analysis/';

  constructor(private http: HttpClient) {}

  getAnalysis(): Observable<any> {
    return this.http.get(this.apiUrl);
  }
}