type NFT = Record<string, string | null>;
type TraitCounts = Record<string, Record<string, number>>;

function log2(x: number): number {
  return Math.log(x) / Math.log(2);
}

function calculateSurprisalScore(
  nft: NFT,
  traitCounts: TraitCounts,
  totalSupply: number
): number {
  if (!nft || Object.keys(nft).length === 0 || totalSupply <= 0) {
    return 0;
  }

  let score = 0;

  for (const [traitType, value] of Object.entries(nft)) {
    const traitValue = value ?? "null";

    const count = traitCounts[traitType]?.[traitValue] ?? 0;
    const probability = count / totalSupply;

    if (probability > 0) {
      const surprisal = -log2(probability);
      score += surprisal;
    }
    // Traits with P=1 add 0 to the score
  }

  return isNaN(score) ? 0 : score;
}

function calculateExpectedSurprisalScore(
  allNFTs: NFT[],
  traitCounts: TraitCounts,
  totalSupply: number
): number {
  if (!allNFTs || allNFTs.length === 0 || totalSupply <= 0) {
    return 1; // Return 1 to avoid division by zero
  }

  const scores = allNFTs.map((nft) =>
    calculateSurprisalScore(nft, traitCounts, totalSupply)
  );
  const total = scores.reduce((acc, s) => acc + s, 0);
  const average = total / allNFTs.length;
  return average === 0 ? 1 : average; // Avoid division by zero
}

export function getTraitCounts(nfts: NFT[]): TraitCounts {
  const counts: TraitCounts = {};
  for (const nft of nfts) {
    for (const [traitType, value] of Object.entries(nft)) {
      const traitValue = value ?? "null";
      counts[traitType] ??= {};
      counts[traitType][traitValue] ??= 0;
      counts[traitType][traitValue]++;
    }
  }
  return counts;
}

export function calculateNormalizedRarityScore(
  index: number,
  allNFTs: NFT[],
  totalSupply: number
): number {
  if (!allNFTs || allNFTs.length === 0 || index < 0 || index >= allNFTs.length || totalSupply <= 0) {
    return 0;
  }

  const traitCounts = getTraitCounts(allNFTs);
  const nftScore = calculateSurprisalScore(
    allNFTs[index],
    traitCounts,
    totalSupply
  );
  const expectedScore = calculateExpectedSurprisalScore(
    allNFTs,
    traitCounts,
    totalSupply
  );

  const score = nftScore / expectedScore;
  return isNaN(score) ? 0 : score;
}
