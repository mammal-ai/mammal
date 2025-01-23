import { createEffect, createSignal, For, Show } from "solid-js";
import { Page } from "../components/Page";
import { SolidApexCharts } from "solid-apexcharts";
import { ApexOptions } from "apexcharts";
import {
  addBenchmark,
  Benchmark,
  benchmarks,
  challenges,
  removeBenchmark,
  Result,
  results,
  runBenchmark,
} from "../state/BenchmarkContext";
import { Button } from "../shadcn/components/Button";
import {
  Select,
  SelectTrigger,
  SelectItem,
  SelectContent,
  SelectValue,
} from "../shadcn/components/Select";
import BenchmarkDialog from "../components/BenchmarkDialog";
import { models } from "../state/ModelProvidersContext";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "../shadcn/components/Accordion";
import { Pen, Trash2 } from "lucide-solid";

const modelById = (id: string) => {
  return models().find((m) => m.id === id);
};

const challengeById = (id: string) => {
  return challenges().find((c) => c.id === id);
};

const avg = (values: number[]) =>
  values.reduce((a, v) => a + v, 0) / values.length;

const TopModelsChart = () => {
  const [options] = createSignal<ApexOptions>({
    chart: {
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "70%",
        borderRadius: 2,
        borderRadiusApplication: "end",
      },
    },
    legend: {
      // show: false
      position: "top",
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: true,
      width: 2,
      colors: ["transparent"],
    },
    xaxis: {
      categories: ["MMLU-Pro", "GPQA Diamond", "MATH"],
    },
    yaxis: {
      // title: {
      //     text: '$ (thousands)'
      // }
    },
    fill: {
      opacity: 1,
    },
    tooltip: {
      y: {
        formatter: function (val, _data) {
          // we can use this to handle normalizing to a shared scale across different benchmarks:
          // const { dataPointIndex, seriesIndex } = data
          // console.log(`group: ${dataPointIndex} | col: ${seriesIndex}`)
          return `${val}`;
        },
      },
    },
  });
  const [series] = createSignal([
    {
      name: "GPT-4o",
      data: [72.6, 49.9, 74.6],
    },
    {
      name: "Sonnet 3.5",
      data: [78.0, 65.0, 78.3],
    },
    {
      name: "Gemini 1.5 Pro 002",
      data: [75.8, 59.1, 86.5],
    },
    {
      name: "Llama 3.3 405B",
      data: [73.3, 51.1, 73.8],
    },
  ]);

  return <SolidApexCharts type="bar" options={options()} series={series()} />;
};

type ChartProps = {
  benchmarks: string[];
  models: string[];
  data: {
    benchmark_name: string;
    model_name: string;
    score: number;
  }[];
};

const optionsFromProps: (p: ChartProps) => ApexOptions = (props) => ({
  chart: {
    toolbar: {
      show: false,
    },
  },
  plotOptions: {
    bar: {
      borderRadius: 2,
      columnWidth: "70%",
      borderRadiusApplication: "end",
    },
  },
  legend: {
    position: "top",
  },
  xaxis: {
    categories: props.benchmarks,
  },
  yaxis: {
    labels: {
      formatter: function (val) {
        return Math.round(val) + "%";
      },
    },
    max: 100,
  },
});

const seriesFromProps = (props: ChartProps) => {
  return props.models.map((m) => {
    return {
      name: m,
      data: props.benchmarks.map((b) => {
        const result = props.data.find(
          (d) => d.benchmark_name === b && d.model_name === m
        );
        return result ? result.score * 100 : 0;
      }),
    };
  });
};

const Chart = (props: ChartProps) => {
  const [options, setOptions] = createSignal<ApexOptions>(
    optionsFromProps(props)
  );
  const [series, setSeries] = createSignal(seriesFromProps(props));

  // This causes re-rendering of the chart when the props change
  createEffect(() => {
    setOptions(optionsFromProps(props));
    setSeries(seriesFromProps(props));
  });

  return <SolidApexCharts type="bar" options={options()} series={series()} />;
};

