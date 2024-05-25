import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, ActivityIndicator } from "react-native";
import { Picker } from "@react-native-picker/picker";
import auth from '@react-native-firebase/auth';
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import Toast from "react-native-toast-message";
import { API_URL } from "../../../../secrets";

const UserProfile = () => {
  const navigate = useNavigation();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [refresh, setRefresh] = useState(false);
  const [allowPhoneNumberEdit, setAllowPhoneNumberEdit] = useState(false);
  const [user, setUser] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [departmentsError, setDepartmentsError] = useState(null);

  useEffect(() => {
    setRefresh(false);
    const unsubscribe = auth().onAuthStateChanged(async (authUser) => {
      if (authUser) {
        setUser(authUser);
        setName(authUser.displayName);
        setEmail(authUser.email);
        setPhoneNumber(authUser.phoneNumber);
        fetchDepartments(authUser);
      }
    });

    return unsubscribe;
  }, [refresh]);

  useEffect(() => {
    if (user && !user.phoneNumber) {
      setAllowPhoneNumberEdit(true);
    }
  }, [user]);

  const fetchDepartments = async (authUser) => {
    setLoadingDepartments(true);
    setDepartmentsError(null);

    try {
      const token = await authUser.getIdToken();
      const response = await axios.get(`${API_URL}/api/v1/user/getdepartment`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 5000,
      });
      setDepartments(response.data);
    } catch (error) {
      console.log(error);
      setDepartmentsError('Failed to fetch departments. Please try again.');
    } finally {
      setLoadingDepartments(false);
    }
  };

  const handleSaveProfile = async () => {
    setLoading(true);

    try {
      const currentUser = auth().currentUser;

      if (
        name !== currentUser.displayName ||
        email !== currentUser.email ||
        phoneNumber !== currentUser.phoneNumber ||
        selectedDepartment !== null
      ) {
        // Update user profile in Firebase Authentication
        await currentUser.updateProfile({
          displayName: name,
        });

        // await currentUser.updateEmail(email); // Can't update email since email login is not enabled

        // Update user profile in MongoDB database
        const token = await currentUser.getIdToken();
        await axios.post(
          `${API_URL}/api/v1/user/updateProfile`,
          {
            name,
            email,
            phoneNumber,
            departmentId: selectedDepartment,
          },

          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            timeout: 5000,
          }

        );
      }

      setRefresh(true);

      Toast.show({
        type: 'success',
        position: 'bottom',
        visibilityTime: 3000,
        text1: 'Your Profile was updated!',
      });
    } catch (error) {
      console.log(error);
      Toast.show({
        type: 'error',
        position: 'bottom',
        visibilityTime: 3000,
        text1: 'Failed to update profile. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.fieldsContainer}>
        <TextInput
          style={styles.input}
          placeholder="Enter your name"
          placeholderTextColor="black"
          value={name}
          onChangeText={setName}
          color="black"
          fontWeight="bold"
        />
        <TextInput
          style={styles.input}
          placeholder="Enter your email"
          placeholderTextColor="black"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          color="black"
          fontWeight="bold"
        />
        {user && (
          <TextInput
            style={styles.input}
            placeholder="Enter your phone number"
            placeholderTextColor="black"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
            editable={allowPhoneNumberEdit}
            color="black"
            fontWeight="bold"
          />
        )}
        {loadingDepartments ? (
          <ActivityIndicator size="small" color="black" style={styles.loadingIndicator} />
        ) : departmentsError ? (
          <Text style={styles.errorText}>{departmentsError}</Text>
        ) : (
          <Picker
            style={styles.picker}
            selectedValue={selectedDepartment}
            onValueChange={(itemValue) => setSelectedDepartment(itemValue)}
          >
            <Picker.Item label="Select Department" value={null} />
            {departments.map((department) => (
              <Picker.Item key={department._id} label={department.name} value={department._id} />
            ))}
          </Picker>
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
  picker: {
    marginBottom: 10,
    borderColor: 'black',
    color: 'black',
    borderWidth: 1,
    borderRadius: 15,
  },
  loadingIndicator: {
    marginBottom: 10,
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
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