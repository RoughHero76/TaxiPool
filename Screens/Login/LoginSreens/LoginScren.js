import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, TouchableWithoutFeedback, Keyboard, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useNavigation } from '@react-navigation/native';
import auth, { firebase } from '@react-native-firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '../../../secrets';

const LoginScreen = () => {
  const navigate = useNavigation();

  const [mobileNumber, setMobileNumber] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [isloading, setIsloading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [editPhoneNumber, setEditPhoneNumber] = useState(true);
  const [countdownTimer, setCountdownTimer] = useState(60);

  const [user, setUser] = useState(null);


  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged((user) => {
      if (user) {
        setUser(user);
        navigate.navigate('NavigationScreen');

      } else {
        setUser(null);
        navigate.navigate('Login');
        AsyncStorage.removeItem('UserToken');
      }


    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    let interval = null;
    if (showOtpInput && countdownTimer > 0) {
      interval = setInterval(() => {
        setCountdownTimer(countdownTimer - 1);
      }, 1000);
    } else if (countdownTimer === 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [showOtpInput, countdownTimer]);




  const handleLogin = async () => {
    const formattedMobileNumber = `+91${mobileNumber}`;
    if (mobileNumber < 10) {
      console.log('Please enter your 10 digit phone number');
      setErrorMessage('Please enter your 10 digit phone number');
    } else {
      setIsloading(true);
      try {
        setErrorMessage('');
        console.log('Entering Try....')
        const confirmation = await firebase.auth().signInWithPhoneNumber(formattedMobileNumber);
        console.log('Confirmation:', confirmation);
        setConfirmationResult(confirmation);
        setShowOtpInput(true);
        setEditPhoneNumber(false);
        setCountdownTimer(60);
      } catch (error) {
        console.log(error);
        setErrorMessage(error.message);
      } finally {
        setIsloading(false);
      }
    }
  };

  const handleOtpVerification = async () => {
    if (otpInput.length !== 6) {
      console.log('OTP cannot be empty');
      setErrorMessage('Please Enter Your 6 Digit OTP');
    } else {
      setIsloading(true);
      try {
        const credential = firebase.auth.PhoneAuthProvider.credential(
          confirmationResult.verificationId,
          otpInput,
        );
        const userCredential = await firebase.auth().signInWithCredential(credential);
        const idToken = await userCredential.user.getIdToken();
        AsyncStorage.setItem('UserToken', idToken);
        console.log('ID Token:', idToken);

        // Make an API call to create or update the user in the database
        const response = await axios.post(`${API_URL}/api/v1/user/createUser`, {
          uid: userCredential.user.uid,
          name: userCredential.user.displayName,
          email: userCredential.user.email,
          phoneNumber: userCredential.user.phoneNumber,
        });

        if (response.data.status === 'success') {
          navigate.navigate('NavigationScreen');
        } else {
          setErrorMessage('Failed to create user in the database');
        }
      } catch (error) {
        console.log(error);
        setErrorMessage(error.message);
      } finally {
        setIsloading(false);
      }
    }
  };


  const handleEditPhoneNumber = () => {
    setEditPhoneNumber(true);
    setShowOtpInput(false);
    setCountdownTimer(60);
  };

  const formatMobileNumber = (value) => {
    const formattedValue = value.replace(/\D/g, '');
    return formattedValue;
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <Text style={styles.heading}>Common Pool Vehicle Booking</Text>
        <View style={styles.loginContainer}>
          <Text style={styles.label}>Login</Text>
          <Text style={styles.details}>Fill up the details to Log in to your account</Text>
          <Text style={styles.mobileNumberLabel}>Mobile Number</Text>
          <View style={styles.mobileNumberContainer}>
            <TextInput
              style={[styles.mobileNumberInput, !editPhoneNumber && styles.disabledInput]}
              placeholder="Enter your mobile number"
              placeholderTextColor={'gray'}
              value={mobileNumber}
              onChangeText={(value) => setMobileNumber(formatMobileNumber(value))}
              keyboardType="phone-pad"
              editable={editPhoneNumber}
            />
            {showOtpInput && !editPhoneNumber && (
              <TouchableOpacity style={styles.editPhoneNumberIcon} onPress={handleEditPhoneNumber}>
                <Icon name="edit" size={20} color="black" />
              </TouchableOpacity>
            )}
          </View>
          {showOtpInput && (
            <>
              <Text style={styles.mobileNumberLabel}>OTP</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter OTP"
                placeholderTextColor={'gray'}
                value={otpInput}
                onChangeText={setOtpInput}
                keyboardType="number-pad"
                maxLength={6}
              />
              {countdownTimer > 0 ? (
                <Text style={styles.countdownText}>Resend OTP in {countdownTimer} seconds</Text>
              ) : (
                <TouchableOpacity onPress={handleLogin}>
                  <Text style={styles.resendOtpText}>Resend OTP</Text>
                </TouchableOpacity>
              )}
            </>
          )}
          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
          <TouchableOpacity style={styles.loginButton} onPress={showOtpInput ? handleOtpVerification : handleLogin} disabled={isloading}>
            {isloading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="white" />
              </View>
            ) : (
              <Text style={styles.loginButtonText}>{showOtpInput ? 'VERIFY' : 'LOGIN'}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A4333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    marginTop: 60,
    fontSize: 34,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 40,
  },
  mobileNumberLabel: {
    alignSelf: 'flex-start',
    color: 'black',
    marginBottom: 5,
  },
  loginContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderTopRightRadius: 20,
    borderTopLeftRadius: 20,
    width: '100%',
  },
  label: {
    alignSelf: 'center',
    color: 'black',
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  details: {
    justifyContent: 'space-between',
    alignSelf: 'center',
    color: '#424B54',
    fontSize: 16,
    marginBottom: 10,
  },
  input: {

    height: 40,
    borderColor: '#CCCCCC',
    borderWidth: 1,
    borderRadius: 40,
    paddingHorizontal: 10,
    marginBottom: 10,
    color: 'black',
  },


  mobileNumberInput: {
    flex: 1,
    height: 40,
    borderColor: '#CCCCCC',
    borderWidth: 1,
    borderRadius: 40,
    paddingHorizontal: 10,
    marginBottom: 10,
    color: 'black',
  },
  disabledInput: {
    backgroundColor: '#F5F5F5',
  },
  mobileNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editPhoneNumberIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  errorText: {
    color: 'red',

    padding: 10,
  },
  loginButton: {
    backgroundColor: '#1A4333',
    paddingVertical: 10,
    borderRadius: 40,
  },
  loginButtonText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  countdownText: {
    color: 'green',
    marginTop: 10,
    textAlign: 'center',
  },
  resendOtpText: {
    color: 'blue',
    marginTop: 10,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
});

export default LoginScreen;