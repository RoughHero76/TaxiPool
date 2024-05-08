import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, ActivityIndicator } from "react-native";
import auth from '@react-native-firebase/auth';
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import Toast from "react-native-toast-message";

const UserProfile = () => {
    const navigate = useNavigation();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');

    const [loading, setLoading] = useState(false);
    const [refresh, setRefresh] = useState(false);
    const [allowPhoneNumberEdit, setAllowPhoneNumberEdit] = useState(false);
    const [user, setUser] = useState(null);

    useEffect(() => {
        setRefresh(false);
        const unsubscribe = auth().onAuthStateChanged(async (authUser) => {
            if (authUser) {
                setUser(authUser);
                setName(authUser.displayName);
                setEmail(authUser.email);
                setPhoneNumber(authUser.phoneNumber);
            }
        });

        return unsubscribe;
    }, [refresh]);

    useEffect(() => {
        if (user && !user.phoneNumber) {
            setAllowPhoneNumberEdit(true);
        }
    }, [user]);

    const handleSaveProfile = async () => {
        setLoading(true);

        try {
            const currentUser = auth().currentUser;

            if (name !== currentUser.displayName || email !== currentUser.email || phoneNumber !== currentUser.phoneNumber) {
                // Update user profile in Firebase Authentication
                await currentUser.updateProfile({
                    displayName: name,
                });

         /*        await currentUser.updateEmail(email); */ //Cant update email since email login is not enabled

                // Update user profile in MongoDB database
                const token = await currentUser.getIdToken();
                await axios.post(
                    'http://192.168.1.22:5000/api/v1/user/updateProfile',
                    {
                        name,
                        email,
                        phoneNumber,
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );
            }

            setLoading(false);
            setRefresh(true);

            Toast.show({
                type: 'success',
                position: 'bottom',
                visibilityTime: 3000,
                text1: 'Your Profile was updated!',
            });
        } catch (error) {
            console.log(error);
            setLoading(false);
            Toast.show({
                type: 'error',
                position: 'bottom',
                visibilityTime: 3000,
                text1: 'Failed to update profile. Please try again.',
            });
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.fieldsContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Enter your name"
                    value={name}
                    onChangeText={setName}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Enter your email"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                />
                {user && (
                    <TextInput
                        style={styles.input}
                        placeholder="Enter your phone number"
                        value={phoneNumber}
                        onChangeText={setPhoneNumber}
                        keyboardType="phone-pad"
                        editable={allowPhoneNumberEdit}
                    />
                )}
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile} disabled={loading}>
                {loading ? (
                    <ActivityIndicator size="small" color="white" />
                ) : (
                    <Text style={styles.saveButtonText}>Save</Text>
                )}
            </TouchableOpacity>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: 'white',
        padding: 16,
    },
    fieldsContainer: {
        width: "100%",
    },
    input: {
        marginBottom: 10,
        height: 40,
        borderColor: 'gray',
        borderWidth: 1,
        paddingHorizontal: 8,
        marginTop: 4,
        borderRadius: 15,
    },
    saveButton: {
        backgroundColor: "black",
        paddingVertical: 12,
        paddingHorizontal: 6,
        borderRadius: 8,
        marginTop: 29,
    },
    saveButtonText: {
        alignSelf: "center",
        color: "white",
        fontWeight: "bold",
    },
});

export default UserProfile;