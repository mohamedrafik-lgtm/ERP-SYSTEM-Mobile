export enum LectureType {
  VIDEO = 'VIDEO',
  PDF = 'PDF',
  BOTH = 'BOTH',
}

export interface CreateLectureRequest {
  title: string;
  description?: string;
  type: LectureType;
  chapter: number;
  youtubeUrl?: string;
  pdfFile?: string;
  order: number;
  contentId: number;
}

export type UpdateLectureRequest = Partial<CreateLectureRequest>;

export interface LectureResponse {
  id: number;
  title: string;
  description?: string;
  type: LectureType;
  chapter: number;
  youtubeUrl?: string;
  pdfFile?: string;
  order: number;
  contentId: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface LectureContentBrief {
  id: number;
  name: string;
  code: string;
}

export interface LectureListItem {
  id: number;
  title: string;
  description?: string | null;
  type: LectureType;
  chapter: number;
  youtubeUrl?: string | null;
  pdfFile?: string | null;
  order: number;
  contentId: number;
  createdAt: string;
  updatedAt: string;
  content: LectureContentBrief;
}

