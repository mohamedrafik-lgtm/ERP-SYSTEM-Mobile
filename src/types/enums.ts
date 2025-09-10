export enum EnrollmentType {
  REGULAR = 'REGULAR',
  DISTANCE = 'DISTANCE',
  BOTH = 'BOTH',
}

export enum MaritalStatus {
  SINGLE = 'SINGLE',
  MARRIED = 'MARRIED',
  DIVORCED = 'DIVORCED',
  WIDOWED = 'WIDOWED',
}

export enum ProgramType {
  SUMMER = 'SUMMER',
  WINTER = 'WINTER',
  ANNUAL = 'ANNUAL',
}

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
}

export enum Religion {
  ISLAM = 'ISLAM',
  CHRISTIANITY = 'CHRISTIANITY',
  JUDAISM = 'JUDAISM'
}

export enum EducationType {
  PREPARATORY = 'PREPARATORY',
  INDUSTRIAL_SECONDARY = 'INDUSTRIAL_SECONDARY',
  COMMERCIAL_SECONDARY = 'COMMERCIAL_SECONDARY',
  AGRICULTURAL_SECONDARY = 'AGRICULTURAL_SECONDARY',
  AZHAR_SECONDARY = 'AZHAR_SECONDARY',
  GENERAL_SECONDARY = 'GENERAL_SECONDARY',
  UNIVERSITY = 'UNIVERSITY',
  INDUSTRIAL_APPRENTICESHIP = 'INDUSTRIAL_APPRENTICESHIP',
  SECONDARY = 'SECONDARY',
}

export enum TraineeStatus {
  NEW = 'NEW',
  CURRENT = 'CURRENT',
  GRADUATE = 'GRADUATE',
  WITHDRAWN = 'WITHDRAWN',
  CONTINUING = 'CONTINUING'
}

export enum ClassLevel {
  FIRST = 'FIRST',
  SECOND = 'SECOND',
  THIRD = 'THIRD',
  FOURTH = 'FOURTH'
}

// Arabic translations for display

export const EnrollmentTypeArabic: Record<EnrollmentType, string> = {
  [EnrollmentType.REGULAR]: 'نظامي',
  [EnrollmentType.DISTANCE]: 'انتساب',
  [EnrollmentType.BOTH]: 'كلاهما'
};

export const MaritalStatusArabic: Record<MaritalStatus, string> = {
  [MaritalStatus.SINGLE]: 'أعزب',
  [MaritalStatus.MARRIED]: 'متزوج',
  [MaritalStatus.DIVORCED]: 'مطلق',
  [MaritalStatus.WIDOWED]: 'أرمل'
};

export const ProgramTypeArabic: Record<ProgramType, string> = {
  [ProgramType.SUMMER]: 'صيفي',
  [ProgramType.WINTER]: 'شتوي',
  [ProgramType.ANNUAL]: 'سنوي'
};

export const GenderArabic: Record<Gender, string> = {
  [Gender.MALE]: 'ذكر',
  [Gender.FEMALE]: 'أنثى'
};

export const ReligionArabic: Record<Religion, string> = {
  [Religion.ISLAM]: 'مسلم',
  [Religion.CHRISTIANITY]: 'مسيحي',
  [Religion.JUDAISM]: 'يهودي'
};

export const EducationTypeArabic: Record<EducationType, string> = {
  [EducationType.PREPARATORY]: 'إعدادية',
  [EducationType.INDUSTRIAL_SECONDARY]: 'ثانوية صناعية',
  [EducationType.COMMERCIAL_SECONDARY]: 'ثانوية تجارية',
  [EducationType.AGRICULTURAL_SECONDARY]: 'ثانوية زراعية',
  [EducationType.AZHAR_SECONDARY]: 'ثانوية أزهرية',
  [EducationType.GENERAL_SECONDARY]: 'ثانوية عامة',
  [EducationType.UNIVERSITY]: 'جامعي',
  [EducationType.INDUSTRIAL_APPRENTICESHIP]: 'تدريب صناعي',
  [EducationType.SECONDARY]: 'ثانوي'
};

export const TraineeStatusArabic: Record<TraineeStatus, string> = {
  [TraineeStatus.NEW]: 'جديد',
  [TraineeStatus.CURRENT]: 'حالي',
  [TraineeStatus.GRADUATE]: 'خريج',
  [TraineeStatus.WITHDRAWN]: 'منسحب',
  [TraineeStatus.CONTINUING]: 'مستمر'
};

export const ClassLevelArabic: Record<ClassLevel, string> = {
  [ClassLevel.FIRST]: 'الأول',
  [ClassLevel.SECOND]: 'الثاني',
  [ClassLevel.THIRD]: 'الثالث',
  [ClassLevel.FOURTH]: 'الرابع'
};

export enum ISemester {
  FIRST = 'FIRST',
  SECOND = 'SECOND'
}

export const ISemesterArabic: Record<ISemester, string> = {
  [ISemester.FIRST]: 'الفصل الدراسي الأول',
  [ISemester.SECOND]: 'الفصل الدراسي الثاني'
};

export enum Year {
  FIRST = 'FIRST',
  SECOND = 'SECOND',
  THIRD = 'THIRD',
  FOURTH = 'FOURTH'
}

export const YearArabic: Record<Year, string> = {
  [Year.FIRST]: 'السنة الأولى',
  [Year.SECOND]: 'السنة الثانية',
  [Year.THIRD]: 'السنة الثالثة',
  [Year.FOURTH]: 'السنة الرابعة'
};

// Additional enums from API
export enum SessionType {
  THEORY = 'THEORY',
  PRACTICAL = 'PRACTICAL'
}

export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  LATE = 'LATE',
  EXCUSED = 'EXCUSED'
}

export const SessionTypeArabic: Record<SessionType, string> = {
  [SessionType.THEORY]: 'نظري',
  [SessionType.PRACTICAL]: 'عملي'
};

export const AttendanceStatusArabic: Record<AttendanceStatus, string> = {
  [AttendanceStatus.PRESENT]: 'حاضر',
  [AttendanceStatus.ABSENT]: 'غائب',
  [AttendanceStatus.LATE]: 'متأخر',
  [AttendanceStatus.EXCUSED]: 'معذور'
};