const getResultsForBenchmark = (benchmark: Benchmark) => {
  // TODO: This is pretty hacky, we need to fix this when we start storing things in the db but there's a data modelling improvement somewhere in here...!
  const data = JSON.stringify(benchmark.data);
  const models = benchmark.models.map((m) => m.modelId);
  return results().filter((r) => {
    const stringifiedData = JSON.stringify(r.data);
    return (
      r.challengeId === benchmark.challengeId &&
      (stringifiedData === "{}" || data.includes(stringifiedData)) &&
      models.includes(r.modelId)
    );
  });
};

const getBenchmarkResultsGroupedByData = (benchmark: Benchmark) => {
  const groupedByData = getResultsForBenchmark(benchmark).reduce(
    (acc, result) => {
      const key = JSON.stringify(result.data);
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(result);
      return acc;
    },
    {} as Record<string, Result[]>
  );

  return Object.values(groupedByData);
};

const getBenchmarkResultsGroupedByModel = (benchmark: Benchmark) => {
  const groupedByModel = getResultsForBenchmark(benchmark).reduce(
    (acc, result) => {
      const key = result.modelId;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(result);
      return acc;
    },
    {} as Record<string, Result[]>
  );
  return Object.values(groupedByModel);
};

const MultiSelectTrigger = (props: {
  options: { label: string; value: string; disabled: boolean }[];
}) => {
  return (
    <>
      {props.options.slice(0, 3).map((option) => (
        <span class="px-2 py-1 bg-slate-200 rounded">{option.label}</span>
      ))}
      {props.options.length > 3 && <span class="px-2 py-1">...</span>}
    </>
  );
};

