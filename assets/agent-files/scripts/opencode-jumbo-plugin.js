// Managed by Jumbo. Refresh with `jumbo evolve --yes`.
export const JumboCompactionPlugin = async ({ $, directory }) => {
  const pausedSessionIds = new Set();

  return {
    "experimental.session.compacting": async (input, output) => {
      const result = await $`jumbo work pause --format json --quiet`
        .cwd(directory)
        .quiet()
        .nothrow();

      if (result.exitCode !== 0) {
        const detail = result.stderr.toString().trim();
        throw new Error(
          `Jumbo failed to pause work before compaction${detail ? `: ${detail}` : ""}`,
        );
      }

      const stdout = result.text().trim();
      if (!stdout) {
        return;
      }

      let paused;
      try {
        paused = JSON.parse(stdout);
      } catch {
        throw new Error(
          "Jumbo returned invalid pause output before compaction",
        );
      }

      if (paused.info === "No active goal to pause") {
        return;
      }

      if (
        typeof paused.goalId !== "string" ||
        typeof paused.objective !== "string"
      ) {
        throw new Error("Jumbo pause output did not identify the active goal");
      }

      pausedSessionIds.add(input.sessionID);
      const context = [
        "## Jumbo Active Goal",
        `Goal ID: ${paused.goalId}`,
        `Objective: ${paused.objective}`,
        "Jumbo paused this goal before compaction and will resume it afterward. Continue this goal after compaction.",
      ].join("\n");

      if (output.prompt) {
        output.prompt = `${output.prompt}\n\n${context}`;
      } else {
        output.context.push(context);
      }
    },

    "experimental.compaction.autocontinue": async (input) => {
      if (!pausedSessionIds.has(input.sessionID)) {
        return;
      }

      const result = await $`jumbo work resume --format text --quiet`
        .cwd(directory)
        .quiet()
        .nothrow();

      if (result.exitCode !== 0) {
        const detail = result.stderr.toString().trim();
        throw new Error(
          `Jumbo failed to resume work after compaction${detail ? `: ${detail}` : ""}`,
        );
      }

      pausedSessionIds.delete(input.sessionID);
    },
  };
};
