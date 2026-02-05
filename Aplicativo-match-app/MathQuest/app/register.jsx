import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function RegisterScreen() {
  const router = useRouter();
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  // Estados para os campos do formulário
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('1º'); // Estado para a Série

  const grades = ['1º', '2º', '3º', '4º', '5º'];

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
        <Text style={[styles.title, { color: theme.text }]}>Comece sua Jornada!</Text>
        {/* Campos de Texto */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.label }]}>Nome do Aluno</Text>
          <View style={[styles.inputWrapper, { borderColor: theme.inputBorder, backgroundColor: theme.inputBg }]}>
            <Ionicons name="person" size={20} color={theme.iconColor} style={styles.inputIcon} />
            <TextInput 
              style={[styles.input, { color: theme.inputText }]}
              placeholder="Digite seu nome"
              placeholderTextColor={theme.inputPlaceholder}
              value={name}
              onChangeText={setName}
            />
          </View>

          <Text style={[styles.label, { color: theme.label }]}>E-mail do Responsável</Text>
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

          <Text style={[styles.label, { color: theme.label }]}>Criar Senha</Text>
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

        {/* Seleção de nivel ou ano escolar */}
        <Text style={[styles.label, { color: theme.label }]}>Nível / Ano</Text>
        <View style={styles.gradeContainer}>
          {grades.map((grade) => (
            <TouchableOpacity 
              key={grade}
              style={[
                styles.gradeButton, 
                { borderColor: selectedGrade === grade ? '#0056D2' : theme.inputBorder, backgroundColor: selectedGrade === grade ? '#0056D2' : theme.inputBg }
              ]}
              onPress={() => setSelectedGrade(grade)}
            >
              <Text style={[styles.gradeText, { color: selectedGrade === grade ? '#FFFFFF' : theme.text }]}>{grade}</Text>
              <Text style={[styles.gradeSubtext, { color: selectedGrade === grade ? '#FFFFFF' : theme.subtext }]}>Fund.</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Botão de Cadastro */}
        <TouchableOpacity 
          style={styles.registerButton}
          onPress={() => router.push('/home')}
        >
          <Ionicons name="rocket" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.registerButtonText}>Cadastrar</Text>
        </TouchableOpacity>

        <Text style={[styles.footerText, { color: theme.subtext }]}>
          Ao se cadastrar, você concorda com nossos{'\n'}
          <Text style={styles.link}>Termos de Uso e Privacidade.</Text>
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
  },
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
  scrollContent: { 
    padding: 25,
    paddingBottom: 40,
  },
  title: { 
    fontSize: 32, 
    fontWeight: 'bold', 
    textAlign: 'center',
    marginBottom: 10,
  },
  description: { 
    fontSize: 14, 
    textAlign: 'center', 
    marginBottom: 30, 
    marginTop: 5,
    lineHeight: 20,
  },
  inputGroup: { 
    marginBottom: 20 
  },
  label: { 
    fontSize: 14, 
    fontWeight: 'bold', 
    marginBottom: 10 
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 20,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: { 
    flex: 1,
    fontSize: 14,
    paddingVertical: 14,
    fontFamily: 'System',
  },
  gradeContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 30,
    marginTop: 10,
  },
  gradeButton: { 
    width: '18%', 
    paddingVertical: 12, 
    borderRadius: 50, 
    borderWidth: 2,
    alignItems: 'center',
  },
  gradeText: { 
    fontSize: 18, 
    fontWeight: 'bold',
  },
  gradeSubtext: { 
    fontSize: 10, 
    marginTop: 2,
  },
  registerButton: { 
    backgroundColor: '#0056D2', 
    padding: 16, 
    borderRadius: 20, 
    alignItems: 'center', 
    marginBottom: 20,
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  registerButtonText: { 
    color: '#FFFFFF', 
    fontSize: 16, 
    fontWeight: 'bold',
  },
  footerText: { 
    fontSize: 12, 
    textAlign: 'center', 
    lineHeight: 18 
  },
  link: { 
    color: '#0056D2', 
    fontWeight: 'bold' 
  }
});