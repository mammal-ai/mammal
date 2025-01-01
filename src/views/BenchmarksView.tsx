import { createSignal, For, Show } from "solid-js";
import { Page } from "../components/Page";
import { SolidApexCharts } from 'solid-apexcharts';
import { ApexOptions } from "apexcharts";
import { addBenchmark, Benchmark, benchmarks, challenges, results, runBenchmark } from "../state/BenchmarkContext";
import { Button } from "../shadcn/components/Button";
import { Select, SelectTrigger, SelectItem, SelectContent, SelectValue } from "../shadcn/components/Select"
import BenchmarkDialog from "../components/BenchmarkDialog";

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

    return <SolidApexCharts type="bar" options={options()} series={series()} />
}

type ChartProps = {
    title: string
    data: {
        label: string
        score: number
    }[]
}
const Chart = (props: ChartProps) => {
    const [options] = createSignal<ApexOptions>({
        chart: {
            toolbar: {
                show: false
            }
        },
        plotOptions: {
            bar: {
                borderRadius: 2,
                columnWidth: '70%',
                borderRadiusApplication: 'end'
                // dataLabels: {
                //     position: 'top', // top, center, bottom
                // },
            }
        },
        // dataLabels: {
        //     enabled: true,
        //     formatter: function (val) {
        //         return val + "%";
        //     },
        //     offsetY: -20,
        //     style: {
        //         fontSize: '12px',
        //         colors: ["#304758"]
        //     }
        // },

        xaxis: {
            categories: props.data.map(d => d.label),
            position: 'bottom',
            // axisBorder: {
            //     show: false
            // },
            // labels: {
            //     show: false
            // },
            // axisTicks: {
            //     show: false
            // },
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
            // axisBorder: {
            //     show: false
            // },
            // axisTicks: {
            //     show: false,
            // },
            labels: {
                // show: false,
                formatter: function (val) {
                    return Math.round(val) + "%";
                }
            },
            max: 100

        },
        // title: {
        //     text: props.title,
        //     floating: true,
        //     offsetY: 330,
        //     align: 'center',
        //     style: {
        //         color: '#444'
        //     }
        // }
    }
        // {
        //     plotOptions: {
        //         bar: {
        //             horizontal: false,
        //             columnWidth: '70%',
        //             borderRadius: 2,
        //             borderRadiusApplication: 'end'
        //         },
        //     },
        //     legend: {
        //         // show: false
        //         position: "top"
        //     },
        //     dataLabels: {
        //         enabled: false
        //     },
        //     stroke: {
        //         show: true,
        //         width: 2,
        //         colors: ['transparent']
        //     },
        //     xaxis: {
        //         categories: ['MMLU', 'GPQA', 'Hellaswag', 'Arc', 'Lmarena'],
        //     },
        //     yaxis: {
        //         // title: {
        //         //     text: '$ (thousands)'
        //         // }
        //     },
        //     fill: {
        //         opacity: 1
        //     },
        //     tooltip: {
        //         y: {
        //             formatter: function (val, _data) {
        //                 // we can use this to handle normalizing to a shared scale across different benchmarks:
        //                 // const { dataPointIndex, seriesIndex } = data
        //                 // console.log(`group: ${dataPointIndex} | col: ${seriesIndex}`)
        //                 return `${val}`
        //             }
        //         }
        //     }
        // }
    );
    const [series] = createSignal([{
        name: props.title,
        data: props.data.map(d => d.score * 100)
    }]);

    return <SolidApexCharts type="bar" options={options()} series={series()} />
}

const getBenchmarkResults = (benchmark: Benchmark) => {
    const benchmarkModels = benchmark.models
    const benchmarkChallenges = benchmark.challenges.map(challenge => challenges().find(c => c.id === challenge))
    return benchmarkChallenges.map(c => benchmarkModels.map(m => {
        const thisResult = results().find(r =>
            c?.id && r.challengeId === c.id && r.model.id === m.id
        )
        return {
            challenge: c,
            model: m,
            text: thisResult?.resultContent,
            score: Number.isFinite(thisResult?.score) ? parseFloat(thisResult.score) : "?"
        }
    }))
}

const BenchmarksView = (props: { isOpen: boolean }) => {
    const [showNewBenchmarkDialog, setShowNewBenchmarkDialog] = createSignal(false)
    const [selectedBenchmark, setSelectedBenchmark] = createSignal<Benchmark | null>(null)
    const [chartOption, setChartOption] = createSignal("Top Models")
    const chartOptions = () => ["Top Models"].concat(benchmarks().map(b => b.title))
    const chartDataForSelectedBenchmark = () => {
        const benchmark = benchmarks().find(b => b.title === chartOption())
        if (!benchmark) {
            return []
        }

        const results = getBenchmarkResults(benchmark)
        console.log(results[0])
        const aggregation = results[0].map((m, i) => ({
            label: m.model.name,
            score: results.some(m => typeof m[i].score === "string") ? 0 : avg(results.map(m => m[i].score))
        }))
        return aggregation
    }

    const onSaveBenchmark = (benchmark: Omit<Benchmark, "id">) => {
        addBenchmark(benchmark)
        setShowNewBenchmarkDialog(false)
    }

    const firstBenchmark = benchmarks()?.[0]
    if (firstBenchmark) {
        setSelectedBenchmark(firstBenchmark)
    }


    return (
        <Page isOpen={props.isOpen}>
            <BenchmarkDialog
                open={showNewBenchmarkDialog()}
                onClose={() => setShowNewBenchmarkDialog(false)}
                onSave={onSaveBenchmark}
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
                                data={chartDataForSelectedBenchmark()}
                            />
                        </Show>
                    </div>
                </div>
                {/* <div class="flex flex-col items-center bg-background rounded-md border px-6 py-4">
                    {JSON.stringify(challenges())}
                </div>
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
                                Info for {selectedBenchmark()!.title}:
                            </div>
                            <Button onClick={() => runBenchmark(selectedBenchmark()!)}>Run Benchmarks</Button>
                        </div>
                        <table class="w-full">
                            <thead>
                                <tr>
                                    <td>
                                    </td>
                                    <For each={selectedBenchmark()!.models}>
                                        {m => <td class="text-right">{m.name}</td>}
                                    </For>
                                </tr>
                            </thead>
                            <tbody>
                                <For each={getBenchmarkResults(selectedBenchmark()!)}>
                                    {row =>
                                        <tr>
                                            <td>{row?.[0].challenge?.title || "???"}</td>
                                            <For each={row}>
                                                {col =>
                                                    <td class="text-right" title={col.text}>{col.score}</td>
                                                }
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