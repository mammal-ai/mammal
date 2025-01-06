import { useChat } from '@ai-sdk/solid';
import { createEffect } from 'solid-js';
import { LoadingIndicator } from '../components/LoadingIndicator';
import ChatBox from '../components/ChatBox';
import "./MessagesView.css"
import MessagesSidebar from '../components/MessagesSidebar';
import Navbar from '../components/Navbar';
import { createSignal } from 'solid-js';
import { activeMessage, getThreadEndingAt, addMessage, setActiveMessage, ChatMessageRole } from '../state/MessagesContext';
import { getParentId } from '../util/tree/treeUtils';
import EditDialog from '../components/EditDialog';
import MessageThread from '../components/MessageThread';

const MessagesView = () => {
    const { messages, isLoading, append, setMessages } = useChat({ api: "https://hijacked_fetch_request.com/api/chat" });
    const [open, setOpen] = createSignal(true);
    const [editId, setEditId] = createSignal<string | null>(null)

    createEffect(async () => {
        setEditId(null)
        const newActiveMessage = activeMessage()
        if (newActiveMessage === null) {
            setMessages([])
            return
        }
        const thread = await getThreadEndingAt(newActiveMessage.path)
        setMessages(thread.map(m => ({
            id: m.path,
            content: m.data.message,
            role: m.data.role,
        })))
    })

    const onSubmit = async (msg: string) => {
        const newId = await addMessage({
            name: "User",
            role: "user",
            message: msg,
            createdAt: new Date().toISOString(),
        }, activeMessage()?.path || null)
        if (newId === null) {
            console.error("Failed to add message")
            return
        }
        append({
            content: msg,
            role: "user",
            annotations: [{ parentId: newId.path }]
        });
    }

    const onAttach = async (msg: string) => {
        const newNode = await addMessage({
            name: "User",
            role: "user",
            message: msg,
            createdAt: new Date().toISOString(),
        }, activeMessage()?.path || null)
        if (newNode === null) {
            console.error("Failed to add message")
            return
        }
        // nearly like onSubmit, but we can't use append because that triggers a "generate"
        setMessages([...messages(), {
            id: newNode.path,
            content: msg,
            role: "user",
            annotations: [{ parentId: newNode.path }]
        }]);
    }

    const onRegenerate = async (treeId: string) => {
        const msg = messages()
        const parentId = getParentId(treeId)
        const parentMsg = msg.find(m => m.id === parentId)
        if (!parentMsg) {
            console.error("Could not regenerate: couldn't find parent message")
            return
        }

        const grandparentId = getParentId(parentId || "")
        const lastContextMessage = grandparentId === null ? -1 : msg.findIndex(m => m.id === grandparentId)
        setMessages(msg.slice(0, lastContextMessage + 1))

        setTimeout(() => {
            append({
                id: parentMsg.id,
                content: parentMsg.content,
                role: parentMsg.role,
                annotations: [{ parentId }]
            })
        }, 60)
    }

    const onEdit = async (treeId: string, message: string, role: ChatMessageRole) => {
        // treeId is the id of the message being edited, but we want to make a sibling for that message.
        const msg = messages()
        const parentId = getParentId(treeId)

        const lastContextMessage = msg.findIndex(m => m.id === parentId)
        setMessages(msg.slice(0, lastContextMessage + 1))

        // Now that we've reset the context, we can basically duplicate the onSubmit logic:

        // assert role === "user"
        if (role !== "user") {
            throw "Editing non-user message not implemented"
            // TODO: we have to think through how to proceed at the point of generation here...
        }

        const newNode = await addMessage({
            name: "User",
            role: "user",
            message,
            createdAt: new Date().toISOString(),
        }, parentId)
        if (newNode === null) {
            console.error("Failed to add message")
            return
        }

        // interestingly, if we use setTimeout here, we end up with an old version of messages() (before the reset)
        append({
            role,
            content: message,
            annotations: [{ parentId: newNode.path }]
        })
    }

    return (
        <div class='flex-1 flex flex-row'>
            <MessagesSidebar isOpen={open()} />
            <div class="flex-1 h-screen flex flex-col relative">
                <Navbar toggleSidebar={() => setOpen(!open())} onNewChat={() => setActiveMessage(null)} />
                <div class="flex-1 flex flex-col-reverse overflow-y-auto w-full gap-4 p-4">
                    <div class='flex-1' />
                    <ChatBox onSubmit={onSubmit} onAttach={onAttach} show={editId() === null} />
                    <EditDialog treeId={editId()} onHide={() => setEditId(null)} onEdit={onEdit} />
                    <div class="flex flex-col w-full gap-4 p-4 pb-[12rem]" style={{ "z-index": 1 }}>
                        <MessageThread messages={messages()} onRegenerate={onRegenerate} onEdit={setEditId} />
                        <LoadingIndicator isLoading={isLoading} />
                    </div>
                </div>
            </div>
        </div>
    )
}
export default MessagesView