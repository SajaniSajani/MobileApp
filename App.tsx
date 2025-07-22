/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from './src/screen/LoginScreen';
import DashboardScreen from './src/screen/DashboardScreen';
import ProjectOverviewScreen from './src/screen/ProjectOverviewScreen';

export type RootStackParamList = {
  Login: undefined;
  Dashboard: undefined;
  ProjectOverview: { name: string; risk: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="ProjectOverview" component={ProjectOverviewScreen} options={{ title: 'Project Overview' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
