import React from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TestLogin from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import StudentsScreen from './src/screens/StudentsScreen';
import StudentsListScreen from './src/screens/StudentsListScreen';
import CoursesScreen from './src/screens/CoursesScreen';
import ProgramsScreen from './src/screens/ProgramsScreen';
import AddProgramScreen from './src/screens/AddProgramScreen';
import IconTest from './src/components/IconTest';
import { enableScreens } from 'react-native-screens';
enableScreens();

const Stack = createNativeStackNavigator();

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={TestLogin} />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Students" component={StudentsScreen} />
          <Stack.Screen name="StudentsList" component={StudentsListScreen} />
          <Stack.Screen name="Courses" component={CoursesScreen} />
          <Stack.Screen name="Programs" component={ProgramsScreen} />
          <Stack.Screen name="AddProgram" component={AddProgramScreen} />
          <Stack.Screen name="IconTest" component={IconTest} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default App;
