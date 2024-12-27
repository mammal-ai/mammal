import { createEffect, createSignal, For, Setter, Show } from "solid-js";
import { getMessage, isAncestorOfActiveThread, MessageData, setActiveMessage } from "../state/MessagesContext";
import db from "../store/db";
import MessageListButton from "./MessageListButton";

type SearchResult = {
    treeId: string
    snippet: string
}
const getSearchResults = async (query: string) => {
    // const escapedQuery = query.replace(/'/g, "''");
    return (await db.select<{ path: string; data: string; snippet: string }>(
        `SELECT
            messages.path as path,
            messages.data as data,
            snippet(messages_fts, 1, '<b>', '</b>', '...', 60) as snippet
        FROM
            messages_fts
        JOIN
            messages ON messages.id = messages_fts.rowid
        WHERE
            messages_fts MATCH $1
        ORDER BY
            rank
        LIMIT 50`
        , [query])).map(({ path, data, snippet }) => {
            return {
                treeId: path,
                data: JSON.parse(data) as MessageData,
                snippet,
            };
        }) as SearchResult[];
};

type SearchResultButtonProps = {
    active: boolean
    snippet: string
    onClick: () => void
}
const SearchResultButton = (props: SearchResultButtonProps) => {
    const [isHovered, setIsHovered] = createSignal(false);
    return (
        <MessageListButton
            active={props.active}
            isHovered={isHovered}
            setIsHovered={setIsHovered}
            onClick={props.onClick}
        >
            <div class="p-4 text-left" innerHTML={props.snippet} />
        </MessageListButton>
    )
}

type SearchResultsListProps = {
    query: string
    setQuery: Setter<string>
}
const SearchResultsList = (props: SearchResultsListProps) => {
    const [results, setResults] = createSignal<SearchResult[]>([])

    createEffect(async () => {
        setResults(await getSearchResults(props.query))
    })

    return (
        <div class="h-full">
            <For each={results()}>
                {result => (
                    <SearchResultButton
                        active={isAncestorOfActiveThread(result.treeId)}
                        snippet={result.snippet}
                        onClick={async () => {
                            const node = await getMessage(result.treeId)
                            if (node !== null) {
                                setActiveMessage(node)
                            }
                        }}
                    />
                )}
            </For>
            <Show when={results().length === 0}>
                <div class="h-full flex flex-col items-center justify-center pb-[50%]">
                    <span class="font-bold text-foreground">No Search Results</span>
                    <button class="text-blue-400 hover:text-blue-500" onClick={() => props.setQuery("")}>clear search</button>
                </div>
            </Show>
        </div>
    )
}
export default SearchResultsList