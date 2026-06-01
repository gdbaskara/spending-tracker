import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AmountInput } from "../AmountInput";
import { parseRpInput, fmtRp, MAX_AMOUNT } from "@/lib/engine";

// Mirror exactly how AddModal wires the field: raw input string -> parseRpInput
// -> integer rupiah state -> formatted value. Testing through this harness
// exercises the real type/parse/format/clamp loop, not a mock.
function Harness({ initial = 0 }: { initial?: number }) {
  const [amount, setAmount] = React.useState(initial);
  return <AmountInput amount={amount} onAmount={(raw) => setAmount((a) => parseRpInput(raw, a))} />;
}

function field() {
  return screen.getByLabelText("Jumlah") as HTMLInputElement;
}

describe("AmountInput", () => {
  it("renders an accessible field that triggers the system numpad", () => {
    render(<Harness />);
    const input = field();
    // inputMode + numeric pattern is what makes mobile/iPad show the numpad.
    expect(input.getAttribute("inputmode")).toBe("numeric");
    expect(input.getAttribute("pattern")).toBe("[0-9]*");
  });

  it("shows an empty field (placeholder only) when the amount is zero", () => {
    render(<Harness />);
    const input = field();
    expect(input.value).toBe("");
    expect(input.placeholder).toBe("Rp0");
  });

  it("formats typed digits as rupiah", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const input = field();
    await user.click(input);
    await user.keyboard("125000");
    expect(input.value).toBe(fmtRp(125000)); // "Rp125.000"
  });

  it("clamps input that exceeds MAX_AMOUNT, keeping the last valid amount", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const input = field();
    await user.click(input);
    // Type MAX_AMOUNT (9 nines) then one extra digit that would overflow.
    await user.keyboard(String(MAX_AMOUNT) + "0");
    expect(input.value).toBe(fmtRp(MAX_AMOUNT)); // overflow digit rejected
  });

  it("resets to empty when the field is cleared", async () => {
    const user = userEvent.setup();
    render(<Harness initial={5000} />);
    const input = field();
    expect(input.value).toBe(fmtRp(5000));
    await user.clear(input);
    expect(input.value).toBe("");
  });
});
