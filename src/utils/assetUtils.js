/**
 * Utility functions for asset hierarchy management
 */

/**
 * Build hierarchical asset structure from flat array
 * @param {Array} assets - Flat array of assets
 * @returns {Array} - Hierarchical asset structure
 */
export function buildAssetHierarchy(assets) {
  if (!Array.isArray(assets)) {
    return [];
  }

  // Create a map for quick lookup
  const assetMap = new Map();
  const rootAssets = [];

  // First pass: create map and identify root assets
  assets.forEach(asset => {
    assetMap.set(asset.id, { ...asset, children: [] });
    if (!asset.parent) {
      rootAssets.push(asset.id);
    }
  });

  // Second pass: build parent-child relationships
  assets.forEach(asset => {
    if (asset.parent) {
      const parent = assetMap.get(asset.parent);
      const child = assetMap.get(asset.id);
      if (parent && child) {
        parent.children.push(child);
      }
    }
  });

  // Return root assets with their complete hierarchies
  return rootAssets.map(rootId => assetMap.get(rootId)).filter(Boolean);
}

/**
 * Flatten hierarchical asset structure
 * @param {Array} hierarchicalAssets - Hierarchical asset structure
 * @param {number} level - Current level (for indentation)
 * @returns {Array} - Flattened array with level information
 */
export function flattenAssetHierarchy(hierarchicalAssets, level = 0) {
  let flattened = [];

  hierarchicalAssets.forEach(asset => {
    // Add current asset with level
    flattened.push({
      ...asset,
      level,
      hasChildren: asset.children && asset.children.length > 0
    });

    // Recursively add children
    if (asset.children && asset.children.length > 0) {
      flattened = flattened.concat(
        flattenAssetHierarchy(asset.children, level + 1)
      );
    }
  });

  return flattened;
}

/**
 * Get all descendant asset IDs
 * @param {string} assetId - Parent asset ID
 * @param {Array} assets - All assets
 * @returns {Array} - Array of descendant IDs
 */
export function getDescendantIds(assetId, assets) {
  const descendants = [];
  const children = assets.filter(asset => asset.parent === assetId);

  children.forEach(child => {
    descendants.push(child.id);
    descendants.push(...getDescendantIds(child.id, assets));
  });

  return descendants;
}

/**
 * Get asset path (breadcrumb) from root to specific asset
 * @param {string} assetId - Target asset ID
 * @param {Array} assets - All assets
 * @returns {Array} - Array of assets from root to target
 */
export function getAssetPath(assetId, assets) {
  const path = [];
  const assetMap = new Map(assets.map(asset => [asset.id, asset]));
  
  let currentAsset = assetMap.get(assetId);
  
  while (currentAsset) {
    path.unshift(currentAsset);
    currentAsset = currentAsset.parent ? assetMap.get(currentAsset.parent) : null;
  }
  
  return path;
}

/**
 * Search assets by name or External ID
 * @param {Array} assets - All assets
 * @param {string} searchTerm - Search term
 * @returns {Array} - Matching assets
 */
export function searchAssets(assets, searchTerm) {
  if (!searchTerm || !searchTerm.trim()) {
    return assets;
  }

  const term = searchTerm.toLowerCase().trim();
  
  return assets.filter(asset =>
    asset.name?.toLowerCase().includes(term) ||
    asset.externalId?.toLowerCase().includes(term) ||
    asset.cmmsInternalId?.toLowerCase().includes(term) ||
    asset.functionalLocation?.toLowerCase().includes(term) ||
    asset.description?.toLowerCase().includes(term)
  );
}

/**
 * Sort assets by name or ID
 * @param {Array} assets - Assets to sort
 * @param {string} sortBy - Field to sort by ('name', 'id', 'createdAt')
 * @param {string} sortOrder - Sort order ('asc', 'desc')
 * @returns {Array} - Sorted assets
 */
export function sortAssets(assets, sortBy = 'name', sortOrder = 'asc') {
  return [...assets].sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];

    // Handle different data types
    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    if (sortOrder === 'desc') {
      return bValue > aValue ? 1 : bValue < aValue ? -1 : 0;
    } else {
      return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
    }
  });
}
