import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// ── URL de base du backend Django ────────────────────────────────────────────
const API_URL = 'http://127.0.0.1:8000/api';

// ── Interface pour les statistiques retournées par /api/ai/stats/ ───────────
export interface AiStats {
  critical_sfps: number;
  down_ports: number;
  critical_links: number;
  total_routers: number;
}

// ── Interface pour les messages envoyés au backend ───────────────────────────
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// ── Interface pour la réponse JSON du backend natif ──────────────────────────
export interface NativeResponse {
  response: string;
}

@Injectable({
  providedIn: 'root'
})
export class AiAssistantService {

  constructor(private http: HttpClient) {}

  // ════════════════════════════════════════════════════════════════════════
  //  1. Récupérer les statistiques réseau en temps réel
  //     GET /api/ai/stats/ → { critical_sfps, down_ports, critical_links, total_routers }
  // ════════════════════════════════════════════════════════════════════════
  getAiStats(): Observable<AiStats> {
    return this.http.get<AiStats>(`${API_URL}/ai/stats/`);
  }

  // ════════════════════════════════════════════════════════════════════════
  //  2. Envoyer un message au moteur natif (Rule-based)
  //     POST /api/ai/chat/native/ → { response: string }
  // ════════════════════════════════════════════════════════════════════════
  sendMessage(messages: ChatMessage[]): Observable<NativeResponse> {
    return this.http.post<NativeResponse>(`${API_URL}/ai/chat/native/`, { messages });
  }
}
