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
      // For unlimited stock, use a very large quantity (100).
      const stockArray = stockLengths.flatMap(stock => {
        const qty = unlimitedStock ? 100 : stock.quantity;
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
            editable={!unlimitedStock} // Disable input when unlimited mode is on
          />
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
    padding: 10, // Reduced overall padding for a compact view.
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: "#ffffff",
    padding: 8, // Smaller padding.
    borderRadius: 6,
    marginBottom: 10, // Reduced margin.
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  unlimitedButton: {
    backgroundColor: "#ddd",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 4,
  },
  unlimitedButtonActive: {
    backgroundColor: "#4CAF50",
  },
  unlimitedButtonText: {
    color: "#333",
    fontSize: 14,
    fontWeight: "600",
  },
  clearAllButton: {
    backgroundColor: "#d11a2a",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 4,
  },
  clearAllButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  sectionLabel: {
    fontSize: 18, // Slightly smaller font.
    fontWeight: "600",
    color: "#333",
    marginBottom: 6, // Reduced margin.
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10, // Reduced margin.
    backgroundColor: "#ffffff",
    padding: 8, // Reduced padding.
    borderRadius: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  input: {
    flex: 3,
    height: 40,
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 8, // Smaller padding.
    backgroundColor: "#f9f9f9",
    fontSize: 14, // Slightly smaller font.
    color: "#333",
  },
  inputSmall: {
    flex: 1,
    height: 40,
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 8,
    backgroundColor: "#f9f9f9",
    marginLeft: 8,
    fontSize: 14,
    color: "#333",
  },
  iconButton: {
    marginLeft: 8,
    padding: 6,
  },
  addButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    alignItems: "center",
    marginBottom: 10,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  calculateButton: {
    backgroundColor: "#2196F3",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 4,
    alignItems: "center",
    marginTop: 10,
  },
  calculateButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default OptimizerScreen;