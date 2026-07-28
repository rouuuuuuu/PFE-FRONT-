import {
  Component, OnInit, OnDestroy,
  ViewChild, ElementRef, ChangeDetectorRef, Output, EventEmitter
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AiAssistantService, AiStats, ChatMessage } from '../../services/ai-assistant.service';
import { Subscription } from 'rxjs';
import { marked } from 'marked';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

// ── Interface pour les messages affichés dans le chat ──────────────────────
interface DisplayMessage {
  role: 'user' | 'assistant';
  text: string;     // Texte brut (Markdown)
  html: SafeHtml;   // HTML sécurisé rendu depuis Markdown
  intent?: string;  // Intention détectée (ex: sfp, ports)
  model?: string;   // Modèle utilisé (ex: meta-llama/llama-3.3-70b-instruct)
}

import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-ai-assistant',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatTooltipModule, TranslateModule],
  templateUrl: './ai-assistant.component.html',
  styleUrls: ['./ai-assistant.component.css']
})
export class AiAssistantComponent implements OnInit, OnDestroy {

  // Emits when the user clicks the close button inside the drawer
  @Output() closeSidenav = new EventEmitter<void>();

  // ── Références DOM ────────────────────────────────────────────────────────
  @ViewChild('chatZone') chatZone!: ElementRef<HTMLDivElement>;
  @ViewChild('textareaInput') textareaInput!: ElementRef<HTMLTextAreaElement>;
  headerSubtitle = 'Maintenance & Stock AI';

  // ── KPI Cards — données chargées depuis /api/iris/stats/ ──────────────────
  stats: AiStats | null = null;
  statsLoading = true;
  statsError = false;

  // ── Historique des messages du chat ──────────────────────────────────────
  messages: DisplayMessage[] = [];

  // ── Saisie de l'utilisateur ───────────────────────────────────────────────
  userInput = '';

  // ── État de chargement (en attente de réponse backend) ───────────────────
  isLoading = false;

  // ── Abonnement RxJS actif ─────────────────────────────────────────────────
  private activeSub?: Subscription;

  // ── Quick prompts displayed above the input area ────────────────────────
  readonly quickPrompts: { icon: string; label: string; text: string }[] = [
    { icon: 'sensors', label: 'AI.PROMPT_1_LABEL', text: 'AI.PROMPT_1_TEXT' },
    { icon: 'inventory_2', label: 'AI.PROMPT_2_LABEL', text: 'AI.PROMPT_2_TEXT' },
    { icon: 'developer_board', label: 'AI.PROMPT_3_LABEL', text: 'AI.PROMPT_3_TEXT' }
  ];

  constructor(
    private aiService: AiAssistantService,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService
  ) {
    marked.setOptions({ breaks: true, gfm: true });
  }

  // ════════════════════════════════════════════════════════════════════════
  //  Cycle de vie
  // ════════════════════════════════════════════════════════════════════════
  ngOnInit(): void {
    // ── TASK 2 : chargement des stats strictement dans ngOnInit ─────────
    this.aiService.getAiStats().subscribe({
      next: (data: AiStats) => {
        this.stats = data;
        this.statsLoading = false;
        this.statsError = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('[AiAssistant] Erreur lors du chargement des stats réseau:', err);
        this.statsLoading = false;
        this.statsError = true;
        this.cdr.detectChanges();
      }
    });

    // Welcome message
    this._pushAssistantMessage(this.translate.instant('AI.WELCOME_MSG'));
  }

  ngOnDestroy(): void {
    this.activeSub?.unsubscribe();
  }

  // ════════════════════════════════════════════════════════════════════════
  //  Envoi d'un message (TASK 1 — POST simple, plus de streaming SSE)
  // ════════════════════════════════════════════════════════════════════════
  sendMessage(): void {
    const text = this.userInput.trim();
    if (!text || this.isLoading) return;

    this.activeSub?.unsubscribe();

    // Ajouter le message utilisateur
    this._pushUserMessage(text);
    this.userInput = '';
    this._resetTextareaHeight();
    this.isLoading = true;
    this._scrollToBottom();

    // Construire le tableau pour l'API
    const apiMessages: ChatMessage[] = this.messages.map(m => ({
      role: m.role,
      content: m.text
    }));

    // Appel HTTP POST vers /api/iris/chat/native/
    this.activeSub = this.aiService.sendMessage(apiMessages).subscribe({
      next: (res) => {
        this._pushAssistantMessage(res.response, res.intent, res.model);
        this.isLoading = false;
        this._scrollToBottom();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('[AiAssistant] Error sending message:', err);
        this._pushAssistantMessage(this.translate.instant('AI.ERROR_MSG'));
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ════════════════════════════════════════════════════════════════════════
  //  TASK 3 — Quick Prompt : pré-remplir + envoyer automatiquement
  // ════════════════════════════════════════════════════════════════════════
  usePrompt(key: string): void {
    if (this.isLoading) return;
    this.userInput = this.translate.instant(key);
    this.sendMessage();
  }

  // ════════════════════════════════════════════════════════════════════════
  //  Effacer la conversation
  // ════════════════════════════════════════════════════════════════════════
  clearChat(): void {
    this.activeSub?.unsubscribe();
    this.isLoading = false;
    this.messages = [];
    this._pushAssistantMessage(this.translate.instant('AI.CLEARED_MSG'));
  }

  // ════════════════════════════════════════════════════════════════════════
  //  Gestion clavier du textarea
  // ════════════════════════════════════════════════════════════════════════
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  // ════════════════════════════════════════════════════════════════════════
  //  Auto-resize du textarea
  // ════════════════════════════════════════════════════════════════════════
  autoResize(event: Event): void {
    const el = event.target as HTMLTextAreaElement;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 140) + 'px';
  }

  // ════════════════════════════════════════════════════════════════════════
  //  Classe CSS selon la sévérité d'une stat KPI
  // ════════════════════════════════════════════════════════════════════════
  statClass(value: number | null | undefined, thresholds: [number, number]): string {
    if (value == null) return 'stat-neutral';
    if (value >= thresholds[1]) return 'stat-critical';
    if (value >= thresholds[0]) return 'stat-warning';
    return 'stat-ok';
  }

  // ════════════════════════════════════════════════════════════════════════
  //  Helpers internes
  // ════════════════════════════════════════════════════════════════════════
  private _pushUserMessage(text: string): void {
    this.messages.push({
      role: 'user',
      text,
      html: this.sanitizer.bypassSecurityTrustHtml(
        `<p>${text.replace(/\n/g, '<br>')}</p>`
      )
    });
  }

  private _pushAssistantMessage(markdown: string, intent?: string, model?: string): void {
    this.messages.push({
      role: 'assistant',
      text: markdown,
      html: this.sanitizer.bypassSecurityTrustHtml(marked(markdown) as string),
      intent: intent,
      model: model
    });
  }

  private _scrollToBottom(): void {
    setTimeout(() => {
      if (this.chatZone?.nativeElement) {
        this.chatZone.nativeElement.scrollTop = this.chatZone.nativeElement.scrollHeight;
      }
    }, 60);
  }

  private _resetTextareaHeight(): void {
    if (this.textareaInput?.nativeElement) {
      this.textareaInput.nativeElement.style.height = 'auto';
    }
  }
}
