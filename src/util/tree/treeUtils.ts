export const getNextChildPath = async (
  dbSelect: <T>(query: string, params?: any[]) => Promise<T[]>,
  tableName: string,
  parentPath: string | null
) => {
  // If parentPath is null, we need a new top level path (e.g. "1", "2", "3", etc.)
  // Otherwise, we need a new child path (e.g. "1.1", "1.2", "1.3", etc.)
  if (!parentPath) {
    const topLevelNodes = await dbSelect<{ thread_id: string }>(
      `SELECT thread_id FROM top_level_messages ORDER BY thread_id DESC LIMIT 1`
    );
    const lastTopLevelPath =
      topLevelNodes.length === 0 ? 0 : parseInt(topLevelNodes[0].thread_id);
    const nextTopLevelPath = (lastTopLevelPath + 1).toString();
    return `${nextTopLevelPath}.1`;
  }

  const unsortedChildNodes = await dbSelect<{ path: string }>(
    `SELECT path FROM ${tableName} WHERE path LIKE ? AND path NOT LIKE ?`,
    [`${parentPath}.%`, `${parentPath}.%.%`]
  );
  const childNodes = unsortedChildNodes.sort((a, b) => {
    const aParts = a.path.split(".");
    const lastA = Number.parseInt(aParts[aParts.length - 1]);
    const bParts = b.path.split(".");
    const lastB = Number.parseInt(bParts[bParts.length - 1]);

    // reverse (so: B - A)
    return lastB - lastA;
  });

  if (childNodes.length === 0) {
    return `${parentPath}.1`;
  }

  const lastChildPath = childNodes[0].path;
  const lastChildIndex = parseInt(lastChildPath.split(".").pop() || "0");
  const nextChildIndex = lastChildIndex + 1;
  return `${parentPath}.${nextChildIndex}`;
};

export const getParentId = (treeId: string) =>
  treeId.split(".").slice(0, -1).join(".") || null;
