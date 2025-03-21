import React from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ScrollView } from 'react-native';
import { auth } from '../firebaseConfig';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import BarChart from './BarChart'; 

const db = getFirestore();

const ReportsScreen = ({ route, navigation }) => {
  // Destructure parameters from route, providing default values.
  const {
    stockLengths = [],
    desiredCuttings = [],
    cuttingPlans = [],
    unplacedCuttings = [],
    unplacedStocks = [],
    usageRate = 0, // Single number, not an array.
  } = route.params || {};

  // Local state for the report name and saving status.
  const [reportName, setReportName] = React.useState('');
  const [isSaving, setIsSaving] = React.useState(false);

  // Function to save the report data to Firestore.
  const saveReport = async () => {
    if (!reportName.trim()) {
      Alert.alert('Error', 'Please provide a name for the report.');
      return;
    }
    setIsSaving(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No user is logged in.');
      }
      const reportData = {
        name: reportName,
        stockLengths: stockLengths || [],
        desiredCuttings: desiredCuttings || [],
        cuttingPlans: cuttingPlans || [],
        unplacedCuttings: unplacedCuttings || [],
        unplacedStocks: unplacedStocks || [],
        usageRate: usageRate || 0,
        createdAt: new Date(),
      };

      await addDoc(collection(db, 'users', user.uid, 'reports'), reportData);
      Alert.alert('Success', 'Report saved successfully!');
      setReportName('');
      navigation.goBack();
    } catch (error) {
      console.error('Error saving report:', error);
      Alert.alert('Error', error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Main Title */}
      <Text style={styles.mainTitle}>Report Summary</Text>
      
      {/* Bar Chart Section */}
      <Text style={styles.subTitle}>Bar Chart</Text>
      <BarChart cuttingPlans={cuttingPlans} />

      {/* Report Details Section */}
      <View style={styles.reportSection}>
        <Text style={styles.sectionHeader}>Cutting Plans</Text>
        {cuttingPlans.length > 0 ? (
          cuttingPlans.map((plan, idx) => (
            <Text key={idx} style={styles.reportText}>
              • Stock: {plan.stock}, Cuttings: [{plan.cutting.join(', ')}], Remaining: {plan.remaining}
            </Text>
          ))
        ) : (
          <Text style={styles.reportText}>No cutting plans available.</Text>
        )}
      </View>

      <View style={styles.reportSection}>
        <Text style={styles.sectionHeader}>Unplaced Items</Text>
        <Text style={styles.reportText}>
          Unplaced Cuttings: {unplacedCuttings.length > 0 ? unplacedCuttings.join(', ') : 'None'}
        </Text>
        <Text style={styles.reportText}>
          Unplaced Stocks: {unplacedStocks.length > 0 ? unplacedStocks.join(', ') : 'None'}
        </Text>
      </View>

      <View style={styles.reportSection}>
        <Text style={styles.sectionHeader}>Usage</Text>
        <Text style={styles.reportText}>
          Stock Usage Rate: {(usageRate * 100).toFixed(2)}%
        </Text>
      </View>

      {/* Input field for naming the report */}
      <TextInput
        style={styles.input}
        placeholder="Enter report name"
        value={reportName}
        onChangeText={setReportName}
      />
      
      {/* Save Report Button */}
      <Button
        title={isSaving ? 'Saving...' : 'Save Report'}
        onPress={saveReport}
        disabled={isSaving}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#f4f6fa',
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  subTitle: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
    textAlign: 'center',
  },
  reportSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 5,
    color: '#333',
  },
  reportText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
    marginBottom: 5,
  },
  input: {
    height: 45,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    width: '100%',
    marginBottom: 15,
    fontSize: 16,
    color: '#333',
  },
  error: {
    color: 'red',
    fontSize: 14,
    marginBottom: 10,
  },
});

export default ReportsScreen;