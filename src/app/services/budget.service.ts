import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Budget {
  id?: string;
  categoryId: string;
  categoryName: string;
  amount: number;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate: Date;
  endDate?: Date;
  alertThreshold?: number; // Percentage (0-100) to alert when reached
  isActive: boolean;
}

export interface BudgetAlert {
  budgetId: string;
  categoryName: string;
  budgetAmount: number;
  spentAmount: number;
  percentage: number;
  status: 'warning' | 'exceeded';
}

@Injectable({
  providedIn: 'root'
})
export class BudgetService {
  private budgets: Budget[] = [];
  private budgetsSubject = new BehaviorSubject<Budget[]>([]);
  public budgets$ = this.budgetsSubject.asObservable();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    const stored = localStorage.getItem('budgets');
    if (stored) {
      try {
        this.budgets = JSON.parse(stored).map((b: any) => ({
          ...b,
          startDate: new Date(b.startDate),
          endDate: b.endDate ? new Date(b.endDate) : undefined
        }));
        this.updateSubject();
      } catch (e) {
        console.error('Error loading budgets from storage', e);
      }
    }
  }

  private saveToStorage(): void {
    localStorage.setItem('budgets', JSON.stringify(this.budgets));
  }

  private updateSubject(): void {
    this.budgetsSubject.next([...this.budgets]);
  }

  createBudget(budget: Omit<Budget, 'id'>): Budget {
    const newBudget: Budget = {
      ...budget,
      id: this.generateId(),
      isActive: true
    };
    this.budgets.push(newBudget);
    this.updateSubject();
    this.saveToStorage();
    return newBudget;
  }

  updateBudget(id: string, updates: Partial<Budget>): boolean {
    const index = this.budgets.findIndex(b => b.id === id);
    if (index !== -1) {
      this.budgets[index] = { ...this.budgets[index], ...updates };
      this.updateSubject();
      this.saveToStorage();
      return true;
    }
    return false;
  }

  deleteBudget(id: string): boolean {
    const index = this.budgets.findIndex(b => b.id === id);
    if (index !== -1) {
      this.budgets.splice(index, 1);
      this.updateSubject();
      this.saveToStorage();
      return true;
    }
    return false;
  }

  getBudgets(): Budget[] {
    return [...this.budgets];
  }

  getActiveBudgets(): Budget[] {
    return this.budgets.filter(b => b.isActive);
  }

  getBudgetById(id: string): Budget | undefined {
    return this.budgets.find(b => b.id === id);
  }

  checkBudgetAlerts(spentByCategory: Map<string, number>): BudgetAlert[] {
    const alerts: BudgetAlert[] = [];
    const now = new Date();

    this.budgets
      .filter(b => b.isActive)
      .forEach(budget => {
        const spent = spentByCategory.get(budget.categoryId) || 0;
        const percentage = (spent / budget.amount) * 100;
        const threshold = budget.alertThreshold || 80;

        if (percentage >= threshold) {
          // Check if budget is still valid for current period
          if (this.isBudgetValidForPeriod(budget, now)) {
            alerts.push({
              budgetId: budget.id!,
              categoryName: budget.categoryName,
              budgetAmount: budget.amount,
              spentAmount: spent,
              percentage: Math.round(percentage * 100) / 100,
              status: percentage >= 100 ? 'exceeded' : 'warning'
            });
          }
        }
      });

    return alerts.sort((a, b) => b.percentage - a.percentage);
  }

  private isBudgetValidForPeriod(budget: Budget, date: Date): boolean {
    if (budget.endDate && date > budget.endDate) {
      return false;
    }

    const start = new Date(budget.startDate);
    switch (budget.period) {
      case 'daily':
        return date.toDateString() === start.toDateString();
      case 'weekly':
        const weekStart = new Date(start);
        weekStart.setDate(start.getDate() - start.getDay());
        const currentWeekStart = new Date(date);
        currentWeekStart.setDate(date.getDate() - date.getDay());
        return weekStart.getTime() === currentWeekStart.getTime();
      case 'monthly':
        return date.getMonth() === start.getMonth() && date.getFullYear() === start.getFullYear();
      case 'yearly':
        return date.getFullYear() === start.getFullYear();
      default:
        return true;
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}


