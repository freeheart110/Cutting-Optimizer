// __tests__/calculateOptimalCuttingPlan.test.js
import { calculateOptimalCuttingPlan } from '../path/to/your/Optimizer'; // adjust the path accordingly

describe('calculateOptimalCuttingPlan', () => {
  it('should correctly calculate cutting plans when all cuttings can be placed', () => {
    const stockLengths = [10, 8];
    const desiredCuttings = [5, 4, 3, 2];
    
    const result = calculateOptimalCuttingPlan(stockLengths, desiredCuttings);
    
    // Expected:
    // Stock 10 gets cuttings [5, 4] with remaining 1.
    // Stock 8 gets cuttings [3, 2] with remaining 3.
    expect(result.cuttingPlans).toHaveLength(2);
    expect(result.cuttingPlans[0]).toEqual({
      stock: 10,
      cutting: [5, 4],
      remaining: 1,
    });
    expect(result.cuttingPlans[1]).toEqual({
      stock: 8,
      cutting: [3, 2],
      remaining: 3,
    });
    expect(result.unplacedCuttings).toEqual([]);
    expect(result.unplacedStocks).toEqual([]);
    // usageRate = (5+4+3+2) / (10+8) = 14 / 18 ≈ 0.7778
    expect(result.usageRate).toBeCloseTo(14 / 18, 2);
  });

  it('should correctly handle cases where some cuttings cannot be placed', () => {
    const stockLengths = [5, 3];
    const desiredCuttings = [4, 4, 2];
    
    const result = calculateOptimalCuttingPlan(stockLengths, desiredCuttings);
    
    // Process:
    // - For cutting 4: stock 5 → placed; remaining becomes 1.
    // - Next cutting 4: stock 5 insufficient (1 < 4), stock 3 insufficient (3 < 4) → unplaced.
    // - For cutting 2: stock 3 → placed; remaining becomes 1.
    expect(result.cuttingPlans).toHaveLength(2);
    expect(result.cuttingPlans[0]).toEqual({
      stock: 5,
      cutting: [4],
      remaining: 1,
    });
    expect(result.cuttingPlans[1]).toEqual({
      stock: 3,
      cutting: [2],
      remaining: 1,
    });
    expect(result.unplacedCuttings).toEqual([4]);
    expect(result.unplacedStocks).toEqual([]);
    // usageRate = (4 + 2) / (5 + 3) = 6 / 8 = 0.75
    expect(result.usageRate).toBeCloseTo(0.75, 2);
  });

  it('should handle case with no stocks provided', () => {
    const stockLengths = [];
    const desiredCuttings = [3, 2];
    
    const result = calculateOptimalCuttingPlan(stockLengths, desiredCuttings);
    
    expect(result.cuttingPlans).toEqual([]);
    expect(result.unplacedCuttings).toEqual([3, 2]);
    expect(result.unplacedStocks).toEqual([]);
    expect(result.usageRate).toBe(0);
  });
});