import { ChangeDetectionStrategy, Component, inject, signal, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Dashboard } from './components/dashboard';
import { TransactionForm } from './components/transaction-form';
import { TransactionList } from './components/transaction-list';
import { CategoryManager } from './components/category-manager';
import { FinanceService } from './finance';
import { Transaction } from './models/finance.models';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  imports: [
    CommonModule,
    Dashboard,
    TransactionForm,
    TransactionList,
    CategoryManager
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private financeService = inject(FinanceService);
  private platformId = inject(PLATFORM_ID);
  
  activeTab = signal<'dashboard' | 'transactions' | 'categories'>('dashboard');
  editingTransaction = signal<Transaction | null>(null);
  isDarkMode = signal<boolean>(false);

  toggleDarkMode() {
    this.isDarkMode.update(v => !v);
    if (isPlatformBrowser(this.platformId)) {
      if (this.isDarkMode()) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }

  exportData() {
    const data = this.financeService.exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financas-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  importData(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          this.financeService.importData(e.target?.result as string);
          alert('Dados importados com sucesso!');
        } catch (err: any) {
          alert(err.message);
        }
      };
      reader.readAsText(file);
    }
  }

  onEditTransaction(t: Transaction) {
    this.editingTransaction.set(t);
    this.activeTab.set('transactions');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
