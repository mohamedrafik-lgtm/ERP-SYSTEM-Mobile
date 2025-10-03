// Types for trainee distribution

export enum DistributionType {
  THEORY = 'THEORY',
  PRACTICAL = 'PRACTICAL',
}

export interface CreateTraineeDistributionRequest {
  programId: number;          // معرف البرنامج التدريبي
  type: DistributionType;     // THEORY أو PRACTICAL
  numberOfRooms: number;      // >= 1
}

export interface CreateTraineeDistributionResponse {
  id: number;
  programId: number;
  type: DistributionType;
  numberOfRooms: number;
  createdAt: string;
}

// Response types for viewing distribution details
export interface DistributionProgram {
  id: number;
  nameAr: string;
  nameEn: string;
}

export interface TraineeInfo {
  id: string;
  nameAr: string;
  nameEn: string;
  nationalId: string | null;
  phone: string | null;
  email: string | null;
}

export interface AssignmentInfo {
  id: string;
  traineeId: string;
  orderNumber: number;
  notes: string | null;
  trainee: TraineeInfo;
}

export interface RoomInfo {
  id: string;
  roomName: string;
  roomNumber: number;
  capacity: number;
  assignments: AssignmentInfo[];  // المتدربين في هذه القاعة
}

export interface TraineeDistributionDetail {
  id: string;
  programId: number;
  type: DistributionType;
  academicYear: string;
  numberOfRooms: number;
  createdAt: string;  // ISO date
  updatedAt: string; // ISO date
  program: ProgramInfo;
  rooms: RoomInfo[];
}

// Types for distribution summaries
export interface ProgramInfo {
  id: number;
  nameAr: string;
  nameEn: string;
}

export interface RoomSummary {
  id: string;
  roomName: string;
  roomNumber: number;
  capacity: number;
  _count: {
    assignments: number;  // عدد المتدربين في القاعة
  };
}

export interface DistributionSummary {
  id: string;
  programId: number;
  type: DistributionType;
  academicYear: string;
  numberOfRooms: number;
  createdAt: string;  // ISO date
  updatedAt: string; // ISO date
  program: ProgramInfo;
  rooms: RoomSummary[];
  _count: {
    rooms: number;  // إجمالي عدد القاعات
  };
}

// الاستجابة تكون array من DistributionSummary
export type TraineeDistributionsResponse = DistributionSummary[];


