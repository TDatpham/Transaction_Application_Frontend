import { Component, OnInit } from '@angular/core';
import { CategoryService, Category } from 'src/app/services/category.service';
import { ToastService } from 'angular-toastify';

@Component({
  selector: 'app-expense-categories',
  templateUrl: './expense-categories.component.html',
  styleUrls: ['./expense-categories.component.css']
})
export class ExpenseCategoriesComponent implements OnInit {
  categories: Category[] = [];
  showAddModal: boolean = false;
  editingCategory: Category | null = null;

  formData: Partial<Category> = {
    name: '',
    icon: '📦',
    color: '#6C757D',
    description: ''
  };

  availableIcons = ['🍽️', '🎬', '🛍️', '🚗', '💡', '🏥', '📚', '✈️', '📦', '🎮', '💄', '🏋️', '🎵', '🍕', '☕'];

  constructor(
    private categoryService: CategoryService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.categoryService.categories$.subscribe(categories => {
      this.categories = categories;
    });
  }

  openAddModal(): void {
    this.editingCategory = null;
    this.formData = {
      name: '',
      icon: '📦',
      color: '#6C757D',
      description: ''
    };
    this.showAddModal = true;
  }

  openEditModal(category: Category): void {
    // Don't allow editing default categories
    const defaultIds = ['food', 'entertainment', 'shopping', 'transport', 'bills', 'health', 'education', 'travel', 'other'];
    if (defaultIds.includes(category.id)) {
      this.toastService.error('Không thể chỉnh sửa danh mục mặc định');
      return;
    }
    this.editingCategory = category;
    this.formData = { ...category };
    this.showAddModal = true;
  }

  closeModal(): void {
    this.showAddModal = false;
    this.editingCategory = null;
  }

  saveCategory(): void {
    if (!this.formData.name || !this.formData.icon) {
      this.toastService.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    if (this.editingCategory) {
      const success = this.categoryService.updateCategory(this.editingCategory.id, {
        name: this.formData.name!,
        icon: this.formData.icon!,
        color: this.formData.color!,
        description: this.formData.description
      });
      if (success) {
        this.toastService.success('Cập nhật danh mục thành công');
      } else {
        this.toastService.error('Không thể cập nhật danh mục');
      }
    } else {
      this.categoryService.addCategory({
        name: this.formData.name!,
        icon: this.formData.icon!,
        color: this.formData.color!,
        description: this.formData.description
      });
      this.toastService.success('Tạo danh mục thành công');
    }

    this.closeModal();
  }

  deleteCategory(id: string): void {
    const defaultIds = ['food', 'entertainment', 'shopping', 'transport', 'bills', 'health', 'education', 'travel', 'other'];
    if (defaultIds.includes(id)) {
      this.toastService.error('Không thể xóa danh mục mặc định');
      return;
    }

    if (confirm('Bạn có chắc chắn muốn xóa danh mục này?')) {
      const success = this.categoryService.deleteCategory(id);
      if (success) {
        this.toastService.success('Xóa danh mục thành công');
      } else {
        this.toastService.error('Không thể xóa danh mục');
      }
    }
  }

  isDefaultCategory(id: string): boolean {
    const defaultIds = ['food', 'entertainment', 'shopping', 'transport', 'bills', 'health', 'education', 'travel', 'other'];
    return defaultIds.includes(id);
  }
}


