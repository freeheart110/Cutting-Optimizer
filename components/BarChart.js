import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// To render cutting plan in bar chart format for report and history screens.
const BarChart = ({ cuttingPlans }) => {
  if (!cuttingPlans || cuttingPlans.length === 0) {
    return <Text style={styles.error}>No cutting plans available.</Text>;
  }

  return (
    <View style={styles.barContainer}>
      {cuttingPlans.map((plan, stockIdx) => {
        // Build an array of sections: one for each cutting and one for remaining (if any).
        const sections = [
          ...plan.cutting.map(cut => ({ length: cut, type: 'cutting' })),
          plan.remaining > 0 ? { length: plan.remaining, type: 'remaining' } : null,
        ].filter(section => section !== null);

        return (
          <View key={stockIdx} style={styles.planContainer}>
            {/* Label above each bar displaying the original stock length */}
            <Text style={styles.stockLabel}>Stock: {plan.stock}</Text>
            {/* Bar container where each section is rendered with proportional width */}
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
                    {/* Only cutting sections display their cutting length */}
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

const styles = StyleSheet.create({
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
  error: {
    color: 'red',
    fontSize: 14,
    marginBottom: 10,
  },
});

export default BarChart;