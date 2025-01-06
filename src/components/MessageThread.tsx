import { Message } from "ai"
import { createSignal, For, Setter } from "solid-js"
import { messageIsAttachment, getFilename } from "../util/attach"
import IndividualMessage from "./IndividualMessage"
import { FileText, Paperclip } from "lucide-solid"
import { Tooltip, TooltipContent, TooltipTrigger } from "../shadcn/components/Tooltip"
import { addChallenge, Challenge } from "../state/BenchmarkContext"
import ChallengeDialog from "./ChallengeDialog"

type AttachmentGroup = {
    type: "ATTACHMENT",
    messages: Message[]
}

type SingleMessage = {
    type: "MESSAGE",
    message: Message
}

type GroupedMessage = (AttachmentGroup | SingleMessage)

const AttachmentGroup = (props: { attachments: AttachmentGroup }) => {
    return <div class="w-full flex flex-row items-center justify-end space-x-1">
        {/* <div class="w-8 h-8 flex items-start"> */}
        <Paperclip class="w-4 h-4 mr-1 text-gray-300" />
        {/* </div> */}
        <For each={props.attachments.messages}>
            {(m) =>
                <Tooltip>
                    <TooltipContent>{getFilename(m.content)}</TooltipContent>
                    <TooltipTrigger>
                        <FileText class="w-7 h-7 hover:text-primary/80 hover:rotate-6 hover:scale-110 transition-all">{m.id}</FileText>
                    </TooltipTrigger>
                </Tooltip>
            }
        </For>
    </div>
}

const groupAttachments = (messages: Message[]) => {
    const group: GroupedMessage[] = []
    for (const m of messages) {
        if (messageIsAttachment(m.content)) {
            if (group.length > 0 && group[group.length - 1].type === "ATTACHMENT") {
                (group[group.length - 1] as AttachmentGroup).messages.push(m)
            }
            else {
                group.push({
                    type: "ATTACHMENT",
                    messages: [m]
                })
            }
        }
        else {
            group.push({
                type: "MESSAGE",
                message: m
            })
        }
    }
    return group
}

type MessageThreadProps = {
    messages: Message[]
    onRegenerate: (treeId: string) => Promise<void>
    onEdit: Setter<string | null>
}
const MessageThread = (props: MessageThreadProps) => {
    const [useAsChallengeTreeId, setUseAsChallengeTreeId] = createSignal<string | null>(null)
    const messageGroups = () => groupAttachments(props.messages)

    const onSaveChallenge = async (challenge: Challenge) => {
        addChallenge(challenge)
        setUseAsChallengeTreeId(null)
    }

    return (
        <>
            <For each={messageGroups()}>
                {(message) =>
                    message.type === "MESSAGE"
                        ? <IndividualMessage onUseAsChallenge={() => setUseAsChallengeTreeId(message.message.id)} id={message.message.id} message={message.message.content} role={message.message.role} onRegenerate={props.onRegenerate} onEdit={() => props.onEdit(message.message.id)} />
                        : <AttachmentGroup attachments={message} />
                }
            </For>
            <ChallengeDialog
                treeId={useAsChallengeTreeId()}
                onClose={() => setUseAsChallengeTreeId(null)}
                onSave={onSaveChallenge}
            />
        </>
    )
}
export default MessageThread