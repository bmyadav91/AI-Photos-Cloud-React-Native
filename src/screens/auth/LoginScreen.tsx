import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Image, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard, Platform, Linking } from "react-native";
import EncryptedStorage from 'react-native-encrypted-storage';
import { useTranslation } from "../../i18n/useTranslation";
import { languages } from "../../i18n/config";
import { globalStyles } from "../../styles/globalStyles";
import { apiRequest } from "../../services/MainAPI";
import { showToast } from '../../utils/toast';
import { useNavigation } from '@react-navigation/native';
import { getIconSource } from '../../utils/icons';

import { useDispatch } from 'react-redux';
import { setIsAuthenticated } from '../../redux/slices/authSlice';

export default function LoginScreen() {

  const { t, language } = useTranslation();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [showOtpField, setShowOtpField] = useState(false);
  const [showNameField, setShowNameField] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const dispatch = useDispatch();

  const navigation = useNavigation();

  const handleLoginSubmit = async () => {
    if (!email || email.length < 3 || email.length > 100) {
      showToast(t('login.invalidEmail'), "error");
      return;
    }

    if (showOtpField && (otp.length < 4 || otp.length > 10)) {
      showToast(t('login.invalidOtp'), "error");
      return;
    }

    setIsLoading(true);
    let shouldEnableButton = true;
    try {
      const endpoint = showOtpField ? "/verify_otp" : "/send_otp";
      const payload = showOtpField ? { email, otp } : { email };

      const response = await apiRequest({
        API: endpoint,
        DATA: payload,
        ACCESS_TOKEN_REQUIRED: false
      });

      if (response.success) {
        if (showOtpField) {
          if (response.access_token && response.refresh_token) {
            await EncryptedStorage.setItem("access_token", response.access_token);
            await EncryptedStorage.setItem("refresh_token", response.refresh_token);
            dispatch(setIsAuthenticated(true));
            setTimeout(() => {
              navigation.navigate('MainApp', { screen: 'Home' });
            }, 100);
          }

          if (response.need_name_update) {
            setShowNameField(true);
          } else {
            shouldEnableButton = false;
            dispatch(setIsAuthenticated(true));
            setTimeout(() => {
              navigation.navigate('MainApp', { screen: 'Home' });
            }, 100);
          }
        } else {
          setShowOtpField(true);
          showToast(t('login.otpSent'), "success");
        }
      } else {
        showToast(response.error || t('login.somethingWentWrong'), "error");
      }
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : t('login.anErrorOccurred'),
        "error"
      );
    } finally {
      if (shouldEnableButton) setIsLoading(false);
    }
  };

  const handleUpdateName = async () => {
    if (!name || name.length < 1 || name.length > 50) {
      showToast(t('login.invalidName'), "error");
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiRequest({ API: "/change-name", DATA: { name: name } });

      if (response.success) {
        dispatch(setIsAuthenticated(true));
        setTimeout(() => {
          navigation.navigate('MainApp', { screen: 'Home' });
        }, 100);
      } else {
        showToast(response.error, "error");
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : t('login.anErrorOccurred'), "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    let shouldEnableButton = true;

    try {
      const auth_type = "app";      
      const response = await apiRequest({ API: `/google-auth?auth_type=${auth_type}`, METHOD: "GET", ACCESS_TOKEN_REQUIRED: false });

      if (response.success && response.auth_url) {
        await Linking.openURL(response.auth_url);
        shouldEnableButton = false;
      } else {
        showToast(response.message, "error")
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : t('login.anErrorOccurred'), "error");
    } finally {
      if (shouldEnableButton) setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"} 
      style={styles.container}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1 }} 
          keyboardShouldPersistTaps="handled"
        >
          {/* Top Flexbox: Skip Button */}
          <View style={styles.topContainer}>
            <TouchableOpacity 
              style={styles.loginLaterButton} 
              onPress={() => 
                showToast('Sorry, Login is required', "info")
              }
            >
              <Text style={styles.loginLaterText}>{t('login.loginLater')}</Text>
            </TouchableOpacity>
          </View>
  
          {/* Middle Flexbox: Login Form */}
          <View style={styles.middleContainer}>
            <View style={styles.languageWrapper}>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator 
                contentContainerStyle={styles.languageScrollContainer}
              >
                {Object.entries(languages).map(([key, lang]) => (
                  <TouchableOpacity
                    key={lang.code}
                    style={[
                      styles.option,
                      language.currentLanguage === lang.code ? styles.selectedOption : styles.unselectedOption,
                    ]}
                    onPress={() => language.setLanguage(lang.code)}
                  >
                    <Text style={[styles.icon, language.currentLanguage === lang.code && styles.selectedText]}>
                      {lang.icon}
                    </Text>
                    <Text style={[styles.languageText, language.currentLanguage === lang.code && styles.selectedText]}>
                      {lang.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
  
            <View style={styles.loginWrapper}>
              {!showNameField && (
                <>
                  <TextInput
                    style={globalStyles.input}
                    placeholder={t('login.email_placeholder')}
                    placeholderTextColor="#999"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    maxLength={100}
                  />
  
                  {showOtpField && (
                    <TextInput
                      style={globalStyles.input}
                      placeholder={t('login.otp_placeholder')}
                      placeholderTextColor="#999"
                      value={otp}
                      onChangeText={setOtp}
                      keyboardType="number-pad"
                      maxLength={10}
                    />
                  )}
                </>
              )}
  
              {showNameField && (
                <TextInput
                  style={globalStyles.input}
                  placeholder={t('login.name_placeholder')}
                  placeholderTextColor="#999"
                  value={name}
                  onChangeText={setName}
                  maxLength={50}
                />
              )}
  
              <TouchableOpacity
                style={[globalStyles.button, isLoading && globalStyles.disabledButton]}
                onPress={!showNameField ? handleLoginSubmit : handleUpdateName}
                disabled={isLoading}
              >
                <Text style={globalStyles.buttonText}>
                  {!showNameField ? (showOtpField ? t('login.verify_otp_btn') : t('login.send_otp_btn')) : t('login.update_name_btn')}
                </Text>
              </TouchableOpacity>
  
              {/* OR separator */}
              <View style={styles.orContainer}>
                <View style={styles.line} />
                <Text style={styles.orText}>{t('login.or')}</Text>
                <View style={styles.line} />
              </View>
  
              {/* Google Login */}
              <View style={styles.OtherLoginOptionsContainer}>
                <TouchableOpacity
                  style={[styles.LoginOptionItem, isLoading && globalStyles.disabledButton]}
                  disabled={isLoading}
                  onPress={handleGoogleLogin}
                >
                  <Image source={getIconSource("google")} style={styles.LoginOptionItemImage} />
                  <Text style={styles.LoginOptionItemText}>{t('login.loginWithGoogle')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
  
          {/* Bottom Flexbox: Terms & Conditions */}
          <View style={styles.bottomContainer}>
            <Text style={[globalStyles.notes, styles.login_note]}>
              {t('login.termsAndConditions')}
              <Text style={globalStyles.notesLink} onPress={() => navigation.navigate("Terms")}>Read More</Text>
            </Text>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
  
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
    padding: 20,
  },

  topContainer: {
    alignItems: "flex-end",
  },
  loginLaterButton: {
    // marginTop: 20,
    marginBottom: 20,
    paddingVertical: 7,
    paddingHorizontal: 23,
    borderRadius: 10,
    borderWidth: 1,
    opacity: 0.5,
  },
  loginLaterText: {
    fontSize: 18,
    color: "black",
  },
  middleContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  bottomContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  languageWrapper: {
    height: 60,
    marginBottom: 30,
  },
  languageScrollContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 2,
    marginHorizontal: 5,
  },
  unselectedOption: {
    borderColor: "#ccc",
  },
  selectedOption: {
    borderColor: "purple",
  },
  icon: {
    fontSize: 20,
    color: "#999",
    marginRight: 8,
  },
  languageText: {
    fontSize: 18,
    color: "#333",
  },
  selectedText: {
    color: "purple",
    fontWeight: "bold",
  },
  loginWrapper: {
    width: "100%",
  },
  orContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginVertical: 18,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: "#d4d4d4",
  },
  orText: {
    marginHorizontal: 10,
    fontSize: 18,
    color: "#555",
  },
  OtherLoginOptionsContainer: {
    width: "100%",
    gap: 15,
  },
  LoginOptionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
  },
  LoginOptionItemImage: {
    height: 20,
    width: 20,
    marginRight: 10,
  },
  LoginOptionItemText: {
    fontSize: 18,
    color: "black",
  },
  termsContainer: {
    alignItems: 'center',
  },
  login_note: {
    marginBottom: 10,
  },
});