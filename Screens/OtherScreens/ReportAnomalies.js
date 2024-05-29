import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Keyboard, ActivityIndicator } from 'react-native';
import axios from 'axios';
import firebase from '@react-native-firebase/app';
import Toast from 'react-native-toast-message';
import { API_URL } from '../../secrets';

const ReportAnomalies = ({ route }) => {
    const { bookingId, driverId, vehicleId } = route.params;
    const [type, setType] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        try {
            if (!type || !description) {
                Toast.show({
                    position: 'top',
                    type: 'error',
                    text1: 'Please fill in all fields',
                });
                return;
            }
            setLoading(true);
            const token = await firebase.auth().currentUser.getIdToken(true);
            const response = await axios.post(
                `${API_URL}/api/v1/user/addAnomalies`,
                {
                    type,
                    description,
                    driverId: driverId || null,
                    bookingId: bookingId || null,
                    vehicleId: vehicleId || null,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            console.log(response.data);
            Toast.show({
                position: 'top',
                type: 'success',
                text1: 'Anomaly reported successfully',
            });
            // Reset form fields and navigate back
            setType('');
            setDescription('');
            // Navigate back to the previous screen
        } catch (error) {
            console.error(error);
            Toast.show({
                position: 'top',
                type: 'error',
                text1: 'Failed to report anomaly',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container} >
            <Text style={styles.heading}>Report Anomaly</Text>
            <TextInput
                style={styles.input}
                placeholder="Type"
                placeholderTextColor={'gray'}
                value={type}
                onChangeText={setType}
            />
            <TextInput
                style={styles.input}
                placeholder="Description"
                placeholderTextColor={'gray'}
                value={description}
                onChangeText={setDescription}
                multiline
            />
            <TouchableOpacity
                style={styles.button}
                onPress={handleSubmit}
                disabled={loading}
            >
                {
                    loading ? <ActivityIndicator size="small" color="white" /> : <Text style={styles.buttonText}>Submit</Text>
                }
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    heading: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        color: 'black',
    },
    input: {
        borderWidth: 1,
        borderColor: 'gray',
        borderRadius: 5,
        padding: 10,
        marginBottom: 10,
        color: 'black',
    },
    button: {
        backgroundColor: 'black',
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',

    },
});

export default ReportAnomalies;