/**
 * Mock Data Generator Utilities
 *
 * Generates realistic mock data for items with creative names and descriptions.
 */

// Word banks for creative name generation
const adjectives = [
  "Azure",
  "Crimson",
  "Velvet",
  "Mystic",
  "Golden",
  "Silver",
  "Ancient",
  "Modern",
  "Ethereal",
  "Radiant",
  "Cosmic",
  "Midnight",
  "Dawn",
  "Twilight",
  "Crystal",
  "Shadow",
  "Thunder",
  "Whisper",
  "Blazing",
  "Frozen",
  "Electric",
  "Quantum",
  "Stellar",
  "Lunar",
  "Solar",
  "Neon",
  "Magnetic",
  "Dynamic",
  "Static",
  "Flux",
  "Prime",
  "Ultra",
];

const nouns = [
  "Phoenix",
  "Dragon",
  "Falcon",
  "Tiger",
  "Wolf",
  "Raven",
  "Eagle",
  "Panther",
  "Vortex",
  "Nexus",
  "Prism",
  "Eclipse",
  "Horizon",
  "Summit",
  "Canyon",
  "Ocean",
  "Mountain",
  "Valley",
  "River",
  "Storm",
  "Cascade",
  "Beacon",
  "Citadel",
  "Fortress",
  "Gateway",
  "Archive",
  "Matrix",
  "Portal",
  "Sphere",
  "Cube",
  "Helix",
  "Catalyst",
];

const descriptors = [
  "Protocol",
  "System",
  "Module",
  "Framework",
  "Engine",
  "Interface",
  "Platform",
  "Network",
  "Blueprint",
  "Manifest",
  "Codex",
  "Algorithm",
  "Sequence",
  "Pattern",
  "Structure",
  "Schema",
  "Paradigm",
  "Vector",
  "Element",
  "Component",
  "Artifact",
  "Construct",
  "Entity",
  "Resource",
  "Instance",
  "Model",
  "Template",
  "Variant",
  "Edition",
  "Version",
  "Build",
  "Release",
];

const descWords = [
  "advanced",
  "optimized",
  "enhanced",
  "integrated",
  "automated",
  "streamlined",
  "refined",
  "sophisticated",
  "innovative",
  "revolutionary",
  "cutting-edge",
  "state-of-the-art",
  "powerful",
  "efficient",
  "robust",
  "scalable",
  "flexible",
  "dynamic",
  "adaptive",
  "intelligent",
  "seamless",
  "comprehensive",
  "unified",
  "synchronized",
  "coordinated",
  "precision",
  "performance",
  "reliability",
  "stability",
  "security",
  "quality",
  "processing",
  "analysis",
  "computation",
  "execution",
  "implementation",
  "deployment",
  "management",
  "orchestration",
  "monitoring",
  "tracking",
  "validation",
  "verification",
  "transformation",
  "generation",
  "aggregation",
  "distribution",
  "optimization",
  "acceleration",
];

/**
 * Selects a random element from an array
 */
function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Generates a random item name using the pattern: [Adjective] [Noun] [Descriptor]
 */
export function generateName(): string {
  return `${randomElement(adjectives)} ${randomElement(nouns)} ${randomElement(
    descriptors
  )}`;
}

/**
 * Generates a random description by combining 7 descriptor words
 */
export function generateDescription(): string {
  const words: string[] = [];
  for (let i = 0; i < 7; i++) {
    words.push(randomElement(descWords));
  }
  return words.join(" ");
}

// Collection name bank (separate from item words)
const collectionWords = [
  "Atlas",
  "Beacon",
  "Catalyst",
  "Citadel",
  "Cosmos",
  "Frontier",
  "Genesis",
  "Horizon",
  "Infinity",
  "Legacy",
  "Meridian",
  "Nexus",
  "Odyssey",
  "Pinnacle",
  "Quantum",
  "Sentinel",
  "Spectrum",
  "Summit",
  "Synthesis",
  "Terminus",
  "Vanguard",
  "Vertex",
  "Zenith",
  "Apex",
  "Core",
  "Eclipse",
  "Forge",
  "Haven",
  "Matrix",
  "Orbit",
  "Portal",
  "Realm",
  "Sphere",
  "Vault",
  "Axis",
];

/**
 * Generates an array of mock collections with random one-word names
 */
export function generateMockCollections(count: number = 5) {
  const baseDate = new Date("2024-01-01T08:00:00Z");
  const usedNames = new Set<string>();
  const collections = [];

  for (let i = 0; i < count; i++) {
    // Get a unique random name
    let name;
    do {
      name = randomElement(collectionWords);
    } while (usedNames.has(name) && usedNames.size < collectionWords.length);

    usedNames.add(name);

    const id = `coll-${i + 1}`;
    const createdDate = new Date(baseDate.getTime() + i * 86400000); // 1 day apart

    collections.push({
      id,
      name,
      description: generateDescription(),
      created_at: createdDate.toISOString(),
      updated_at: createdDate.toISOString(),
    });
  }

  return collections;
}

/**
 * Generates an array of mock items with unique IDs and incrementing timestamps
 */
export function generateMockItems(
  count: number = 100,
  collectionId: string = "coll-1"
) {
  const baseDate = new Date("2024-01-01T10:00:00Z");

  return Array.from({ length: count }, (_, i) => {
    const id = (i + 1).toString();
    const createdDate = new Date(baseDate.getTime() + i * 3600000); // 1 hour apart

    return {
      id,
      name: generateName(),
      description: generateDescription(),
      created_at: createdDate.toISOString(),
      updated_at: createdDate.toISOString(),
      collection_id: collectionId,
    };
  });
}

/**
 * Generates all mock data: 5 collections with 100 items each
 */
export function generateAllMockData() {
  const collections = generateMockCollections();

  // Generate 100 items for each collection
  const allItems = collections.flatMap((collection, collIndex) => {
    const baseDate = new Date("2024-01-01T10:00:00Z");

    return Array.from({ length: 100 }, (_, itemIndex) => {
      const globalId = collIndex * 100 + itemIndex + 1;
      const createdDate = new Date(baseDate.getTime() + globalId * 3600000); // 1 hour apart

      return {
        id: globalId.toString(),
        name: generateName(),
        description: generateDescription(),
        created_at: createdDate.toISOString(),
        updated_at: createdDate.toISOString(),
        collection_id: collection.id,
      };
    });
  });

  return { collections, items: allItems };
}

// Generate all data at module load
const { collections: MOCK_COLLECTIONS, items: MOCK_ITEMS } =
  generateAllMockData();

export { MOCK_COLLECTIONS, MOCK_ITEMS };
