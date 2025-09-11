import React, { useState, useEffect } from 'react';
import { StatusBar, useColorScheme, View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TestLogin from './src/screens/LoginScreen';
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
import AuthService from './src/services/AuthService';
import { enableScreens } from 'react-native-screens';
enableScreens();

const Stack = createNativeStackNavigator();

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const authenticated = await AuthService.isAuthenticated();
      setIsAuthenticated(authenticated);
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsAuthenticated(false);
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
          initialRouteName={isAuthenticated ? "Programs" : "Login"} 
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen name="Login" component={TestLogin} />
          <Stack.Screen name="Programs" component={ProgramsScreen} />
          <Stack.Screen name="AddProgram" component={AddProgramScreen} />
          <Stack.Screen name="EditProgram" component={EditProgramScreen} />
          <Stack.Screen name="StudentsList" component={StudentsListScreen} />
                    <Stack.Screen name="AddStudent" component={AddStudentScreen} />
          <Stack.Screen name="TrainingContents" component={TrainingContentsScreen} />
          <Stack.Screen name="AddTrainingContent" component={AddTrainingContentScreen} />
          <Stack.Screen name="EditTrainingContent" component={EditTrainingContentScreen} />
          <Stack.Screen name="QuestionsScreen" component={QuestionsScreen} />
          <Stack.Screen name="AddQuestionScreen" component={AddQuestionScreen} />
          <Stack.Screen name="Treasury" component={TreasuryScreen} />
          <Stack.Screen name="AddTreasuryScreen" component={AddTreasuryScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default App;
