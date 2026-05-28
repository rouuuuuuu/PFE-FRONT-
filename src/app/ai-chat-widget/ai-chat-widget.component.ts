import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ProvisioningService } from '../services/provisioning.service';

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

@Component({
  selector: 'app-ai-chat-widget',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './ai-chat-widget.component.html',
  styleUrls: ['./ai-chat-widget.component.css']
})
export class AiChatWidgetComponent {

  isOpen = false;
  activeTab: 'chat' | 'form' = 'chat';

  messages: Message[] = [
    {
      role: 'assistant',
      text: 'Hello! Describe the service you want to provision and I will extract the parameters automatically.\n\nYou can type in English, French, or Arabic.'
    }
  ];

  userInput = '';
  loading = false;
  formFilled = false;

  form = {
    client_name: '',
    pe_ip: '',
    vlan_id: null as number | null,
    bandwidth_mbps: null as number | null,
    service_type: '',
    notes: ''
  };

  constructor(private provisioningService: ProvisioningService) {}

  toggle() {
    this.isOpen = !this.isOpen;
  }

  close() {
    this.isOpen = false;
  }

  sendMessage() {
    if (!this.userInput.trim() || this.loading) return;

    this.messages.push({ role: 'user', text: this.userInput });
    const text = this.userInput;
    this.userInput = '';
    this.loading = true;

    this.provisioningService.extractParams(text).subscribe({
      next: (res) => {
        const p = res.params;

        this.form = {
          client_name:    p.client_name    || '',
          pe_ip:          p.pe_ip          || '',
          vlan_id:        p.vlan_id        || null,
          bandwidth_mbps: p.bandwidth_mbps || null,
          service_type:   p.service_type   || '',
          notes:          p.notes          || ''
        };
        this.formFilled = true;

        const filled = Object.entries(p)
          .filter(([_, v]) => v !== null)
          .map(([k, v]) => `  • ${k}: ${v}`)
          .join('\n');

        const missing = Object.entries(p)
          .filter(([_, v]) => v === null)
          .map(([k]) => k);

        let reply = `Parameters extracted:\n${filled}`;
        if (missing.length > 0) {
          reply += `\n\nMissing: ${missing.join(', ')}\nPlease provide them.`;
        } else {
          reply += `\n\nAll fields filled. Switch to the Form tab to review and submit.`;
        }

        this.messages.push({ role: 'assistant', text: reply });
        this.loading = false;
        this.scrollToBottom();

        // Auto-switch to form tab when all filled
        if (missing.length === 0) {
          setTimeout(() => { this.activeTab = 'form'; }, 800);
        }
      },
      error: () => {
        this.messages.push({
          role: 'assistant',
          text: 'Something went wrong. Please try again.'
        });
        this.loading = false;
      }
    });
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  scrollToBottom() {
    setTimeout(() => {
      const chat = document.querySelector('.widget-messages');
      if (chat) chat.scrollTop = chat.scrollHeight;
    }, 80);
  }

  submitProvisioning() {
    console.log('Submitting:', this.form);
    this.messages.push({
      role: 'assistant',
      text: `Provisioning request submitted for client ${this.form.client_name}. Our team will process it shortly.`
    });
    this.formFilled = false;
    this.activeTab = 'chat';
  }

  get filledCount(): number {
    return Object.values(this.form).filter(v => v !== '' && v !== null).length;
  }
}
