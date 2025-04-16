import React, { useCallback, useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { Linking } from 'react-native';
import EncryptedStorage from 'react-native-encrypted-storage';
import { Loader } from '../../utils/Loader';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { setIsAuthenticated } from '../../redux/slices/authSlice';

const GoogleAuthCallback = () => {
  const [url, setUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const route = useRoute();

  const parseUrlParams = useCallback((incomingUrl: string | null): string => {
    if (!incomingUrl) return 'Login Failed';

    const params = incomingUrl.split('?')[1]?.split('&').reduce((acc, param) => {
      const [key, value] = param.split('=');
      acc[key] = decodeURIComponent(value);
      return acc;
    }, {} as Record<string, string>);

    const access_token = params?.access_token;
    const refresh_token = params?.refresh_token;

    if (access_token && refresh_token) {
      EncryptedStorage.setItem('access_token', access_token);
      EncryptedStorage.setItem('refresh_token', refresh_token);
      dispatch(setIsAuthenticated(true));
      setTimeout(() => {
        navigation.replace('MainApp', { screen: 'Home' });
      }, 100);
      return 'Login Success';
    }

    return 'Login Failed';
  }, [dispatch, navigation]);

  useEffect(() => {
    const handleInitialUrl = async () => {
      try {
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) {
          setUrl(initialUrl);
          parseUrlParams(initialUrl);
        } else if (route?.params?.access_token && route?.params?.refresh_token) {
          // Fallback if deep link params were parsed by react-navigation
          const fallbackUrl = `whatbmphotos://google-auth/callback?access_token=${route.params.access_token}&refresh_token=${route.params.refresh_token}`;
          setUrl(fallbackUrl);
          parseUrlParams(fallbackUrl);
        }
      } finally {
        setLoading(false);
      }
    };

    handleInitialUrl();

    const subscription = Linking.addEventListener('url', (event) => {
      setUrl(event.url);
      parseUrlParams(event.url);
    });

    return () => {
      subscription.remove();
    };
  }, [parseUrlParams, route]);

  if (loading) return <Loader />;

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      {url ? <Text>Waiting for verification</Text> : <Text>No URL received</Text>}
    </View>
  );
};

export default GoogleAuthCallback;
