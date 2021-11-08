import { ResponsivePie } from "@nivo/pie";

/**
 * Component to create a pie chart
 * @param {} data - data in the format at https://nivo.rocks/pie/
 * @param {boolean} radial_labels - whether you want radial labels
 * @param {boolean} slice_labels - whether you want slice labels
 */

export const PieChart = ({ data, radial_labels, slice_labels }) => (
  <ResponsivePie
    data={data}
    margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
    innerRadius={0.5}
    padAngle={0.7}
    cornerRadius={3}
    colors={{ scheme: "category10" }}
    borderWidth={1}
    borderColor={{ from: "color", modifiers: [["darker", 0.2]] }}
    enableRadialLabels={radial_labels}
    enableSliceLabels={slice_labels}
    radialLabelsSkipAngle={10}
    radialLabelsTextColor="#333333"
    radialLabelsLinkColor={{ from: "color" }}
    sliceLabelsSkipAngle={10}
    sliceLabelsTextColor="#333333"
  />
);
