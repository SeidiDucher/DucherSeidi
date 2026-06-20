import React from 'react'

import {
    Text,
    View,
    Image,
    TextInput
} from 'react-native';

import { styles } from './style';
import Logo from '../../assets/logo.png';

export default function Login() {
  return (
        <View style={styles.container}>
            <View style={styles.boxTop}>
                <Image
                    source={Logo}
                    style={styles.logo}
                    resizeMode='contain'
                />
                <Text style={styles.text}>Bem vindo de volta</Text>
            </View>

            <View style={styles.boxMed}>
                <Text>Endereco de Email</Text>
                <TextInput 
                    placeholder='Digite seu email' 
                />
                <Text>Senha</Text>
                <TextInput
                    placeholder='Digite sua senha'
                    secureTextEntry={true}
                />
            </View>

            <View style={styles.boxBottom}>
                
            </View>
        </View>
  )
}