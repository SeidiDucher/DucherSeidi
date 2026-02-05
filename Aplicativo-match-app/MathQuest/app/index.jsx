import React, { useState } from "react";
import { SafeAreaView, View, Text, Image, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const PRIMARY = "#0B63E5";

export default function Index() {
  const router = useRouter();
  const [isDarkMode, setIsDarkMode] = useState(false);

  const darkTheme = {
    bg: '#0F1419',
    text: '#FFFFFF',
    subtext: '#999',
    inputBorder: '#2196F3',
  };
  const lightTheme = {
    bg: '#F3F6F9',
    text: '#1F2937',
    subtext: '#6B7280',
    inputBorder: PRIMARY,
  };
  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      <View style={[styles.header, { backgroundColor: theme.bg }]}>
        <TouchableOpacity 
          onPress={() => setIsDarkMode(!isDarkMode)}
          style={styles.themeToggle}
        >
          <Ionicons 
            name={isDarkMode ? "sunny" : "moon"} 
            size={24} 
            color={isDarkMode ? "#FFD700" : "#000000"} 
          />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.container}>
        <Image
          source={require("../assets/images/matematica.png")}
          style={styles.hero}
          resizeMode="contain"
        />

        <Text style={[styles.title, { color: theme.text }]}>Bem-vindo ao App de Matemática!</Text>

        <Text style={[styles.subtitle, { color: theme.subtext }]}>
          Aprenda matemática de forma divertida e interativa com desafios e
          jogos incríveis.
        </Text>

        <View style={styles.buttons}>
          <TouchableOpacity 
            style={styles.primaryButton}
            activeOpacity={0.8}
            onPress={() => router.push('/register')}
          >
            <Text style={styles.primaryText}>Criar Minha Conta</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.secondaryButton, { borderColor: theme.inputBorder }]}
            activeOpacity={0.8}
            onPress={() => router.push('/login')}
          >
            <Text style={[styles.secondaryText, { color: theme.inputBorder }]}>Já tenho uma conta</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.guestRow} activeOpacity={0.7}>
          <Text style={[styles.guestText, { color: theme.subtext }]}>Entrar como Convidado</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { 
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 12,
  },
  themeToggle: {
    padding: 8,
  },
  container: {
    alignItems: "center",
    paddingHorizontal: 28,
    paddingTop: 24,
    paddingBottom: 40,
  },
  hero: {
    width: 200,
    height: 230,
    marginTop: 30,
    borderRadius: 16,
  },
  title: {
    fontSize: 30,
    textAlign: "center",
    fontWeight: "800",
    marginTop: 18,
  },
  subtitle: {
    textAlign: "center",
    marginTop: 12,
    fontSize: 17,
    lineHeight: 24,
    maxWidth: 360,
  },
  buttons: {
    width: "100%",
    marginTop: 28,
    alignItems: "center",
  },
  primaryButton: {
    width: "100%",
    paddingVertical: 18,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: PRIMARY,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryText: { 
    fontSize: 18, 
    fontWeight: "700",
    color: "#FFFFFF"
  },
  secondaryButton: {
    width: "100%",
    marginTop: 14,
    paddingVertical: 16,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    backgroundColor: "transparent",
  },
  secondaryText: { 
    fontSize: 17, 
    fontWeight: "700",
  },
  guestRow: { marginTop: 26 },
  guestText: { 
    fontSize: 15,
  },
});