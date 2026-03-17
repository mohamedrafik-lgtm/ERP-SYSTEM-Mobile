import React, { useState, useEffect } from 'react';
import { StatusBar, useColorScheme, View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import withPermissionGuard from './src/components/withPermissionGuard';
import LoginTypeSelectionScreen from './src/screens/LoginTypeSelectionScreen';
import { hasLoginType } from './src/screens/LoginTypeSelectionScreen';
import TestLogin from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import ProgramsScreen from './src/screens/ProgramsScreen';
import AddProgramScreen from './src/screens/AddProgramScreen';
import EditProgramScreen from './src/screens/EditProgramScreen';
import StudentsListScreen from './src/screens/StudentsListScreen';
import TraineeTransferScreen from './src/screens/TraineeTransferScreen';
import AddStudentScreen from './src/screens/AddStudentScreen';
import AddTrainingContentScreen from './src/screens/AddTrainingContentScreen';
import TrainingContentsScreen from './src/screens/TrainingContentsScreen';
import EditTrainingContentScreen from './src/screens/EditTrainingContentScreen';
import QuestionsScreen from './src/screens/QuestionsScreen';
import AddQuestionScreen from './src/screens/AddQuestionScreen';
import TreasuryScreen from './src/screens/TreasuryScreen';
import AddTreasuryScreen from './src/screens/AddTreasuryScreen';
import AddTransactionScreen from './src/screens/AddTransactionScreen';
import FeesScreen from './src/screens/FeesScreen';
import AddFeeScreen from './src/screens/AddFeeScreen';
import TraineePaymentsScreen from './src/screens/TraineePaymentsScreen';
import TraineePaymentDetailsScreen from './src/screens/TraineePaymentDetailsScreen';
import FinancialReportsScreen from './src/screens/FinancialReportsScreen';
import PaymentSchedulesScreen from './src/screens/PaymentSchedulesScreen';
import PaymentScheduleDetailsScreen from './src/screens/PaymentScheduleDetailsScreen';
import AddPaymentScheduleScreen from './src/screens/AddPaymentScheduleScreen';
import PaymentDeferralRequestsScreen from './src/screens/PaymentDeferralRequestsScreen';
import FreeRequestsScreen from './src/screens/FreeRequestsScreen';
import RequestsSettingsScreen from './src/screens/RequestsSettingsScreen';
import PermissionsScreen from './src/screens/PermissionsScreen';
import RoleDetailsScreen from './src/screens/RoleDetailsScreen';
import AddPermissionScreen from './src/screens/AddPermissionScreen';
import CreateEditRoleScreen from './src/screens/CreateEditRoleScreen';
import ManageRolePermissionsScreen from './src/screens/ManageRolePermissionsScreen';
import AddUserScreen from './src/screens/AddUserScreen';
import UsersListScreen from './src/screens/UsersListScreen';
import EditUserScreen from './src/screens/EditUserScreen';
import MarketersScreen from './src/screens/MarketersScreen';
import AddMarketerScreen from './src/screens/AddMarketerScreen';
import EditMarketerScreen from './src/screens/EditMarketerScreen';
import TargetSettingScreen from './src/screens/TargetSettingScreen';
import MarketingTraineesScreen from './src/screens/MarketingTraineesScreen';
import EmployeeTraineesScreen from './src/screens/EmployeeTraineesScreen';
import MarketingStatsScreen from './src/screens/MarketingStatsScreen';
import WhatsAppManagementScreen from './src/screens/WhatsAppManagementScreen';
import EditTraineeScreen from './src/screens/EditTraineeScreen';
import TraineeDocumentsScreen from './src/screens/TraineeDocumentsScreen';
import LecturesScreen from './src/screens/LecturesScreen';
import AddLectureScreen from './src/screens/AddLectureScreen';
import EditLectureScreen from './src/screens/EditLectureScreen';
import PdfViewerScreen from './src/screens/PdfViewerScreen';
import YouTubeViewerScreen from './src/screens/YouTubeViewerScreen';
import DistributionManagementScreen from './src/screens/DistributionManagementScreen';
import AddDistributionScreen from './src/screens/AddDistributionScreen';
import DistributionDetailsScreen from './src/screens/DistributionDetailsScreen';
import ProgramDistributionsScreen from './src/screens/ProgramDistributionsScreen';
import QuizManagementScreen from './src/screens/QuizManagementScreen';
import QuizReportsScreen from './src/screens/QuizReportsScreen';
import PaperExamsScreen from './src/screens/PaperExamsScreen';
import AddPaperExamScreen from './src/screens/AddPaperExamScreen';
import PaperExamDetailsScreen from './src/screens/PaperExamDetailsScreen';
import EditPaperExamScreen from './src/screens/EditPaperExamScreen';
import ControlSystemScreen from './src/screens/ControlSystemScreen';
import GradeReleaseScreen from './src/screens/GradeReleaseScreen';
import AddQuizScreen from './src/screens/AddQuizScreen';
import QuizDetailsScreen from './src/screens/QuizDetailsScreen';
import EditQuizScreen from './src/screens/EditQuizScreen';
import QuizReportScreen from './src/screens/QuizReportScreen';
import QuizAttemptDetailsScreen from './src/screens/QuizAttemptDetailsScreen';
import TraineeAccountsScreen from './src/screens/TraineeAccountsScreen';
import TraineeAccountDetailsScreen from './src/screens/TraineeAccountDetailsScreen';
import ScheduleScreen from './src/screens/ScheduleScreen';
import SemesterSelectionScreen from './src/screens/SemesterSelectionScreen';
import ScheduleDetailsScreen from './src/screens/ScheduleDetailsScreen';
import TraineeGradesScreen from './src/screens/TraineeGradesScreen';
import BulkUploadGradesScreen from './src/screens/BulkUploadGradesScreen';
import TraineeGradeDetailsScreen from './src/screens/TraineeGradeDetailsScreen';
import SecondRoundStudentsScreen from './src/screens/SecondRoundStudentsScreen';
import MercyGradesScreen from './src/screens/MercyGradesScreen';
import GradeReportsScreen from './src/screens/GradeReportsScreen';
import GradeSettingsScreen from './src/screens/GradeSettingsScreen';
import BranchSelectionScreen from './src/screens/BranchSelectionScreen';
import AcademicSuppliesScreen from './src/screens/AcademicSuppliesScreen';
import DeliveryTrackingScreen from './src/screens/DeliveryTrackingScreen';
import DeliveryTrackingMaterialScreen from './src/screens/DeliveryTrackingMaterialScreen';
import AddStudyMaterialScreen from './src/screens/AddStudyMaterialScreen';
import StaffAttendanceScreen from './src/screens/StaffAttendanceScreen';
import StaffAttendanceLogsScreen from './src/screens/StaffAttendanceLogsScreen';
import StaffLeaveRequestsScreen from './src/screens/StaffLeaveRequestsScreen';
import StaffAttendanceSettingsScreen from './src/screens/StaffAttendanceSettingsScreen';
import StaffAttendanceEmployeesScreen from './src/screens/StaffAttendanceEmployeesScreen';
import StaffAttendanceEmployeeDetailScreen from './src/screens/StaffAttendanceEmployeeDetailScreen';
import AuthService from './src/services/AuthService';
import BranchService from './src/services/BranchService';
import { enableScreens } from 'react-native-screens';
enableScreens();

// ==================== حماية الشاشات بالصلاحيات ====================
const GuardedPrograms = withPermissionGuard(ProgramsScreen, 'Programs');
const GuardedAddProgram = withPermissionGuard(AddProgramScreen, 'AddProgram');
const GuardedEditProgram = withPermissionGuard(EditProgramScreen, 'EditProgram');
const GuardedStudentsList = withPermissionGuard(StudentsListScreen, 'StudentsList');
const GuardedTraineeTransfer = withPermissionGuard(TraineeTransferScreen, 'TraineeTransfer');
const GuardedAddStudent = withPermissionGuard(AddStudentScreen, 'AddStudent');
const GuardedEditTrainee = withPermissionGuard(EditTraineeScreen, 'EditTrainee');
const GuardedTraineeDocuments = withPermissionGuard(TraineeDocumentsScreen, 'TraineeDocuments');
const GuardedUsersList = withPermissionGuard(UsersListScreen, 'UsersList');
const GuardedAddUser = withPermissionGuard(AddUserScreen, 'AddUser');
const GuardedEditUser = withPermissionGuard(EditUserScreen, 'EditUser');
const GuardedTrainingContents = withPermissionGuard(TrainingContentsScreen, 'TrainingContents');
const GuardedAddTrainingContent = withPermissionGuard(AddTrainingContentScreen, 'AddTrainingContent');
const GuardedEditTrainingContent = withPermissionGuard(EditTrainingContentScreen, 'EditTrainingContent');
const GuardedLectures = withPermissionGuard(LecturesScreen, 'Lectures');
const GuardedAddLecture = withPermissionGuard(AddLectureScreen, 'AddLecture');
const GuardedEditLecture = withPermissionGuard(EditLectureScreen, 'EditLecture');
const GuardedDistributionManagement = withPermissionGuard(DistributionManagementScreen, 'DistributionManagement');
const GuardedAddDistribution = withPermissionGuard(AddDistributionScreen, 'AddDistribution');
const GuardedDistributionDetails = withPermissionGuard(DistributionDetailsScreen, 'DistributionDetails');
const GuardedProgramDistributions = withPermissionGuard(ProgramDistributionsScreen, 'ProgramDistributions');
const GuardedQuestions = withPermissionGuard(QuestionsScreen, 'Questions');
const GuardedAddQuestion = withPermissionGuard(AddQuestionScreen, 'AddQuestion');
const GuardedQuizManagement = withPermissionGuard(QuizManagementScreen, 'QuizManagement');
const GuardedQuizReports = withPermissionGuard(QuizReportsScreen, 'QuizReports');
const GuardedPaperExams = withPermissionGuard(PaperExamsScreen, 'PaperExams');
const GuardedAddPaperExam = withPermissionGuard(AddPaperExamScreen, 'AddPaperExam');
const GuardedPaperExamDetails = withPermissionGuard(PaperExamDetailsScreen, 'PaperExamDetails');
const GuardedEditPaperExam = withPermissionGuard(EditPaperExamScreen, 'EditPaperExam');
const GuardedControlSystem = withPermissionGuard(ControlSystemScreen, 'ControlSystem');
const GuardedGradeRelease = withPermissionGuard(GradeReleaseScreen, 'GradeRelease');
const GuardedAddQuiz = withPermissionGuard(AddQuizScreen, 'AddQuiz');
const GuardedQuizDetails = withPermissionGuard(QuizDetailsScreen, 'QuizDetails');
const GuardedEditQuiz = withPermissionGuard(EditQuizScreen, 'EditQuiz');
const GuardedQuizReport = withPermissionGuard(QuizReportScreen, 'QuizReport');
const GuardedQuizAttemptDetails = withPermissionGuard(QuizAttemptDetailsScreen, 'QuizAttemptDetails');
const GuardedTraineeAccounts = withPermissionGuard(TraineeAccountsScreen, 'TraineeAccounts');
const GuardedTraineeAccountDetails = withPermissionGuard(TraineeAccountDetailsScreen, 'TraineeAccountDetails');
const GuardedSchedules = withPermissionGuard(ScheduleScreen, 'Schedules');
const GuardedSemesterSelection = withPermissionGuard(SemesterSelectionScreen, 'SemesterSelection');
const GuardedScheduleDetails = withPermissionGuard(ScheduleDetailsScreen, 'ScheduleDetails');
const GuardedTraineeGrades = withPermissionGuard(TraineeGradesScreen, 'TraineeGrades');
const GuardedBulkUploadGrades = withPermissionGuard(BulkUploadGradesScreen, 'BulkUploadGrades');
const GuardedTraineeGradeDetails = withPermissionGuard(TraineeGradeDetailsScreen, 'TraineeGradeDetails');
const GuardedSecondRoundStudents = withPermissionGuard(SecondRoundStudentsScreen, 'SecondRoundStudents');
const GuardedMercyGrades = withPermissionGuard(MercyGradesScreen, 'MercyGrades');
const GuardedGradeReports = withPermissionGuard(GradeReportsScreen, 'GradeReports');
const GuardedGradeSettings = withPermissionGuard(GradeSettingsScreen, 'GradeSettings');
const GuardedMarketers = withPermissionGuard(MarketersScreen, 'Marketers');
const GuardedAddMarketer = withPermissionGuard(AddMarketerScreen, 'AddMarketer');
const GuardedEditMarketer = withPermissionGuard(EditMarketerScreen, 'EditMarketer');
const GuardedTargetSetting = withPermissionGuard(TargetSettingScreen, 'TargetSetting');
const GuardedMarketingTrainees = withPermissionGuard(MarketingTraineesScreen, 'MarketingTrainees');
const GuardedEmployeeTrainees = withPermissionGuard(EmployeeTraineesScreen, 'EmployeeTrainees');
const GuardedMarketingStats = withPermissionGuard(MarketingStatsScreen, 'MarketingStats');
const GuardedWhatsAppManagement = withPermissionGuard(WhatsAppManagementScreen, 'WhatsAppManagement');
const GuardedTreasury = withPermissionGuard(TreasuryScreen, 'Treasury');
const GuardedAddTreasury = withPermissionGuard(AddTreasuryScreen, 'AddTreasuryScreen');
const GuardedAddTransaction = withPermissionGuard(AddTransactionScreen, 'AddTransactionScreen');
const GuardedFees = withPermissionGuard(FeesScreen, 'Fees');
const GuardedAddFee = withPermissionGuard(AddFeeScreen, 'AddFeeScreen');
const GuardedTraineePayments = withPermissionGuard(TraineePaymentsScreen, 'TraineePayments');
const GuardedTraineePaymentDetails = withPermissionGuard(TraineePaymentDetailsScreen, 'TraineePaymentDetails');
const GuardedFinancialReports = withPermissionGuard(FinancialReportsScreen, 'FinancialReports');
const GuardedPaymentSchedules = withPermissionGuard(PaymentSchedulesScreen, 'PaymentSchedules');
const GuardedPaymentScheduleDetails = withPermissionGuard(PaymentScheduleDetailsScreen, 'PaymentScheduleDetails');
const GuardedAddPaymentSchedule = withPermissionGuard(AddPaymentScheduleScreen, 'AddPaymentSchedule');
const GuardedPaymentDeferralRequests = withPermissionGuard(PaymentDeferralRequestsScreen, 'PaymentDeferralRequests');
const GuardedFreeRequests = withPermissionGuard(FreeRequestsScreen, 'FreeRequests');
const GuardedRequestsSettings = withPermissionGuard(RequestsSettingsScreen, 'RequestsSettings');
const GuardedPermissions = withPermissionGuard(PermissionsScreen, 'Permissions');
const GuardedRoleDetails = withPermissionGuard(RoleDetailsScreen, 'RoleDetails');
const GuardedAddPermission = withPermissionGuard(AddPermissionScreen, 'AddPermission');
const GuardedCreateEditRole = withPermissionGuard(CreateEditRoleScreen, 'Permissions');
const GuardedManageRolePermissions = withPermissionGuard(ManageRolePermissionsScreen, 'Permissions');
const GuardedAcademicSupplies = withPermissionGuard(AcademicSuppliesScreen, 'AcademicSupplies');
const GuardedDeliveryTracking = withPermissionGuard(DeliveryTrackingScreen, 'DeliveryTracking');
const GuardedDeliveryTrackingMaterial = withPermissionGuard(DeliveryTrackingMaterialScreen, 'DeliveryTrackingMaterial');
const GuardedAddStudyMaterial = withPermissionGuard(AddStudyMaterialScreen, 'AddStudyMaterial');
const GuardedStaffAttendance = withPermissionGuard(StaffAttendanceScreen, 'StaffAttendance');
const GuardedStaffAttendanceLogs = withPermissionGuard(StaffAttendanceLogsScreen, 'StaffAttendanceLogs');
const GuardedStaffLeaveRequests = withPermissionGuard(StaffLeaveRequestsScreen, 'StaffLeaveRequests');
const GuardedStaffAttendanceSettings = withPermissionGuard(StaffAttendanceSettingsScreen, 'StaffAttendanceSettings');
const GuardedStaffAttendanceEmployees = withPermissionGuard(StaffAttendanceEmployeesScreen, 'StaffAttendanceEmployees');
const GuardedStaffAttendanceEmployeeDetail = withPermissionGuard(StaffAttendanceEmployeeDetailScreen, 'StaffAttendanceEmployeeDetail');

const Stack = createNativeStackNavigator();

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasBranchSelected, setHasBranchSelected] = useState(false);
  const [hasLoginTypeSelected, setHasLoginTypeSelected] = useState(false);

  useEffect(() => {
    checkInitialStatus();
  }, []);

  const checkInitialStatus = async () => {
    try {
      // أولاً تحقق من اختيار نوع تسجيل الدخول
      const loginTypeSelected = await hasLoginType();
      setHasLoginTypeSelected(loginTypeSelected);

      // ثانياً تحقق من اختيار الفرع
      const branchSelected = await BranchService.hasSavedBranch();
      console.log('🔍 App startup - LoginType selected:', loginTypeSelected, 'Branch selected:', branchSelected);
      
      setHasBranchSelected(branchSelected);
      
      if (branchSelected) {
        // إذا تم اختيار الفرع، تحقق من المصادقة
        const authenticated = await AuthService.isAuthenticated();
        console.log('🔍 App startup - User authenticated:', authenticated);
        setIsAuthenticated(authenticated);
      } else {
        console.log('🔍 App startup - No branch selected, going to BranchSelection');
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Error checking initial status:', error);
      setIsAuthenticated(false);
      setHasBranchSelected(false);
      setHasLoginTypeSelected(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f4f6fa' }}>
          <ActivityIndicator size="large" color="#1a237e" />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <NavigationContainer>
        <Stack.Navigator 
          initialRouteName={(() => {
            const route = !hasLoginTypeSelected ? "LoginTypeSelection" :
                         !hasBranchSelected ? "BranchSelection" : 
                         isAuthenticated ? "Home" : "Login";
            console.log('🚀 App navigator - Initial route:', route,
                       'hasLoginTypeSelected:', hasLoginTypeSelected,
                       'hasBranchSelected:', hasBranchSelected, 
                       'isAuthenticated:', isAuthenticated);
            return route;
          })()} 
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen name="LoginTypeSelection" component={LoginTypeSelectionScreen} />
          <Stack.Screen name="BranchSelection" component={BranchSelectionScreen} />
          <Stack.Screen name="Login" component={TestLogin} />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Programs" component={GuardedPrograms} />
          <Stack.Screen name="AddProgram" component={GuardedAddProgram} />
          <Stack.Screen name="EditProgram" component={GuardedEditProgram} />
          <Stack.Screen name="StudentsList" component={GuardedStudentsList} />
          <Stack.Screen name="TraineeTransfer" component={GuardedTraineeTransfer} />
          <Stack.Screen name="AddStudent" component={GuardedAddStudent} />
          <Stack.Screen name="TrainingContents" component={GuardedTrainingContents} />
          <Stack.Screen name="AddTrainingContent" component={GuardedAddTrainingContent} />
          <Stack.Screen name="EditTrainingContent" component={GuardedEditTrainingContent} />
          <Stack.Screen name="Questions" component={GuardedQuestions} />
          <Stack.Screen name="AddQuestion" component={GuardedAddQuestion} />
          <Stack.Screen name="Treasury" component={GuardedTreasury} />
          <Stack.Screen name="AddTreasuryScreen" component={GuardedAddTreasury} />
          <Stack.Screen name="AddTransactionScreen" component={GuardedAddTransaction} />
          <Stack.Screen name="Fees" component={GuardedFees} />
          <Stack.Screen name="AddFeeScreen" component={GuardedAddFee} />
          <Stack.Screen name="TraineePayments" component={GuardedTraineePayments} />
          <Stack.Screen name="TraineePaymentDetails" component={GuardedTraineePaymentDetails} />
          <Stack.Screen name="FinancialReports" component={GuardedFinancialReports} />
          <Stack.Screen name="PaymentSchedules" component={GuardedPaymentSchedules} />
          <Stack.Screen name="PaymentScheduleDetails" component={GuardedPaymentScheduleDetails} />
          <Stack.Screen name="AddPaymentSchedule" component={GuardedAddPaymentSchedule} />
          <Stack.Screen name="PaymentDeferralRequests" component={GuardedPaymentDeferralRequests} />
          <Stack.Screen name="FreeRequests" component={GuardedFreeRequests} />
          <Stack.Screen name="RequestsSettings" component={GuardedRequestsSettings} />
          <Stack.Screen name="Permissions" component={GuardedPermissions} />
          <Stack.Screen name="RoleDetails" component={GuardedRoleDetails} />
          <Stack.Screen name="AddPermission" component={GuardedAddPermission} />
          <Stack.Screen name="CreateEditRole" component={GuardedCreateEditRole} />
          <Stack.Screen name="ManageRolePermissions" component={GuardedManageRolePermissions} />
          <Stack.Screen name="AddUser" component={GuardedAddUser} />
          <Stack.Screen name="UsersList" component={GuardedUsersList} />
          <Stack.Screen name="EditUser" component={GuardedEditUser} />
          <Stack.Screen name="Marketers" component={GuardedMarketers} />
          <Stack.Screen name="AddMarketer" component={GuardedAddMarketer} />
          <Stack.Screen name="EditMarketer" component={GuardedEditMarketer} />
          <Stack.Screen name="TargetSetting" component={GuardedTargetSetting} />
          <Stack.Screen name="MarketingTrainees" component={GuardedMarketingTrainees} />
          <Stack.Screen name="EmployeeTrainees" component={GuardedEmployeeTrainees} />
          <Stack.Screen name="MarketingStats" component={GuardedMarketingStats} />
          <Stack.Screen name="WhatsAppManagement" component={GuardedWhatsAppManagement} />
          <Stack.Screen name="EditTrainee" component={GuardedEditTrainee} />
          <Stack.Screen name="TraineeDocuments" component={GuardedTraineeDocuments} />
          <Stack.Screen name="Lectures" component={GuardedLectures} />
          <Stack.Screen name="AddLecture" component={GuardedAddLecture} />
          <Stack.Screen name="EditLecture" component={GuardedEditLecture} />
          <Stack.Screen name="PdfViewer" component={PdfViewerScreen} />
          <Stack.Screen name="YouTubeViewer" component={YouTubeViewerScreen} />
          <Stack.Screen name="DistributionManagement" component={GuardedDistributionManagement} />
          <Stack.Screen name="AddDistribution" component={GuardedAddDistribution} />
          <Stack.Screen name="DistributionDetails" component={GuardedDistributionDetails} />
          <Stack.Screen name="ProgramDistributions" component={GuardedProgramDistributions} />
          <Stack.Screen name="QuizManagement" component={GuardedQuizManagement} />
          <Stack.Screen name="QuizReports" component={GuardedQuizReports} />
          <Stack.Screen name="PaperExams" component={GuardedPaperExams} />
          <Stack.Screen name="AddPaperExam" component={GuardedAddPaperExam} />
          <Stack.Screen name="PaperExamDetails" component={GuardedPaperExamDetails} />
          <Stack.Screen name="EditPaperExam" component={GuardedEditPaperExam} />
          <Stack.Screen name="ControlSystem" component={GuardedControlSystem} />
          <Stack.Screen name="GradeRelease" component={GuardedGradeRelease} />
          <Stack.Screen name="AddQuiz" component={GuardedAddQuiz} />
          <Stack.Screen name="QuizDetails" component={GuardedQuizDetails} />
          <Stack.Screen name="EditQuiz" component={GuardedEditQuiz} />
          <Stack.Screen name="QuizReport" component={GuardedQuizReport} />
          <Stack.Screen name="QuizAttemptDetails" component={GuardedQuizAttemptDetails} />
          <Stack.Screen name="TraineeAccounts" component={GuardedTraineeAccounts} />
          <Stack.Screen name="TraineeAccountDetails" component={GuardedTraineeAccountDetails} />
          <Stack.Screen name="Schedules" component={GuardedSchedules} />
          <Stack.Screen name="SemesterSelection" component={GuardedSemesterSelection} />
          <Stack.Screen name="ScheduleDetails" component={GuardedScheduleDetails} />
          <Stack.Screen name="TraineeGrades" component={GuardedTraineeGrades} />
          <Stack.Screen name="BulkUploadGrades" component={GuardedBulkUploadGrades} />
          <Stack.Screen name="TraineeGradeDetails" component={GuardedTraineeGradeDetails} />
          <Stack.Screen name="SecondRoundStudents" component={GuardedSecondRoundStudents} />
          <Stack.Screen name="MercyGrades" component={GuardedMercyGrades} />
          <Stack.Screen name="GradeReports" component={GuardedGradeReports} />
          <Stack.Screen name="GradeSettings" component={GuardedGradeSettings} />
          <Stack.Screen name="AcademicSupplies" component={GuardedAcademicSupplies} />
          <Stack.Screen name="DeliveryTracking" component={GuardedDeliveryTracking} />
          <Stack.Screen name="DeliveryTrackingMaterial" component={GuardedDeliveryTrackingMaterial} />
          <Stack.Screen name="AddStudyMaterial" component={GuardedAddStudyMaterial} />
          <Stack.Screen name="StaffAttendance" component={GuardedStaffAttendance} />
          <Stack.Screen name="StaffAttendanceLogs" component={GuardedStaffAttendanceLogs} />
          <Stack.Screen name="StaffLeaveRequests" component={GuardedStaffLeaveRequests} />
          <Stack.Screen name="StaffAttendanceSettings" component={GuardedStaffAttendanceSettings} />
          <Stack.Screen name="StaffAttendanceEmployees" component={GuardedStaffAttendanceEmployees} />
          <Stack.Screen name="StaffAttendanceEmployeeDetail" component={GuardedStaffAttendanceEmployeeDetail} />
        </Stack.Navigator>
      </NavigationContainer>
      <Toast />
    </SafeAreaProvider>
  );
}

export default App;
