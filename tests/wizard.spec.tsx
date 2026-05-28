import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { Wizard } from "@/components/wizard/Wizard";

function setup() {
  return render(
    <MemoryRouter>
      <Wizard />
    </MemoryRouter>
  );
}

describe("Wizard", () => {
  it("disables Next until the current question is answered", async () => {
    setup();
    const next = screen.getByRole("button", { name: /Next/i });
    expect(next).toBeDisabled();
    await userEvent.click(screen.getByText(/3 to 10 million/));
    expect(next).toBeEnabled();
  });

  it("shows 'See recommendation' on the last step", async () => {
    setup();
    const user = userEvent.setup();
    // Advance through 6 of 7 questions
    for (let i = 0; i < 6; i++) {
      const options = screen.queryAllByRole("radio");
      if (options.length > 0) {
        await user.click(options[0]!);
      } else {
        // multi-select step (environments) — Production is forced-checked,
        // so it counts as answered without explicit click.
      }
      const nextBtn = screen.getByRole("button", { name: /Next/i });
      await user.click(nextBtn);
    }
    expect(screen.getByRole("button", { name: /See recommendation/i })).toBeInTheDocument();
  });
});
