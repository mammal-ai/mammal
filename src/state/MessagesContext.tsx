
import db from "../store/db";
import MPTree from "../util/tree/MPTree";
import MPTreeNode, { MPTreeNodeWithChildren } from "../util/tree/MPTreeNode";
import { createSignal } from "solid-js";
import { getParentId } from "../util/tree/treeUtils";
import { generateTitle } from "../util/llm";

export type ChatMessageRole = "user" | "assistant" | "system" | "data";

export type MessageData = {
    name: string;
    role: ChatMessageRole;
    message: string;
    createdAt: string;
    metadata?: {
        provider?: string;
        model?: string;
        temperature?: number;
        maxTokens?: number;
    };
}

export type RootNode = {
    title?: string
    path: string
    firstMessage: MessageData
}

const dboperations = {
    select: db.select,
    execute: (query: string, params?: unknown[]) =>
        new Promise<void>(async (resolve, reject) => {
            try {
                await db.execute(query, params);
                resolve();
            } catch (e) {
                console.error(e);
                reject(e);
            }
        }),
};

const messageMPTree = new MPTree<MessageData>(
    "messages",
    dboperations.select,
    dboperations.execute
);

const [rootNodes, setRootNodes] = createSignal<RootNode[]>([]);

const refreshRootNodes = async () => {
    const nodes = await messageMPTree.getRootNodes();
    const rootIds = nodes.map(n => n.path.split(".")[0])
    const placeholders = rootIds.map((_, i) => `$${i + 1}`).join(', ');
    const titles = await db.select<{ id: string, title: string }>(`SELECT id, title FROM thread_titles WHERE id IN (${placeholders})`, rootIds)

    const rn = nodes.map(n => ({
        title: titles.find(t => t.id === n.path.split(".")[0])?.title || "Unknown Title",
        path: n.path,
        firstMessage: n.data
    }))
    setRootNodes(rn)

    // find all the rootIds that don't have a title and generate one for them using `generateTitle()`
    const rootIdsWithoutTitles = rootIds.filter(id => !titles.find(t => t.id === id));
    const generatedTitles = await Promise.all(rootIdsWithoutTitles.map(async id => {
        const messages = await db.select<{ path: string, message: string }>("SELECT path, message FROM message_view WHERE path LIKE $1", [`${id}.%`])
        const title = await generateTitle([{ role: "user", content: JSON.stringify(messages) }]) as string;
        if (title) {
            await db.execute("INSERT INTO thread_titles (id, title) VALUES ($1, $2)", [id, title])
        }
        return { id, title };
    }));
    const allTitles = [...titles, ...generatedTitles];
    setRootNodes(nodes.map(n => ({
        title: allTitles.find(t => t.id === n.path.split(".")[0])?.title || "Unknown Title",
        path: n.path,
        firstMessage: n.data
    })))
}
refreshRootNodes()

const updateThreadTitle = async (threadId: string, title: string) => {
    await db.execute("UPDATE thread_titles SET title = $1 WHERE id = $2", [title, threadId])
    refreshRootNodes()
}

const [activeMessage, setActiveMessage] = createSignal<MPTreeNode<MessageData> | null>(null);

export const getThreadEndingAt = async (treeId: string) => {
    const thread = [];
    let currentId: string | null = treeId
    // NOTE: we assume that the top level does not actually have a message so "1.1" is the first message in a thread
    // (the parent "1" is just the virtual root)
    while (currentId !== null && currentId.includes(".")) {
        const node = await messageMPTree.getNode(currentId);
        if (!node) {
            console.error("Failed to get message");
            return [];
        }
        thread.push(node);
        currentId = getParentId(currentId);
    }

    return thread.reverse();
}

const getMessage = async (treeId: string) => {
    const node = await messageMPTree.getNode(treeId);
    if (!node) {
        return null;
    }

    return node;
}

const addMessage = async (data: MessageData, parentId: string | null) => {
    let newNode = await messageMPTree.addNode(parentId, data);
    if (!newNode) {
        console.error("Failed to add message");
        return null;
    }

    refreshRootNodes();
    setActiveMessage(newNode);
    return newNode;
}

const cascadeDelete = async (treeId: string) => {
    const rootPath = treeId.split(".")[0]
    await messageMPTree.deleteNode(treeId);

    // check if there are any messages left attached to this root
    const descendantCount = await db.select<{ count: number }>("SELECT COUNT(path) count FROM messages WHERE path LIKE $1", [`${rootPath}.%`])
    if (!descendantCount?.[0].count) {
        // remove any title associated with this thread
        await db.execute(`DELETE FROM thread_titles WHERE id = $1`, [rootPath])
    }

    refreshRootNodes();
    // check if activeMessage still exists...
    const currentActiveMessage = activeMessage()
    if (currentActiveMessage === null) {
        return
    }
    const node = await messageMPTree.getNode(currentActiveMessage.path)
    if (!node) {
        setActiveMessage(null)
    }
}

const setActiveThread = async (treeId: string) => {
    const thread = await getThreadEndingAt(treeId)
    if (thread.length === 0) {
        console.error("No messages in thread for treeId:", treeId)
        return
    }

    const tree = await messageMPTree.getTree(thread[0].path)
    if (!tree) {
        console.error("Failed to get tree")
        return
    }

    // Find the message in the tree that is the most recent using a depth first search
    const findLatestNode = (node: MPTreeNodeWithChildren<MessageData>): MPTreeNodeWithChildren<MessageData> => {
        if (node.children.length === 0) {
            return node
        }
        return node.children.map(findLatestNode).sort((a, b) => {
            if (!a) {
                return 1
            }
            if (!b) {
                return -1
            }
            return a.node.data.createdAt.localeCompare(b.node.data.createdAt)
        })[0]
    }
    const { node } = findLatestNode(tree)

    setActiveMessage(node)
}

const setThreadFor = async (treeId: string) => {
    const thread = await getThreadEndingAt(treeId)
    if (thread.length === 0) {
        console.error("No messages in thread for treeId:", treeId)
        return
    }

    const tree = await messageMPTree.getTree(thread[thread.length - 1].path)
    if (!tree) {
        console.error("Failed to get tree")
        return
    }

    // Find the message in the tree that is the most recent using a depth first search
    const findLatestNode = (node: MPTreeNodeWithChildren<MessageData>): MPTreeNodeWithChildren<MessageData> => {
        if (node.children.length === 0) {
            return node
        }
        return node.children.map(findLatestNode).sort((a, b) => {
            if (!a) {
                return 1
            }
            if (!b) {
                return -1
            }
            return a.node.data.createdAt.localeCompare(b.node.data.createdAt)
        })[0]
    }
    const { node } = findLatestNode(tree)
    console.log(node)
    setActiveMessage(node)
}

const isAncestorOfActiveThread = (path: string) => {
    const currentActiveMessage = activeMessage()
    if (!currentActiveMessage) {
        return false
    }
    return currentActiveMessage.path.startsWith(path)
}

export {
    rootNodes,
    updateThreadTitle,
    activeMessage,
    setActiveMessage,
    setActiveThread,
    setThreadFor,
    getMessage,
    addMessage,
    cascadeDelete,
    // some helpers:
    isAncestorOfActiveThread,
};