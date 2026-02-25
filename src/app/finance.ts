import { Injectable, signal, computed, effect, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Transaction, Category, TransactionType } from './models/finance.models';

@Injectable({
  providedIn: 'root'
})
export class FinanceService {
  private readonly STORAGE_KEY_TRANSACTIONS = 'fin_transactions';
  private readonly STORAGE_KEY_CATEGORIES = 'fin_categories';
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  private _transactions = signal<Transaction[]>([]);
  private _categories = signal<Category[]>([]);

  transactions = computed(() => this._transactions());
  categories = computed(() => this._categories());

  constructor() {
    if (this.isBrowser) {
      this.loadFromStorage();
    }
    
    // Auto-save on changes
    effect(() => {
      if (this.isBrowser) {
        localStorage.setItem(this.STORAGE_KEY_TRANSACTIONS, JSON.stringify(this._transactions()));
      }
    });
    effect(() => {
      if (this.isBrowser) {
        localStorage.setItem(this.STORAGE_KEY_CATEGORIES, JSON.stringify(this._categories()));
      }
    });
  }

  private loadFromStorage() {
    if (!this.isBrowser) return;
    
    const savedTransactions = localStorage.getItem(this.STORAGE_KEY_TRANSACTIONS);
    if (savedTransactions) {
      this._transactions.set(JSON.parse(savedTransactions));
    }

    const savedCategories = localStorage.getItem(this.STORAGE_KEY_CATEGORIES);
    if (savedCategories) {
      this._categories.set(JSON.parse(savedCategories));
    } else {
      // Default categories
      const defaults: Category[] = [
        { id: '1', name: 'Alimentação', color: '#ef4444', icon: 'restaurant' },
        { id: '2', name: 'Transporte', color: '#3b82f6', icon: 'directions_car' },
        { id: '3', name: 'Moradia', color: '#10b981', icon: 'home' },
        { id: '4', name: 'Lazer', color: '#f59e0b', icon: 'celebration' },
        { id: '5', name: 'Saúde', color: '#ec4899', icon: 'medical_services' },
        { id: '6', name: 'Salário', color: '#8b5cf6', icon: 'payments' },
      ];
      this._categories.set(defaults);
    }
  }

  addTransaction(transaction: Omit<Transaction, 'id'>) {
    const newTransaction = {
      ...transaction,
      id: crypto.randomUUID()
    };
    this._transactions.update(t => [newTransaction, ...t]);
  }

  updateTransaction(transaction: Transaction) {
    this._transactions.update(ts => ts.map(t => t.id === transaction.id ? transaction : t));
  }

  deleteTransaction(id: string) {
    this._transactions.update(ts => ts.filter(t => t.id !== id));
  }

  addCategory(category: Omit<Category, 'id'>) {
    const newCategory = {
      ...category,
      id: crypto.randomUUID()
    };
    this._categories.update(c => [...c, newCategory]);
  }

  updateCategory(category: Category) {
    this._categories.update(cs => cs.map(c => c.id === category.id ? category : c));
  }

  deleteCategory(id: string) {
    this._categories.update(cs => cs.filter(c => c.id !== id));
  }

  exportData(): string {
    const data = {
      transactions: this._transactions(),
      categories: this._categories()
    };
    return JSON.stringify(data, null, 2);
  }

  importData(json: string) {
    try {
      const data = JSON.parse(json);
      if (data.transactions) this._transactions.set(data.transactions);
      if (data.categories) this._categories.set(data.categories);
    } catch (e) {
      console.error('Failed to import data', e);
      throw new Error('Formato de arquivo inválido');
    }
  }
}
