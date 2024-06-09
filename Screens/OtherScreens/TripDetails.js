import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView, ActivityIndicator, Alert, TextInput } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';
import firebase from '@react-native-firebase/app';
import '@react-native-firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../secrets';
import Toast from 'react-native-toast-message';

const TripDetails = () => {
    const navigate = useNavigation();
    const route = useRoute();
    const { pickupCity, dropoffCity } = route.params;

    const [isLoading, setIsLoading] = useState(true);
    const [tripDetails, setTripDetails] = useState(null);
    const [error, setError] = useState(null);
    const [isBooking, setIsBooking] = useState(false);
    const [approvalReason, setApprovalReason] = useState('');
    const [bookingDuration, setBookingDuration] = useState('');

    const [profileIncomplete, setProfileIncomplete] = useState(false);
    const [bookingSuccess, setBookingSuccess] = useState(false);
    const [bookingPending, setBookingPending] = useState(false);
    const [bookingError, setBookingError] = useState(null);

    //Looking For Drivers
    const [lookingForDriver, setLookingForDriver] = useState(false);
    const [driversFound, setDriversFound] = useState(false);

    const sendDriverNotifications = async (bookingId) => {
        try {
            console.log('Sending driver notifications for bookingId:', bookingId);
            const response = await axios.post(`${API_URL}/api/v1/driver/searchingDriver`, { bookingId },
                {
                    headers: {
                        Authorization: `Bearer ${await firebase.auth().currentUser.getIdToken(true)}`,
                    },
                    timeout: 10000,
                }
            );
            console.log('API response:', response.data);
            if (response.data.status === 'success') {
                console.log('Driver notifications sent successfully.');
                await AsyncStorage.setItem(bookingId, JSON.stringify({ foundDrivers: true }));
                setDriversFound(true);
                setLookingForDriver(false);
            } else {
                console.error('Error sending driver notifications:', response.data.message);
                if (response.data.message === 'No driver found') {
                    await AsyncStorage.setItem(bookingId, JSON.stringify({ foundDrivers: false }));
                    setDriversFound(false);
                    setLookingForDriver(false);
                }
            }
        } catch (error) {
            console.error('Error sending driver notifications:', error);
            if (error.response && error.response.data.message === 'No driver found') {
                await AsyncStorage.setItem(bookingId, JSON.stringify({ foundDrivers: false }));
                setDriversFound(false);
                setLookingForDriver(false);
            }
        }
    };
    useEffect(() => {
        fetchTripDetails();
    }, []);

    const fetchTripDetails = async () => {
        try {
            setIsLoading(true);
            const token = await firebase.auth().currentUser.getIdToken(true);
            const response = await axios.post(
                `${API_URL}/api/v1/user/getRideDetails`,
                {
                    pickUpCity: pickupCity,
                    dropOffCity: dropoffCity,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    timeout: 10000,
                }
            );
            console.log('Response:', response.data);
            if (response.data.status === 'success') {
                setTripDetails(response.data.data);
            } else {
                setError('Failed to fetch trip details. Please try again.');
            }
        } catch (error) {
            console.error('Error:', error);
            if (error.response) {
                if (error.response.status === 500) {
                    setError('Internal server error. Please try again later.');
                } else if (error.response.status === 401) {
                    setError('Unauthorized. Please log in again.');
                } else {
                    setError('Failed to fetch trip details. Please try again.');
                }
            } else if (error.request) {
                setError('No response from the server. Please check your internet connection.');
            } else if (error.code === 'ECONNABORTED') {
                setError('Request timed out. Please try again.');
            } else {
                setError('An error occurred. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const bookRide = async () => {
        try {
            setIsBooking(true);
            const token = await firebase.auth().currentUser.getIdToken(true);
            const response = await axios.post(
                `${API_URL}/api/v1/user/bookRide`,
                {
                    pickUpCity: pickupCity,
                    dropOffCity: dropoffCity,
                    reason: approvalReason,
                    bookingDuration: bookingDuration,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    timeout: 10000,
                }


            );
            console.log('Response from Booking Ride:', response.data.message);
            console.log('Booking Response:', response.data);
            if (response.data.status === 'success') {
                if (response.data.requiresApproval) {
                    setBookingPending(true);
                } else {
                    setBookingSuccess(true);
                    setLookingForDriver(true);
                    // Store the booking ID
                    const bookingId = response.data.bookingId;
                    sendDriverNotifications(bookingId);

                }
            } else {
                setBookingError('Failed to book the ride. Please try again.');
            }
        } catch (error) {
            console.error('Booking Error:', error);
            if (error.response) {
                if (error.response.status === 500) {
                    setBookingError('Internal server error. Please try again later.');
                } else if (error.response.status === 401) {
                    setBookingError('Unauthorized. Please log in again.');
                } else if (error.response.status === 403) {
                    if (error.response.data.message === 'Your profile is incomplete. Please update your name and phone number before booking a ride.') {
                        setProfileIncomplete(true);
                    } else {
                        setBookingError('Forbidden. Please check your permissions.');
                    }
                } else if (error.response.status === 400) {
                    Toast.show({
                        type: 'error',
                        text1: error.response.data.message,
                        text1Style: { textAlign: 'center' },
                    })
                    setBookingError(error.response.data.message);
                } else {
                    setBookingError('Failed to book the ride. Please try again.');
                }
            } else if (error.request) {
                setBookingError('No response from the server. Please check your internet connection.');
            } else if (error.code === 'ECONNABORTED') {
                setBookingError('Request timed out. Please try again.');
            } else {
                setBookingError('An error occurred. Please try again.');
            }
        } finally {
            setIsBooking(false);
        }
    };


    if (isLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <ActivityIndicator size="large" color="#0000ff" />
                <Text style={styles.loadingText}>Loading trip details...</Text>
            </SafeAreaView>
        );
    }

    if (profileIncomplete) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.profileIncompleteContainer}>
                    <MaterialCommunityIcons name="account-alert" size={80} color="orange" />
                    <Text style={styles.profileIncompleteText}>Your profile is incomplete!</Text>
                    <Text style={styles.profileIncompleteSubtext}>
                        Please complete your profile with your name and phone number before booking a ride.
                    </Text>
                    <TouchableOpacity
                        style={styles.completeProfileButton}
                        onPress={() => {
                            navigate.navigate('NavigationScreen');
                        }}
                    >
                        <Text style={styles.completeProfileButtonText}>Home</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    if (bookingSuccess) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.bookingSuccessContainer}>
                    <MaterialCommunityIcons name="check-circle" size={80} color="green" />
                    <Text style={styles.bookingSuccessText}>Booking Successful!</Text>
                    <Text style={styles.bookingSuccessSubtext}>Your ride has been booked successfully.</Text>
                    {lookingForDriver ? (
                        <View style={styles.searchingDriverContainer}>
                            <ActivityIndicator size="large" color="orange" />
                            <Text style={styles.searchingDriverText}>Looking for nearby drivers...</Text>
                        </View>
                    ) : (
                        <View style={styles.driverStatusContainer}>
                            {driversFound ? (
                                <Text style={styles.driversFoundText}>Drivers found! Please wait for the driver to accept your ride.</Text>
                            ) : (
                                <Text style={styles.noDriversFoundText}>
                                    No nearby driver can be found. You can try again in Upcoming Bookings.
                                </Text>
                            )}
                        </View>
                    )}
                    <TouchableOpacity style={styles.homeButton} onPress={() => navigate.navigate('NavigationScreen')}>
                        <Text style={styles.homeButtonText}>Home</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    if (bookingPending) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.bookingPendingContainer}>
                    <MaterialCommunityIcons name="clock" size={80} color="orange" />
                    <Text style={styles.bookingPendingText}>Booking Pending</Text>
                    <Text style={styles.bookingPendingSubtext}>Your booking request has been submitted and is pending approval.</Text>
                    <TouchableOpacity style={styles.homeButton} onPress={() => navigate.navigate('NavigationScreen')}>
                        <Text style={styles.homeButtonText}>Home</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    if (bookingError) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.bookingErrorContainer}>
                    <MaterialCommunityIcons name="alert-circle" size={80} color="red" />
                    <Text style={styles.bookingErrorText}>Booking Error</Text>
                    <Text style={styles.bookingErrorSubtext}>{bookingError}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={bookRide}>
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }


    if (error) {
        return (
            <SafeAreaView style={styles.container}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={fetchTripDetails}>
                    <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <Text style={styles.title}>Trip Details</Text>
                <View style={styles.detailsContainer}>
                    <Text style={styles.label}>Pickup Address:</Text>
                    <Text style={styles.value}>{tripDetails.pickUpCity.address}</Text>
                </View>
                <View style={styles.detailsContainer}>
                    <Text style={styles.label}>Dropoff Address:</Text>
                    <Text style={styles.value}>{tripDetails.dropOffCity.address}</Text>
                </View>
                <View style={styles.detailsContainer}>
                    <Text style={styles.label}>Distance:</Text>
                    <Text style={styles.value}>{tripDetails.distance}</Text>
                </View>
                <View style={styles.detailsContainer}>
                    <Text style={styles.label}>Estimated Travel Time:</Text>
                    <Text style={styles.value}>{tripDetails.estimatedTravelTime} minutes</Text>
                </View>
                <View style={styles.detailsContainer}>
                    <Text style={styles.label}>Within Plant:</Text>
                    <Text style={styles.value}>{tripDetails.isWithinThermalPlant ? 'Yes' : 'No'}</Text>
                </View>
                <View style={styles.approvalRequestTextContainer}>
                    <Text style={styles.approvalRequestText}>Booking Duration In Minutes (Optional)</Text>
                    <TextInput
                        placeholder='Booking Duration'
                        placeholderTextColor={'gray'}
                        style={styles.approvalRequestInput}
                        onChangeText={setBookingDuration}
                        keyboardType='numeric'
                    >

                    </TextInput>
                </View>

                {tripDetails.isSuperAdministratorPrivilegeRequired && (
                    <View style={styles.approvalContainer}>
                        <MaterialCommunityIcons name="alert-circle-outline" size={24} color="red" />
                        <Text style={styles.approvalText}>Requires Super Administrator Approval</Text>
                    </View>
                )}

                {tripDetails.isSuperAdministratorPrivilegeRequired || tripDetails.isAdministratorPrivilegeRequired ? (
                    <View style={styles.approvalRequestTextContainer}>
                        <Text style={styles.approvalRequestText}>Approval Request Form</Text>
                        <TextInput
                            placeholder='Please enter your reason for requesting approval'
                            placeholderTextColor={'gray'}
                            style={styles.approvalRequestInput}
                            onChangeText={setApprovalReason}
                        >

                        </TextInput>
                    </View>
                ) : (null)}
                {tripDetails.isAdministratorPrivilegeRequired && (
                    <View style={styles.approvalContainer}>
                        <MaterialCommunityIcons name="alert-circle-outline" size={24} color="orange" />
                        <Text style={styles.approvalText}>Requires Administrator Approval</Text>
                    </View>
                )}

                {
                    tripDetails.isSuperAdministratorPrivilegeRequired || tripDetails.isAdministratorPrivilegeRequired ? (
                        <TouchableOpacity
                            style={styles.requestApprovalButton}
                            onPress={bookRide}
                            disabled={isBooking}
                        >
                            {isBooking ? (
                                <ActivityIndicator size="small" color="white" />
                            ) : (
                                <Text style={styles.requestApprovalButtonText}>Request Approval</Text>
                            )}
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={styles.bookButton}
                            onPress={bookRide}
                            disabled={isBooking}
                        >
                            {isBooking ? (
                                <ActivityIndicator size="small" color="white" />
                            ) : (
                                <Text style={styles.bookButtonText}>Request TA Approval</Text>
                            )}
                        </TouchableOpacity>
                    )
                }
            </ScrollView>
        </SafeAreaView>
    );
};


