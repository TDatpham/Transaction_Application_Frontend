import { Component, OnInit } from '@angular/core';
import { BudgetService, Budget, BudgetAlert } from 'src/app/services/budget.service';
import { CategoryService, Category } from 'src/app/services/category.service';
import { NotificationService } from 'src/app/services/notification.service';
import { ApiService } from 'src/app/services/api.service';
import { ToastService } from 'angular-toastify';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-budget-management',
  templateUrl: './budget-management.component.html',
  styleUrls: ['./budget-management.component.css']
})
export class BudgetManagementComponent implements OnInit {
  budgets: Budget[] = [];
  categories: Category[] = [];
  alerts: BudgetAlert[] = [];
  showAddModal: boolean = false;
  editingBudget: Budget | null = null;

  // Form data
  formData: Partial<Budget> = {
    categoryId: '',
    amount: 0,
    period: 'monthly',
    startDate: new Date(),
    alertThreshold: 80,
    isActive: true
  };

  startDateString: string = '';

  get formattedStartDate(): string {
    if (this.startDateString) return this.startDateString;
    if (!this.formData.startDate) return '';
    const date = new Date(this.formData.startDate);
    return date.toISOString().split('T')[0];
  }

  periods = [
    { value: 'daily', label: 'Hàng ngày' },
    { value: 'weekly', label: 'Hàng tuần' },
    { value: 'monthly', label: 'Hàng tháng' },
    { value: 'yearly', label: 'Hàng năm' }
  ];

  constructor(
    private budgetService: BudgetService,
    private categoryService: CategoryService,
    private notificationService: NotificationService,
    private apiService: ApiService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadBudgets();
    this.loadCategories();
    this.checkBudgetAlerts();
  }

  loadBudgets(): void {
    this.budgetService.budgets$.subscribe(budgets => {
      this.budgets = budgets;
      this.checkBudgetAlerts();
    });
  }

  loadCategories(): void {
    this.categoryService.categories$.subscribe(categories => {
      this.categories = categories;
    });
  }

  async checkBudgetAlerts(): Promise<void> {
    try {
      // Get transactions to calculate spending by category
      const transactions = await firstValueFrom(this.apiService.getTransactions());
      const spentByCategory = this.calculateSpendingByCategory(transactions || []);
      this.alerts = this.budgetService.checkBudgetAlerts(spentByCategory);

      // Create notifications for alerts
      this.alerts.forEach(alert => {
        if (alert.status === 'exceeded') {
          this.notificationService.addNotification({
            type: 'budget_alert',
            title: 'Vượt ngân sách!',
            message: `Bạn đã vượt ngân sách cho ${alert.categoryName}. Đã chi: ${this.formatCurrency(alert.spentAmount)} / ${this.formatCurrency(alert.budgetAmount)}`,
            actionUrl: '/account/budget-management'
          });
        } else if (alert.percentage >= 90) {
          this.notificationService.addNotification({
            type: 'warning',
            title: 'Cảnh báo ngân sách',
            message: `Bạn đã sử dụng ${alert.percentage.toFixed(0)}% ngân sách cho ${alert.categoryName}`,
            actionUrl: '/account/budget-management'
          });
        }
      });
    } catch (error) {
      console.error('Error checking budget alerts:', error);
    }
  }

  private calculateSpendingByCategory(transactions: any[]): Map<string, number> {
    const spent = new Map<string, number>();
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    transactions.forEach(txn => {
      if (txn.transactionType === 'CASH_WITHDRAWAL' && txn.categoryId) {
        const txnDate = new Date(txn.transactionDate);
        if (txnDate.getMonth() === currentMonth && txnDate.getFullYear() === currentYear) {
          const current = spent.get(txn.categoryId) || 0;
          spent.set(txn.categoryId, current + txn.amount);
        }
      }
    });

    return spent;
  }

  openAddModal(): void {
    this.editingBudget = null;
    const today = new Date();
    this.startDateString = today.toISOString().split('T')[0];
    this.formData = {
      categoryId: '',
      amount: 0,
      period: 'monthly',
      startDate: today,
      alertThreshold: 80,
      isActive: true
    };
    this.showAddModal = true;
  }

  openEditModal(budget: Budget): void {
    this.editingBudget = budget;
    this.formData = { ...budget };
    if (budget.startDate) {
      this.startDateString = new Date(budget.startDate).toISOString().split('T')[0];
    }
    this.showAddModal = true;
  }

  closeModal(): void {
    this.showAddModal = false;
    this.editingBudget = null;
  }

  saveBudget(): void {
    if (!this.formData.categoryId || !this.formData.amount || !this.formData.period) {
      this.toastService.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    const category = this.categories.find(c => c.id === this.formData.categoryId);
    if (!category) {
      this.toastService.error('Danh mục không hợp lệ');
      return;
    }

    const startDate = this.startDateString ? new Date(this.startDateString) : (this.formData.startDate || new Date());
    const budgetData: Omit<Budget, 'id'> = {
      categoryId: this.formData.categoryId!,
      categoryName: category.name,
      amount: this.formData.amount!,
      period: this.formData.period!,
      startDate: startDate,
      alertThreshold: this.formData.alertThreshold || 80,
      isActive: this.formData.isActive ?? true
    };

    if (this.editingBudget) {
      this.budgetService.updateBudget(this.editingBudget.id!, budgetData);
      this.toastService.success('Cập nhật ngân sách thành công');
    } else {
      this.budgetService.createBudget(budgetData);
      this.toastService.success('Tạo ngân sách thành công');
    }

    this.closeModal();
  }

  deleteBudget(id: string): void {
    if (confirm('Bạn có chắc chắn muốn xóa ngân sách này?')) {
      this.budgetService.deleteBudget(id);
      this.toastService.success('Xóa ngân sách thành công');
    }
  }

  toggleBudgetActive(budget: Budget): void {
    this.budgetService.updateBudget(budget.id!, { isActive: !budget.isActive });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  }

  getPeriodLabel(period: string): string {
    return this.periods.find(p => p.value === period)?.label || period;
  }

  getAlertStatusClass(status: string): string {
    return status === 'exceeded' 
      ? 'bg-red-100 text-red-800 border-red-300' 
      : 'bg-yellow-100 text-yellow-800 border-yellow-300';
  }

  getPercentageWidth(percentage: number): number {
    return Math.min(percentage, 100);
  }
}

