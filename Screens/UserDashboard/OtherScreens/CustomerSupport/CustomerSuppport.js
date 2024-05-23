import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Linking,
    ScrollView
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';

const SupportScreen = () => {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');

    const handleCall = () => {
        let phoneNumber = '+7976773165';
        Linking.openURL(`tel:${phoneNumber}`);
    }

    const handleEmail = () => {
        let emailAddress = 'mfaisalkhan9@gmail.com';
        Linking.openURL(`mailto:${emailAddress}`);
    }

    const handleSubmit = () => {
        // Validate input
        if (!name || !phone || !email || !message) {
            Toast.show({
                type: 'error',
                position: 'bottom',
                visibilityTime: 2000,
                text1: 'Please fill all fields',
            });
            return;
        }

        // Submit form logic
        Toast.show({
            type: 'success',
            position: 'bottom',
            visibilityTime: 2000,
            text1: 'Form submitted!',
        });

        // Clear input fields
        setName('');
        setPhone('');
        setEmail('');
        setMessage('');
    }

    return (
        <ScrollView style={styles.container}>
            <View>
                <View style={styles.section}>
                    <Text style={styles.heading}>Support by Phone</Text>
                    <Text style={styles.writeOrPhone}>Write to us</Text>
                    <View style={styles.emailPhoneRow}>
                        <Text style={styles.phone}>+917976773165</Text>
                        <TouchableOpacity onPress={handleCall}>
                            <Icon name="phone" size={24} color="black" style={styles.phoneEmailIcon} />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.heading}>Support by Email</Text>
                    <Text style={styles.writeOrPhone}>Write to us at </Text>
                    <View style={styles.emailPhoneRow}>
                        <Text style={styles.email}>
                            faizankhan99280@gmail.com
                        </Text>
                        <TouchableOpacity onPress={handleEmail}>
                            <Icon name="email" size={24} color="black" style={styles.phoneEmailIcon} />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.divider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>Or Fill the form below to send your request</Text>
                    <View style={styles.dividerLine} />
                </View>

                <TextInput
                    style={styles.input}
                    placeholder="Name"
                    placeholderTextColor={'#333'}
                    value={name}
                    onChangeText={text => setName(text)}
                />

                <TextInput
                    style={styles.input}
                    placeholder="Mobile Number"
                    placeholderTextColor={'#333'}
                    value={phone}
                    onChangeText={text => setPhone(text)}
                    keyboardType="phone-pad"
                />

                <TextInput
                    style={styles.input}
                    placeholder="Email Address"
                    placeholderTextColor={'#333'}
                    value={email}
                    onChangeText={text => setEmail(text)}
                />

                <TextInput
                    style={[styles.input, { height: 80 }]}
                    placeholder="Type your message"
                    placeholderTextColor={'#333'}
                    value={message}
                    onChangeText={text => setMessage(text)}
                    multiline
                />
                <TouchableOpacity style={styles.button} onPress={handleSubmit}>
                    <Text style={styles.buttonText}>Submit</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#fff'
    },
    section: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 10,
        marginBottom: 16,
        elevation: 5,
    },
    heading: {
        fontWeight: 'bold',
        fontSize: 18,
        marginBottom: 8,
        color: 'black'
    },
    writeOrPhone: {
        color: '#333',
        marginBottom: 8,
        color: 'black',
    },
    phone: {
        marginRight: 10,
        color: 'black',
        marginBottom: 8
    },
    phoneEmailIcon: {
        marginLeft: 10,
        color: 'black',
        marginBottom: 8
    },
    email: {
        marginRight: 10,
        color: 'black',
        marginBottom: 8
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 16
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: 'black'
    },
    dividerText: {
        color: '#333',
        fontWeight: '600',
        paddingHorizontal: 8
    },
    emailPhoneRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 10,
        marginBottom: 16,
        fontSize: 16,
        color: 'black',
    },
    button: {
        backgroundColor: 'black',
        padding: 12,
        borderRadius: 5,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});

export default SupportScreen;