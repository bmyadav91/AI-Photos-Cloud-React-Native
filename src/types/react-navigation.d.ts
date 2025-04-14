declare module '@react-navigation/native';
declare module '@react-navigation/native-stack';
declare module '@react-navigation/bottom-tabs';

interface TabBarIconProps {
  color: string;
  size: number;
}

// Add more specific type declarations if needed
declare module '@react-navigation/native-stack' {
  import { NavigatorScreenParams } from '@react-navigation/native';
  
  export function createNativeStackNavigator<T = {}>(): {
    Navigator: React.ComponentType<any>;
    Screen: React.ComponentType<any>;
  };
}

declare module '@react-navigation/bottom-tabs' {
  import { NavigatorScreenParams } from '@react-navigation/native';
  
  export function createBottomTabNavigator<T = {}>(): {
    Navigator: React.ComponentType<any>;
    Screen: React.ComponentType<any>;
  };
} 