// This function calculates the optimal cutting plan by running three algorithms:
// First-Fit Decreasing (FFD), Best-Fit Decreasing (BFD), and a Genetic Optimizer.
// It dynamically compares their results using a weighted scoring system and selects the best.

import { runGeneticCuttingOptimizer } from './GeneticOptimizer';

export const calculateOptimalCuttingPlan = (stockLengths, desiredCuttings) => {
  // Run the First-Fit Decreasing (FFD) algorithm.
  const resultFfd = calculateFfd(stockLengths, desiredCuttings);
  // Run the Best-Fit Decreasing (BFD) algorithm.
  const resultBfd = calculateBfd(stockLengths, desiredCuttings);

  // Run the Genetic Optimization algorithm.
  const resultGenetic = runGeneticCuttingOptimizer(stockLengths, desiredCuttings);

  // Define weights for each metric.
  // Higher weight indicates greater importance.
  const weightUnplaced = 0.5; // Fewer unplaced cuttings (count) is preferred.
  const weightUsage = 0.3;    // Higher usage rate (cutting length / stock length) is preferred.
  const weightStocks = 0.2;   // Fewer stocks used (i.e. fewer entries in cuttingPlans) is preferred.

  // Helper function to compute the total length of cuttings from a given cuttingPlans array.
  const getTotalCuttingsLength = (plans) =>
    plans.reduce((sum, plan) => sum + plan.cutting.reduce((s, c) => s + c, 0), 0);

  // Calculate a weighted score for a result.
  // The score is higher when:
  // 1. There are fewer unplaced cuttings,
  // 2. The usage rate is higher, and
  // 3. Fewer stocks are used.
  const calculateScore = (result) => {
    // Inverse of unplaced count: using 1/(1 + count) ensures that as the number of
    // unplaced cuttings increases, the score decreases.
    const unplacedScore = weightUnplaced * (1 / (1 + result.unplacedCuttings.length));
    // Directly use the usage rate with its weight.
    const usageScore = weightUsage * result.usageRate;
    // Penalty based on the number of stocks used (lower is better).
    const stocksPenalty = weightStocks * result.cuttingPlans.length;
    // Total score is the sum of positive scores minus the penalty.
    return unplacedScore + usageScore - stocksPenalty;
  };

  // Compute scores for the three algorithm results.
  const scoreFfd = calculateScore(resultFfd);
  const scoreBfd = calculateScore(resultBfd);
  const scoreGenetic = calculateScore(resultGenetic);

    // Determine the highest score
  const maxScore = Math.max(scoreFfd, scoreBfd, scoreGenetic);

  // Determine all winners
  const winners = [];
  if (scoreFfd === maxScore) winners.push('FFD');
  if (scoreBfd === maxScore) winners.push('BFD');
  if (scoreGenetic === maxScore) winners.push('Genetic');

  // Decide which result to return (priority: Genetic > BFD > FFD if tied)
  let bestResult;
  if (winners.includes('Genetic')) {
    bestResult = resultGenetic;
  } else if (winners.includes('BFD')) {
    bestResult = resultBfd;
  } else {
    bestResult = resultFfd;
  }

  // Log the results
  console.log(`Best algorithm${winners.length > 1 ? 's' : ''}: ${winners.join(', ')}`);
  console.log(`Scores — FFD: ${scoreFfd.toFixed(4)}, BFD: ${scoreBfd.toFixed(4)}, Genetic: ${scoreGenetic.toFixed(4)}`);
  return bestResult;
};

