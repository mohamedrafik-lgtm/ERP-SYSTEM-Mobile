import React, { useState, useEffect } from 'react';
import { StatusBar, useColorScheme, View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import TestLogin from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import ProgramsScreen from './src/screens/ProgramsScreen';
import AddProgramScreen from './src/screens/AddProgramScreen';
import EditProgramScreen from './src/screens/EditProgramScreen';
import StudentsListScreen from './src/screens/StudentsListScreen';
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
import PermissionsScreen from './src/screens/PermissionsScreen';
import RoleDetailsScreen from './src/screens/RoleDetailsScreen';
import AddPermissionScreen from './src/screens/AddPermissionScreen';
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
import DistributionManagementScreen from './src/screens/DistributionManagementScreen';
import AddDistributionScreen from './src/screens/AddDistributionScreen';
import DistributionDetailsScreen from './src/screens/DistributionDetailsScreen';
import ProgramDistributionsScreen from './src/screens/ProgramDistributionsScreen';
import BranchSelectionScreen from './src/screens/BranchSelectionScreen';
import AuthService from './src/services/AuthService';
import BranchService from './src/services/BranchService';
import { enableScreens } from 'react-native-screens';
enableScreens();

const Stack = createNativeStackNavigator();

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasBranchSelected, setHasBranchSelected] = useState(false);

  useEffect(() => {
    checkInitialStatus();
  }, []);

  const checkInitialStatus = async () => {
    try {
      // أولاً تحقق من اختيار الفرع
      const branchSelected = await BranchService.hasSavedBranch();
      console.log('🔍 App startup - Branch selected:', branchSelected);
      
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
            const route = !hasBranchSelected ? "BranchSelection" : 
                         isAuthenticated ? "Home" : "Login";
            console.log('🚀 App navigator - Initial route:', route, 
                       'hasBranchSelected:', hasBranchSelected, 
                       'isAuthenticated:', isAuthenticated);
            return route;
          })()} 
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen name="BranchSelection" component={BranchSelectionScreen} />
          <Stack.Screen name="Login" component={TestLogin} />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Programs" component={ProgramsScreen} />
          <Stack.Screen name="AddProgram" component={AddProgramScreen} />
          <Stack.Screen name="EditProgram" component={EditProgramScreen} />
          <Stack.Screen name="StudentsList" component={StudentsListScreen} />
                    <Stack.Screen name="AddStudent" component={AddStudentScreen} />
          <Stack.Screen name="TrainingContents" component={TrainingContentsScreen} />
          <Stack.Screen name="AddTrainingContent" component={AddTrainingContentScreen} />
          <Stack.Screen name="EditTrainingContent" component={EditTrainingContentScreen} />
          <Stack.Screen name="Questions" component={QuestionsScreen} />
          <Stack.Screen name="AddQuestion" component={AddQuestionScreen} />
          <Stack.Screen name="Treasury" component={TreasuryScreen} />
          <Stack.Screen name="AddTreasuryScreen" component={AddTreasuryScreen} />
          <Stack.Screen name="AddTransactionScreen" component={AddTransactionScreen} />
          <Stack.Screen name="Fees" component={FeesScreen} />
          <Stack.Screen name="AddFeeScreen" component={AddFeeScreen} />
          <Stack.Screen name="TraineePayments" component={TraineePaymentsScreen} />
          <Stack.Screen name="TraineePaymentDetails" component={TraineePaymentDetailsScreen} />
          <Stack.Screen name="Permissions" component={PermissionsScreen} />
          <Stack.Screen name="RoleDetails" component={RoleDetailsScreen} />
          <Stack.Screen name="AddPermission" component={AddPermissionScreen} />
          <Stack.Screen name="AddUser" component={AddUserScreen} />
          <Stack.Screen name="UsersList" component={UsersListScreen} />
          <Stack.Screen name="EditUser" component={EditUserScreen} />
          <Stack.Screen name="Marketers" component={MarketersScreen} />
          <Stack.Screen name="AddMarketer" component={AddMarketerScreen} />
          <Stack.Screen name="EditMarketer" component={EditMarketerScreen} />
          <Stack.Screen name="TargetSetting" component={TargetSettingScreen} />
          <Stack.Screen name="MarketingTrainees" component={MarketingTraineesScreen} />
          <Stack.Screen name="EmployeeTrainees" component={EmployeeTraineesScreen} />
          <Stack.Screen name="MarketingStats" component={MarketingStatsScreen} />
          <Stack.Screen name="WhatsAppManagement" component={WhatsAppManagementScreen} />
        <Stack.Screen name="EditTrainee" component={EditTraineeScreen} />
        <Stack.Screen name="TraineeDocuments" component={TraineeDocumentsScreen} />
        <Stack.Screen name="Lectures" component={LecturesScreen} />
        <Stack.Screen name="AddLecture" component={AddLectureScreen} />
        <Stack.Screen name="EditLecture" component={EditLectureScreen} />
        <Stack.Screen name="DistributionManagement" component={DistributionManagementScreen} />
        <Stack.Screen name="AddDistribution" component={AddDistributionScreen} />
        <Stack.Screen name="DistributionDetails" component={DistributionDetailsScreen} />
        <Stack.Screen name="ProgramDistributions" component={ProgramDistributionsScreen} />
        </Stack.Navigator>
      </NavigationContainer>
      <Toast />
    </SafeAreaProvider>
  );
}

export default App;
