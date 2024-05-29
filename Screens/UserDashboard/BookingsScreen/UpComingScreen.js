// UpcomingTab.js
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import axios from 'axios';
import firebase from '@react-native-firebase/app';
import '@react-native-firebase/auth';
import socketIOClient from 'socket.io-client';
import { useFocusEffect, } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { API_URL } from '../../../secrets';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';

const UpcomingTab = () => {
    const [bookings, setBookings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const [cancelBookingLoading, setCancelBookingLoading] = useState(false);

    const [showDriverLocationLoading, setShowDriverLocationLoading] = useState(false);

    const navigate = useNavigation();

    useFocusEffect(
        React.useCallback(() => {
            let socket;

            const establishSocketConnection = () => {
                socket = socketIOClient(API_URL);
                console.log('Connected to server');

                socket.on('connect', () => {
                    console.log('Socket connected');
                });

                socket.on('bookingUpdate', (updatedBooking) => {
                    console.log('Received bookingUpdate event:', updatedBooking);
                    setBookings((prevBookings) => {
                        console.log('Previous bookings:', prevBookings);
                        const updatedBookings = [...prevBookings];
                        const index = updatedBookings.findIndex((booking) => booking._id === updatedBooking._id);
                        if (index !== -1) {
                            console.log('Updating booking:', updatedBookings[index]);
                            updatedBookings[index] = updatedBooking;
                        } else {
                            console.log('Adding new booking:', updatedBooking);
                            updatedBookings.push(updatedBooking);
                        }
                        console.log('Updated bookings:', updatedBookings);
                        return updatedBookings;
                    });
                });

                socket.on('disconnect', () => {
                    console.log('Socket disconnected');
                });
            };

            establishSocketConnection();
            fetchUpcomingBookings();

            return () => {
                if (socket) {
                    socket.disconnect();
                    console.log('Disconnected from server');
                }
            };
        }, [])
    );

    const fetchUpcomingBookings = async () => {
        try {
            setIsLoading(true);
            const token = await firebase.auth().currentUser.getIdToken(true);
            const response = await axios.get(`${API_URL}/api/v1/user/upcomingBookings`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (response.data.status === 'success') {
                setBookings(response.data.bookings);
                setError(null);

            } else {
                setError('Failed to fetch upcoming bookings. Please try again.');

            }
        } catch (error) {
            console.error('Error fetching upcoming bookings:', error);
            setError('An error occurred while fetching upcoming bookings. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const BookingItem = ({ item }) => {
        const [driverAvailability, setDriverAvailability] = useState(null);
        const [retryLoading, setRetryLoading] = useState(false);
        const [retryTimer, setRetryTimer] = useState(null);
        const [retryCount, setRetryCount] = useState(0);

        useEffect(() => {
            const fetchDriverAvailability = async () => {
                try {
                    const bookingInfo = await AsyncStorage.getItem(item._id);
                    if (bookingInfo !== null) {
                        const { foundDrivers } = JSON.parse(bookingInfo);
                        setDriverAvailability(foundDrivers);
                    } else {
                        setDriverAvailability(false);
                    }
                } catch (error) {
                    console.error('Error retrieving driver availability:', error);
                    setDriverAvailability(false);
                }
            };

            if (item.status !== 'pending') {
                fetchDriverAvailability();
            }
        }, [item._id, item.status]);

        const retryBooking = async () => {
            setRetryLoading(true);
            setRetryCount(60);

            try {
                const response = await axios.post(`${API_URL}/api/v1/driver/searchingDriver`, { bookingId: item._id },
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
                    await AsyncStorage.setItem(item._id, JSON.stringify({ foundDrivers: true }));
                    setDriverAvailability(true);
                } else {
                    console.error('Error sending driver notifications:', response.data.message);
                    await AsyncStorage.setItem(item._id, JSON.stringify({ foundDrivers: false }));
                    setDriverAvailability(false);
                }
            } catch (error) {

                if (error.response && error.response.status === 404 && error.response.data.message === 'No driver found') {
                    await AsyncStorage.setItem(item._id, JSON.stringify({ foundDrivers: false }));
                    setDriverAvailability(false);
                } else {
                    console.error('Error sending driver notifications:', error);
                }
            } finally {
                setRetryLoading(false);
            }

            const timer = setInterval(() => {
                setRetryCount((prevCount) => {
                    if (prevCount === 1) {
                        clearInterval(timer);
                        setRetryLoading(false);
                        setRetryTimer(null);
                    }
                    return prevCount - 1;
                });
            }, 1000);

            setRetryTimer(timer);
        };



        const handleShowLocation = async (bookingId, pickupLatitude, pickupLongitude) => {
            try {
                setShowDriverLocationLoading(true);
                const token = await firebase.auth().currentUser.getIdToken(true);
                const response = await axios.post(
                    `${API_URL}/api/v1/user/driverLocation`,
                    {
                        bookingId: bookingId,
                        pickUpCity: {
                            latitude: pickupLatitude,
                            longitude: pickupLongitude,
                        },
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );
                // Handle the response data
                console.log(response.data);
                const driverData = response.data.data;
                // Navigate to a different screen and pass the data as parameters
                navigate.navigate('DriverLocMapScreen', {
                    driverName: driverData.driverName,
                    driverLocation: driverData.driverLocation,
                    pickupLocation: {
                        latitude: pickupLatitude,
                        longitude: pickupLongitude,
                    },
                    estimatedTime: driverData.estimatedTime,
                    distance: driverData.distance,
                    bookingId: bookingId,
                });
            } catch (error) {
                // Handle any errors
                console.error(error);
                console.log(error.response.data);
                Toast.show({
                    position: 'top',
                    type: 'error',
                    text1: error.response.data.message
                })
            } finally {
                setShowDriverLocationLoading(false);
            }
        };


        let statusText;
        let statusColor;
        switch (item.status) {
            case 'pending':
                statusText = 'Your booking is pending. Please wait for admin approval.';
                statusColor = '#FFC107';
                break;
            case 'searchingRide':
                statusText = 'We are searching for a ride for you. Please wait.';
                statusColor = '#2196F3';
                break;

            case 'driverAccepted':
                statusText = 'Driver has accepted your booking. Please wait.';
                statusColor = '#4CAF50';
                break;

            case 'driverArrivedPickup':
                statusText = 'Driver has arrived at the pickup location.';
                statusColor = '#4CAF50';
                break;

            default:
                statusText = `Status: ${item.status}`;
                statusColor = '#F44336';
        }

        const handleReportAnomaly = async () => {
            navigate.navigate('ReportAnomalies', {
                bookingId: item._id ? item._id : null,
                driverId: item.driver && item.driver._id ? item.driver._id : null,
                vehicleId: item.vehicle && item.vehicle._id ? item.vehicle._id : null,
            });
        };

        const handleCancelBooking = async (bookingId) => {

            try {

                setCancelBookingLoading(true);
                const response = await axios.post(`${API_URL}/api/v1/user/cancelRide`, { bookingId: bookingId },
                    {
                        headers: {
                            Authorization: `Bearer ${await firebase.auth().currentUser.getIdToken(true)}`,
                        },
                    }
                );
                console.log('API response:', response.data);
                if (response.data.status === 'success') {
                    Toast.show({
                        position: 'top',
                        type: 'success',
                        text1: response.data.message
                    })
                } else {
                    console.error('Error cancelling booking:', response.data.message);
                }
            } catch (error) {
                console.error('Error cancelling booking:', error);
            } finally {
                setCancelBookingLoading(false);
            }
        }

        return (
            <View style={styles.bookingItem}>
                <Text style={styles.bookingIdText}>Booking ID Ref: {item._id}</Text>
                <View style={styles.statusContainer}>
                    <Icon name="circle" size={12} color={statusColor} />
                    <Text style={styles.statusText}>{statusText}</Text>
                </View>
                {(item.status === 'driverAccepted' || item.status === 'driverArrivedPickup') && (
                    <View style={styles.driverInformationContainer}>
                        <Image
                            source={require('../../../assets/images/profile.jpg')}
                            style={styles.driverProfileImage}
                        />
                        {item.driver ? (
                            <View style={styles.contactInfoContainer}>
                                <Text style={styles.driverNameText}>Name: {item.driver.name}</Text>
                                <Text style={styles.driverContactText}>Contact Number: {item.driver.contactNumber}</Text>
                            </View>
                        ) : (
                            <View style={styles.contactInfoContainer}>
                                <Text style={styles.driverNameText}>Driver information not available</Text>
                            </View>
                        )}
                        <TouchableOpacity
                            style={styles.showLocationButton}
                            disabled={showDriverLocationLoading}
                            onPress={() => handleShowLocation(item._id, item.pickUpCity.latitude, item.pickUpCity.longitude)}
                        >
                            {showDriverLocationLoading ?
                                (
                                    <ActivityIndicator size="small" color="white" />
                                ) : (
                                    <Text style={styles.showLocationButtonText}>Show Location</Text>
                                )}
                        </TouchableOpacity>
                    </View>

                )}

                <View style={styles.bookingInformationContainer}>
                    <View style={styles.bookingInformation}>
                        <Text style={styles.pickupLocationText}>
                            Pick Up: {item.pickUpCity && item.pickUpCity.address ? item.pickUpCity.address : 'N/A'}
                        </Text>
                        <Text style={styles.dropoffLocationText}>
                            Drop Off: {item.dropOffCity && item.dropOffCity.address ? item.dropOffCity.address : 'N/A'}
                        </Text>
                    </View>
                </View>
                <View style={styles.driverAvailabilityContainer}>
                    {item.status !== 'cancelled ' && item.status !== 'rejected ' && item.status !== 'pending' && item.status !== 'driverAccepted' && item.status !== 'driverArrivedPickup' && driverAvailability !== null && (
                        <View style={styles.driverAvailabilityRow}>
                            <Text style={styles.driverAvailabilityText}>
                                {driverAvailability ? 'Drivers found for this booking.' : 'No drivers found for this booking.'}
                            </Text>
                            <TouchableOpacity
                                style={styles.retryButton}
                                onPress={retryBooking}
                                disabled={retryLoading || retryTimer !== null}
                            >
                                {retryLoading ? (
                                    <ActivityIndicator size="small" color="white" />
                                ) : (
                                    <Text style={styles.retryButtonText}>
                                        {retryTimer !== null ? `Retry (${retryCount}s)` : 'Retry'}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    )}

                    {item.status !== 'pending' && item.status !== 'cancelled ' && (
                        <View style={styles.reportButtonContainer}>
                            <TouchableOpacity
                                style={styles.reportButton}
                                onPress={handleReportAnomaly}
                            >
                                <Text style={styles.reportButtonText}>Report Anomaly</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {(item.status === 'pending' || item.status === 'searchingRide') && (
                        <View style={styles.cancelButtonContainer}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                disabled={cancelBookingLoading}
                                onPress={() => {
                                    handleCancelBooking(item._id);
                                }}
                            >
                                {cancelBookingLoading ? (
                                    <ActivityIndicator size="small" color="white" />
                                ) : (
                                    <Text style={styles.cancelButtonText}>Cancel Booking</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
                {/* Render other booking details */}
            </View >
        );
    };
    const renderBookingItem = ({ item }) => {
        return <BookingItem item={item} />;
    };


    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0000ff" />
                <Text style={styles.loadingText}>Loading upcoming bookings...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={bookings}
                renderItem={renderBookingItem}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.bookingList}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
        padding: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: 'black',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        fontSize: 16,
        color: 'red',
    },
    bookingList: {
        paddingBottom: 16,
    },
    bookingItem: {
        backgroundColor: '#f0f0f0',
        padding: 16,
        marginBottom: 8,
        borderRadius: 8,
    },
    bookingIdText: {
        fontSize: 12,
        color: 'gray',
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    statusText: {
        marginLeft: 8,
        fontSize: 14,
        color: 'black',
    },

    /* Driver information container */
    driverInformationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 16,
        backgroundColor: 'white',
        padding: 10,
        borderRadius: 10,
    },
    driverProfileImage: {
        width: 60,
        height: 60,
        borderRadius: 30,
        marginRight: 10,
    },
    contactInfoContainer: {
        flex: 1,
    },
    driverNameText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'black',
    },
    driverContactText: {
        fontSize: 14,
        color: 'gray',
    },
    showLocationButton: {
        backgroundColor: 'black',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10,
    },
    showLocationButtonText: {
        color: 'white',
        fontSize: 14,
    },
    /*  */

    bookingInformationContainer: {
        marginTop: 8,
        marginBottom: 8,
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 10,
        backgroundColor: 'white',
    },

    bookingInformation: {
        marginTop: 8,
    },
    pickupLocationText: {
        marginBottom: 5,
        fontSize: 14,
        color: 'black',
    },

    dropoffLocationText: {
        fontSize: 14,
        color: 'black',
    },

    driverAvailabilityContainer: {
        marginTop: 8,
    },
    driverAvailabilityRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    driverAvailabilityText: {
        fontSize: 14,
        color: 'gray',
    },
    retryButton: {
        backgroundColor: 'gray',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10,

    },
    retryButtonText: {
        color: 'black',
        fontSize: 14,
    },

    /* Report Anomaly button */
    reportButtonContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        marginTop: 10,
    },
    reportButton: {
        backgroundColor: 'gray',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10,
    },
    reportButtonText: {
        color: 'black',
        fontSize: 16,
    },

    /* Cancel Booking */

    cancelButtonContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        marginTop: 10,
    },
    cancelButton: {
        backgroundColor: 'red',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10,
    },
    cancelButtonText: {
        color: 'white',
        fontSize: 16,
    },


});

export default UpcomingTab;