const BenchmarksView = (props: { isOpen: boolean }) => {
  const [selectedChallengeId, setSelectedChallengeId] = createSignal("");
  const [showNewBenchmarkDialog, setShowNewBenchmarkDialog] =
    createSignal(false);
  const [selectedBenchmarks, setSelectedBenchmarks] = createSignal<Benchmark[]>(
    []
  );
  const [chartOption, setChartOption] = createSignal<
    {
      label: string;
      value: string;
      disabled: boolean;
    }[]
  >([]);
  // const [chartProps, setChartProps] = createSignal<ChartProps>({ title: "", data: [] })

  const chartOptions = () =>
    benchmarks().map((b) => ({
      label: b.title,
      value: b.id,
      disabled: false,
    }));
  const chartDataForBenchmark = (benchmarksToDisplay: Benchmark[]) =>
    benchmarksToDisplay
      .map((b) => {
        const results = getBenchmarkResultsGroupedByModel(b);
        return results.map((r, i) => {
          return {
            benchmark_name: b.title,
            model_name: modelById(r[0].modelId)?.name || "Unknown Model Name",
            score: r.some(({ score }) => typeof score !== "number")
              ? 0
              : avg(r.map(({ score }) => score)),
          };
        });
      })
      .flat();

  const onRunBenchmark = (benchmark: Omit<Benchmark, "id">) => {
    const newBenchmark = addBenchmark(benchmark);
    setShowNewBenchmarkDialog(false);
    runBenchmark(newBenchmark);
  };

  createEffect(() => {
    const selectedBenchmarkIds = new Set(chartOption().map((s) => s.value));
    const isSelected = (b: Benchmark) => selectedBenchmarkIds.has(b.id);
    setSelectedBenchmarks(benchmarks().filter(isSelected));
  });

  const chartData = () => chartDataForBenchmark(selectedBenchmarks());

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
              <Select<{
                label: string;
                value: string;
                disabled: boolean;
              }>
                multiple
                class={"w-full"}
                options={chartOptions()}
                optionValue="value"
                optionTextValue="label"
                optionDisabled="disabled"
                placeholder="Top Models"
                itemComponent={(props) => (
                  <SelectItem item={props.item}>
                    {props.item.textValue}
                  </SelectItem>
                )}
                value={chartOption()}
                onChange={setChartOption}
              >
                <SelectTrigger>
                  <SelectValue<{
                    label: string;
                    value: string;
                    disabled: boolean;
                  }> class="flex flex-wrap space-x-2 mr-2">
                    {(state) => (
                      <MultiSelectTrigger options={state.selectedOptions()} />
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent />
              </Select>
            </div>
          </div>
          <div class="relative w-full">
            <Show when={chartOption().length === 0}>
              <TopModelsChart />
            </Show>
            <Show when={chartOption().length > 0}>
              <Chart
                benchmarks={Array.from(
                  new Set(chartData().map((c) => c.benchmark_name))
                )}
                models={Array.from(
                  new Set(chartData().map((c) => c.model_name))
                )}
                data={chartData()}
              />
            </Show>
          </div>
        </div>
        <div class="flex flex-col items-center space-y-2 bg-background rounded-md border px-6 py-4">
          <Accordion collapsible class="w-full">
            <For each={challenges()}>
              {(challenge, i) => (
                <AccordionItem value={challenge.id} class={challenges().length - 1 === i() ? "border-b-0" : ""}>
                  <AccordionTrigger class="font-bold">
                    {challenge.title}
                  </AccordionTrigger>
                  <AccordionContent>
                    <div class="flex flex-col w-full">
                      <div class="mr-4 w-full">
                        <Button
                          class="w-full"
                          onClick={() => {
                            setSelectedChallengeId(challenge.id);
                            setShowNewBenchmarkDialog(true);
                          }}
                        >
                          Benchmark Against New Data
                        </Button>

                        <For
                          each={benchmarks().filter(
                            (b) => b.challengeId === challenge.id
                          )}
                        >
                          {(benchmark) => (
                            <div class="flex flex-row items-center justify-between w-full my-1 group">
                              {benchmark.title}
                              <div class="flex flex-row space-x-1 group-hover:visible invisible">
                                <Button
                                  size={"icon"}
                                  variant={"outline"}
                                  onClick={() => {}}
                                >
                                  <Pen />
                                </Button>
                                <Button
                                  size={"icon"}
                                  variant={"outline"}
                                  onClick={async () => {
                                    const sure = await confirm(
                                      "Are you sure you want to delete this benchmark?"
                                    );
                                    if (!sure) return;
                                    removeBenchmark(benchmark.id);
                                  }}
                                >
                                  <Trash2 />
                                </Button>
                                <Button variant={"outline"} onClick={() => {}}>
                                  View
                                </Button>
                              </div>
                            </div>
                          )}
                        </For>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}
            </For>
          </Accordion>
        </div>
        {/* <Show
          when={selectedBenchmarks().length > 0}
          fallback={"no selected benchmark"}
        >
          <div>
            <div class="flex flex-row items-center justify-between mb-4">
              <div class="font-bold">
                Info for{" "}
                {challengeById(selectedBenchmarks()?.[0]?.challengeId || "")
                  ?.title || "Unknown"}
                :
              </div>
            </div>
            <table class="w-full">
              <thead>
                <tr>
                  <td></td>
                  <For each={selectedBenchmarks()?.[0].models}>
                    {(m) => (
                      <td class="text-right">
                        {modelById(m.modelId)?.name || "Unknown Model"}
                      </td>
                    )}
                  </For>
                </tr>
              </thead>
              <tbody>
                <For
                  each={getBenchmarkResultsGroupedByData(
                    selectedBenchmarks()?.[0]!
                  )}
                >
                  {(row, rowIndex) => (
                    <tr>
                      <td class="text-slate-400">{rowIndex()}</td>
                      <For each={selectedBenchmarks()?.[0]!.models}>
                        {(m) => {
                          const col = row.find((r) => r.modelId === m.modelId);
                          if (!col) {
                            return <td class="text-right">-</td>;
                          }
                          return (
                            <td class="text-right" title={col.resultContent}>
                              {col.score}
                            </td>
                          );
                        }}
                      </For>
                    </tr>
                  )}
                </For>
              </tbody>
            </table>
          </div>
        </Show> */}
      </div>
    </Page>
  );
};
export default BenchmarksView;
