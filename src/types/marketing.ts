export type MarketingEmployeesResponse = MarketingEmployeeItem[];

export interface MarketingEmployeeItem {
  id: number;
  name: string;
  phone: string;
  email?: string | null;
  isActive: boolean;
  totalApplications: number;
  createdAt: string;
  updatedAt: string;
  marketingTargets: MarketingTarget[];
  _count: {
    trainees: number;
  };
  totalAssignedTrainees: number;
}

export interface MarketingTarget {
  id: number;
  employeeId: number;
  month: number;
  year: number;
  targetAmount: number;
  achievedAmount: number;
  notes?: string | null;
  setById?: string | null;
  setAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMarketingEmployeeRequest {
  name: string;
  phone: string;
  email?: string | null;
  isActive?: boolean;
}

export interface UpdateMarketingEmployeeRequest {
  name?: string;
  phone?: string;
  email?: string | null;
  isActive?: boolean;
}


