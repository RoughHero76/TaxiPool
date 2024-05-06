// PickUpLocation.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, PermissionsAndroid, TouchableWithoutFeedback, Keyboard, ActivityIndicator, ScrollView } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import Geolocation from 'react-native-geolocation-service';

import { useRoute, useNavigation } from '@react-navigation/native';

const PickUpLocation = () => {
    const navigate = useNavigation();
    const route = useRoute();

    const returnedLocation = route.params?.location || null;

    console.log('Returned Location from map is: ', returnedLocation);

    const [userPickUpAddress, setUserPickUpAddress] = useState(null);

    //Loadings
    const [currentLocationLoading, setCurrentLocationLoading] = useState(false);
    const [openMapLoading, setOpenMapLoading] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (returnedLocation) {
            const { latitude, longitude } = returnedLocation;
            setLoading(true);
            fetchAddressFromCoordinates(latitude, longitude);
        }
    }, [returnedLocation]);

    const fetchAddressFromCoordinates = async (latitude, longitude) => {
        try {
            const response = await fetch(
                `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=AIzaSyCYwHNeqOW-oeSSex-b-vqUyZb3vWcWxVA`,
            );
            const data = await response.json();
            if (data.results.length > 0) {
                const address = data.results[0].formatted_address;
                setUserPickUpAddress({ address, latitude, longitude });
                console.log('Address:', address);
            } else {
                console.log('No address found for the returned location');
                setUserPickUpAddress({ address: '', latitude, longitude });
            }
        } catch (error) {
            console.log('Error fetching address:', error);
            setUserPickUpAddress({ address: '', latitude, longitude });
        } finally {
            setLoading(false);
        }
    };

    const handleCurrentGeoLocation = async () => {
        try {
            setCurrentLocationLoading(true);
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                {
                    title: 'Location Permission',
                    message: 'App needs access to your location',
                    buttonNeutral: 'Ask Me Later',
                    buttonNegative: 'Cancel',
                    buttonPositive: 'OK',
                },
            );
            if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                console.log('Location permission granted');
                Geolocation.getCurrentPosition(
                    async (position) => {
                        const { latitude, longitude } = position.coords;
                        console.log('Current position:', latitude, longitude);
                        try {
                            const response = await fetch(
                                `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=AIzaSyCYwHNeqOW-oeSSex-b-vqUyZb3vWcWxVA`,
                            );
                            const data = await response.json();
                            if (data.results.length > 0) {
                                const address = data.results[0].formatted_address;
                                setUserPickUpAddress({ address, latitude, longitude });
                                console.log('Address:', address);
                            } else {
                                console.log('No address found for the current location');
                                setUserPickUpAddress({ address: '', latitude, longitude });
                            }
                        } catch (error) {
                            console.log('Error fetching address:', error);
                            setUserPickUpAddress({ address: '', latitude, longitude });
                        } finally {
                            setCurrentLocationLoading(false);
                        }
                    },
                    (error) => {
                        console.log('Error getting location:', error);
                        setCurrentLocationLoading(false);
                    },
                    {
                        enableHighAccuracy: false,
                        timeout: 5000,
                        maximumAge: 10000,
                    },
                );
            } else {
                console.log('Location permission denied');
                setCurrentLocationLoading(false);
            }
        } catch (err) {
            console.warn('Error requesting location permission:', err);
            setCurrentLocationLoading(false);
        }
    };

    const handleSetLocationOnMap = async () => {
        try {
            setOpenMapLoading(true);
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                {
                    title: 'Location Permission',
                    message: 'App needs access to your location',
                    buttonNeutral: 'Ask Me Later',
                    buttonNegative: 'Cancel',
                    buttonPositive: 'OK',
                },
            );
            if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                Geolocation.getCurrentPosition(
                    (position) => {
                        const { latitude, longitude } = position.coords;
                        navigate.navigate('MapScreen', { initialRegion: { latitude, longitude } });
                        setOpenMapLoading(false);
                    },
                    (error) => {
                        console.log(error);
                        setOpenMapLoading(false);
                    },
                    { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
                );
            } else {
                console.log('Location permission denied');
            }
        } catch (err) {
            console.log(err);
            setOpenMapLoading(false);
        }
    };


    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.container}>
                <Text style={styles.heading}>Search Location</Text>
                <GooglePlacesAutocomplete
                    renderLeftButton={() => <MaterialCommunityIcons name="magnify" size={24} color="black" style={styles.searchIcon} />}
                    placeholder="Enter your location"
                    fetchDetails={true}
                    onPress={(data, details = null) => {
                        if (details && details.geometry && details.geometry.location) {
                            const { lat, lng } = details.geometry.location;
                            console.log(details.geometry.location);
                            setUserPickUpAddress({ address: data.description, latitude: lat, longitude: lng });
                        } else {
                            setUserPickUpAddress({ address: data.description, latitude: null, longitude: null });
                        }
                    }}
                    query={{
                        key: 'AIzaSyCYwHNeqOW-oeSSex-b-vqUyZb3vWcWxVA',
                        language: 'en',
                    }}
                    styles={{
                        container: styles.autocompleteContainer,
                        textInputContainer: styles.inputContainer,
                        textInput: styles.input,
                        listView: styles.listView,
                        row: styles.row,
                        description: styles.description,
                    }}
                />
                <ScrollView>
                    <View style={styles.buttonsContainer}>
                        <TouchableOpacity style={styles.button} onPress={handleCurrentGeoLocation} disabled={currentLocationLoading}>
                            <MaterialCommunityIcons name="crosshairs-gps" size={24} color="#333" />
                            {currentLocationLoading ? (
                                <>
                                    <ActivityIndicator size="small" color="#333" />
                                    <Text style={styles.buttonText}>Please Wait...</Text>
                                </>
                            ) : (
                                <Text style={styles.buttonText}>Current Location</Text>
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.button} onPress={handleSetLocationOnMap} disabled={openMapLoading}>
                            <MaterialCommunityIcons name="map-outline" size={24} color="#333" />
                            {openMapLoading ? (
                                <>
                                    <ActivityIndicator size="small" color="#333" />
                                    <Text style={styles.buttonText}>Please Wait...</Text>
                                </>
                            ) : (
                                <Text style={styles.buttonText}>Open Map</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#333" />
                            <Text style={styles.loadingText}>Please Wait...</Text>
                        </View>
                    ) : (
                        <>
                            {userPickUpAddress && (
                                <View style={styles.addressContainer}>
                                    <Text style={styles.addressText}>{`Pick Up Location: ${userPickUpAddress.address}`}</Text>
                                    <Text style={styles.addressText}>{`Latitude: ${userPickUpAddress.latitude}, Longitude: ${userPickUpAddress.longitude}`}</Text>
                                </View>
                            )}
                            {userPickUpAddress?.latitude && userPickUpAddress?.longitude && (
                                <Image
                                    style={styles.mapImage}
                                    source={{
                                        uri: `https://maps.googleapis.com/maps/api/staticmap?center=${userPickUpAddress.latitude},${userPickUpAddress.longitude}&zoom=18&size=500x500&markers=color:red%7C${userPickUpAddress.latitude},${userPickUpAddress.longitude}&key=AIzaSyCYwHNeqOW-oeSSex-b-vqUyZb3vWcWxVA`,
                                    }}
                                />
                            )}
                        </>
                    )}
                </ScrollView>
            </View>
        </TouchableWithoutFeedback>
    );
};
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 16,
    },
    heading: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
        color: '#333',
    },
    autocompleteContainer: {
        flex: 0,
        backgroundColor: 'transparent',
        zIndex: 1,
    },
    inputContainer: {
        backgroundColor: 'white',
        borderRadius: 15,
        paddingHorizontal: 20,
        borderWidth: 1,
        borderColor: '#ccc',
    },
    searchIcon: {
        alignSelf: 'center',
        marginRight: 0,
    },
    input: {
        color: 'black',
    },
    listView: {
        backgroundColor: '#fff',
        borderRadius: 15,
        marginTop: 10,
        elevation: 2,
    },
    row: {
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    description: {
        fontSize: 16,
        color: '#333',
    },
    buttonsContainer: {
        marginTop: 16,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'transparent',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        marginBottom: 10,
    },
    buttonText: {
        fontSize: 16,
        marginLeft: 8,
        color: '#333',
        marginRight: 10,
    },
    addressContainer: {
        backgroundColor: '#f2f2f2',
        padding: 16,
        borderRadius: 8,
        marginTop: 16,

    },
    mapImage: {
        width: 'auto',
        height: 200,
        marginTop: 10,
        borderRadius: 8,
    },
    addressText: {
        fontSize: 16,
        color: '#333',
    },

    loadingContainer:{
        justifyContent: 'space-between',
    },
    loadingText: {
        fontSize: 16,
        color: '#333',
        marginLeft: 8,
    }
});

export default PickUpLocation;