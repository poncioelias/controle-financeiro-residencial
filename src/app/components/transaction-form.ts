import { Component, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { FinanceService } from '../finance';
import { TransactionType, Transaction } from '../models/finance.models';

@Component({
  selector: 'app-transaction-form',
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-lg font-semibold text-slate-800">
          {{ editTransaction() ? 'Editar Lançamento' : 'Novo Lançamento' }}
        </h3>
        @if (editTransaction()) {
          <button (click)="cancel.emit()" class="text-slate-400 hover:text-slate-600 transition-colors">
            <span class="material-icons">close</span>
          </button>
        }
      </div>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <button 
            type="button"
            (click)="setType(TransactionType.EXPENSE)"
            class="flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all font-medium"
            [class.border-rose-500]="form.get('type')?.value === TransactionType.EXPENSE"
            [class.bg-rose-50]="form.get('type')?.value === TransactionType.EXPENSE"
            [class.text-rose-600]="form.get('type')?.value === TransactionType.EXPENSE"
            [class.border-slate-100]="form.get('type')?.value !== TransactionType.EXPENSE"
            [class.text-slate-500]="form.get('type')?.value !== TransactionType.EXPENSE"
          >
            <span class="material-icons">trending_down</span>
            Despesa
          </button>
          <button 
            type="button"
            (click)="setType(TransactionType.INCOME)"
            class="flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all font-medium"
            [class.border-emerald-500]="form.get('type')?.value === TransactionType.INCOME"
            [class.bg-emerald-50]="form.get('type')?.value === TransactionType.INCOME"
            [class.text-emerald-600]="form.get('type')?.value === TransactionType.INCOME"
            [class.border-slate-100]="form.get('type')?.value !== TransactionType.INCOME"
            [class.text-slate-500]="form.get('type')?.value !== TransactionType.INCOME"
          >
            <span class="material-icons">trending_up</span>
            Receita
          </button>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
          <input 
            type="text" 
            formControlName="description"
            placeholder="Ex: Aluguel, Supermercado..."
            class="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
          >
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Valor</label>
            <div class="relative">
              <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">R$</span>
              <input 
                type="number" 
                formControlName="amount"
                step="0.01"
                class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              >
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Data</label>
            <input 
              type="date" 
              formControlName="date"
              class="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            >
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Categoria</label>
          <select 
            formControlName="category"
            class="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all appearance-none bg-white"
          >
            <option value="">Selecione uma categoria</option>
            @for (cat of categories(); track cat.id) {
              <option [value]="cat.id">{{ cat.name }}</option>
            }
          </select>
        </div>

        <button 
          type="submit"
          [disabled]="form.invalid"
          class="w-full py-3 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-4"
        >
          {{ editTransaction() ? 'Salvar Alterações' : 'Adicionar Lançamento' }}
        </button>
      </form>
    </div>
  `
})
export class TransactionForm {
  private fb = inject(FormBuilder);
  private financeService = inject(FinanceService);

  editTransaction = input<Transaction | null>(null);
  cancel = output<void>();
  saved = output<void>();

  TransactionType = TransactionType;
  categories = this.financeService.categories;

  form: FormGroup = this.fb.group({
    description: ['', [Validators.required, Validators.minLength(3)]],
    amount: [null, [Validators.required, Validators.min(0.01)]],
    date: [new Date().toISOString().split('T')[0], Validators.required],
    category: ['', Validators.required],
    type: [TransactionType.EXPENSE, Validators.required]
  });

  ngOnChanges() {
    const edit = this.editTransaction();
    if (edit) {
      this.form.patchValue(edit);
    } else {
      this.form.reset({
        type: TransactionType.EXPENSE,
        date: new Date().toISOString().split('T')[0]
      });
    }
  }

  setType(type: TransactionType) {
    this.form.patchValue({ type });
  }

  onSubmit() {
    if (this.form.valid) {
      const val = this.form.value;
      const edit = this.editTransaction();
      
      if (edit) {
        this.financeService.updateTransaction({ ...val, id: edit.id });
      } else {
        this.financeService.addTransaction(val);
      }
      
      this.form.reset({
        type: TransactionType.EXPENSE,
        date: new Date().toISOString().split('T')[0]
      });
      this.saved.emit();
    }
  }
}
