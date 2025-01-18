import { createEffect, createSignal, For, Show } from "solid-js";
import { Page } from "../components/Page";
import { SolidApexCharts } from 'solid-apexcharts';
import { ApexOptions } from "apexcharts";
import { addBenchmark, Benchmark, benchmarks, challenges, Result, results, runBenchmark } from "../state/BenchmarkContext";
import { Button } from "../shadcn/components/Button";
import { Select, SelectTrigger, SelectItem, SelectContent, SelectValue } from "../shadcn/components/Select"
import BenchmarkDialog from "../components/BenchmarkDialog";
import { models } from "../state/ModelProvidersContext";

const modelById = (id: string) => {
    return models().find(m => m.id === id)
}

const challengeById = (id: string) => {
    return challenges().find(c => c.id === id)
}

const avg = (values: number[]) =>
    values.reduce((a, v) => a + v, 0) / values.length

const TopModelsChart = () => {
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
                    borderRadiusApplication: "end"
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

    return <SolidApexCharts type="bar" options={options()} series={series()} />
}


const optionsFromProps: (p: ChartProps) => ApexOptions = (props) => ({
    chart: {
        toolbar: {
            show: false
        }
    },
    plotOptions: {
        bar: {
            borderRadius: 2,
            columnWidth: '70%',
            borderRadiusApplication: "end"
        }
    },

    xaxis: {
        categories: props.data.map(d => d.label),
        position: 'bottom',
        crosshairs: {
            fill: {
                type: 'gradient',
                gradient: {
                    colorFrom: '#D8E3F0',
                    colorTo: '#BED1E6',
                    stops: [0, 100],
                    opacityFrom: 0.4,
                    opacityTo: 0.5,
                }
            }
        },
        tooltip: {
            enabled: true,
        }
    },
    yaxis: {
        labels: {
            formatter: function (val) {
                return Math.round(val) + "%";
            }
        },
        max: 100

    },
})
const seriesFromProps = (props: ChartProps) => ([{
    name: props.title,
    data: props.data.map(d => d.score * 100)
}])

type ChartProps = {
    title: string
    data: {
        label: string
        score: number
    }[]
}
const Chart = (props: ChartProps) => {
    const [options, setOptions] = createSignal<ApexOptions>(optionsFromProps(props));
    const [series, setSeries] = createSignal(seriesFromProps(props));

    // This causes re-rendering of the chart when the props change
    createEffect(() => {
        setOptions(optionsFromProps(props));
        setSeries(seriesFromProps(props));
    })

    return <SolidApexCharts type="bar" options={options()} series={series()} />
}

const getResultsForBenchmark = (benchmark: Benchmark) => {
    return results().filter(r => r.challengeId === benchmark.challengeId)
}

const getBenchmarkResultsGroupedByData = (benchmark: Benchmark) => {
    const groupedByData = getResultsForBenchmark(benchmark).reduce((acc, result) => {
        const key = JSON.stringify(result.data)
        if (!acc[key]) {
            acc[key] = []
        }
        acc[key].push(result)
        return acc
    }, {} as Record<string, Result[]>)

    return Object.values(groupedByData)
}

const getBenchmarkResultsGroupedByModel = (benchmark: Benchmark) => {
    const groupedByModel = getResultsForBenchmark(benchmark).reduce((acc, result) => {
        const key = result.modelId
        if (!acc[key]) {
            acc[key] = []
        }
        acc[key].push(result)
        return acc
    }, {} as Record<string, Result[]>)
    return Object.values(groupedByModel)
}

