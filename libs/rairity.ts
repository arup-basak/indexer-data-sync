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

  return score;
}

function calculateExpectedSurprisalScore(
  allNFTs: NFT[],
  traitCounts: TraitCounts,
  totalSupply: number
): number {
  const scores = allNFTs.map((nft) =>
    calculateSurprisalScore(nft, traitCounts, totalSupply)
  );
  const total = scores.reduce((acc, s) => acc + s, 0);
  return total / allNFTs.length;
}

function calculateNormalizedRarityScore(
  nft: NFT,
  allNFTs: NFT[],
  traitCounts: TraitCounts,
  totalSupply: number
): number {
  const nftScore = calculateSurprisalScore(nft, traitCounts, totalSupply);
  const expectedScore = calculateExpectedSurprisalScore(
    allNFTs,
    traitCounts,
    totalSupply
  );
  return nftScore / expectedScore;
}
