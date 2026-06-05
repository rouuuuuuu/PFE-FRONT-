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
}

import { TranslateModule } from '@ngx-translate/core';

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

  // ── KPI Cards — données chargées depuis /api/ai/stats/ ───────────────────
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
    { icon: 'bar_chart', label: 'Network Summary', text: 'Give me a summary of the current network state.' },
    { icon: 'sensors', label: 'Diagnose SFP Issues', text: 'Diagnose the current SFP problems on the network.' },
    { icon: 'developer_board_off', label: 'Card Failure slot 3', text: 'Card failure on slot 3 of TUN_0010.' }
  ];

  constructor(
    private aiService: AiAssistantService,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef
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
    this._pushAssistantMessage(
      '**Hello Iris Here! I\'m your AI Assistant :)**\n\n' +
      'I can analyze alerts, critical equipment, and answer questions about the network.\n\n' +
      '_Use the quick prompts below or type your own question._'
    );
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

    // Appel HTTP POST vers /api/ai/chat/native/
    this.activeSub = this.aiService.sendMessage(apiMessages).subscribe({
      next: (res) => {
        this._pushAssistantMessage(res.response);
        this.isLoading = false;
        this._scrollToBottom();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('[AiAssistant] Error sending message:', err);
        this._pushAssistantMessage('An error occurred while contacting the AI engine. Please try again.');
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ════════════════════════════════════════════════════════════════════════
  //  TASK 3 — Quick Prompt : pré-remplir + envoyer automatiquement
  // ════════════════════════════════════════════════════════════════════════
  usePrompt(text: string): void {
    if (this.isLoading) return;
    this.userInput = text;
    this.sendMessage();
  }

  // ════════════════════════════════════════════════════════════════════════
  //  Effacer la conversation
  // ════════════════════════════════════════════════════════════════════════
  clearChat(): void {
    this.activeSub?.unsubscribe();
    this.isLoading = false;
    this.messages = [];
    this._pushAssistantMessage('**Conversation cleared.**\n\nHow can I help you?');
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

  private _pushAssistantMessage(markdown: string): void {
    this.messages.push({
      role: 'assistant',
      text: markdown,
      html: this.sanitizer.bypassSecurityTrustHtml(marked(markdown) as string)
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