const BenchmarksView = (props: { isOpen: boolean }) => {
    const [selectedChallengeId, setSelectedChallengeId] = createSignal("")
    const [showNewBenchmarkDialog, setShowNewBenchmarkDialog] = createSignal(false)
    const [selectedBenchmark, setSelectedBenchmark] = createSignal<Benchmark | null>(null)
    const [chartOption, setChartOption] = createSignal("Top Models")
    // const [chartProps, setChartProps] = createSignal<ChartProps>({ title: "", data: [] })

    const chartOptions = () => ["Top Models"].concat(benchmarks().map(b => b.title))
    const chartDataForBenchmark = (benchmark: Benchmark | null) => {
        if (!benchmark) return []
        const results = getBenchmarkResultsGroupedByModel(benchmark)
        console.log(results[0])
        const aggregation = results.map((r, i) => {
            console.log(r, modelById(r[0].modelId),)

            return {
                label: modelById(r[0].modelId)?.name || "Unknown Model Name",
                score: r.some(({ score }) => typeof score !== "number") ? 0 : avg(r.map(({ score }) => score))
            }
        })
        console.log(aggregation)
        return aggregation
    }

    const onRunBenchmark = (benchmark: Omit<Benchmark, "id">) => {
        const newBenchmark = addBenchmark(benchmark)
        setShowNewBenchmarkDialog(false)
        runBenchmark(newBenchmark)
    }

    createEffect(() => {
        console.log(chartOption())
        if (chartOption() !== "Top Models") {
            const benchmark = benchmarks().find(b => b.title === chartOption())
            console.log(benchmark)
            setSelectedBenchmark(benchmark || null)
            if (benchmark) {
                // setChartProps({
                //     title: chartOption(),
                //     data: 
                // })
            }
        }
    })

    const firstBenchmark = benchmarks()?.[0]
    if (firstBenchmark) {
        setSelectedBenchmark(firstBenchmark)
    }

    const chartData = () => chartDataForBenchmark(selectedBenchmark())

    return (
        <Page isOpen={props.isOpen}>
            <BenchmarkDialog
                challengeId={selectedChallengeId()}
                open={showNewBenchmarkDialog()}
                onClose={() => setShowNewBenchmarkDialog(false)}
                onRun={onRunBenchmark}
            />
            <div class="mx-auto min-w-[36rem] max-w-[48rem] p-6 mt-2 flex flex-col space-y-4">
                <div class="flex flex-row items-center justify-between">
                    <span class="font-bold text-2xl">Model Benchmarks</span>
                    {/* <Button onClick={() => setShowNewBenchmarkDialog(true)}>New Benchmark</Button> */}
                </div>
                <div class="flex flex-col items-center bg-background rounded-md border px-6 py-4">
                    <div class="flex flex-row w-full items-center justify-between">
                        <div class="font-bold flex-1">Model Benchmarks</div>
                        <div>
                            <Select
                                class={"w-full"}
                                options={chartOptions()}
                                itemComponent={props =>
                                    <SelectItem item={props.item}>
                                        {props.item.rawValue}
                                    </SelectItem>
                                }
                                onChange={setChartOption}
                                value={chartOption()}
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
                        <Show when={chartOption() === "Top Models"}>
                            <TopModelsChart />
                        </Show>
                        <Show when={chartOption() !== "Top Models"}>
                            <Chart
                                title={chartOption()}
                                data={chartData()}
                            />
                            {JSON.stringify(chartData())}
                        </Show>
                    </div>
                </div>
                <div class="flex flex-col items-center bg-background rounded-md border px-6 py-4">
                    {JSON.stringify(challenges())}
                    <div>
                        as
                    </div>
                    <For each={challenges()}>
                        {challenge =>
                            <div class="flex flex-row justify-between w-full">
                                <div>
                                    {challenge.title}
                                </div>
                                <div>
                                    <Button onClick={() => { setSelectedChallengeId(challenge.id); setShowNewBenchmarkDialog(true) }}>Benchmark</Button>
                                </div>
                            </div>
                        }
                    </For>
                </div>
                {/* 
                <div class="flex flex-col items-center bg-background rounded-md border px-6 py-4">
                    {JSON.stringify(benchmarks())}
                </div>
                <div class="flex flex-col items-center bg-background rounded-md border px-6 py-4">
                    {JSON.stringify(results())}
                </div> */}
                <Show when={selectedBenchmark() !== null} fallback={"no selected benchmark"}>
                    <div>
                        <div class="flex flex-row items-center justify-between mb-4">
                            <div class="font-bold">
                                Info for {challengeById(selectedBenchmark()?.challengeId || "")?.title || "Unknown"}:
                            </div>
                            <Button onClick={() => runBenchmark(selectedBenchmark()!)}>Run Benchmarks</Button>
                        </div>
                        <div>
                            {JSON.stringify(selectedBenchmark())}
                        </div>
                        <table class="w-full">
                            <thead>
                                <tr>
                                    <td>
                                    </td>
                                    <For each={selectedBenchmark()!.models}>
                                        {m => <td class="text-right">{modelById(m.modelId)?.name || "Unknown Model"}</td>}
                                    </For>
                                </tr>
                            </thead>
                            <tbody>
                                <For each={getBenchmarkResultsGroupedByData(selectedBenchmark()!)}>
                                    {(row, rowIndex) =>
                                        <tr>
                                            <td class="text-slate-400">{rowIndex()}</td>
                                            <For each={selectedBenchmark()!.models}>
                                                {m => {
                                                    const col = row.find(r => r.modelId === m.modelId)
                                                    if (!col) {
                                                        return <td class="text-right">-</td>
                                                    }
                                                    return <td class="text-right" title={col.resultContent}>{col.score}</td>
                                                }}
                                            </For>
                                        </tr>
                                    }
                                </For>
                            </tbody>
                        </table>
                    </div>
                </Show>
            </div>
        </Page>
    )
}
export default BenchmarksView