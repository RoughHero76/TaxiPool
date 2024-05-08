// UpcomingTab.js
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import axios from 'axios';
import firebase from '@react-native-firebase/app';
import '@react-native-firebase/auth';
import socketIOClient from 'socket.io-client';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const UpcomingTab = () => {
    const [bookings, setBookings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useFocusEffect(
        React.useCallback(() => {
            let socket;

            const establishSocketConnection = () => {
                socket = socketIOClient('http://192.168.1.22:5000');
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
            const response = await axios.get('http://192.168.1.22:5000/api/v1/user/upcomingBookings', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.data.status === 'success') {
                setBookings(response.data.bookings);
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

    const renderBookingItem = ({ item }) => {
        let statusText;
        let statusColor;
        switch (item.status) {
            case 'pending':
                statusText = 'Your booking is pending. Please wait for admin approval.';
                statusColor = '#FFC107'; 
                break;
            case 'searchingRide':
                statusText = 'We are searching for a ride for you. Please wait.';
                statusColor = '#4CAF50'; 
                break;
            default:
                statusText = `Status: ${item.status}`;
                statusColor = '#F44336'; 
        }

        return (
            <View style={styles.bookingItem}>
                <Text style={styles.bookingIdText}>Booking ID Ref: {item._id}</Text>
                <View style={styles.statusContainer}>
                    <Icon name="circle" size={12} color={statusColor} />
                    <Text style={styles.statusText}>{statusText}</Text>
                </View>
                {/* Render other booking details */}
            </View>
        );
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
});

export default UpcomingTab;