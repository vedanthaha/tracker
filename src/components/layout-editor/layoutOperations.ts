import { LayoutNode, LayoutSpec, GridContainer, StackContainer, WidgetNode } from "../../lib/design/LayoutSpec";
import { nanoid } from "nanoid";

/**
 * Ensures every node in a layout tree has an ID.
 *
 * @param node - The root node of the layout tree
 * @returns A cloned layout tree with generated IDs assigned to nodes that lack them
 */
export function ensureNodeIds(node: LayoutNode): LayoutNode {
  const newNode = { ...node };
  if (!newNode.id) {
    newNode.id = nanoid();
  }

  if (newNode.type === "grid" || newNode.type === "stack") {
    newNode.children = newNode.children.map(ensureNodeIds);
  }

  return newNode;
}

/**
 * Finds a layout node by its ID.
 *
 * @param id - The ID of the node to find
 * @returns The matching layout node, or `null` if no node has the specified ID
 */
export function findNode(root: LayoutNode, id: string): LayoutNode | null {
  if (root.id === id) return root;
  if (root.type === "grid" || root.type === "stack") {
    for (const child of root.children) {
      const found = findNode(child, id);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Finds the container that directly contains a node with the specified ID.
 *
 * @param childId - The ID of the child whose parent to find
 * @returns The containing grid or stack container, or `null` if no direct parent is found
 */
export function findParent(root: LayoutNode, childId: string): GridContainer | StackContainer | null {
  if (root.type === "grid" || root.type === "stack") {
    if (root.children.some(c => c.id === childId)) {
      return root;
    }
    for (const child of root.children) {
      const parent = findParent(child, childId);
      if (parent) return parent;
    }
  }
  return null;
}

/**
 * Removes the node with the specified ID from a layout tree.
 *
 * @param id - The ID of the node to remove
 * @returns The updated layout tree, or `null` if the root node matches the ID
 */
export function removeNode(root: LayoutNode, id: string): LayoutNode | null {
  if (root.id === id) return null; // Can't return null from root easily, handled by caller

  if (root.type === "grid" || root.type === "stack") {
    const newRoot = { ...root, children: [...root.children] };
    const idx = newRoot.children.findIndex(c => c.id === id);
    if (idx !== -1) {
      newRoot.children.splice(idx, 1);
      return newRoot;
    } else {
      newRoot.children = newRoot.children.map(c => removeNode(c, id)).filter(Boolean) as LayoutNode[];
      return newRoot;
    }
  }
  return root;
}

/**
 * Inserts a layout node into the specified grid or stack container.
 *
 * @param root - The layout tree to update
 * @param parentId - The ID of the container that receives the node
 * @param node - The node to insert
 * @param index - The insertion position; invalid or omitted values append the node
 * @returns The layout tree with the node inserted
 */
export function insertNode(
  root: LayoutNode,
  parentId: string,
  node: LayoutNode,
  index?: number
): LayoutNode {
  if (root.id === parentId && (root.type === "grid" || root.type === "stack")) {
    const newRoot = { ...root, children: [...root.children] };
    if (index !== undefined && index >= 0 && index <= newRoot.children.length) {
      newRoot.children.splice(index, 0, node);
    } else {
      newRoot.children.push(node);
    }
    return newRoot;
  }

  if (root.type === "grid" || root.type === "stack") {
    return {
      ...root,
      children: root.children.map(c => insertNode(c, parentId, node, index))
    };
  }

  return root;
}

/**
 * Applies updates to the node with the specified ID in a layout tree.
 *
 * @param root - The root of the layout tree to update
 * @param id - The ID of the node to update
 * @param updates - The properties to merge into the matching node
 * @returns The layout tree with the specified updates applied
 */
export function updateNode(root: LayoutNode, id: string, updates: Partial<LayoutNode>): LayoutNode {
  if (root.id === id) {
    return { ...root, ...updates } as LayoutNode;
  }
  if (root.type === "grid" || root.type === "stack") {
    return {
      ...root,
      children: root.children.map(c => updateNode(c, id, updates))
    };
  }
  return root;
}

/**
 * Removes empty grid and stack containers from a layout tree.
 *
 * @param node - The layout node to prune
 * @returns The pruned node, or `null` if the node is an empty container
 */
export function pruneEmptyContainers(node: LayoutNode): LayoutNode | null {
  if (node.type === "grid" || node.type === "stack") {
    const prunedChildren = node.children
      .map(pruneEmptyContainers)
      .filter(Boolean) as LayoutNode[];
    
    // We shouldn't prune the root even if empty, so caller must handle it
    if (prunedChildren.length === 0) return null;
    return { ...node, children: prunedChildren };
  }
  return node;
}
