import React, { useState, useEffect } from "react";
import { 
  SafeAreaView, 
  ScrollView, 
  View, 
  Text, 
  TextInput, 
  Pressable, 
  StyleSheet, 
  Alert 
} from "react-native";
import { auth } from "../firebaseConfig";
import {
  updatePassword,
  updateProfile,
  updateEmail,
  signOut,
  EmailAuthProvider,
  reauthenticateWithCredential,
  onAuthStateChanged,
} from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";

const db = getFirestore();

const AccountScreen = ({ navigation }) => {
  // Local state for user information.
  const [userInfo, setUserInfo] = useState(null);
  // States for updating profile info.
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  // Toggle for showing profile update form.
  const [showUpdateProfileForm, setShowUpdateProfileForm] = useState(false);
  // States for password reset form.
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showResetForm, setShowResetForm] = useState(false);

  // Subscribe to auth state changes so the component refreshes when the user logs in or out.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // If user is logged in, update userInfo and pre-fill update fields.
        setUserInfo({
          email: user.email,
          name: user.displayName || "No Name",
          createdAt: new Date(user.metadata.creationTime).toLocaleDateString(),
        });
        setNewName(user.displayName || "");
        setNewEmail(user.email);
      } else {
        // If user logs out, clear userInfo.
        setUserInfo(null);
      }
    });
    return unsubscribe;
  }, []);

  // Show a loading view if userInfo is not set.
  if (userInfo === null) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.error}>You must be logged in to view account details.</Text>
          <Pressable style={styles.loginButton} onPress={() => navigation.navigate("Login")}>
            <Text style={styles.loginButtonText}>Login</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Handler to update the user's profile (name and email).
  const handleUpdateProfile = async () => {
    const user = auth.currentUser;
    if (!user) return; // Safety check.
    try {
      if (newName !== user.displayName) {
        await updateProfile(user, { displayName: newName });
      }
      if (newEmail !== user.email) {
        await updateEmail(user, newEmail);
      }
      await setDoc(doc(db, "users", user.uid), { email: newEmail, name: newName }, { merge: true });
      Alert.alert("Success", "Profile updated successfully!");
      // Update local state.
      setUserInfo({
        email: newEmail,
        name: newName,
        createdAt: user.metadata.creationTime
          ? new Date(user.metadata.creationTime).toLocaleDateString()
          : "",
      });
      setShowUpdateProfileForm(false);
    } catch (error) {
      Alert.alert("Update Error", error.message);
    }
  };

  // Handler for password update.
  const handleUpdatePassword = async () => {
    if (!currentPassword.trim()) {
      Alert.alert("Error", "Please enter your current password.");
      return;
    }
    if (!newPassword.trim() || !confirmNewPassword.trim()) {
      Alert.alert("Error", "Please enter and confirm your new password.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      Alert.alert("Error", "New passwords do not match.");
      return;
    }
    try {
      const user = auth.currentUser;
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      Alert.alert("Success", "Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setShowResetForm(false);
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  // Handler for logging out.
  const handleLogout = async () => {
    try {
      await signOut(auth);
      Alert.alert("Logged Out", "You have been logged out.");
      // onAuthStateChanged will trigger and update userInfo.
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          {/* Header: Account Information */}
          <Text style={styles.headerLabel}>Account Information</Text>
          <Text style={styles.info}>Email: {userInfo.email}</Text>
          <Text style={styles.info}>Name: {userInfo.name}</Text>
          <Text style={styles.info}>Account Created: {userInfo.createdAt}</Text>

          {/* Button to toggle profile update form */}
          <Pressable style={styles.updateButton} onPress={() => setShowUpdateProfileForm(!showUpdateProfileForm)}>
            <Text style={styles.updateButtonText}>
              {showUpdateProfileForm ? "Cancel Profile Update" : "Update Profile"}
            </Text>
          </Pressable>

          {/* Profile Update Form */}
          {showUpdateProfileForm && (
            <View style={styles.updateForm}>
              <TextInput
                style={styles.input}
                value={newName}
                onChangeText={setNewName}
                placeholder="Update Name"
                autoCapitalize="none"
                placeholderTextColor="#888"
              />
              <TextInput
                style={styles.input}
                value={newEmail}
                onChangeText={setNewEmail}
                placeholder="Update Email"
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#888"
              />
              <Pressable style={styles.button} onPress={handleUpdateProfile}>
                <Text style={styles.buttonText}>Submit Profile Update</Text>
              </Pressable>
            </View>
          )}

          {/* Password Reset Section */}
          <Pressable style={styles.resetButton} onPress={() => setShowResetForm(!showResetForm)}>
            <Text style={styles.resetButtonText}>
              {showResetForm ? "Cancel Password Reset" : "Reset Password"}
            </Text>
          </Pressable>
          {showResetForm && (
            <View style={styles.resetForm}>
              <TextInput
                style={styles.input}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Enter Current Password"
                secureTextEntry
                placeholderTextColor="#888"
              />
              <TextInput
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Enter New Password"
                secureTextEntry
                placeholderTextColor="#888"
              />
              <TextInput
                style={styles.input}
                value={confirmNewPassword}
                onChangeText={setConfirmNewPassword}
                placeholder="Confirm New Password"
                secureTextEntry
                placeholderTextColor="#888"
              />
              <Pressable style={styles.button} onPress={handleUpdatePassword}>
                <Text style={styles.buttonText}>Update Password</Text>
              </Pressable>
            </View>
          )}

          {/* Logout Button */}
          <Pressable style={[styles.button, styles.logoutButton]} onPress={handleLogout}>
            <Text style={styles.buttonText}>Log Out</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f6fa",
  },
  scrollContent: {
    padding: 20,
    justifyContent: "center",
  },
  card: {
    backgroundColor: "#ffffff",
    padding: 20,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  headerLabel: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#333",
  },
  info: {
    fontSize: 18,
    marginBottom: 10,
    color: "#333",
  },
  updateButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 6,
    alignItems: "center",
    marginBottom: 15,
  },
  updateButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  updateForm: {
    marginBottom: 20,
  },
  resetButton: {
    backgroundColor: "#d11a2a",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 6,
    alignItems: "center",
    marginBottom: 15,
  },
  resetButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  resetForm: {
    marginBottom: 20,
  },
  input: {
    height: 45,
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    backgroundColor: "#f9f9f9",
    marginBottom: 15,
    fontSize: 16,
    color: "#333",
  },
  button: {
    backgroundColor: "#2196F3",
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: "center",
    marginTop: 10,
  },
  logoutButton: {
    backgroundColor: "#d11a2a",
    marginTop: 20,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  loginButton: {
    backgroundColor: "#2196F3",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 6,
    alignItems: "center",
    marginTop: 20,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  loadingText: {
    fontSize: 16,
    color: "gray",
  },
  error: {
    fontSize: 16,
    color: "red",
    textAlign: "center",
    marginBottom: 10,
  },
});

export default AccountScreen;