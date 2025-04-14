import React, { lazy, Suspense, useState, useEffect } from 'react';
import { Image } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { getIconSource } from '../utils/icons';
import { ToastWrapper } from '../utils/toast';
import { Loader } from '../utils/Loader';
import { isAuthenticatedFun } from "../../src/services/MainAPI";

import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../redux/store';
import { setIsAuthenticated } from '../redux/slices/authSlice';


const LoginScreen = lazy(() => import('../screens/auth/LoginScreen'));
const TermsScreen = lazy(() => import('../screens/pages/TermsScreen'));
const HomeScreen = lazy(() => import('../screens/mains/HomeScreen'));
const FaceDetails = lazy(() => import('../screens/mains/FaceDetails'));
const UploadScreen = lazy(() => import('../screens/mains/UploadPhoto'));
const SettingsScreen = lazy(() => import('../screens/mains/SettingsScreen'));
const GoogleAuthCallback = lazy(() => import('../screens/auth/GoogleAuthCallback'));

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();


type TabBarIconProps = {
  color: string;
  size: number;
};

// Icon component
const TabIcon = ({ name, color, size }: TabBarIconProps & { name: string }) => (
  <Image
    source={getIconSource(name as any)}
    style={{
      width: size,
      height: size,
      tintColor: color
    }}
  />
);

const linking = {
  prefixes: ['whatbmphotos://'],
  config: {
    screens: {
      'GoogleAuthCallback': 'google-auth/callback',
    },
  },
};

// Bottom Tabs (Main App Screens)
const MainTabs = () => (
  <Suspense fallback={<Loader />}>
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }: TabBarIconProps) => <TabIcon name="home" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Upload"
        component={UploadScreen}
        options={{
          tabBarIcon: ({ color, size }: TabBarIconProps) => <TabIcon name="upload" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ color, size }: TabBarIconProps) => <TabIcon name="settings" color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  </Suspense>
);

// Main App Navigator
const AppNavigator = () => {
  const [loading, setLoading] = useState(true);
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const dispatch = useDispatch();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authStatus = await isAuthenticatedFun();
        dispatch(setIsAuthenticated(authStatus));
      } catch (error) {
        dispatch(setIsAuthenticated(false));
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [dispatch]);

  if (loading) {
    return <Loader />;
  }

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <>
            <Stack.Screen name="MainApp" component={MainTabs} />
            <Stack.Screen name="FaceDetails" component={FaceDetails} />
            {/* <Stack.Screen name="Terms" component={TermsScreen} /> */}
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
          </>
        )}
        <Stack.Screen name="Terms" component={TermsScreen} />
        <Stack.Screen name="GoogleAuthCallback" component={GoogleAuthCallback} />
      </Stack.Navigator>
      <ToastWrapper />
    </NavigationContainer>
  );
};

export default AppNavigator;
