import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function TermsScreen() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms and Conditions</Text>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Introduction</Text>
        <Text style={styles.text}>
          Welcome to our app. By using our services, you agree to these terms and conditions. Please read them carefully.
        </Text>

        <Text style={styles.sectionTitle}>Usage Terms</Text>
        <Text style={styles.text}>
          You must be at least 13 years old to use this app. You are responsible for maintaining the confidentiality of your account credentials.
        </Text>

        <Text style={styles.sectionTitle}>Privacy Policy</Text>
        <Text style={styles.text}>
          We collect and process your data as described in our Privacy Policy. By using our services, you consent to such processing.
        </Text>

        <Text style={styles.sectionTitle}>User Conduct</Text>
        <Text style={styles.text}>
          You agree not to use our services for any illegal purposes or to transmit any malicious code or harmful content.
        </Text>

        <Text style={styles.sectionTitle}>Account Termination</Text>
        <Text style={styles.text}>
          We reserve the right to terminate or suspend your account at our discretion, without prior notice.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  backButtonText: {
    fontSize: 24,
    color: '#333',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  text: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 16,
  },
}); 