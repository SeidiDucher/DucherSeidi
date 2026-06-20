import { Dimensions, StyleSheet } from "react-native";

export const styles = StyleSheet.create({
    container:{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    boxTop:{
        height: Dimensions.get('window').height / 3,
        width: '100%',
        backgroundColor: 'red',
        alignItems: 'center',
        justifyContent: 'center',
    },
    boxMed:{
        height: Dimensions.get('window').height / 4,
        width: '100%',
        backgroundColor: 'green',
    },
    boxBottom:{
        height: Dimensions.get('window').height / 3,
        width: '100%',
        backgroundColor: 'blue',
    },
    logo:{
        width: 80,
        height: 80,
    },
    text:{
        fontWeight: 'bold',
        marginTop: 20,
        fontSize: 20,
    }
});