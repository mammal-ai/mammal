import { createSignal } from "solid-js";
import { Page } from "../components/Page";
// import { Card, CardContent, CardHeader, CardTitle } from "../shadcn/components/Card";
// import { Button } from "../shadcn/components/Button";
import { SolidApexCharts } from 'solid-apexcharts';
import { ApexOptions } from "apexcharts";
import { benchmarks, challenges } from "../state/BenchmarkContext";
import { Button } from "../shadcn/components/Button";
import { Select, SelectTrigger, SelectItem, SelectContent, SelectValue } from "../shadcn/components/Select"
import BenchmarkDialog from "../components/BenchmarkDialog";

const Chart = () => {
    const [options] = createSignal<ApexOptions>(
        {
            chart: {
                toolbar: {
                    show: false
                }
            },
            plotOptions: {
                bar: {
                    horizontal: false,
                    columnWidth: '70%',
                    borderRadius: 2,
                    borderRadiusApplication: 'end'
                },
            },
            legend: {
                // show: false
                position: "top"
            },
            dataLabels: {
                enabled: false
            },
            stroke: {
                show: true,
                width: 2,
                colors: ['transparent']
            },
            xaxis: {
                categories: ['MMLU', 'GPQA', 'Hellaswag', 'Arc', 'Lmarena'],
            },
            yaxis: {
                // title: {
                //     text: '$ (thousands)'
                // }
            },
            fill: {
                opacity: 1
            },
            tooltip: {
                y: {
                    formatter: function (val, _data) {
                        // we can use this to handle normalizing to a shared scale across different benchmarks:
                        // const { dataPointIndex, seriesIndex } = data
                        // console.log(`group: ${dataPointIndex} | col: ${seriesIndex}`)
                        return `${val}`
                    }
                }
            }
        });
    const [series] = createSignal([{
        name: 'GPT-4o',
        data: [44, 55, 57, 56, 61]
    }, {
        name: 'Sonnet 3.5',
        data: [56, 65, 61, 58, 57]
    }, {
        name: 'Gemini 1206',
        data: [35, 41, 36, 26, 45]
    }, {
        name: 'Llama 3.3 405B',
        data: [41, 36, 26, 45, 62]
    }]);

    return <SolidApexCharts toolbar={{ show: false }} type="bar" options={options()} series={series()} />
}

const BenchmarksView = (props: { isOpen: boolean }) => {
    const [showNewBenchmarkDialog, setShowNewBenchmarkDialog] = createSignal(false)

    return (
        <Page isOpen={props.isOpen}>
            <BenchmarkDialog
                open={showNewBenchmarkDialog()}
                onClose={() => setShowNewBenchmarkDialog(false)}
                onSave={() => setShowNewBenchmarkDialog(false)}
            />
            <div class="mx-auto min-w-[36rem] max-w-[48rem] p-6 mt-2 flex flex-col space-y-4">
                <div class="flex flex-row items-center justify-between">
                    <span class="font-bold text-2xl">Model Benchmarks</span>
                    <Button onClick={() => setShowNewBenchmarkDialog(true)}>New Benchmark</Button>
                </div>
                <div class="flex flex-col items-center bg-background rounded-md border px-6 py-4">
                    <div class="flex flex-row w-full items-center justify-between">
                        <div class="font-bold flex-1">Model Benchmarks</div>
                        <div>
                            <Select
                                class={"w-full"}
                                options={["Top Models"]}
                                itemComponent={props =>
                                    <SelectItem item={props.item}>
                                        {props.item.rawValue}
                                    </SelectItem>
                                }
                                onChange={() => { }}
                                value={"Top Models"}
                            >
                                <SelectTrigger>
                                    <SelectValue<string>>
                                        {state => state.selectedOption()}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent />
                            </Select>
                        </div>
                    </div>
                    <div class="relative w-full">
                        <Chart />
                    </div>
                </div>
                <div class="flex flex-col items-center bg-background rounded-md border px-6 py-4">
                    {JSON.stringify(challenges())}
                </div>
                <div class="flex flex-col items-center bg-background rounded-md border px-6 py-4">

                    {JSON.stringify(benchmarks())}
                </div>
            </div>
        </Page>
    )
}
export default BenchmarksView