// -----------------------------------------------------------------------
// First-Fit Decreasing (FFD) Algorithm
// This algorithm assigns each cutting to the first stock that can accommodate it.
function calculateFfd(stockLengths, desiredCuttings) {
  // Sort stock lengths in descending order.
  const sortedStocks = [...stockLengths].sort((a, b) => b - a);
  // Sort desired cuttings in descending order.
  const sortedCuttings = [...desiredCuttings].sort((a, b) => b - a);

  // Create an array of stock objects.
  // Each stock has:
  // - original: the original length,
  // - remaining: initially equal to the original length, and
  // - cuttings: an empty array to store the cuttings assigned to it.
  const stocks = sortedStocks.map(length => ({
    original: length,
    remaining: length,
    cuttings: []
  }));

  // Initialize an array to store cuttings that cannot be placed in any stock.
  const unplacedCuttings = [];

  // For each cutting in the sorted list, try to place it in the first stock that has enough remaining length.
  for (const cutting of sortedCuttings) {
    let placed = false;
    for (const stock of stocks) {
      if (stock.remaining >= cutting) {
        stock.cuttings.push(cutting); // Assign the cutting.
        stock.remaining -= cutting;   // Reduce the remaining length.
        placed = true;
        break; // Move on to the next cutting once it is placed.
      }
    }
    // If no stock could accommodate the cutting, add it to unplacedCuttings.
    if (!placed) {
      unplacedCuttings.push(cutting);
    }
  }

  // Build the cutting plans by filtering stocks that have been used.
  const cuttingPlans = stocks
    .filter(stock => stock.cuttings.length > 0)
    .map(stock => ({
      stock: stock.original,   // Original stock length.
      cutting: stock.cuttings, // List of assigned cuttings.
      remaining: stock.remaining // Leftover length.
    }));

  // Identify stocks that were not used at all.
  const unplacedStocks = stocks
    .filter(stock => stock.cuttings.length === 0)
    .map(stock => stock.original);

  // Calculate the total length of stocks used in the cutting plans.
  const totalUsedStockLength = cuttingPlans.reduce((sum, plan) => sum + plan.stock, 0);
  // Calculate the total length of all cuttings placed.
  const totalCuttingsLength = cuttingPlans.reduce(
    (sum, plan) => sum + plan.cutting.reduce((s, c) => s + c, 0),
    0
  );
  // Compute the usage rate.
  const usageRate = totalUsedStockLength > 0 ? totalCuttingsLength / totalUsedStockLength : 0;

  return {
    cuttingPlans,
    unplacedCuttings,
    unplacedStocks,
    usageRate
  };
}

// -----------------------------------------------------------------------
// Best-Fit Decreasing (BFD) Algorithm
// This algorithm assigns each cutting to the stock that, after placement, would leave the smallest remaining space.
function calculateBfd(stockLengths, desiredCuttings) {
  // Sort stock lengths and desired cuttings in descending order.
  const sortedStocks = [...stockLengths].sort((a, b) => b - a);
  const sortedCuttings = [...desiredCuttings].sort((a, b) => b - a);

  // Create stock objects.
  const stocks = sortedStocks.map(length => ({
    original: length,
    remaining: length,
    cuttings: []
  }));

  // Initialize array for cuttings that cannot be placed.
  const unplacedCuttings = [];

  // For each cutting, find all stocks that can accommodate it.
  // Then choose the stock that minimizes the leftover space after placement.
  for (const cutting of sortedCuttings) {
    const candidates = stocks.filter(stock => stock.remaining >= cutting);
    if (candidates.length > 0) {
      // Use reduce to select the best candidate.
      // For each candidate, compute (remaining - cutting) and select the smallest value.
      const bestStock = candidates.reduce((best, current) =>
        (current.remaining - cutting < best.remaining - cutting) ? current : best
      );
      bestStock.cuttings.push(cutting);   // Assign the cutting.
      bestStock.remaining -= cutting;       // Update remaining length.
    } else {
      // If no candidate can accommodate the cutting, add it to unplacedCuttings.
      unplacedCuttings.push(cutting);
    }
  }

  // Build the cutting plans.
  const cuttingPlans = stocks
    .filter(stock => stock.cuttings.length > 0)
    .map(stock => ({
      stock: stock.original,
      cutting: stock.cuttings,
      remaining: stock.remaining
    }));

  // Identify stocks that were not used.
  const unplacedStocks = stocks
    .filter(stock => stock.cuttings.length === 0)
    .map(stock => stock.original);

  // Calculate total used stock length and total cutting length.
  const totalUsedStockLength = cuttingPlans.reduce((sum, plan) => sum + plan.stock, 0);
  const totalCuttingsLength = cuttingPlans.reduce(
    (sum, plan) => sum + plan.cutting.reduce((s, c) => s + c, 0),
    0
  );
  const usageRate = totalUsedStockLength > 0 ? totalCuttingsLength / totalUsedStockLength : 0;

  return {
    cuttingPlans,
    unplacedCuttings,
    unplacedStocks,
    usageRate
  };
}