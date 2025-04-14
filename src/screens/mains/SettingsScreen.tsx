import React, { useCallback, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Linking } from 'react-native';
import SettingsListItem from '../../components/SettingsListItem';
import { showToast } from '../../utils/toast';
import { apiRequest } from '../../services/MainAPI';
import EncryptedStorage from 'react-native-encrypted-storage';
import { useNavigation } from '@react-navigation/native';

import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../redux/store';
import { setIsAuthenticated } from '../../redux/slices/authSlice';


export default function SettingsScreen() {
  const navigation = useNavigation();
  const [isLogouting, setIsLogouting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const dispatch = useDispatch();
  const isAuth = useSelector((state: RootState) => state.auth.isAuthenticated);

  const handlePrivacyPolicy = () => {
    Linking.openURL('https://docs.google.com/document/d/1jfO6mh63R0foJQ27ynKl5EiOnAMW8UjdktuJuAsAgv0/edit?tab=t.0');
  };

  const LogoutAPI = useCallback(async (allDevices: boolean = false) => {
    if (isLogouting) return;
    setIsLogouting(true);
    try {
      const response = await apiRequest({ API: '/logout', DATA: { allDevices } });
    } finally {
      setIsLogouting(false);
      dispatch(setIsAuthenticated(false));
      await EncryptedStorage.removeItem("access_token");
      await EncryptedStorage.removeItem("refresh_token");
      showToast('Logged out successfully', 'success');
      navigation.navigate('Login');
    }
  }, []);

  const DeleteAccountAPI = useCallback(async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      const response = await apiRequest({ API: `/delete_account`, METHOD: 'POST' });
      if (response.success) {
        await EncryptedStorage.removeItem("access_token");
        await EncryptedStorage.removeItem("refresh_token");
        dispatch(setIsAuthenticated(false));
        showToast(response.message || "Account deleted successfully!", "success");
        navigation.navigate('Login');
      } else {
        showToast(response.message || "Failed to delete account", "error");
      }
    } finally {
      setIsDeleting(false);
    }
  }, []);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Logout from all devices',
          onPress: () => {
            LogoutAPI(true);
          },
        },
        {
          text: 'Logout',
          onPress: () => {
            LogoutAPI();
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        {
          text: 'Yes',
          onPress: () => {
            DeleteAccountAPI();
          },
        },
        {
          text: 'No',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <SettingsListItem
          title="Privacy Policy"
          iconIMG="document_text_outline"
          onPress={handlePrivacyPolicy}
        />
        <SettingsListItem
          title="Delete Account"
          iconIMG="trash"
          onPress={handleDeleteAccount}
        />
        <SettingsListItem
          title="Logout"
          iconIMG="logout"
          onPress={handleLogout}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    backgroundColor: '#fff',
  },
}); 