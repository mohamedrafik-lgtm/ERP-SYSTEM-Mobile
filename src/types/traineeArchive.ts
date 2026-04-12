export type ArchiveCompletionStatusFilter =
  | 'complete'
  | 'incomplete'
  | 'high'
  | 'medium'
  | 'low';

export interface ArchiveProgramOption {
  id: number;
  nameAr: string;
}

export interface TraineeArchiveOverallStats {
  totalTrainees: number;
  completeTrainees: number;
  incompleteTrainees: number;
  averageCompletion: number;
}

export interface TraineeArchivePagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface TraineeArchiveStat {
  traineeId: number;
  traineeName: string;
  photoUrl?: string | null;
  programName: string;
  totalDocuments: number;
  requiredDocuments: number;
  completionPercentage: number;
  isComplete: boolean;
  verifiedDocuments: number;
}

export interface TraineeDocumentsCompletionStatsResponse {
  overallStats: TraineeArchiveOverallStats;
  traineeStats: TraineeArchiveStat[];
  pagination: TraineeArchivePagination;
}

export interface TraineeDocumentsCompletionStatsFilters {
  programId?: number;
  completionStatus?: ArchiveCompletionStatusFilter;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface DetailedReportDocumentStatus {
  nameAr: string;
  isUploaded: boolean;
  isVerified: boolean;
  uploadedAt: string | null;
  verifiedAt?: string | null;
}

export interface DetailedReportTraineeStat {
  traineeId: number;
  traineeName: string;
  programName: string;
  documentStatuses: Record<string, DetailedReportDocumentStatus>;
  totalDocuments: number;
  requiredDocuments: number;
  verifiedDocuments: number;
  completionPercentage: number;
  isComplete: boolean;
}

export interface TraineeDocumentsDetailedReportResponse {
  overallStats: TraineeArchiveOverallStats;
  traineeStats: DetailedReportTraineeStat[];
  requiredDocumentTypes: string[];
}

export interface TraineeDocumentsDetailedReportFilters {
  programId?: number;
  completionStatus?: ArchiveCompletionStatusFilter;
  search?: string;
  limit?: number;
}

export interface TraineeArchivesBulkDownloadFilters {
  programId?: number;
  documentTypes?: string[];
}
