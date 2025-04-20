// Main function to run the Genetic Algorithm optimizer
export function runGeneticCuttingOptimizer(stockLengths, desiredCuttings, {
  populationSize = 50,     // Number of candidate solutions in each generation
  generations = 100,       // How many generations to evolve
  mutationRate = 0.1       // Probability of mutation for each gene
} = {}) {
  const cuttingCount = desiredCuttings.length;

  // --- Step 1: Initialize Population ---
  // Each individual is an array where each index represents a cutting,
  // and the value at that index represents the stock it's assigned to.
  let population = Array.from({ length: populationSize }, () => {
    return Array.from({ length: cuttingCount }, () =>
      Math.floor(Math.random() * stockLengths.length) // Assign a random stock for each cutting
    );
  });

  let bestIndividual = null;
  let bestFitness = -Infinity;
  let bestUnplacedCuttings = [];
  let bestUnplacedStocks = [];

  // --- Step 2: Evolve through Generations ---
  for (let gen = 0; gen < generations; gen++) {
    // Evaluate fitness of each individual
    const evaluated = population.map(individual => {
      const {
        fitness,
        unplacedCuttings,
        unplacedStocks,
        cuttingPlans
      } = evaluateFitness(individual, stockLengths, desiredCuttings);

      return { individual, fitness, unplacedCuttings, unplacedStocks, cuttingPlans };
    });

    // Sort population by fitness (best first)
    evaluated.sort((a, b) => b.fitness - a.fitness);

    // Save best individual if it's the best seen so far
    if (evaluated[0].fitness > bestFitness) {
      bestFitness = evaluated[0].fitness;
      bestIndividual = evaluated[0].individual;
      bestUnplacedCuttings = evaluated[0].unplacedCuttings;
      bestUnplacedStocks = evaluated[0].unplacedStocks;
    }

    // --- Step 3: Selection ---
    // Top 20% of population survives to next generation
    const survivors = evaluated.slice(0, Math.floor(populationSize * 0.2));

    // --- Step 4: Crossover and Mutation ---
    const newPopulation = [...survivors.map(e => e.individual)];

    while (newPopulation.length < populationSize) {
      // Select two parents randomly from survivors
      const parent1 = randomChoice(survivors).individual;
      const parent2 = randomChoice(survivors).individual;

      // Produce child using crossover and mutation
      const child = crossover(parent1, parent2);
      mutate(child, stockLengths.length, mutationRate);

      newPopulation.push(child);
    }

    population = newPopulation;
  }

  // --- Step 5: Decode final best individual into a cutting plan ---
  return generateCuttingPlan(bestIndividual, stockLengths, desiredCuttings, bestUnplacedCuttings, bestUnplacedStocks);
}

function evaluateFitness(individual, stockLengths, cuttings) {
  // Create a stock usage map with remaining lengths and assigned cuts
  const stockUsage = stockLengths.map(length => ({
    original: length,
    remaining: length,
    cuts: []
  }));

  const unplacedCuttings = [];

  // Try to place each cutting on the assigned stock
  for (let i = 0; i < individual.length; i++) {
    const stockIdx = individual[i];
    const cutting = cuttings[i];
    const stock = stockUsage[stockIdx];

    // If it fits, assign it
    if (stock.remaining >= cutting) {
      stock.remaining -= cutting;
      stock.cuts.push(cutting);
    } else {
      unplacedCuttings.push(cutting); // If not, mark as unplaced
    }
  }

  // Filter out all stocks that were used
  const usedStocks = stockUsage.filter(s => s.cuts.length > 0);
  // Filter out stocks that were never used
  const unplacedStocks = stockUsage.filter(s => s.cuts.length === 0).map(s => s.original);

  // Calculate the total length of all used stocks
  const totalUsed = usedStocks.reduce((sum, s) => sum + s.original, 0);
  // Calculate the total length of cuttings placed across all used stocks
  const totalCut = usedStocks.reduce((sum, s) => sum + s.cuts.reduce((a, b) => a + b, 0), 0);
  // Compute the usage rate as (total cuttings placed) / (total length of stock used)
  const usageRate = totalUsed > 0 ? totalCut / totalUsed : 0;

  // Fitness = reward for placed cuts, reward for good usage rate, penalty for using too many stocks
  const fitness = (cuttings.length - unplacedCuttings.length) * 1000 + usageRate * 100 - usedStocks.length * 5;

  return {
    fitness,
    cuttingPlans: usedStocks,
    unplacedCuttings,
    unplacedStocks
  };
}

// Randomly combine genes (assignments) from two parents
function crossover(parent1, parent2) {
  const point = Math.floor(Math.random() * parent1.length);
  return parent1.slice(0, point).concat(parent2.slice(point));
}

// Randomly mutate genes based on mutation rate
function mutate(individual, stockLengthCount, rate) {
  for (let i = 0; i < individual.length; i++) {
    if (Math.random() < rate) {
      individual[i] = Math.floor(Math.random() * stockLengthCount);
    }
  }
}

// Pick a random element from an array
function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Converts a selected "assignment" (individual) into a structured cutting plan
function generateCuttingPlan(assignments, stockLengths, cuttings, unplacedCuttings, unplacedStocks) {
  const usageMap = {};

  // Loop through all cutting assignments
  // Each cutting is assigned to a stock index (via `assignments`)
  assignments.forEach((stockIdx, i) => {
    const stockLength = stockLengths[stockIdx];
    const cutting = cuttings[i];

    // Create a unique key combining the stock index and its original length
    // This is necessary in case multiple stocks have the same length
    const key = `${stockIdx}-${stockLength}`;

    // Initialize an entry in the usageMap if this stock hasn't been used yet
    if (!usageMap[key]) {
      usageMap[key] = {
        stock: stockLength,          // Original stock length
        cutting: [],                 // List of cuttings placed in this stock
        remaining: stockLength       // Remaining unused length
      };
    }

    // Try to place the cutting into the stock (if space allows)
    if (usageMap[key].remaining >= cutting) {
      usageMap[key].cutting.push(cutting);         // Add cutting to the list
      usageMap[key].remaining -= cutting;          // Subtract from remaining length
    } 
    // NOTE: Else: This cutting is silently ignored here — but it's already tracked in `unplacedCuttings`
  });

  // Convert the usageMap object into an array of cutting plan objects
  const cuttingPlans = Object.values(usageMap);

  // Calculate the total length of stock used (sum of original lengths)
  const totalUsedStockLength = cuttingPlans.reduce((sum, p) => sum + p.stock, 0);

  // Calculate total length of all placed cuttings
  const totalCuttingsLength = cuttingPlans.reduce(
    (sum, p) => sum + p.cutting.reduce((a, b) => a + b, 0),
    0
  );

  // Usage rate = percentage of stock material actually used
  const usageRate = totalUsedStockLength > 0 ? totalCuttingsLength / totalUsedStockLength : 0;

  return {
    cuttingPlans, 
    unplacedCuttings, 
    unplacedStocks, 
    usageRate 
  };
}