import { Page } from "../components/Page";


const OrganizerView = (props: { isOpen: boolean }) => {
    return (
        <Page isOpen={props.isOpen}>
            <div class="mx-auto min-w-[36rem] max-w-[48rem] p-6 mt-2"><div class="flex flex-row items-center justify-between mb-2">
                <span class="font-bold text-2xl">Organizer</span>
            </div>
            </div>
        </Page>
    )
}
export default OrganizerView