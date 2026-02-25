import { Component, inject, computed, signal, ElementRef, viewChild, effect } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FinanceService } from '../finance';
import { TransactionType } from '../models/finance.models';
import { FormsModule } from '@angular/forms';
import * as d3 from 'd3';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, CurrencyPipe, FormsModule],
  template: `
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
      <h2 class="text-2xl font-bold text-slate-800">Visão Geral</h2>
      
      <div class="flex items-center gap-3">
        <div class="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
          <span class="material-icons text-slate-400 text-sm">calendar_today</span>
          <select 
            [(ngModel)]="filterYear" 
            class="bg-transparent text-sm font-semibold text-slate-700 outline-none"
          >
            @for (y of years; track y) {
              <option [value]="y">{{ y }}</option>
            }
          </select>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <!-- Summary Cards -->
      <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div class="flex items-center justify-between mb-2">
          <span class="text-slate-500 text-sm font-medium uppercase tracking-wider">Rendimentos ({{ filterYear() }})</span>
          <div class="p-2 bg-emerald-50 rounded-lg">
            <span class="material-icons text-emerald-600">trending_up</span>
          </div>
        </div>
        <div class="text-2xl font-bold text-emerald-600">
          {{ totalIncome() | currency:'BRL' }}
        </div>
      </div>

      <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div class="flex items-center justify-between mb-2">
          <span class="text-slate-500 text-sm font-medium uppercase tracking-wider">Gastos ({{ filterYear() }})</span>
          <div class="p-2 bg-rose-50 rounded-lg">
            <span class="material-icons text-rose-600">trending_down</span>
          </div>
        </div>
        <div class="text-2xl font-bold text-rose-600">
          {{ totalExpenses() | currency:'BRL' }}
        </div>
      </div>

      <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div class="flex items-center justify-between mb-2">
          <span class="text-slate-500 text-sm font-medium uppercase tracking-wider">Saldo ({{ filterYear() }})</span>
          <div class="p-2 bg-blue-50 rounded-lg">
            <span class="material-icons text-blue-600">account_balance_wallet</span>
          </div>
        </div>
        <div class="text-2xl font-bold" [ngClass]="balance() >= 0 ? 'text-blue-600' : 'text-rose-600'">
          {{ balance() | currency:'BRL' }}
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <!-- Monthly Evolution Chart -->
      <div class="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h3 class="text-lg font-semibold mb-6 text-slate-800">Evolução Mensal</h3>
        <div class="w-full overflow-x-auto">
          <div class="min-w-[600px] h-[300px] flex justify-center items-center" #evolutionContainer>
            <svg #evolutionSvg></svg>
          </div>
        </div>
      </div>

      <!-- Pie Chart Section -->
      <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h3 class="text-lg font-semibold mb-6 text-slate-800">Gastos por Categoria</h3>
        <div class="flex justify-center items-center min-h-[300px]" #chartContainer>
          @if (expensesByCategory().length === 0) {
            <p class="text-slate-400 italic">Nenhum dado para exibir</p>
          } @else {
            <svg #svg></svg>
          }
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-6">
      <!-- Category Summary -->
      <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h3 class="text-lg font-semibold mb-6 text-slate-800">Resumo de Categorias ({{ filterYear() }})</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          @for (cat of expensesByCategory(); track cat.name) {
            <div class="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div class="flex items-center gap-3">
                <div class="w-3 h-3 rounded-full" [style.backgroundColor]="cat.color"></div>
                <span class="text-slate-600 font-medium">{{ cat.name }}</span>
              </div>
              <div class="text-right">
                <div class="font-semibold text-slate-800">{{ cat.value | currency:'BRL' }}</div>
                <div class="text-xs text-slate-400">{{ (cat.value / totalExpenses() * 100) | number:'1.0-1' }}%</div>
              </div>
            </div>
          } @empty {
            <p class="text-slate-400 italic text-center py-8 col-span-full">Adicione lançamentos para ver o resumo</p>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    svg { overflow: visible; width: 100%; height: 100%; }
  `]
})
export class Dashboard {
  private financeService = inject(FinanceService);
  private svgRef = viewChild<ElementRef<SVGSVGElement>>('svg');
  private evolutionSvgRef = viewChild<ElementRef<SVGSVGElement>>('evolutionSvg');

