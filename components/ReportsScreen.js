import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ScrollView, Pressable, Modal, FlatList } from 'react-native';
import { auth } from '../firebaseConfig';
import { getFirestore, collection, addDoc, query, getDocs } from 'firebase/firestore';

const db = getFirestore();

const ReportsScreen = ({ route, navigation }) => {
  // Destructure parameters from route, providing default values
  const {
    stockLengths = [],
    desiredCuttings = [],
    cuttingPlans = [],
    unplacedCuttings = [],
    unplacedStocks = [],
    usageRate = 0,
  } = route.params || {};

  const [projectName, setProjectName] = useState('');
  const [materialType, setMaterialType] = useState('');
  const [existingProjects, setExistingProjects] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch existing project names from Firestore
  useEffect(() => {
    const fetchExistingProjects = async () => {
      if (auth.currentUser) {
        try {
          const reportsRef = collection(db, 'users', auth.currentUser.uid, 'reports');
          const q = query(reportsRef);
          const querySnapshot = await getDocs(q);
          const projectNames = new Set();
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.projectName) {
              projectNames.add(data.projectName);
            }
          });
          setExistingProjects(Array.from(projectNames));
        } catch (error) {
          console.error('Error fetching existing projects:', error);
        }
      }
    };
    fetchExistingProjects();
  }, []);

  // Render the bar chart using cuttingPlans
  const renderBar = () => {
    if (!cuttingPlans || cuttingPlans.length === 0) {
      return <Text style={styles.error}>No cutting plans available.</Text>;
    }
    return (
      <View style={styles.barContainer}>
        {cuttingPlans.map((plan, stockIdx) => {
          const sections = [
            ...plan.cutting.map(cut => ({ length: cut, type: 'cutting' })),
            plan.remaining > 0 ? { length: plan.remaining, type: 'remaining' } : null,
          ].filter(section => section !== null);
          return (
            <View key={stockIdx} style={styles.planContainer}>
              <Text style={styles.stockLabel}>Stock: {plan.stock}</Text>
              <View style={styles.singleBar}>
                {sections.map((section, index) => {
                  const ratio = section.length / plan.stock;
                  const backgroundColor =
                    section.type === 'remaining'
                      ? 'lightgray'
                      : `hsl(${(index * 60) % 360}, 70%, 50%)`;
                  return (
                    <View
                      key={index}
                      style={{
                        flex: ratio,
                        backgroundColor,
                        justifyContent: 'center',
                        alignItems: 'center',
                        paddingHorizontal: 2,
                        borderRightWidth: 1,
                        borderRightColor: '#fff',
                      }}
                    >
                      {section.type === 'cutting' && (
                        <Text style={styles.segmentLabel}>{section.length}</Text>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  // Save the report data to Firestore
  const saveReport = async () => {
    if (!projectName.trim() || !materialType.trim()) {
      Alert.alert('Error', 'Please provide both project name and material type.');
      return;
    }
    setIsSaving(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No user is logged in.');
      }
      const reportData = {
        projectName: projectName,
        materialType: materialType,
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
      setProjectName('');
      setMaterialType('');
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
      <Text style={styles.subTitle}>Bar Chart</Text>
      {renderBar()}

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

      {/* Project Name Input */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Project Name</Text>
        <View style={styles.row}>
          <TextInput
            style={styles.input}
            placeholder="Enter or select project name"
            value={projectName}
            onChangeText={setProjectName}
          />
          <Pressable style={styles.selectButton} onPress={() => setModalVisible(true)}>
            <Text style={styles.selectButtonText}>Select</Text>
          </Pressable>
        </View>
      </View>

      {/* Material Type Input */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Material Type</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter material type"
          value={materialType}
          onChangeText={setMaterialType}
        />
      </View>

      {/* Save Report Button */}
      {auth.currentUser ? (
        <Pressable style={styles.saveButton} onPress={saveReport} disabled={isSaving}>
          <Text style={styles.saveButtonText}>{isSaving ? 'Saving...' : 'Save Report'}</Text>
        </Pressable>
      ) : (
        <Pressable style={styles.saveButton} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.saveButtonText}>Login to Save Report</Text>
        </Pressable>
      )}

      {/* Modal for Selecting Existing Project Names */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Existing Project</Text>
            {existingProjects.length > 0 ? (
              <FlatList
                data={existingProjects}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <Pressable
                    style={styles.projectItem}
                    onPress={() => {
                      setProjectName(item);
                      setModalVisible(false);
                    }}
                  >
                    <Text style={styles.projectText}>{item}</Text>
                  </Pressable>
                )}
              />
            ) : (
              <Text style={styles.noProjectsText}>No existing projects found.</Text>
            )}
            <Pressable style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

// Styles remain unchanged
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#f4f6fa',
  },
  subTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#333',
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
    color: '#333',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 45,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    fontSize: 16,
    color: '#333',
  },
  selectButton: {
    marginLeft: 10,
    backgroundColor: '#ddd',
    padding: 10,
    borderRadius: 5,
  },
  selectButtonText: {
    color: '#333',
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    maxHeight: '60%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  projectItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  projectText: {
    fontSize: 16,
  },
  noProjectsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  closeButton: {
    marginTop: 10,
    backgroundColor: '#2196F3',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  barContainer: {
    marginVertical: 10,
  },
  planContainer: {
    marginBottom: 20,
  },
  stockLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
    color: '#333',
  },
  singleBar: {
    flexDirection: 'row',
    height: 30,
    width: '100%',
    borderRadius: 4,
    overflow: 'hidden',
  },
  segmentLabel: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
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
  error: {
    color: 'red',
    fontSize: 14,
    marginBottom: 10,
  },
  saveButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ReportsScreen;