/**
 * Banner Content Generator
 *
 * Generates banner content based on project state:
 * - No project: Welcome message with getting started guide
 * - Project exists: Project summary with session and goal status
 */

import chalk from "chalk";
import { ProjectSummaryView } from "../../../application/context/project/ProjectSummaryView.js";
import { WorkSummaryView } from "../../../application/context/work/views/WorkSummaryView.js";

/**
 * Combined context for banner display
 */
export interface BannerDisplayContext {
  project: ProjectSummaryView | null;
  work: WorkSummaryView;
}

/**
 * Generate banner content based on project state
 *
 * @param context - Combined project and work context
 * @returns Array of content lines to display
 */
export function generateBannerContent(context: BannerDisplayContext): string[] {
  if (!context.project) {
    return generateWelcomeContent();
  }
  return generateProjectSummaryContent(context);
}

/**
 * Welcome content for uninitialized projects
 */
function generateWelcomeContent(): string[] {
  return [
    // "Hi. I'm Jumbo!",
    // "",
    // "Gone are the days of working with amnesiac coding agents. I track the",
    // "details about your project necessary to keep your coding agent implementing",
    // "the solution according to the standards you define. I serve them as pertinent context to your agent when",
    // "when they need it. Keeping them on track and you focused on your goals not baby-sitting your agent.",
    // "The best part is that my memory is portable. Your not bound to a single coding agent",
    // "model or harness. Switch any of those and everything I've collected about your ",
    // "project follows without you lifting a finger. No need to reinitialize or do anything.",
    // "Change models, or switch from CLI to IDE and I just work---picking up right where we left off.",
    // "Actually, ",
    // "the best part is probably that I'm open source, free to use and always will be!",
    // "Initialize your project by running 'jumbo init' to get started.",
    // "After that you pretty much just need to focus on defining the goals you want to ",
    // "accomplish. You're coding agent will guide you through the rest.",
    // "You can be more hands-on if you want and always work with me directly using the CLI to",
    // "manage goals, architecture details, coding guidelines, invariants and more.",
    // "Run 'jumbo --help' to see all available commands.",
    // "I hope you find great use in Jumbo. Happy coding!",
    // "Follow on x, y and z for updates, tips and news.",

    "Memory for Coding Agents",
    "",
    "Use Jumbo.",
    "Focus on goals, not context.",
    "",
    "Portable: switch models, tools, or IDEs—context follows.",
    "Private: all data stays local. Free and open source.",
    "",
    "Get started:  jumbo init",
    "Add a goal:   jumbo goal add",
    "All commands: jumbo --help",
  ];
}

/**
 * Project summary content for initialized projects
 */
function generateProjectSummaryContent(
  context: BannerDisplayContext,
): string[] {
  const lines: string[] = [];

  lines.push(
    "  " + chalk.gray("Project: ") + chalk.white(context.project!.name),
  );

  // Session status
  if (context.work.session && context.work.session.status === "active") {
    lines.push(
      "  " +
        chalk.gray("Session: ") +
        context.work.session.focus +
        " " +
        chalk.green("(active)"),
    );
  } else {
    lines.push(
      "  " +
        chalk.gray("Start session: ") +
        chalk.cyan('jumbo session start --focus "Your focus"'),
    );
  }

  lines.push(" ");

  // Goal summary
  if (context.work.goals.active > 0) {
    lines.push(
      `  ${chalk.green(String(context.work.goals.active))} active goal${context.work.goals.active > 1 ? "s" : ""}` +
        (context.work.goals.blocked > 0
          ? ` | ${chalk.red(String(context.work.goals.blocked))} blocked`
          : ""),
    );
  } else if (context.work.goals.planned > 0) {
    lines.push(
      `  ${chalk.blue(String(context.work.goals.planned))} planned goal${context.work.goals.planned > 1 ? "s" : ""} ready to start`,
    );
  } else {
    lines.push(
      "  " +
        chalk.gray("No goals yet. Add one with: ") +
        chalk.cyan("jumbo goal add"),
    );
  }

  lines.push(" ");
  lines.push(
    "  " +
      chalk.gray("Type ") +
      chalk.cyan("jumbo --help") +
      chalk.gray(" for all commands"),
  );
  lines.push(" ");

  return lines;
}