const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 5,

    },
    scrollContainer: {
        marginTop: 10,
        paddingBottom: 16,
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 16,
        color: 'black',
    },
    detailsContainer: {
        marginBottom: 12,
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
        color: 'black',
    },
    value: {
        fontSize: 16,
        color: 'black',
    },
    approvalContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 16,
    },
    approvalText: {
        fontSize: 16,
        marginLeft: 8,
        color: 'black',
    },

    approvalRequestTextContainer: {

        marginTop: 16,
        marginBottom: 16,
    },

    approvalRequestText: {
        color: 'black',

    },
    approvalRequestInput: {
        borderWidth: 1,
        borderColor: 'black',
        borderRadius: 10,
        padding: 10,
        marginTop: 16,
        color: 'black',
    },
    loadingText: {
        fontSize: 16,
        marginTop: 16,
        color: 'black',
    },
    errorText: {
        fontWeight: 'bold',
        fontSize: 16,
        color: 'red',
        marginBottom: 16,
    },
    retryButton: {
        backgroundColor: 'black',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 20,
    },
    retryButtonText: {
        fontSize: 16,
        color: 'white',
        fontWeight: 'bold',
    },
    requestButton: {
        backgroundColor: 'orange',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 20,
        marginTop: 16,
    },
    requestButtonText: {
        fontSize: 16,
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
    },
    bookButton: {
        backgroundColor: 'black',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 20,
        marginTop: 16,
    },
    bookButtonText: {
        fontSize: 16,
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
    },

    requestApprovalButton: {
        backgroundColor: 'orange',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 20,
        marginTop: 16,
    },
    requestApprovalButtonText: {
        fontSize: 16,
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
    },

    profileIncompleteContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    profileIncompleteText: {
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 20,
        textAlign: 'center',
        color: 'black',
    },
    profileIncompleteSubtext: {
        fontSize: 16,
        marginTop: 10,
        textAlign: 'center',
        color: 'black',
    },
    completeProfileButton: {
        backgroundColor: 'black',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 20,
        marginTop: 20,
    },
    completeProfileButtonText: {
        fontSize: 16,
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
    },

    bookingSuccessContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    bookingSuccessText: {
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 20,
        textAlign: 'center',
        color: 'green',
    },
    bookingSuccessSubtext: {
        fontSize: 16,
        marginTop: 10,
        textAlign: 'center',
        color: 'black',
    },
    bookingPendingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    bookingPendingText: {
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 20,
        textAlign: 'center',
        color: 'orange',
    },
    bookingPendingSubtext: {
        fontSize: 16,
        marginTop: 10,
        textAlign: 'center',
        color: 'black',
    },
    bookingErrorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    bookingErrorText: {
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 20,
        textAlign: 'center',
        color: 'red',
    },
    bookingErrorSubtext: {
        fontSize: 16,
        marginTop: 10,
        textAlign: 'center',
        color: 'black',
    },
    homeButton: {
        backgroundColor: 'black',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 20,
        marginTop: 20,
    },
    homeButtonText: {
        fontSize: 16,
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
    },
    retryButton: {
        backgroundColor: 'black',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 20,
        marginTop: 20,
    },
    retryButtonText: {
        fontSize: 16,
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
    },

    /* Searching Driver Container */
    searchingDriverContainer: {


        alignItems: 'center',
        padding: 20,
        flexDirection: 'row',
    },
    searchingDriverText: {
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 20,
        textAlign: 'center',
        color: 'black',
        alignSelf: 'center',
    },
    driversFoundText: {
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 20,
        textAlign: 'center',
        color: 'green',
        alignSelf: 'center',
    },
    noDriversFoundText: {
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 20,
        textAlign: 'center',
        color: 'orange',
        alignSelf: 'center',
    },


});

export default TripDetails;