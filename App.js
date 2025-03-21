import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import LoginScreen from "./components/LoginScreen";
import RegisterScreen from "./components/RegisterScreen";
import OptimizerScreen from "./components/OptimizerScreen";
import AccountScreen from "./components/AccountScreen";
import ReportsScreen from "./components/ReportsScreen";
import HistoryScreen from "./components/HistoryScreen";

// Create Stack Navigator for Reports and related screens
const Stack = createStackNavigator();

// Create Bottom Tab Navigator for persistent navigation
const Tab = createBottomTabNavigator();

// Stack Navigator for Optimizer to Reports
const OptimizerStack = () => {
  return (
    <Stack.Navigator>
      {/* Set headerLeft to null to remove the back button on the Optimizer Input screen */}
      <Stack.Screen 
        name="Optimizer Input" 
        component={OptimizerScreen} 
        options={{ 
          headerLeft: () => null,
          headerTitle: "Optimizer Input"
        }} 
      />
      <Stack.Screen name="Reports" component={ReportsScreen} />
      <Stack.Screen name="HistoryRecords" component={HistoryScreen} />
    </Stack.Navigator>
  );
};

// Bottom Tab Navigator (persistent nav bar)
const BottomTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false, // Hide the default header for tabs
        tabBarStyle: { height: 75 },
        tabBarLabelStyle: { fontSize: 14 },
      }}
    >
      {/* Home and Reports via Stack */}
      <Tab.Screen name="Optimizer" component={OptimizerStack} />
      
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen name="Account" component={AccountScreen} />
    </Tab.Navigator>
  );
};

// Main App Component
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Main">
        {/* Set initial route to "Main" so the app shows Optimizer screen first */}
        <Stack.Screen
          name="Main"
          component={BottomTabNavigator}
          options={{ headerShown: false }}
        />
        {/* Login and Register screens are still available for when they are needed. */}
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Register"
          component={RegisterScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
