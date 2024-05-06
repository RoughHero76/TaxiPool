import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Image, PermissionsAndroid, ActivityIndicator } from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import Geolocation from 'react-native-geolocation-service';
import Toast from 'react-native-toast-message';

const MapScreen = ({ navigation, route }) => {
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [initialRegion, setInitialRegion] = useState(null);
    const [mapType, setMapType] = useState('standard');
    const [middlePointAddress, setMiddlePointAddress] = useState('');

    const mapViewRef = useRef(null);

    const [locationLoading, setLocationLoading] = useState(false);
    const [addressLoading, setAddressLoading] = useState(false);

    useEffect(() => {
        const { initialRegion } = route.params || {};
        if (initialRegion) {
            setInitialRegion({
                latitude: initialRegion.latitude,
                longitude: initialRegion.longitude,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
            });
        }
    }, [route.params]);


    const handleMapPress = () => {
        if (mapViewRef.current) {
            mapViewRef.current.getCamera().then((camera) => {
                const { center } = camera;
                setSelectedLocation(center);
                fetchMiddlePointAddress(center.latitude, center.longitude);
            });
        }
    };

    const handleConfirmLocation = () => {
        if (selectedLocation) {
            console.log(selectedLocation);
        } else {
            Toast.show({
                type: 'error',
                text1: 'Please select a location',
                visibilityTime: 4000,
            
            })

            return;
        }
        navigation.navigate('PickUpLocation', { location: selectedLocation });
    };

    const handleUserLocation = async () => {
        try {
            setLocationLoading(true);
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                {
                    title: 'Location Permission',
                    message: 'This app needs access to your location.',
                    buttonNeutral: 'Ask Me Later',
                    buttonNegative: 'Cancel',
                    buttonPositive: 'OK',
                },
            );
    
            if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                Geolocation.getCurrentPosition(
                    (position) => {
                        const { latitude, longitude } = position.coords;
                        console.log('Current position:', latitude, longitude);
                        setInitialRegion({
                            latitude,
                            longitude,
                            latitudeDelta: 0.0922,
                            longitudeDelta: 0.0421,
                        });
                        if (mapViewRef.current) {
                            mapViewRef.current.animateCamera({
                                center: {
                                    latitude,
                                    longitude,
                                },
                                zoom: 15,
                            },
                            {
                                duration: 1000,
                            });
                        }
                        setLocationLoading(false);
                    },
                    (error) => {
                        console.log(error);
                        setLocationLoading(false);
                    },
                    { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
                );
            } else {
                console.log('Location permission denied');
                setLocationLoading(false);
            }
        } catch (err) {
            console.log(err);
            setLocationLoading(false);
        }
    };

    const toggleMapType = () => {
        setMapType((prevMapType) => (prevMapType === 'standard' ? 'satellite' : 'standard'));
    };

    const fetchMiddlePointAddress = (latitude, longitude) => {
        setAddressLoading(true);
        fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=AIzaSyCYwHNeqOW-oeSSex-b-vqUyZb3vWcWxVA`,
        )
            .then((response) => response.json())
            .then((data) => {
                if (data.results.length > 0) {
                    const address = data.results[0].formatted_address;
                    setMiddlePointAddress(address);
                }
                setAddressLoading(false);
            })
            .catch((error) => {
                console.log(error);
                setAddressLoading(false);
            });
    };

    return (
        <View style={styles.container}>
            {initialRegion && (
                <MapView
                    ref={mapViewRef}
                    style={styles.map}
                    initialRegion={initialRegion}
                    provider={PROVIDER_GOOGLE}
                    mapType={mapType}
                    showsUserLocation={true}
                    showsMyLocationButton={false}
                    onRegionChangeComplete={handleMapPress}
                />
            )}
            <View style={styles.searchContainer}>
                <GooglePlacesAutocomplete
                    placeholder="Search"
                    onPress={(data, details = null) => {
                        if (data.place_id) {
                            fetch(`https://maps.googleapis.com/maps/api/place/details/json?place_id=${data.place_id}&key=AIzaSyCYwHNeqOW-oeSSex-b-vqUyZb3vWcWxVA`)
                                .then(response => response.json())
                                .then(placeDetails => {
                                    if (placeDetails.result && placeDetails.result.geometry && placeDetails.result.geometry.location) {
                                        const { location } = placeDetails.result.geometry;
                                        setSelectedLocation(location);
                                        fetchMiddlePointAddress(location.lat, location.lng);
                                        if (mapViewRef.current) {
                                            mapViewRef.current.animateCamera({
                                                center: {
                                                    latitude: location.lat,
                                                    longitude: location.lng,
                                                },
                                                zoom: 15,
                                            },
                                                {
                                                    duration: 1000,
                                                });
                                        }
                                    }
                                })
                                .catch(error => {
                                    console.log(error);
                                });
                        }
                    }}
                    query={{
                        key: 'AIzaSyCYwHNeqOW-oeSSex-b-vqUyZb3vWcWxVA',
                        language: 'en',
                    }}
                    styles={{
                        textInputContainer: styles.textInputContainer,
                        textInput: styles.textInput,
                    }}
                    renderLeftButton={() => (
                        <MaterialCommunityIcons name="magnify" size={24} color="gray" style={styles.searchIcon} />
                    )}
                />
            </View>
            <View style={styles.markerContainer}>
                <View style={{ alignItems: 'center', justifyContent: 'center', transform: [{ scale: 0.6 }] }}>
                    <Image source={require('./../../../assets/images/marker.png')} style={{ width: 64, height: 64 }} resizeMode="contain" />
                </View>
            </View>
            <View style={styles.topButtonsContainer}>
                <TouchableOpacity style={styles.topButton} onPress={handleUserLocation}>
                    {locationLoading ? (
                        <ActivityIndicator size="small" color="black" />
                    ) : (
                        <MaterialCommunityIcons name={'crosshairs-gps'} size={24} color="black" />
                    )}
                </TouchableOpacity>
                <TouchableOpacity style={styles.topButton1} onPress={toggleMapType}>
                    <MaterialCommunityIcons
                        name={mapType === 'standard' ? 'map' : 'satellite'}
                        size={24}
                        color="black"
                    />
                </TouchableOpacity>
            </View>
            {middlePointAddress !== '' && (
                <View style={styles.addressContainer}>
                    {addressLoading ? (
                        <ActivityIndicator size="small" color="black" />
                    ) : (
                        <Text style={styles.addressText}>{middlePointAddress}</Text>
                    )}
                </View>
            )}
            <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmLocation}>
                <Text style={styles.confirmButtonText}>Confirm Location</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    map: {
        flex: 1,
    },
    searchContainer: {
        position: 'absolute',
        top: 20,
        left: 20,
        right: 20,
        zIndex: 1,
    },
    textInputContainer: {
        flexDirection: 'row',
        backgroundColor: 'white',
        borderRadius: 5,
        alignItems: 'center',
        paddingHorizontal: 10,
    },
    textInput: {
        flex: 1,
        height: 40,
        marginLeft: 10,
    },
    searchIcon: {
        marginRight: 0,
    },
    markerContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
    },
    topButtonsContainer: {
        flexDirection: 'column',
        position: 'absolute',
        top: 20,
        right: 7,
    },
    topButton: {
        backgroundColor: 'white',
        opacity: 0.7,
        borderRadius: 5,
        padding: 10,
        marginTop: 50,
        marginBottom: 10,

    },

    topButton1: {
        backgroundColor: 'white',
        opacity: 0.7,
        borderRadius: 5,
        padding: 10,
    },
    confirmButton: {
        backgroundColor: 'black',
        padding: 10,
        alignItems: 'center',
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        borderRadius: 20,
    },
    confirmButtonText: {
        color: 'white',
        fontSize: 18,
    },
    addressContainer: {
        backgroundColor: 'white',
        padding: 10,
        borderRadius: 10,
        alignItems: 'center',
        position: 'absolute',
        bottom: 80,
        left: 20,
        right: 20,
    },
    addressText: {
        fontSize: 16,
        color: 'black',
    },
});

export default MapScreen;