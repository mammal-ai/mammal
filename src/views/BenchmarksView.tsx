import { createSignal } from "solid-js";
import { Page } from "../components/Page";
// import { Card, CardContent, CardHeader, CardTitle } from "../shadcn/components/Card";
// import { Button } from "../shadcn/components/Button";
import { SolidApexCharts } from 'solid-apexcharts';
import { ApexOptions } from "apexcharts";


const BenchmarksView = (props: { isOpen: boolean }) => {
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

    return (
        <Page isOpen={props.isOpen}>
            <div class="mx-auto min-w-[36rem] max-w-[48rem] p-6 mt-2">
                <div class="flex flex-col items-center bg-background rounded-md border px-6 py-4">
                    <div class="flex flex-row w-full items-center justify-between">
                        <div class="font-bold">Model Benchmarks</div>
                        {/* <Button>Hi</Button> */}
                    </div>
                    <div class="relative w-full">
                        <SolidApexCharts toolbar={{ show: false }} type="bar" options={options()} series={series()} />
                    </div>
                </div>
            </div>
        </Page>
    )
}
export default BenchmarksView