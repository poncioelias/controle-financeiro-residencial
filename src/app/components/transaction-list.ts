import { Component, inject, signal, computed, output } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FinanceService } from '../finance';
import { Transaction, TransactionType } from '../models/finance.models';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-transaction-list',
  imports: [CommonModule, CurrencyPipe, DatePipe, FormsModule],
  template: `
    <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div class="p-6 border-b border-slate-100">
        <div class="flex flex-col gap-6">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h3 class="text-lg font-semibold text-slate-800">Lançamentos</h3>
            
            <div class="flex flex-wrap items-center gap-3">
              <!-- Search -->
              <div class="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                <span class="material-icons text-slate-400 text-sm">search</span>
                <input 
                  type="text" 
                  [(ngModel)]="searchQuery" 
                  placeholder="Buscar descrição..."
                  class="bg-transparent text-sm font-medium text-slate-600 outline-none w-full md:w-48"
                >
              </div>

              <!-- Month/Year -->
              <div class="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
                <span class="material-icons text-slate-400 text-sm">event</span>
                <select 
                  [(ngModel)]="filterMonth" 
                  class="bg-transparent text-sm font-medium text-slate-600 outline-none"
                >
                  <option [value]="0">Todos os meses</option>
                  @for (m of months; track m.value) {
                    <option [value]="m.value">{{ m.label }}</option>
                  }
                </select>
                <span class="text-slate-300">|</span>
                <select 
                  [(ngModel)]="filterYear" 
                  class="bg-transparent text-sm font-medium text-slate-600 outline-none"
                >
                  @for (y of years; track y) {
                    <option [value]="y">{{ y }}</option>
                  }
                </select>
              </div>
            </div>
          </div>

          <!-- Advanced Filters -->
          <div class="flex flex-wrap items-center gap-4 pt-4 border-t border-slate-50">
            <div class="flex items-center gap-2">
              <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tipo:</span>
              <div class="flex bg-slate-50 p-1 rounded-lg border border-slate-200">
                <button 
                  (click)="filterType.set('ALL')"
                  class="px-3 py-1 text-xs font-bold rounded-md transition-all"
                  [class.bg-white]="filterType() === 'ALL'"
                  [class.shadow-sm]="filterType() === 'ALL'"
                  [class.text-slate-900]="filterType() === 'ALL'"
                  [class.text-slate-500]="filterType() !== 'ALL'"
                >Todos</button>
                <button 
                  (click)="filterType.set(TransactionType.INCOME)"
                  class="px-3 py-1 text-xs font-bold rounded-md transition-all"
                  [class.bg-emerald-500]="filterType() === TransactionType.INCOME"
                  [class.text-white]="filterType() === TransactionType.INCOME"
                  [class.text-slate-500]="filterType() !== TransactionType.INCOME"
                >Receitas</button>
                <button 
                  (click)="filterType.set(TransactionType.EXPENSE)"
                  class="px-3 py-1 text-xs font-bold rounded-md transition-all"
                  [class.bg-rose-500]="filterType() === TransactionType.EXPENSE"
                  [class.text-white]="filterType() === TransactionType.EXPENSE"
                  [class.text-slate-500]="filterType() !== TransactionType.EXPENSE"
                >Despesas</button>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Categoria:</span>
              <select 
                [(ngModel)]="filterCategory"
                class="bg-slate-50 text-xs font-bold text-slate-600 px-3 py-1.5 rounded-lg border border-slate-200 outline-none"
              >
                <option value="ALL">Todas</option>
                @for (cat of categories(); track cat.id) {
                  <option [value]="cat.id">{{ cat.name }}</option>
                }
              </select>
            </div>
          </div>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
              <th class="px-6 py-4 font-semibold">Data</th>
              <th class="px-6 py-4 font-semibold">Descrição</th>
              <th class="px-6 py-4 font-semibold">Categoria</th>
              <th class="px-6 py-4 font-semibold text-right">Valor</th>
              <th class="px-6 py-4 font-semibold text-center">Ações</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            @for (t of filteredTransactions(); track t.id) {
              <tr class="hover:bg-slate-50 transition-colors group">
                <td class="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">
                  {{ t.date | date:'dd/MM/yyyy' }}
                </td>
                <td class="px-6 py-4">
                  <div class="text-sm font-medium text-slate-800">{{ t.description }}</div>
                </td>
                <td class="px-6 py-4">
                  <div class="flex items-center gap-2">
                    <div class="w-2 h-2 rounded-full" [style.backgroundColor]="getCategoryColor(t.category)"></div>
                    <span class="text-sm text-slate-600">{{ getCategoryName(t.category) }}</span>
                  </div>
                </td>
                <td class="px-6 py-4 text-right">
                  <span 
                    class="text-sm font-bold"
                    [class.text-emerald-600]="t.type === TransactionType.INCOME"
                    [class.text-rose-600]="t.type === TransactionType.EXPENSE"
                  >
                    {{ t.type === TransactionType.INCOME ? '+' : '-' }} {{ t.amount | currency:'BRL' }}
                  </span>
                </td>
                <td class="px-6 py-4 text-center">
                  <div class="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      (click)="edit.emit(t)"
                      class="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      title="Editar"
                    >
                      <span class="material-icons text-sm">edit</span>
                    </button>
                    <button 
                      (click)="onDelete(t.id)"
                      class="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                      title="Excluir"
                    >
                      <span class="material-icons text-sm">delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="5" class="px-6 py-12 text-center text-slate-400 italic">
                  Nenhum lançamento encontrado para este período.
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class TransactionList {
  private financeService = inject(FinanceService);
  edit = output<Transaction>();

  TransactionType = TransactionType;
  categories = this.financeService.categories;
  
  searchQuery = signal<string>('');
  filterMonth = signal<number>(new Date().getMonth() + 1);
  filterYear = signal<number>(new Date().getFullYear());
  filterCategory = signal<string>('ALL');
  filterType = signal<TransactionType | 'ALL'>('ALL');

  months = [
    { value: 1, label: 'Jan' },
    { value: 2, label: 'Fev' },
    { value: 3, label: 'Mar' },
    { value: 4, label: 'Abr' },
    { value: 5, label: 'Mai' },
    { value: 6, label: 'Jun' },
    { value: 7, label: 'Jul' },
    { value: 8, label: 'Ago' },
    { value: 9, label: 'Set' },
    { value: 10, label: 'Out' },
    { value: 11, label: 'Nov' },
    { value: 12, label: 'Dez' },
  ];

  years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  filteredTransactions = computed(() => {
    const ts = this.financeService.transactions();
    const m = this.filterMonth();
    const y = this.filterYear();
    const q = this.searchQuery().toLowerCase();
    const cat = this.filterCategory();
    const type = this.filterType();

    return ts.filter(t => {
      const date = new Date(t.date);
      const monthMatch = m === 0 || (date.getUTCMonth() + 1) === m;
      const yearMatch = date.getUTCFullYear() === y;
      const searchMatch = !q || t.description.toLowerCase().includes(q);
      const categoryMatch = cat === 'ALL' || t.category === cat;
      const typeMatch = type === 'ALL' || t.type === type;

      return monthMatch && yearMatch && searchMatch && categoryMatch && typeMatch;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  });

  getCategoryName(id: string) {
    return this.financeService.categories().find(c => c.id === id)?.name || 'Outros';
  }

  getCategoryColor(id: string) {
    return this.financeService.categories().find(c => c.id === id)?.color || '#cbd5e1';
  }

  onDelete(id: string) {
    if (confirm('Tem certeza que deseja excluir este lançamento?')) {
      this.financeService.deleteTransaction(id);
    }
  }
}
