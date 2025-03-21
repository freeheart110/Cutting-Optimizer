export const calculateOptimalCuttingPlan = (stockLengths, desiredCuttings) => {
  // Run both algorithms.
  const resultFfd = calculateFfd(stockLengths, desiredCuttings);
  const resultBfd = calculateBfd(stockLengths, desiredCuttings);

  // Compare usage rates (higher usage rate means better utilization of stock)
  return resultFfd.usageRate >= resultBfd.usageRate ? resultFfd : resultBfd;
};

// First-Fit Decreasing (FFD) Algorithm
function calculateFfd(stockLengths, desiredCuttings) {
  // Sort stock lengths and desired cuttings in descending order.
  const sortedStocks = [...stockLengths].sort((a, b) => b - a);
  const sortedCuttings = [...desiredCuttings].sort((a, b) => b - a);

  // Initialize stocks with an object for each stock.
  const stocks = sortedStocks.map(length => ({
    original: length,
    remaining: length,
    cuttings: []
  }));

  // Array to hold cuttings that cannot be placed.
  const unplacedCuttings = [];

  // For each cutting, assign it to the first stock that can accommodate it.
  for (const cutting of sortedCuttings) {
    let placed = false;
    for (const stock of stocks) {
      if (stock.remaining >= cutting) {
        stock.cuttings.push(cutting);
        stock.remaining -= cutting;
        placed = true;
        break; // Move to the next cutting.
      }
    }
    if (!placed) {
      unplacedCuttings.push(cutting);
    }
  }

  // Generate cutting plans for stocks that were used.
  const cuttingPlans = stocks
    .filter(stock => stock.cuttings.length > 0)
    .map(stock => ({
      stock: stock.original,
      cutting: stock.cuttings,
      remaining: stock.remaining
    }));

  // Identify unused stocks.
  const unplacedStocks = stocks
    .filter(stock => stock.cuttings.length === 0)
    .map(stock => stock.original);

  // Calculate total length of stocks used.
  const totalUsedStockLength = cuttingPlans.reduce((sum, plan) => sum + plan.stock, 0);
  // Calculate total length of placed cuttings.
  const totalCuttingsLength = cuttingPlans.reduce((sum, plan) =>
    sum + plan.cutting.reduce((s, c) => s + c, 0), 0);

  // Usage rate: total cuttings length divided by total used stock length.
  const usageRate = totalUsedStockLength > 0 ? totalCuttingsLength / totalUsedStockLength : 0;

  return {
    cuttingPlans,
    unplacedCuttings,
    unplacedStocks,
    usageRate
  };
}

// Best-Fit Decreasing (BFD) Algorithm
function calculateBfd(stockLengths, desiredCuttings) {
  // Sort stock lengths and desired cuttings in descending order.
  const sortedStocks = [...stockLengths].sort((a, b) => b - a);
  const sortedCuttings = [...desiredCuttings].sort((a, b) => b - a);

  // Initialize stocks with an object for each stock.
  const stocks = sortedStocks.map(length => ({
    original: length,
    remaining: length,
    cuttings: []
  }));

  // Array to hold cuttings that cannot be placed.
  const unplacedCuttings = [];

  // For each cutting, assign it to the stock that leaves the least remaining space.
  for (const cutting of sortedCuttings) {
    // Find all stocks that can accommodate the cutting.
    const candidates = stocks.filter(stock => stock.remaining >= cutting);
    
    if (candidates.length > 0) {
      // Use reduce to pick the candidate with the smallest leftover space after placement.
      const bestStock = candidates.reduce((best, current) =>
        (current.remaining - cutting < best.remaining - cutting) ? current : best
      );
      bestStock.cuttings.push(cutting);
      bestStock.remaining -= cutting;
    } else {
      unplacedCuttings.push(cutting);
    }
  }

  // Generate cutting plans for stocks that were used.
  const cuttingPlans = stocks
    .filter(stock => stock.cuttings.length > 0)
    .map(stock => ({
      stock: stock.original,
      cutting: stock.cuttings,
      remaining: stock.remaining
    }));

  // Identify unused stocks.
  const unplacedStocks = stocks
    .filter(stock => stock.cuttings.length === 0)
    .map(stock => stock.original);

  // Calculate total length of stocks used.
  const totalUsedStockLength = cuttingPlans.reduce((sum, plan) => sum + plan.stock, 0);
  // Calculate total length of placed cuttings.
  const totalCuttingsLength = cuttingPlans.reduce((sum, plan) =>
    sum + plan.cutting.reduce((s, c) => s + c, 0), 0);

  // Usage rate: total cuttings length divided by total used stock length.
  const usageRate = totalUsedStockLength > 0 ? totalCuttingsLength / totalUsedStockLength : 0;

  return {
    cuttingPlans,
    unplacedCuttings,
    unplacedStocks,
    usageRate
  };
}