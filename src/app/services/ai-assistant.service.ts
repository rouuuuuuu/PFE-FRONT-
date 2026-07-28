import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// ── URL de base du backend Django ────────────────────────────────────────────
const API_URL = 'http://127.0.0.1:8000/api';

// ── Interface pour les statistiques retournées par /api/iris/stats/ ──────────
export interface AiStats {
  critical_sfps: number;
  warning_sfps: number;
  down_ports: number;
  unexpected_down: number;
  faulty_cards: number;
  stock?: {
    total_references: number;
    out_of_stock: number;
    low_stock: number;
    sfp_references: number;
    carte_references: number;
  };
}

// ── Interface pour les messages envoyés au backend ───────────────────────────
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// ── Interface pour la réponse JSON du backend OpenRouter ────────────────────
export interface NativeResponse {
  response: string;
  intent: string;   // 'sfp' | 'ports' | 'spare_parts' | 'router' | 'network_summary' | 'general'
  model: string;    // e.g. 'meta-llama/llama-3.3-70b-instruct'
}

@Injectable({
  providedIn: 'root'
})
export class AiAssistantService {

  constructor(private http: HttpClient) { }

  // ════════════════════════════════════════════════════════════════════════
  //  1. Récupérer les statistiques réseau en temps réel
  //     GET /api/iris/stats/ → { critical_sfps, down_ports, critical_links, total_routers }
  // ════════════════════════════════════════════════════════════════════════
  getAiStats(): Observable<AiStats> {
    return this.http.get<AiStats>(`${API_URL}/iris/stats/`);
  }

  // ════════════════════════════════════════════════════════════════════════
  //  2. Envoyer un message au moteur natif (Rule-based)
  //     POST /api/iris/chat/native/ → { response: string }
  // ════════════════════════════════════════════════════════════════════════
  sendMessage(messages: ChatMessage[]): Observable<NativeResponse> {
    return this.http.post<NativeResponse>(`${API_URL}/iris/chat/`, { messages });
  }
}