  filterYear = signal<number>(new Date().getFullYear());
  years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  transactionsInYear = computed(() => {
    const year = this.filterYear();
    return this.financeService.transactions().filter(t => {
      const date = new Date(t.date);
      return date.getUTCFullYear() === year;
    });
  });

  totalIncome = computed(() => 
    this.transactionsInYear()
      .filter(t => t.type === TransactionType.INCOME)
      .reduce((acc, t) => acc + t.amount, 0)
  );

  totalExpenses = computed(() => 
    this.transactionsInYear()
      .filter(t => t.type === TransactionType.EXPENSE)
      .reduce((acc, t) => acc + t.amount, 0)
  );

  balance = computed(() => this.totalIncome() - this.totalExpenses());

  expensesByCategory = computed(() => {
    const expenses = this.transactionsInYear().filter(t => t.type === TransactionType.EXPENSE);
    const categories = this.financeService.categories();
    
    const grouped = d3.rollups(
      expenses,
      v => d3.sum(v, d => d.amount),
      d => d.category
    );

    return grouped.map(([catId, value]) => {
      const cat = categories.find(c => c.id === catId);
      return {
        name: cat?.name || 'Outros',
        color: cat?.color || '#cbd5e1',
        value
      };
    }).sort((a, b) => b.value - a.value);
  });

  monthlyEvolution = computed(() => {
    const ts = this.transactionsInYear();
    const months = [
      'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 
      'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
    ];

    const data = months.map((m, i) => ({
      month: m,
      income: 0,
      expense: 0
    }));

    ts.forEach(t => {
      const date = new Date(t.date);
      const mIdx = date.getUTCMonth();
      if (t.type === TransactionType.INCOME) {
        data[mIdx].income += t.amount;
      } else {
        data[mIdx].expense += t.amount;
      }
    });

    return data;
  });

  constructor() {
    effect(() => {
      const data = this.expensesByCategory();
      const svgEl = this.svgRef()?.nativeElement;
      if (svgEl && data.length > 0) {
        this.renderPieChart(svgEl, data);
      }
    });

    effect(() => {
      const data = this.monthlyEvolution();
      const svgEl = this.evolutionSvgRef()?.nativeElement;
      if (svgEl) {
        this.renderEvolutionChart(svgEl, data);
      }
    });
  }

  private renderPieChart(svgEl: SVGSVGElement, data: any[]) {
    const width = 300;
    const height = 300;
    const radius = Math.min(width, height) / 2;

    const svg = d3.select(svgEl)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .html('') 
      .append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`);

    const pie = d3.pie<any>()
      .value(d => d.value)
      .sort(null);

    const arc = d3.arc<any>()
      .innerRadius(radius * 0.6)
      .outerRadius(radius * 0.9);

    const arcs = svg.selectAll('arc')
      .data(pie(data))
      .enter()
      .append('g');

    arcs.append('path')
      .attr('d', arc as any)
      .attr('fill', d => d.data.color)
      .attr('stroke', 'white')
      .style('stroke-width', '2px')
      .style('opacity', 0.8);
  }

  private renderEvolutionChart(svgEl: SVGSVGElement, data: any[]) {
    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const width = 600 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    const svg = d3.select(svgEl)
      .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
      .html('')
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    const x = d3.scaleBand()
      .domain(data.map(d => d.month))
      .range([0, width])
      .padding(0.2);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => Math.max(d.income, d.expense)) || 1000])
      .nice()
      .range([height, 0]);

    // Axes
    svg.append('g')
      .attr('transform', `translate(0, ${height})`)
      .call(d3.axisBottom(x))
      .attr('color', '#94a3b8');

    svg.append('g')
      .call(d3.axisLeft(y).ticks(5).tickFormat(d3.format('~s')))
      .attr('color', '#94a3b8');

    // Bars for Income
    svg.selectAll('.bar-income')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'bar-income')
      .attr('x', d => (x(d.month) || 0))
      .attr('y', d => y(d.income))
      .attr('width', x.bandwidth() / 2)
      .attr('height', d => height - y(d.income))
      .attr('fill', '#10b981')
      .attr('rx', 2);

    // Bars for Expense
    svg.selectAll('.bar-expense')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'bar-expense')
      .attr('x', d => (x(d.month) || 0) + x.bandwidth() / 2)
      .attr('y', d => y(d.expense))
      .attr('width', x.bandwidth() / 2)
      .attr('height', d => height - y(d.expense))
      .attr('fill', '#f43f5e')
      .attr('rx', 2);
  }
}
