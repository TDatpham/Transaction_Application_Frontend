import { Component, OnInit, ViewChild } from '@angular/core';
import { ChartConfiguration } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { ApiService } from 'src/app/services/api.service';
import { LoadermodelService } from 'src/app/services/loadermodel.service';
import { ToastService } from 'angular-toastify';
import { CategoryService, Category } from 'src/app/services/category.service';

interface ExpenseStatistics {
  totalDeposits: number;
  totalWithdrawals: number;
  netBalance: number;
  monthlyData: MonthlyExpenseData[];
  dailyData: DailyExpenseData[];
  weeklyData: WeeklyExpenseData[];
  categoryData?: { [key: string]: number };
}

interface MonthlyExpenseData {
  month: string;
  year: number;
  deposits: number;
  withdrawals: number;
  netBalance: number;
  categoryData?: { [key: string]: number };
}

interface DailyExpenseData {
  date: string;
  deposits: number;
  withdrawals: number;
  netBalance: number;
  categoryData?: { [key: string]: number };
}

interface WeeklyExpenseData {
  week: string;
  deposits: number;
  withdrawals: number;
  netBalance: number;
  categoryData?: { [key: string]: number };
}

@Component({
  selector: 'app-expense-management',
  templateUrl: './expense-management.component.html',
  styleUrls: ['./expense-management.component.css'],
})
export class ExpenseManagementComponent implements OnInit {
  @ViewChild(BaseChartDirective) monthlyChart?: BaseChartDirective;
  @ViewChild(BaseChartDirective) dailyChart?: BaseChartDirective;
  @ViewChild(BaseChartDirective) weeklyChart?: BaseChartDirective;
  @ViewChild(BaseChartDirective) pieChart?: BaseChartDirective;
  @ViewChild(BaseChartDirective) categoryChart?: BaseChartDirective;

  statistics: ExpenseStatistics | null = null;
  selectedYear: number = new Date().getFullYear();
  availableYears: number[] = [];
  isLoading: boolean = false;

