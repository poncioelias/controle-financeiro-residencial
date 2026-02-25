import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FinanceService } from '../finance';
import { Category } from '../models/finance.models';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-category-manager',
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <h3 class="text-lg font-semibold mb-6 text-slate-800">Gerenciar Categorias</h3>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="flex flex-col md:flex-row gap-4 mb-8">
        <div class="flex-1">
          <input 
            type="text" 
            formControlName="name"
            placeholder="Nome da categoria"
            class="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
          >
        </div>
        <div class="w-full md:w-32">
          <input 
            type="color" 
            formControlName="color"
            class="w-full h-10 p-1 rounded-xl border border-slate-200 cursor-pointer"
          >
        </div>
        <button 
          type="submit"
          [disabled]="form.invalid"
          class="px-6 py-2 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 disabled:opacity-50 transition-all"
        >
          {{ editingId() ? 'Salvar' : 'Adicionar' }}
        </button>
        @if (editingId()) {
          <button 
            type="button"
            (click)="cancelEdit()"
            class="px-6 py-2 bg-slate-100 text-slate-600 rounded-xl font-semibold hover:bg-slate-200 transition-all"
          >
            Cancelar
          </button>
        }
      </form>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        @for (cat of categories(); track cat.id) {
          <div class="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50 group">
            <div class="flex items-center gap-3">
              <div class="w-4 h-4 rounded-full" [style.backgroundColor]="cat.color"></div>
              <span class="font-medium text-slate-700">{{ cat.name }}</span>
            </div>
            <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                (click)="startEdit(cat)"
                class="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg"
              >
                <span class="material-icons text-sm">edit</span>
              </button>
              <button 
                (click)="onDelete(cat.id)"
                class="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
              >
                <span class="material-icons text-sm">delete</span>
              </button>
            </div>
          </div>
        }
      </div>
    </div>
  `
})
export class CategoryManager {
  private financeService = inject(FinanceService);
  private fb = inject(FormBuilder);

  categories = this.financeService.categories;
  editingId = signal<string | null>(null);

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    color: ['#3b82f6', Validators.required],
    icon: ['category']
  });

  startEdit(cat: Category) {
    this.editingId.set(cat.id);
    this.form.patchValue(cat);
  }

  cancelEdit() {
    this.editingId.set(null);
    this.form.reset({ color: '#3b82f6', icon: 'category' });
  }

  onSubmit() {
    if (this.form.valid) {
      const val = this.form.value as any;
      const id = this.editingId();
      
      if (id) {
        this.financeService.updateCategory({ ...val, id });
      } else {
        this.financeService.addCategory(val);
      }
      
      this.cancelEdit();
    }
  }

  onDelete(id: string) {
    if (confirm('Tem certeza? Isso pode afetar lançamentos existentes.')) {
      this.financeService.deleteCategory(id);
    }
  }
}
