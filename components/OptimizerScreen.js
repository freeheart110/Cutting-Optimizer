import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  Alert, 
  ScrollView, 
  Pressable 
} from 'react-native';
import { calculateOptimalCuttingPlan } from '../utils/Optimizer';
import { Ionicons } from '@expo/vector-icons';

const OptimizerScreen = ({ navigation }) => {
  // State for stock lengths and desired cuttings input rows.
  const [stockLengths, setStockLengths] = useState([
    { id: Date.now(), length: '', quantity: 1 },
  ]);
  const [desiredCuttings, setDesiredCuttings] = useState([
    { id: Date.now(), length: '', quantity: 1 },
  ]);
  
  // State to toggle unlimited stock mode.
  const [unlimitedStock, setUnlimitedStock] = useState(false);

  // Calculate the optimal cutting plan and navigate to the Reports screen.
  const calculateOptimalPlan = () => {
    try {
      // For unlimited stock, use a very large quantity (e.g. 99, ).
      const stockArray = stockLengths.flatMap(stock => {
        const qty = unlimitedStock ? 20 : stock.quantity;
        return Array(qty).fill(parseFloat(stock.length) || 0);
      });
      // Convert desired cuttings/quantities into an array for the optimizer.
      const cuttingArray = desiredCuttings.flatMap(cutting =>
        Array(cutting.quantity).fill(parseFloat(cutting.length) || 0)
      );
      // Calculate the optimal cutting plan.
      const result = calculateOptimalCuttingPlan(stockArray, cuttingArray);
      // Navigate to the Reports screen with updated results.
      navigation.navigate('Reports', {
        stockLengths,
        desiredCuttings,
        cuttingPlans: result.cuttingPlans,
        unplacedCuttings: result.unplacedCuttings,
        unplacedStocks: unlimitedStock ? [] : result.unplacedStocks, // Pass empty array if unlimited mode is on
        usageRate: result.usageRate,
      });
    } catch (error) {
      Alert.alert('Error', 'Invalid input format. Please check your inputs.');
    }
  };

  // Add a new stock length row.
  const addStockLength = () => {
    setStockLengths([...stockLengths, { id: Date.now(), length: '', quantity: 1 }]);
  };

  // Add a new desired cutting row.
  const addDesiredCutting = () => {
    setDesiredCuttings([...desiredCuttings, { id: Date.now(), length: '', quantity: 1 }]);
  };

  // Update a specific stock length row.
  const updateStockLength = (id, field, value) => {
    setStockLengths(stockLengths.map(stock => {
      if (stock.id === id) {
        return {
          ...stock,
          [field]: field === 'quantity'
            ? (value === '' ? '' : parseInt(value, 10) || 1)
            : value,
        };
      }
      return stock;
    }));
  };

  // Update a specific desired cutting row.
  const updateDesiredCutting = (id, field, value) => {
    setDesiredCuttings(desiredCuttings.map(cutting => {
      if (cutting.id === id) {
        return {
          ...cutting,
          [field]: field === 'quantity'
            ? (value === '' ? '' : parseInt(value, 10) || 1)
            : value,
        };
      }
      return cutting;
    }));
  };

  // Remove a specific stock length row.
  const removeStockRow = (id) => {
    setStockLengths(stockLengths.filter(stock => stock.id !== id));
  };

  // Remove a specific desired cutting row.
  const removeDesiredCuttingRow = (id) => {
    setDesiredCuttings(desiredCuttings.filter(cutting => cutting.id !== id));
  };

  // Clear all input rows.
  const clearAllInputs = () => {
    setStockLengths([{ id: Date.now(), length: '', quantity: 1 }]);
    setDesiredCuttings([{ id: Date.now(), length: '', quantity: 1 }]);
  };

  return (
    <ScrollView 
      style={styles.scrollView}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Header Section with Clear All and Unlimited Stock Toggle */}
      <View style={styles.headerRow}>
        <Pressable 
          style={[styles.unlimitedButton, unlimitedStock && styles.unlimitedButtonActive]} 
          onPress={() => setUnlimitedStock(!unlimitedStock)}
        >
          <Text style={styles.unlimitedButtonText}>
            {unlimitedStock ? "Unlimited Stock: ON" : "Unlimited Stock: OFF"}
          </Text>
        </Pressable>
        <Pressable style={styles.clearAllButton} onPress={clearAllInputs}>
          <Text style={styles.clearAllButtonText}>Clear All</Text>
        </Pressable>
      </View>

      {/* Stock Lengths Section */}
      <Text style={styles.sectionLabel}>Stock Lengths:</Text>
      {stockLengths.map((stock) => (
        <View key={stock.id} style={styles.rowContainer}>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={stock.length}
            onChangeText={(text) => updateStockLength(stock.id, 'length', text)}
            placeholder="Length"
            placeholderTextColor="#888"
          />
          <TextInput
            style={[
              styles.inputSmall,
              unlimitedStock && { backgroundColor: "#ccc", color: "#888" }
            ]}
            keyboardType="numeric"
            value={stock.quantity.toString()}
            onChangeText={(text) => updateStockLength(stock.id, 'quantity', text)}
            placeholder="Qty"
            placeholderTextColor="#888"
            editable={!unlimitedStock} // Disable input when unlimited stock mode is on
          />
          {/* Delete icon for stock row */}
          <Pressable style={styles.iconButton} onPress={() => removeStockRow(stock.id)}>
            <Ionicons name="trash" size={24} color="#d11a2a" />
          </Pressable>
        </View>
      ))}
      <Pressable style={styles.addButton} onPress={addStockLength}>
        <Text style={styles.addButtonText}>Add Stock Length</Text>
      </Pressable>

      {/* Desired Cuttings Section */}
      <Text style={styles.sectionLabel}>Desired Cuttings:</Text>
      {desiredCuttings.map((cutting) => (
        <View key={cutting.id} style={styles.rowContainer}>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={cutting.length}
            onChangeText={(text) => updateDesiredCutting(cutting.id, 'length', text)}
            placeholder="Length"
            placeholderTextColor="#888"
          />
          <TextInput
            style={styles.inputSmall}
            keyboardType="numeric"
            value={cutting.quantity.toString()}
            onChangeText={(text) => updateDesiredCutting(cutting.id, 'quantity', text)}
            placeholder="Qty"
            placeholderTextColor="#888"
          />
          {/* Delete icon for desired cutting row */}
          <Pressable style={styles.iconButton} onPress={() => removeDesiredCuttingRow(cutting.id)}>
            <Ionicons name="trash" size={24} color="#d11a2a" />
          </Pressable>
        </View>
      ))}
      <Pressable style={styles.addButton} onPress={addDesiredCutting}>
        <Text style={styles.addButtonText}>Add Desired Cutting</Text>
      </Pressable>

      {/* Calculate Button */}
      <Pressable style={styles.calculateButton} onPress={calculateOptimalPlan}>
        <Text style={styles.calculateButtonText}>Calculate Optimal Plan</Text>
      </Pressable>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: "#f4f6fa",
  },
  contentContainer: {
    padding: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: "#ffffff",
    padding: 10,
    borderRadius: 8,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  headerLabel: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  unlimitedButton: {
    backgroundColor: "#ddd",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: 'center',
  },
  clearAllButton: {
    backgroundColor: "#d11a2a",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  clearAllButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  unlimitedButtonActive: {
    backgroundColor: "#4CAF50",
  },
  unlimitedButtonText: {
    color: "#333",
    fontSize: 16,
    fontWeight: "600",
  },
  sectionLabel: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    backgroundColor: "#ffffff",
    padding: 10,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  input: {
    flex: 3,
    height: 45,
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    backgroundColor: "#f9f9f9",
  },
  inputSmall: {
    flex: 1,
    height: 45,
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    backgroundColor: "#f9f9f9",
    marginLeft: 10,
  },
  iconButton: {
    marginLeft: 10,
    padding: 8,
  },
  addButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 6,
    alignItems: "center",
    marginBottom: 20,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  calculateButton: {
    backgroundColor: "#2196F3",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 6,
    alignItems: "center",
    marginTop: 20,
  },
  calculateButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default OptimizerScreen;