  // Monthly Bar Chart - Category based
  public monthlyBarChartType: any = 'bar';
  public monthlyBarChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [],
  };
  public monthlyBarChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'top' },
      title: { display: true, text: 'Giao dịch theo danh mục theo tháng' },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  // Daily Line Chart - Category based
  public dailyLineChartType: any = 'line';
  public dailyLineChartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [],
  };
  public dailyLineChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'top' },
      title: { display: true, text: 'Giao dịch theo danh mục theo ngày' },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  // Weekly Line Chart - Category based
  public weeklyLineChartType: any = 'line';
  public weeklyLineChartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [],
  };
  public weeklyLineChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'top' },
      title: { display: true, text: 'Giao dịch theo danh mục theo tuần' },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  // Pie Chart for Overview - Category based
  public pieChartType: any = 'pie';
  public pieChartData: ChartConfiguration<'pie'>['data'] = {
    labels: [],
    datasets: [
      {
        data: [],
        backgroundColor: [],
        borderColor: [],
      },
    ],
  };
  public pieChartOptions: ChartConfiguration<'pie'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'top' },
      title: { display: true, text: 'Tổng quan giao dịch theo danh mục' },
    },
  };

  // Category Pie Chart
  public categoryChartType: any = 'pie';
  public categoryChartData: ChartConfiguration<'pie'>['data'] = {
    labels: [],
    datasets: [
      {
        data: [],
        backgroundColor: [],
        borderColor: [],
      },
    ],
  };
  public categoryChartOptions: ChartConfiguration<'pie'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'top' },
      title: { display: true, text: 'Chi tiêu theo danh mục' },
    },
  };

  categories: Category[] = [];

  constructor(
    private apiService: ApiService,
    private loader: LoadermodelService,
    private toastService: ToastService,
    private categoryService: CategoryService
  ) {}

  ngOnInit(): void {
    this.generateAvailableYears();
    this.loadCategories();
    this.loadExpenseStatistics();
  }

  loadCategories(): void {
    this.categoryService.categories$.subscribe(categories => {
      this.categories = categories;
    });
  }

  generateAvailableYears(): void {
    const currentYear = new Date().getFullYear();
    for (let i = currentYear; i >= currentYear - 5; i--) {
      this.availableYears.push(i);
    }
  }

  loadExpenseStatistics(): void {
    this.isLoading = true;
    this.loader.show('Đang tải thống kê...');

    this.apiService.getExpenseStatistics(this.selectedYear).subscribe({
      next: (data: ExpenseStatistics) => {
        this.statistics = data;
        this.updateCharts();
        this.isLoading = false;
        this.loader.hide();
      },
      error: (error: any) => {
        console.error('Error loading expense statistics:', error);
        this.toastService.error('Không thể tải thống kê chi tiêu');
        this.isLoading = false;
        this.loader.hide();
      },
    });
  }

  onYearChange(): void {
    this.loadExpenseStatistics();
  }

  updateCharts(): void {
    if (!this.statistics) return;

    // Update Pie Chart - Category based
    if (this.statistics.categoryData && Object.keys(this.statistics.categoryData).length > 0) {
      const categoryEntries = Object.entries(this.statistics.categoryData);
      categoryEntries.sort((a, b) => b[1] - a[1]); // Sort by amount descending
      
      // Show top 8 categories
      const topCategories = categoryEntries.slice(0, 8);
      
      this.pieChartData.labels = topCategories.map(([categoryId]) => {
        const category = this.categories.find(c => c.id === categoryId);
        return category ? `${category.icon} ${category.name}` : categoryId;
      });
      
      this.pieChartData.datasets[0].data = topCategories.map(([, amount]) => amount);
      
      const colors = topCategories.map(([categoryId]) => {
        const category = this.categories.find(c => c.id === categoryId);
        return category ? category.color : '#6C757D';
      });
      
      this.pieChartData.datasets[0].backgroundColor = colors.map(color => color + '80');
      this.pieChartData.datasets[0].borderColor = colors;
    } else {
      // Fallback: show empty chart
      this.pieChartData.labels = ['Chưa có dữ liệu'];
      this.pieChartData.datasets[0].data = [0];
      this.pieChartData.datasets[0].backgroundColor = ['rgba(200, 200, 200, 0.6)'];
      this.pieChartData.datasets[0].borderColor = ['rgba(200, 200, 200, 1)'];
    }
    this.pieChart?.update();

    // Update Monthly Bar Chart - Category based
    if (this.statistics.monthlyData && this.statistics.monthlyData.length > 0) {
      this.updateMonthlyCategoryChart();
    }

    // Update Daily Line Chart - Category based (show last 30 days or all if less)
    if (this.statistics.dailyData && this.statistics.dailyData.length > 0) {
      this.updateDailyCategoryChart();
    }

    // Update Weekly Line Chart - Category based
    if (this.statistics.weeklyData && this.statistics.weeklyData.length > 0) {
      this.updateWeeklyCategoryChart();
    }

    // Update Category Chart
    if (this.statistics.categoryData && Object.keys(this.statistics.categoryData).length > 0) {
      const categoryEntries = Object.entries(this.statistics.categoryData);
      categoryEntries.sort((a, b) => b[1] - a[1]); // Sort by amount descending
      
      this.categoryChartData.labels = categoryEntries.map(([categoryId]) => {
        const category = this.categories.find(c => c.id === categoryId);
        return category ? `${category.icon} ${category.name}` : categoryId;
      });
      
      this.categoryChartData.datasets[0].data = categoryEntries.map(([, amount]) => amount);
      
      const colors = categoryEntries.map(([categoryId]) => {
        const category = this.categories.find(c => c.id === categoryId);
        return category ? category.color : '#6C757D';
      });
      
      this.categoryChartData.datasets[0].backgroundColor = colors.map(color => color + '80'); // Add alpha
      this.categoryChartData.datasets[0].borderColor = colors;
      
      this.categoryChart?.update();
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  }

  getCategoryEntries(): Array<{key: string, value: number}> {
    if (!this.statistics?.categoryData) {
      return [];
    }
    return Object.entries(this.statistics.categoryData)
      .map(([key, value]) => ({ key, value }))
      .sort((a, b) => b.value - a.value);
  }

  getCategoryName(categoryId: string): string {
    const category = this.categories.find(c => c.id === categoryId);
    return category ? `${category.icon} ${category.name}` : categoryId;
  }

  hasCategoryData(): boolean {
    return this.statistics?.categoryData != null && Object.keys(this.statistics.categoryData).length > 0;
  }

  getTotalCategoryAmount(): number {
    if (!this.statistics?.categoryData) {
      return 0;
    }
    return Object.values(this.statistics.categoryData).reduce((sum, amount) => sum + amount, 0);
  }

  getTopCategories(count: number = 6): Array<{category: Category, amount: number}> {
    if (!this.statistics?.categoryData) {
      return [];
    }
    
    const entries = Object.entries(this.statistics.categoryData)
      .map(([categoryId, amount]) => {
        const category = this.categories.find(c => c.id === categoryId);
        return { category: category || null, amount, categoryId };
      })
      .filter(entry => entry.category !== null)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, count)
      .map(entry => ({ category: entry.category!, amount: entry.amount }));
    
    return entries;
  }

  getMonthlyCategoryTotal(month: MonthlyExpenseData): number {
    if (!month.categoryData) {
      return 0;
    }
    return Object.values(month.categoryData).reduce((sum, amount) => sum + amount, 0);
  }

  private updateMonthlyCategoryChart(): void {
    const statistics = this.statistics;
    if (!statistics?.monthlyData) {
      this.monthlyBarChartData.labels = [];
      this.monthlyBarChartData.datasets = [];
      this.monthlyChart?.update();
      return;
    }

    // Get all unique categories from monthly data
    const allCategories = new Set<string>();
    statistics.monthlyData.forEach(month => {
      if (month.categoryData) {
        Object.keys(month.categoryData).forEach(cat => allCategories.add(cat));
      }
    });

    if (allCategories.size === 0) {
      // No category data, show empty chart
      this.monthlyBarChartData.labels = statistics.monthlyData.map((m) => m.month);
      this.monthlyBarChartData.datasets = [];
      this.monthlyChart?.update();
      return;
    }

    // Get top categories by total amount
    const categoryTotals = new Map<string, number>();
    allCategories.forEach(catId => {
      let total = 0;
      statistics.monthlyData.forEach(month => {
        if (month.categoryData && month.categoryData[catId]) {
          total += month.categoryData[catId];
        }
      });
      categoryTotals.set(catId, total);
    });

    const topCategories = Array.from(categoryTotals.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([catId]) => catId);

    this.monthlyBarChartData.labels = statistics.monthlyData.map((m) => `${m.month} ${m.year}`);
    this.monthlyBarChartData.datasets = topCategories.map(catId => {
      const category = this.categories.find(c => c.id === catId);
      const color = category?.color || '#6C757D';
      return {
        data: statistics.monthlyData.map(month => 
          month.categoryData && month.categoryData[catId] ? month.categoryData[catId] : 0
        ),
        label: category ? `${category.icon} ${category.name}` : catId,
        backgroundColor: color + '80',
        borderColor: color,
      };
    });
    this.monthlyChart?.update();
  }

  private updateDailyCategoryChart(): void {
    const statistics = this.statistics;
    if (!statistics?.dailyData) {
      this.dailyLineChartData.labels = [];
      this.dailyLineChartData.datasets = [];
      this.dailyChart?.update();
      return;
    }

    const recentDailyData = statistics.dailyData.slice(-30);
    
    // Get all unique categories from daily data
    const allCategories = new Set<string>();
    recentDailyData.forEach(day => {
      if (day.categoryData) {
        Object.keys(day.categoryData).forEach(cat => allCategories.add(cat));
      }
    });

    if (allCategories.size === 0) {
      // No category data, show empty chart
      this.dailyLineChartData.labels = recentDailyData.map((d) => {
        const date = new Date(d.date);
        return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
      });
      this.dailyLineChartData.datasets = [];
      this.dailyChart?.update();
      return;
    }

    // Get top categories by total amount
    const categoryTotals = new Map<string, number>();
    allCategories.forEach(catId => {
      let total = 0;
      recentDailyData.forEach(day => {
        if (day.categoryData && day.categoryData[catId]) {
          total += day.categoryData[catId];
        }
      });
      categoryTotals.set(catId, total);
    });

    const topCategories = Array.from(categoryTotals.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([catId]) => catId);

    this.dailyLineChartData.labels = recentDailyData.map((d) => {
      const date = new Date(d.date);
      return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    });
    this.dailyLineChartData.datasets = topCategories.map(catId => {
      const category = this.categories.find(c => c.id === catId);
      const color = category?.color || '#6C757D';
      return {
        data: recentDailyData.map(day => 
          day.categoryData && day.categoryData[catId] ? day.categoryData[catId] : 0
        ),
        label: category ? `${category.icon} ${category.name}` : catId,
        borderColor: color,
        backgroundColor: color + '33',
        fill: true,
      };
    });
    this.dailyChart?.update();
  }

  private updateWeeklyCategoryChart(): void {
    const statistics = this.statistics;
    if (!statistics?.weeklyData) {
      this.weeklyLineChartData.labels = [];
      this.weeklyLineChartData.datasets = [];
      this.weeklyChart?.update();
      return;
    }

    // Get all unique categories from weekly data
    const allCategories = new Set<string>();
    statistics.weeklyData.forEach(week => {
      if (week.categoryData) {
        Object.keys(week.categoryData).forEach(cat => allCategories.add(cat));
      }
    });

    if (allCategories.size === 0) {
      // No category data, show empty chart
      this.weeklyLineChartData.labels = statistics.weeklyData.map((w) => w.week);
      this.weeklyLineChartData.datasets = [];
      this.weeklyChart?.update();
      return;
    }

    // Get top categories by total amount
    const categoryTotals = new Map<string, number>();
    allCategories.forEach(catId => {
      let total = 0;
      statistics.weeklyData.forEach(week => {
        if (week.categoryData && week.categoryData[catId]) {
          total += week.categoryData[catId];
        }
      });
      categoryTotals.set(catId, total);
    });

    const topCategories = Array.from(categoryTotals.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([catId]) => catId);

    this.weeklyLineChartData.labels = statistics.weeklyData.map((w) => w.week);
    this.weeklyLineChartData.datasets = topCategories.map(catId => {
      const category = this.categories.find(c => c.id === catId);
      const color = category?.color || '#6C757D';
      return {
        data: statistics.weeklyData.map(week => 
          week.categoryData && week.categoryData[catId] ? week.categoryData[catId] : 0
        ),
        label: category ? `${category.icon} ${category.name}` : catId,
        borderColor: color,
        backgroundColor: color + '33',
        fill: true,
      };
    });
    this.weeklyChart?.update();
  }
}
