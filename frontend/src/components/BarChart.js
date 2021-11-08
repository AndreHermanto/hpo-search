import { ResponsiveBar } from "@nivo/bar";

/**
 * Component to render a bar chart from Nivo.
 * @param {} data - data in format https://nivo.rocks/bar/
 * @param {Array<string>} - keys to determine each series - https://nivo.rocks/bar/
 * @param {} label - denotes how  bar labels are computed - https://nivo.rocks/bar/
 */

export const BarChart = ({ data, keys, label }) => (
  <ResponsiveBar
    data={data}
    indexBy="id"
    keys={keys}
    margin={{ top: 50, bottom: 50, left: 200, right: 50 }}
    padding={0.3}
    layout="horizontal"
    valueScale={{ type: "linear" }}
    indexScale={{ type: "band", round: true }}
    colors={{ scheme: "category10" }}
    borderColor={{ from: "color", modifiers: [["darker", 1.6]] }}
    axisTop={null}
    enableGridY={false}
    enableLabel={true}
    axisRight={null}
    axisBottom={{
      tickSize: 5,
      tickPadding: 5,
      tickRotation: 0,
      legend: "Number of Patients",
      legendPosition: "middle",
      legendOffset: 32,
    }}
    axisLeft={{
      tickSize: 5,
      tickPadding: 5,
      tickRotation: 0,
      legendPosition: "middle",
      legendOffset: -40,
    }}
    labelSkipWidth={12}
    labelSkipHeight={12}
    label={(d) => `${d.value}`}
    labelTextColor={{ from: "color", modifiers: [["darker", 1.6]] }}
    animate={true}
    motionStiffness={90}
    motionDamping={15}
  />
);
