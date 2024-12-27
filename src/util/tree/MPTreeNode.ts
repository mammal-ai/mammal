import { getNextChildPath } from "./treeUtils";

export type NodeRow = {
  path: string;
  data: string;
};

interface DBOperations {
  select: <T>(query: string, params?: unknown[]) => Promise<T[]>;
  execute: (query: string, params?: unknown[]) => Promise<void>;
}

export type MPTreeNodeWithChildren<T> = {
  node: MPTreeNode<T>;
  children: MPTreeNodeWithChildren<T>[];
};

export default class MPTreeNode<T> {
  path: string;
  data: T;
  tableName: string;
  dbSelect: DBOperations["select"];
  dbExecute: DBOperations["execute"];

  constructor(
    path: string,
    data: any,
    tableName: string,
    dbSelect: any,
    dbExecute: any
  ) {
    this.path = path;
    this.data = typeof data === "string" ? JSON.parse(data) : data; // Parse if string, otherwise assume object
    this.tableName = tableName;
    this.dbSelect = dbSelect;
    this.dbExecute = dbExecute;
  }

  getParentPath() {
    return this.path.slice(0, this.path.lastIndexOf("."));
  }

  getDepth() {
    return this.path.split(".").length;
  }

  getChildren() {
    return this.dbSelect<NodeRow>(
      `SELECT path, data FROM ${this.tableName} WHERE path LIKE ? AND path NOT LIKE ?`,
      [`${this.path}.%`, `${this.path}.%.%`]
    );
  }

  async getChildrenCount() {
    return (
      await this.dbSelect<{
        count: number;
      }>(
        `SELECT COUNT(*) as count FROM ${this.tableName} WHERE path LIKE ? AND path NOT LIKE ?`,
        [`${this.path}.%`, `${this.path}.%.%`]
      )
    )[0].count;
  }

  getAncestors() {
    const pathParts = this.path.split(".");
    const ancestorPaths = pathParts
      .slice(0, pathParts.length - 1)
      .map((_, i) => pathParts.slice(0, i + 1).join("."));
    const paramQs = ancestorPaths.map(() => "?").join(", ");
    return this.dbSelect<NodeRow>(
      `SELECT path, data FROM ${this.tableName} WHERE path IN (${paramQs})`,
      [...ancestorPaths]
    );
  }

  getDescendants() {
    return this.dbSelect<NodeRow>(
      `SELECT path, data FROM ${this.tableName} WHERE path LIKE ?`,
      [`${this.path}.%`]
    );
  }

  async getDescendantCount() {
    return (
      await this.dbSelect<{
        count: number;
      }>(`SELECT COUNT(*) as count FROM ${this.tableName} WHERE path LIKE ?`, [
        `${this.path}.%`,
      ])
    )[0].count;
  }

  async getFirstChild() {
    const result = await this.dbSelect<NodeRow>(
      `SELECT path, data FROM ${this.tableName} WHERE path LIKE ? AND path NOT LIKE ? ORDER BY path LIMIT 1`,
      [`${this.path}.%`, `${this.path}.%.%`]
    );
    if (result.length === 0) {
      return null;
    }
    return new MPTreeNode(
      result[0].path,
      result[0].data,
      this.tableName,
      this.dbSelect,
      this.dbExecute
    );
  }

  async getLastChild() {
    const result = await this.dbSelect<NodeRow>(
      `SELECT path, data FROM ${this.tableName} WHERE path LIKE ? AND path NOT LIKE ? ORDER BY path DESC LIMIT 1`,
      [`${this.path}.%`, `${this.path}.%.%`]
    );
    if (result.length === 0) {
      return null;
    }
    return new MPTreeNode(
      result[0].path,
      result[0].data,
      this.tableName,
      this.dbSelect,
      this.dbExecute
    );
  }

  async getFirstSibling() {
    const result = await this.dbSelect<NodeRow>(
      `SELECT path, data FROM ${this.tableName} WHERE path LIKE ? AND path NOT LIKE ? ORDER BY path LIMIT 1`,
      [`${this.getParentPath()}.%`, `${this.getParent()}.%.%`]
    );
    if (result.length === 0) {
      return null;
    }
    return new MPTreeNode(
      result[0].path,
      result[0].data,
      this.tableName,
      this.dbSelect,
      this.dbExecute
    );
  }

  async getLastSibling() {
    const result = await this.dbSelect<NodeRow>(
      `SELECT path, data FROM ${this.tableName} WHERE path LIKE ? AND path NOT LIKE ? ORDER BY path DESC LIMIT 1`,
      [`${this.getParentPath()}.%`, `${this.getParent()}.%.%`]
    );
    if (result.length === 0) {
      return null;
    }
    return new MPTreeNode(
      result[0].path,
      result[0].data,
      this.tableName,
      this.dbSelect,
      this.dbExecute
    );
  }

  async getPrevSibling() {
    const result = await this.dbSelect<NodeRow>(
      `SELECT path, data FROM ${this.tableName} WHERE path < ? AND path LIKE ? AND path NOT LIKE ? ORDER BY path DESC LIMIT 1`,
      [this.path, `${this.getParentPath()}.%`, `${this.getParent()}.%.%`]
    );
    if (result.length === 0) {
      return null;
    }
    return new MPTreeNode(
      result[0].path,
      result[0].data,
      this.tableName,
      this.dbSelect,
      this.dbExecute
    );
  }

