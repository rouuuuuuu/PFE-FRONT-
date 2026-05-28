import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ProvisioningService } from '../../services/provisioning.service';

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

@Component({
  selector: 'app-nlp-provisioning',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './nlp-provisioning.component.html',
  styleUrls: ['./nlp-provisioning.component.css']
})
export class NlpProvisioningComponent {

  messages: Message[] = [
    {
      role: 'assistant',
      text: '👋 Hello! Describe the service you want to provision and I will extract the parameters automatically.\n\nYou can type in English, French, or Arabic.'
    }
  ];

  userInput: string = '';
  loading: boolean = false;
  formFilled: boolean = false;

  form = {
    client_name: '',
    pe_ip: '',
    vlan_id: null as number | null,
    bandwidth_mbps: null as number | null,
    service_type: '',
    notes: ''
  };

  constructor(private provisioningService: ProvisioningService) {}

  sendMessage() {
    if (!this.userInput.trim() || this.loading) return;

    // Add user message
    this.messages.push({ role: 'user', text: this.userInput });
    const text = this.userInput;
    this.userInput = '';
    this.loading = true;

    this.provisioningService.extractParams(text).subscribe({
      next: (res) => {
        const p = res.params;

        // Auto-fill the form
        this.form = {
          client_name:    p.client_name    || '',
          pe_ip:          p.pe_ip          || '',
          vlan_id:        p.vlan_id        || null,
          bandwidth_mbps: p.bandwidth_mbps || null,
          service_type:   p.service_type   || '',
          notes:          p.notes          || ''
        };
        this.formFilled = true;

        // Build reply message
        const filled = Object.entries(p)
          .filter(([_, v]) => v !== null)
          .map(([k, v]) => `  • ${k}: ${v}`)
          .join('\n');

        const missing = Object.entries(p)
          .filter(([_, v]) => v === null)
          .map(([k]) => k);

        let reply = `✅ Parameters extracted:\n${filled}`;
        if (missing.length > 0) {
          reply += `\n\n⚠️ Missing: ${missing.join(', ')}\nPlease provide them.`;
        } else {
          reply += `\n\n✅ All fields filled! Review the form and click Provision.`;
        }

        this.messages.push({ role: 'assistant', text: reply });
        this.loading = false;
        this.scrollToBottom();
      },
      error: () => {
        this.messages.push({
          role: 'assistant',
          text: '❌ Something went wrong. Please try again.'
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
      const chat = document.querySelector('.chat-messages');
      if (chat) chat.scrollTop = chat.scrollHeight;
    }, 100);
  }

  submitProvisioning() {
    console.log('Submitting:', this.form);
    // TODO: call your real provisioning API here
    this.messages.push({
      role: 'assistant',
      text: `🚀 Provisioning request submitted for client ${this.form.client_name}!`
    });
    this.formFilled = false;
  }
}