import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const router = useRouter();
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const darkTheme = { bg: '#0F1419', text: '#FFFFFF', label: '#FFFFFF', subtext: '#999', inputBorder: '#2196F3', inputBg: 'rgba(33, 150, 243, 0.05)', inputText: '#FFFFFF', inputPlaceholder: '#666', iconColor: '#64B5F6' };
  const lightTheme = { bg: '#FFFFFF', text: '#1A1A1A', label: '#1A1A1A', subtext: '#666', inputBorder: '#E0E0E0', inputBg: '#F8F9FA', inputText: '#1A1A1A', inputPlaceholder: '#999', iconColor: '#0056D2' };
  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={[styles.header, { backgroundColor: theme.bg }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color={theme.text} />
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => setIsDarkMode(!isDarkMode)}
          style={styles.themeToggle}
        >
          <Ionicons 
            name={isDarkMode ? "moon" : "sunny"} 
            size={24} 
            color={isDarkMode ? "#FFD700" : "#FFA500"} 
          />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.title, { color: theme.text }]}>Bem-vindo de Volta!</Text>
        <Text style={[styles.subtitle, { color: '#0056D2' }]}>Acesse sua Conta</Text>
        <Text style={[styles.description, { color: theme.subtext }]}>
          Faça login para continuar sua jornada na matemática.
        </Text>

        {/* Campos de Texto */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.label }]}>E-mail</Text>
          <View style={[styles.inputWrapper, { borderColor: theme.inputBorder, backgroundColor: theme.inputBg }]}>
            <Ionicons name="mail" size={20} color={theme.iconColor} style={styles.inputIcon} />
            <TextInput 
              style={[styles.input, { color: theme.inputText }]}
              placeholder="email@exemplo.com" 
              placeholderTextColor={theme.inputPlaceholder}
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <Text style={[styles.label, { color: theme.label }]}>Senha</Text>
          <View style={[styles.inputWrapper, { borderColor: theme.inputBorder, backgroundColor: theme.inputBg }]}>
            <Ionicons name="lock-closed" size={20} color={theme.iconColor} style={styles.inputIcon} />
            <TextInput 
              style={[styles.input, { color: theme.inputText }]}
              placeholder="••••••••" 
              placeholderTextColor={theme.inputPlaceholder}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            <Ionicons name="eye-off" size={20} color={theme.iconColor} style={styles.inputIcon} />
          </View>
        </View>

        <TouchableOpacity>
          <Text style={[styles.forgotPassword, { color: '#0056D2' }]}>Esqueceu a senha?</Text>
        </TouchableOpacity>

        {/* Botão de Login */}
        <TouchableOpacity 
          style={styles.loginButton}
          onPress={() => router.push('/home')}
        >
          <Text style={styles.loginButtonText}>Entrar</Text>
        </TouchableOpacity>

        <Text style={[styles.footerText, { color: theme.subtext }]}>
          Não tem uma conta?{' '}
          <Text 
            style={styles.link}
            onPress={() => router.push('/register')}
          >
            Cadastre-se aqui
          </Text>
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 30,
    paddingBottom: 12,
  },
  themeToggle: {
    padding: 8,
  },
  scrollContent: { padding: 25 },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center' },
  subtitle: { fontSize: 18, fontWeight: '600', color: '#0056D2', textAlign: 'center', marginTop: 5 },
  description: { fontSize: 14, textAlign: 'center', marginBottom: 30, marginTop: 5 },
  inputGroup: { marginBottom: 15 },
  label: { fontSize: 14, fontWeight: 'bold', marginBottom: 8 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    marginBottom: 15,
  },
  inputIcon: {
    marginHorizontal: 6,
  },
  input: { 
    flex: 1,
    padding: 15,
    fontSize: 14,
  },
  forgotPassword: { color: '#0056D2', fontWeight: '600', textAlign: 'right', marginBottom: 25, fontSize: 14 },
  loginButton: { 
    backgroundColor: '#0056D2', 
    padding: 18, 
    borderRadius: 15, 
    alignItems: 'center', 
    marginBottom: 20,
    marginTop: 10
  },
  loginButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  footerText: { fontSize: 14, textAlign: 'center' },
  link: { color: '#0056D2', fontWeight: 'bold' }
});
