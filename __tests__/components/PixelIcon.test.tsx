import React from "react";
import { render } from "@testing-library/react-native";
import { PixelIcon } from "../../components/PixelIcon";

describe("PixelIcon", () => {
  it("renders icon image for valid name", () => {
    const { toJSON } = render(<PixelIcon name="swords" />);
    expect(toJSON()).toBeTruthy();
  });

  it("renders at default size 24", () => {
    const { toJSON } = render(<PixelIcon name="crown" />);
    const tree = toJSON() as any;
    expect(tree.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ width: 24, height: 24 })])
    );
  });

  it("applies size prop", () => {
    const { toJSON } = render(<PixelIcon name="crown" size={48} />);
    const tree = toJSON() as any;
    expect(tree.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ width: 48, height: 48 })])
    );
  });

  it("renders different icon names", () => {
    const { toJSON: toJSON1 } = render(<PixelIcon name="boulder" />);
    const { toJSON: toJSON2 } = render(<PixelIcon name="shield" />);
    expect(toJSON1()).toBeTruthy();
    expect(toJSON2()).toBeTruthy();
  });
});