  async getNextSibling() {
    const result = await this.dbSelect<NodeRow>(
      `SELECT path, data FROM ${this.tableName} WHERE path > ? AND path LIKE ? AND path NOT LIKE ? ORDER BY path LIMIT 1`,
      [this.path, `${this.getParentPath()}.%`, `${this.getParent()}.%.%`]
    );
    if (result.length === 0) {
      return null;
    }
    return new MPTreeNode(
      result[0].path,
      result[0].data,
      this.tableName,
      this.dbSelect,
      this.dbExecute
    );
  }

  async getParent() {
    const result = await this.dbSelect<NodeRow>(
      `SELECT path, data FROM ${this.tableName} WHERE path = ?`,
      [this.getParentPath()]
    );
    if (result.length === 0) {
      return null;
    }
    return new MPTreeNode(
      result[0].path,
      result[0].data,
      this.tableName,
      this.dbSelect,
      this.dbExecute
    );
  }

  async getRoot() {
    const result = await this.dbSelect<NodeRow>(
      `SELECT path, data FROM ${this.tableName} WHERE path = ?`,
      [this.path.split(".")[0]]
    );
    if (result.length === 0) {
      return null;
    }
    return new MPTreeNode(
      result[0].path,
      result[0].data,
      this.tableName,
      this.dbSelect,
      this.dbExecute
    );
  }

  async getSiblings(includeSelf: boolean = false) {
    const result = includeSelf
      ? await this.dbSelect<NodeRow>(
          `SELECT path, data FROM ${this.tableName} WHERE path LIKE ? AND path NOT LIKE ?`,
          [`${this.getParentPath()}.%`, `${this.getParentPath()}.%.%`]
        )
      : await this.dbSelect<NodeRow>(
          `SELECT path, data FROM ${this.tableName} WHERE path LIKE ? AND path NOT LIKE ? AND path != ?`,
          [
            `${this.getParentPath()}.%`,
            `${this.getParentPath()}.%.%`,
            this.path,
          ]
        );

    return result.map(
      (row) =>
        new MPTreeNode(
          row.path,
          row.data,
          this.tableName,
          this.dbSelect,
          this.dbExecute
        )
    );
  }

  isChildOf(node: MPTreeNode<T>) {
    return this.path.startsWith(`${node.path}.`);
  }

  isDescendantOf(node: MPTreeNode<T>) {
    return this.path.startsWith(`${node.path}.`);
  }

  isSiblingOf(node: MPTreeNode<T>) {
    return this.getParentPath() === node.getParentPath();
  }

  isRoot() {
    return this.path.split(".").length === 1;
  }

  async isLeaf() {
    return (await this.getChildrenCount()) === 0;
  }

  // Mutations
  async addSibling(data: T) {
    const newPath = await getNextChildPath(
      this.dbSelect,
      this.tableName,
      this.getParentPath()
    );
    await this.dbExecute(
      `INSERT INTO ${this.tableName} (path, data) VALUES (?, ?)`,
      [newPath, JSON.stringify(data)]
    ).then(() => {
      return this.getLastSibling();
    });

    return await new MPTreeNode(
      newPath,
      data,
      this.tableName,
      this.dbSelect,
      this.dbExecute
    );
  }

  async addChild(data: T) {
    const newPath = await getNextChildPath(
      this.dbSelect,
      this.tableName,
      this.path
    );
    await this.dbExecute(
      `INSERT INTO ${this.tableName} (path, data) VALUES (?, ?)`,
      [newPath, JSON.stringify(data)]
    ).then(() => {
      return this.getLastChild();
    });

    return await new MPTreeNode<T>(
      newPath,
      data,
      this.tableName,
      this.dbSelect,
      this.dbExecute
    );
  }

  async delete() {
    return await this.dbExecute(
      `DELETE FROM ${this.tableName} WHERE path = ? OR path LIKE ?`,
      [this.path, `${this.path}.%`]
    );
  }

  async update(data: any) {
    return await this.dbExecute(
      `UPDATE ${this.tableName} SET data = ? WHERE path = ?`,
      [JSON.stringify(data), this.path]
    );
  }

  async move(newParentPath: string) {
    // TODO: wrap in a transaction
    // First, confirm that the new parent path is not a descendant of the current node
    if (newParentPath.startsWith(this.path)) {
      throw new Error("Cannot move a node to a descendant node");
    }

    // Next, get the new path for the node
    const newPath = await getNextChildPath(
      this.dbSelect,
      this.tableName,
      newParentPath
    );
    const oldPath = this.path;

    // Update the path of the node and all of its descendants
    return await this.dbExecute(
      `
        UPDATE ${this.tableName}
        SET path = ? || '.' || SUBSTR(path, LENGTH(?) + 2) -- Construct new path
        WHERE id IN (
          SELECT
            id, path
          FROM
            ${this.tableName}
          WHERE
            path = ? OR
            path LIKE ?
        );`,
      [newPath, oldPath, oldPath, `${oldPath}.%`]
    );
  }
}
