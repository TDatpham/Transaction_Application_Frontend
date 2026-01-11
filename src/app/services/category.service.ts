import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  description?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private categories: Category[] = [
    {
      id: 'food',
      name: 'Ăn uống',
      icon: '🍽️',
      color: '#FF6B6B',
      description: 'Chi phí ăn uống, nhà hàng, cafe'
    },
    {
      id: 'entertainment',
      name: 'Giải trí',
      icon: '🎬',
      color: '#4ECDC4',
      description: 'Phim ảnh, game, sự kiện giải trí'
    },
    {
      id: 'shopping',
      name: 'Mua sắm',
      icon: '🛍️',
      color: '#95E1D3',
      description: 'Quần áo, đồ dùng cá nhân'
    },
    {
      id: 'transport',
      name: 'Giao thông',
      icon: '🚗',
      color: '#F38181',
      description: 'Xăng xe, taxi, vé tàu xe'
    },
    {
      id: 'bills',
      name: 'Hóa đơn',
      icon: '💡',
      color: '#AA96DA',
      description: 'Điện, nước, internet, điện thoại'
    },
    {
      id: 'health',
      name: 'Sức khỏe',
      icon: '🏥',
      color: '#FCBAD3',
      description: 'Khám bệnh, thuốc men'
    },
    {
      id: 'education',
      name: 'Giáo dục',
      icon: '📚',
      color: '#A8E6CF',
      description: 'Học phí, sách vở, khóa học'
    },
    {
      id: 'travel',
      name: 'Du lịch',
      icon: '✈️',
      color: '#FFD93D',
      description: 'Vé máy bay, khách sạn, du lịch'
    },
    {
      id: 'other',
      name: 'Khác',
      icon: '📦',
      color: '#6C757D',
      description: 'Chi phí khác'
    }
  ];

  private categoriesSubject = new BehaviorSubject<Category[]>([]);
  public categories$ = this.categoriesSubject.asObservable();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    const stored = localStorage.getItem('expenseCategories');
    if (stored) {
      try {
        const customCategories = JSON.parse(stored);
        this.categories = [...this.categories, ...customCategories];
      } catch (e) {
        console.error('Error loading categories from storage', e);
      }
    }
    this.updateSubject();
  }

  private saveToStorage(): void {
    const customCategories = this.categories.filter(c => 
      !['food', 'entertainment', 'shopping', 'transport', 'bills', 'health', 'education', 'travel', 'other'].includes(c.id)
    );
    if (customCategories.length > 0) {
      localStorage.setItem('expenseCategories', JSON.stringify(customCategories));
    }
  }

  private updateSubject(): void {
    this.categoriesSubject.next([...this.categories]);
  }

  getCategories(): Category[] {
    return [...this.categories];
  }

  getCategoryById(id: string): Category | undefined {
    return this.categories.find(c => c.id === id);
  }

  addCategory(category: Omit<Category, 'id'>): Category {
    const newCategory: Category = {
      ...category,
      id: this.generateId()
    };
    this.categories.push(newCategory);
    this.updateSubject();
    this.saveToStorage();
    return newCategory;
  }

  updateCategory(id: string, updates: Partial<Category>): boolean {
    const index = this.categories.findIndex(c => c.id === id);
    if (index !== -1) {
      // Don't allow updating default categories
      const defaultIds = ['food', 'entertainment', 'shopping', 'transport', 'bills', 'health', 'education', 'travel', 'other'];
      if (defaultIds.includes(id)) {
        return false;
      }
      this.categories[index] = { ...this.categories[index], ...updates };
      this.updateSubject();
      this.saveToStorage();
      return true;
    }
    return false;
  }

  deleteCategory(id: string): boolean {
    const defaultIds = ['food', 'entertainment', 'shopping', 'transport', 'bills', 'health', 'education', 'travel', 'other'];
    if (defaultIds.includes(id)) {
      return false; // Don't allow deleting default categories
    }
    const index = this.categories.findIndex(c => c.id === id);
    if (index !== -1) {
      this.categories.splice(index, 1);
      this.updateSubject();
      this.saveToStorage();
      return true;
    }
    return false;
  }

  private generateId(): string {
    return 'cat_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}


