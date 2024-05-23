import React, { useState, useContext, useEffect } from 'react';
import { Text, View, StyleSheet, TouchableOpacity, ScrollView, Image, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import auth from '@react-native-firebase/auth';
import { ActivityIndicator } from 'react-native';
import { HomeContext } from '../../../Components/Context/HomeContext';
import Toast from 'react-native-toast-message';
import { firebase } from '@react-native-firebase/auth';

const MoreScreen = () => {

  //Context Variables

  const { user, setUser } = useContext(HomeContext);


  useEffect(() => {
    firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        setUser(user);
      } else {
        setUser(null);
      }
    });
  }, []);

  const navigate = useNavigation();

  const [loading, setLoading] = useState(false);


  const handleMyProfile = () => {
    navigate.navigate('UserProfile');
  }

  const handleCustomerSupport = () => {
    navigate.navigate('SupportScreen');
  }

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await auth().signOut();
      navigate.navigate('Login');
      Toast.show({
        type: 'success',
        position: 'bottom',
        visibilityTime: 3000,
        text1: 'Signed Out Successfully',

      });
      Toast.show({
        type: 'success',
        position: 'bottom',
        visibilityTime: 3000,
        text1: 'Signed Out Successfully',

      });
      /* Alert.alert('Signed Out Successfully'); */
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setLoading(false);
    }
  };


  return (
    <View style={styles.container}>
      <View style={styles.userInfoContainer}>
        <View style={styles.profilePicContainer}>
          <Image
            source={user?.photoURL ? { uri: user.photoURL } : require('../../../assets/images/profile.jpg')} style={styles.profilePic}
          />
        </View>
        <Text style={styles.username}>{user && user.displayName ? user.displayName : 'User'}</Text>
      </View>
      <ScrollView >
        <View style={styles.buttonsContainer}>

          <TouchableOpacity onPress={handleMyProfile}>
            <View style={styles.buttonContainer}>
              <Icon name="account" size={24} color="#333" />
              <Text style={styles.buttonText}>My Profile</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleCustomerSupport}>
            <View style={styles.buttonContainer} >
              <Icon name="headphones" size={24} color="#333" />
              <Text style={styles.buttonText}>Customer Support</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity>
            <View style={styles.buttonContainer}>
              <Icon name="information" size={24} color="#333" />
              <Text style={styles.buttonText}>Terms & Conditions</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity>
            <View style={styles.buttonContainer}>
              <Icon name="file-document" size={24} color="#333" />
              <Text style={styles.buttonText}>Privacy Policy</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity>
            <View style={styles.buttonContainer}>
              <Icon name="star" size={24} color="#333" />
              <Text style={styles.buttonText}>Rate App</Text>
            </View>
          </TouchableOpacity>

          {/*           <TouchableOpacity>
            <View style={styles.buttonContainer}>
              <Icon name="delete" size={24} color="#333" />
              <Text style={styles.buttonText}>Delete This Account</Text>
            </View>
          </TouchableOpacity>
 */}
          <TouchableOpacity onPress={handleSignOut}>
            <View style={styles.buttonContainer}>
              <Icon name="logout" size={24} color="#333" />
              {loading ? (
                <ActivityIndicator size="small" color="#333" />
              ) : (
                <Text style={styles.buttonText}>Sign Out</Text>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  userInfoContainer: {
    marginTop: 30,
    alignItems: 'center',
    marginBottom: 50,
  },
  profilePicContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  profilePic: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  username: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'black',
  },
  buttonsContainer: {
    flexDirection: 'column',
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },

  buttonText: {
    marginLeft: 16,
    fontSize: 16,
    color: 'black'
  },
});

export default MoreScreen;