import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Text, useInput } from "ink";
import {
  BaseColors,
  SemanticColors,
  TuiGlyphs,
} from "../../shared/DesignTokens.js";
import {
  GoalStatus,
  type GoalStatusType,
} from "../../../domain/goals/Constants.js";
import type { GoalView } from "../../../application/context/goals/GoalView.js";
import type { AddGoalRequest } from "../../../application/context/goals/add/AddGoalRequest.js";
import type { AddGoalResponse } from "../../../application/context/goals/add/AddGoalResponse.js";
import type { GoalContext } from "../../../application/context/goals/get/GoalContext.js";
import type { RelatedContext } from "../../../application/context/goals/get/RelatedContext.js";
import type { ComponentView } from "../../../application/context/components/ComponentView.js";
import type { DependencyView } from "../../../application/context/dependencies/DependencyView.js";
import type { DecisionView } from "../../../application/context/decisions/DecisionView.js";
import type { GuidelineView } from "../../../application/context/guidelines/GuidelineView.js";
import type { InvariantView } from "../../../application/context/invariants/InvariantView.js";
import { KeyBadge } from "../ui-primitives/KeyBadge.js";
import { HorizontalRule } from "../ui-primitives/HorizontalRule.js";
import { GoalAuthoringFlow } from "./GoalAuthoringFlow.js";
import type {
  GoalAuthoringSubmissionResult,
  GoalAuthoringValues,
} from "./GoalAuthoringFlow.js";
import { GoalAuthoringRequestStatus } from "./GoalAuthoringFlowConstants.js";
import { AddGoalRequestFactory } from "./AddGoalRequestFactory.js";
import { ActionDispatcher } from "../action-dispatch/ActionDispatcher.js";
import type { RequestController } from "../action-dispatch/RequestController.js";
import { useGoalContext } from "../state-reading/useGoalContext.js";
import { useGoalsList } from "../state-reading/useGoalsList.js";
import {
  GOAL_BROWSER_TITLE_MAX_LENGTH,
  GOAL_DECISION_PAGE_SIZE,
  GOAL_RELATED_DESCRIPTION_MAX_LENGTH,
  GOAL_SECTION_PAGE_SIZE,
  GOAL_STATUS_FILTER_ALL,
  GOAL_STATUS_FILTERS,
  GoalsScreenCopy,
} from "./GoalsScreenConstants.js";

interface GoalListEntry {
  readonly id: string;
  readonly title: string;
  readonly status: GoalStatusType;
  readonly objective: string;
  readonly criteria: readonly string[];
  readonly scopeIn: readonly string[];
  readonly scopeOut: readonly string[];
  readonly progress: readonly string[];
  readonly prerequisiteGoals: readonly string[];
  readonly note?: string;
  readonly reviewIssues?: string;
  readonly nextGoalId?: string;
  readonly branch?: string;
  readonly worktree?: string;
  readonly claimedBy?: string;
  readonly claimedAt?: string;
  readonly claimExpiresAt?: string;
  readonly version: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

interface GoalSection {
  readonly key: string;
  readonly title: string;
  readonly rows: readonly GoalSectionRow[];
  readonly emptyText?: string;
  readonly paginated: boolean;
  readonly pageSize?: number;
}

interface GoalSectionRow {
  readonly heading?: string;
  readonly label?: string;
  readonly name?: string;
  readonly value: string;
  readonly color?: string;
  readonly marker?: "bullet" | "plain";
  readonly fields?: readonly GoalSectionField[];
}

interface GoalSectionField {
  readonly label: string;
  readonly value: string;
}

interface GoalSectionPage {
  readonly section: GoalSection;
  readonly pageIndex: number;
  readonly totalPages: number;
  readonly rows: readonly GoalSectionRow[];
}

interface GoalsScreenProps {
  readonly statusFilter?: readonly GoalStatusType[];
  readonly terminalWidth?: number;
  readonly shortcutsEnabled?: boolean;
  readonly addGoalController?: RequestController<
    AddGoalRequest,
    AddGoalResponse
  >;
  readonly onModalOpenChange?: (isOpen: boolean) => void;
}

const STATUS_COLORS: Record<GoalStatusType, string> = {
  [GoalStatus.TODO]: SemanticColors.muted,
  [GoalStatus.POSTPONED]: SemanticColors.warning,
  [GoalStatus.REFINED]: SemanticColors.info,
  [GoalStatus.DOING]: SemanticColors.success,
  [GoalStatus.BLOCKED]: SemanticColors.error,
  [GoalStatus.INREVIEW]: SemanticColors.warning,
  [GoalStatus.DONE]: BaseColors.brandGreen70,
  [GoalStatus.PAUSED]: SemanticColors.warning,
  [GoalStatus.QUALIFIED]: SemanticColors.success,
  [GoalStatus.REJECTED]: SemanticColors.error,
  [GoalStatus.SUBMITTED]: SemanticColors.info,
  [GoalStatus.CODIFYING]: SemanticColors.accent,
  [GoalStatus.IN_REFINEMENT]: SemanticColors.info,
  [GoalStatus.UNBLOCKED]: SemanticColors.warning,
};

const EMPTY_GOAL_CONTEXT: GoalContext = {
  components: [],
  dependencies: [],
  decisions: [],
  invariants: [],
  guidelines: [],
};

export function GoalsScreen({
  statusFilter,
  terminalWidth,
  shortcutsEnabled = true,
  addGoalController,
  onModalOpenChange,
}: GoalsScreenProps = {}): React.ReactElement {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [sectionPageFlowIndex, setSectionPageFlowIndex] = useState(0);
  const [filterIndex, setFilterIndex] = useState(0);
  const [authoringOpen, setAuthoringOpen] = useState(false);
  const activeFilter = GOAL_STATUS_FILTERS[filterIndex];
  const requestedStatusFilter = useMemo(
    () =>
      statusFilter ??
      (activeFilter === GOAL_STATUS_FILTER_ALL
        ? undefined
        : ([activeFilter] as readonly GoalStatusType[])),
    [activeFilter, statusFilter],
  );
  const goalsList = useGoalsList(requestedStatusFilter);
  const visibleGoals = useMemo(() => {
    const responseGoals = goalsList.data?.goals;

    if (responseGoals !== undefined) {
      return responseGoals.map(toGoalListEntry);
    }

    return [];
  }, [goalsList.data]);
  const selectedGoal = visibleGoals[selectedIndex] ?? visibleGoals[0];
  const goalContext = useGoalContext(selectedGoal?.id);
  const contextualGoal = goalContext.data?.contextualGoalView.goal;
  const activeGoal =
    contextualGoal !== undefined && contextualGoal.goalId === selectedGoal?.id
      ? toGoalListEntry(contextualGoal)
      : selectedGoal;
  const activeContext =
    contextualGoal !== undefined && contextualGoal.goalId === selectedGoal?.id
      ? (goalContext.data?.contextualGoalView.context ?? EMPTY_GOAL_CONTEXT)
      : EMPTY_GOAL_CONTEXT;
  const sections = useMemo(
    () =>
      activeGoal === undefined
        ? []
        : buildGoalSections(activeGoal, activeContext),
    [activeContext, activeGoal],
  );
  const sectionPages = useMemo(
    () => sections.flatMap(toGoalSectionPages),
    [sections],
  );
  const activeSectionPage =
    sectionPages[sectionPageFlowIndex] ?? sectionPages[0];
  const filterLabel = statusFilter?.join(", ") ?? activeFilter;

  useEffect(() => {
    setSelectedIndex(0);
    setSectionPageFlowIndex(0);
  }, [requestedStatusFilter]);

  useEffect(() => {
    setSectionPageFlowIndex(0);
  }, [selectedGoal?.id]);

  useEffect(() => {
    setSectionPageFlowIndex((currentIndex) => {
      if (sectionPages.length === 0) {
        return 0;
      }

      return Math.min(currentIndex, sectionPages.length - 1);
    });
  }, [sectionPages.length]);

  useEffect(() => {
    setSelectedIndex((currentIndex) => {
      if (visibleGoals.length === 0) {
        return 0;
      }

      return Math.min(currentIndex, visibleGoals.length - 1);
    });
  }, [visibleGoals.length]);

  const updateAuthoringOpen = useCallback(
    (isOpen: boolean) => {
      setAuthoringOpen(isOpen);
      onModalOpenChange?.(isOpen);
    },
    [onModalOpenChange],
  );

  useEffect(
    () => () => {
      onModalOpenChange?.(false);
    },
    [onModalOpenChange],
  );

  useInput((input, key) => {
    if (!shortcutsEnabled || authoringOpen) {
      return;
    }

    if (input === "n" || input === "N" || input === "a" || input === "A") {
      updateAuthoringOpen(true);
      return;
    }

    if (input === " " && statusFilter === undefined) {
      setFilterIndex((currentIndex) =>
        wrapIndex(currentIndex + 1, GOAL_STATUS_FILTERS.length),
      );
      return;
    }

    if (visibleGoals.length > 0 && key.upArrow) {
      setSelectedIndex((currentIndex) =>
        wrapIndex(currentIndex - 1, visibleGoals.length),
      );
      return;
    }

    if (visibleGoals.length > 0 && key.downArrow) {
      setSelectedIndex((currentIndex) =>
        wrapIndex(currentIndex + 1, visibleGoals.length),
      );
      return;
    }

    if (sectionPages.length > 0 && key.leftArrow) {
      setSectionPageFlowIndex((currentIndex) =>
        wrapIndex(currentIndex - 1, sectionPages.length),
      );
      return;
    }

    if (sectionPages.length > 0 && key.rightArrow) {
      setSectionPageFlowIndex((currentIndex) =>
        wrapIndex(currentIndex + 1, sectionPages.length),
      );
    }
  });

  const handleAuthoringComplete = async (
    values: GoalAuthoringValues,
  ): Promise<GoalAuthoringSubmissionResult> => {
    if (addGoalController === undefined) {
      return {
        status: GoalAuthoringRequestStatus.FAILURE,
        error: GoalsScreenCopy.authoringUnavailable,
      };
    }

    const result = await ActionDispatcher.dispatch(
      addGoalController,
      AddGoalRequestFactory.create(values),
    );

    if (!result.ok) {
      return {
        status: GoalAuthoringRequestStatus.FAILURE,
        error: result.error.message,
      };
    }

    return {
      status: GoalAuthoringRequestStatus.SUCCESS,
      goalId: result.response.goalId,
    };
  };

  const handleAuthoringAcknowledged = async (_goalId: string) => {
    await goalsList.refresh();
    updateAuthoringOpen(false);
  };

  const handleAuthoringCancel = () => {
    updateAuthoringOpen(false);
  };

  if (authoringOpen) {
    return (
      <GoalAuthoringFlow
        onComplete={handleAuthoringComplete}
        onSuccessAcknowledged={handleAuthoringAcknowledged}
        onCancel={handleAuthoringCancel}
      />
    );
  }

  return (
    <Box flexDirection="column" paddingTop={1}>
      <Box flexDirection="column" paddingX={1}>
        <Box gap={1}>
          <Text color={SemanticColors.h2} bold>
            {GoalsScreenCopy.browserTitle}
          </Text>
          <KeyBadge char="n" label={GoalsScreenCopy.newGoal} />
        </Box>

        <Box gap={3}>
          <Box>
            <Text color={SemanticColors.label}>
              {GoalsScreenCopy.showingLabel}{" "}
            </Text>
            <Text color={SemanticColors.primary}>
              {selectedGoal
                ? `${selectedIndex + 1}/${visibleGoals.length}`
                : "0/0"}
            </Text>
            <KeyBadge char="↑↓" />
          </Box>
          <Box>
            <Text color={SemanticColors.label}>
              {GoalsScreenCopy.stateLineLabel}{" "}
            </Text>
            <Text color={SemanticColors.primary}>
              {formatFilterLabel(filterLabel)}
            </Text>
            <KeyBadge char="space" />
          </Box>
        </Box>
      </Box>

      <HorizontalRule color={SemanticColors.label} width={terminalWidth} />

      <Box flexDirection="column" paddingX={1}>
        {goalsList.loading && goalsList.data === null ? (
          <Text color={SemanticColors.muted}>
            {GoalsScreenCopy.loadingGoals}
          </Text>
        ) : goalsList.error !== null ? (
          <Text color={SemanticColors.error}>{goalsList.error.message}</Text>
        ) : activeGoal === undefined || activeSectionPage === undefined ? (
          <Text color={SemanticColors.muted}>{GoalsScreenCopy.emptyGoals}</Text>
        ) : (
          <Box flexDirection="column">
            <GoalHeading goal={activeGoal} />
            <SectionHeading
              section={activeSectionPage.section}
              pageIndex={activeSectionPage.pageIndex}
              totalPages={activeSectionPage.totalPages}
            />
            {goalContext.loading && goalContext.data === null && (
              <Text color={SemanticColors.muted}>
                {GoalsScreenCopy.loadingContext}
              </Text>
            )}
            <GoalSectionRows
              rows={activeSectionPage.rows}
              emptyText={
                activeSectionPage.section.emptyText ??
                GoalsScreenCopy.emptyFieldValue
              }
            />
          </Box>
        )}
      </Box>
    </Box>
  );
}

function GoalHeading({
  goal,
}: {
  readonly goal: GoalListEntry;
}): React.ReactElement {
  return (
    <Box flexDirection="column">
      <Box>
        <Text color={SemanticColors.headline}>GOAL: </Text>
        <Text color={SemanticColors.headline}>
          {truncateText(goal.title, GOAL_BROWSER_TITLE_MAX_LENGTH)}
        </Text>
        <KeyBadge char="←→" label="details" />
      </Box>
    </Box>
  );
}

function SectionHeading({
  section,
  pageIndex,
  totalPages,
}: {
  readonly section: GoalSection;
  readonly pageIndex: number;
  readonly totalPages: number;
}): React.ReactElement {
  const normalizedTitle = section.title.endsWith(":")
    ? section.title.slice(0, -1)
    : section.title;
  const title =
    totalPages > 1
      ? `${normalizedTitle} (${pageIndex + 1}/${totalPages}):`
      : section.title.endsWith(":")
        ? section.title
        : `${section.title}:`;

  return (
    <Box marginTop={1}>
      <Text color={SemanticColors.h2} bold>
        {title}
      </Text>
    </Box>
  );
}

function GoalSectionRows({
  rows,
  emptyText,
}: {
  readonly rows: readonly GoalSectionRow[];
  readonly emptyText: string;
}): React.ReactElement {
  if (rows.length === 0) {
    return (
      <Text color={SemanticColors.muted} italic>
        {emptyText}
      </Text>
    );
  }

  return (
    <Box flexDirection="column">
      {rows.map((row, index) => (
        <Box
          key={`${row.label ?? row.heading ?? row.name ?? "row"}-${index}`}
          marginTop={
            (row.heading !== undefined ||
              row.name !== undefined ||
              row.marker === "bullet") &&
            index > 0
              ? 1
              : 0
          }
        >
          {row.heading !== undefined ? (
            <Text color={SemanticColors.h2} bold>
              {row.heading}
            </Text>
          ) : row.name !== undefined ? (
            <Box flexDirection="column">
              <Text color={SemanticColors.h3}>{row.name}</Text>
              {row.value.length > 0 && (
                <Text color={row.color ?? SemanticColors.primary}>
                  {row.value}
                </Text>
              )}
              {row.fields?.map((field, fieldIndex) => (
                <Box key={`${field.label}-${fieldIndex}`}>
                  <Text color={SemanticColors.label}>{field.label} </Text>
                  <Text color={SemanticColors.primary}>{field.value}</Text>
                </Box>
              ))}
            </Box>
          ) : row.label === undefined && row.marker === "bullet" ? (
            <React.Fragment>
              <Box flexShrink={0}>
                <Text color={SemanticColors.label}>{TuiGlyphs.bullet} </Text>
              </Box>
              <Text color={row.color ?? SemanticColors.primary}>
                {row.value}
              </Text>
            </React.Fragment>
          ) : row.label === undefined ? (
            <Text color={row.color ?? SemanticColors.primary}>{row.value}</Text>
          ) : (
            <React.Fragment>
              <Text color={SemanticColors.label}>{row.label} </Text>
              <Text color={row.color ?? SemanticColors.primary}>
                {row.value}
              </Text>
            </React.Fragment>
          )}
        </Box>
      ))}
    </Box>
  );
}

function buildGoalSections(
  goal: GoalListEntry,
  context: GoalContext,
): readonly GoalSection[] {
  return [
    {
      key: "objectiveMetadata",
      title: GoalsScreenCopy.sections.objective,
      paginated: false,
      rows: [
        { value: goal.objective },
        {
          heading: GoalsScreenCopy.sections.metadata,
          value: GoalsScreenCopy.sections.metadata,
        },
        { label: GoalsScreenCopy.details.id, value: goal.id },
        {
          label: GoalsScreenCopy.details.status,
          value: goal.status,
          color: STATUS_COLORS[goal.status],
        },
        { label: GoalsScreenCopy.details.createdAt, value: goal.createdAt },
        { label: GoalsScreenCopy.details.updatedAt, value: goal.updatedAt },
        {
          label: GoalsScreenCopy.details.branch,
          value: goal.branch ?? GoalsScreenCopy.emptyFieldValue,
        },
        {
          label: GoalsScreenCopy.details.worktree,
          value: goal.worktree ?? GoalsScreenCopy.emptyFieldValue,
        },
        {
          label: GoalsScreenCopy.details.claimedBy,
          value: goal.claimedBy ?? GoalsScreenCopy.emptyFieldValue,
        },
        {
          label: GoalsScreenCopy.details.claimedAt,
          value: goal.claimedAt ?? GoalsScreenCopy.emptyFieldValue,
        },
        {
          label: GoalsScreenCopy.details.claimExpiresAt,
          value: goal.claimExpiresAt ?? GoalsScreenCopy.emptyFieldValue,
        },
      ],
    },
    textSection("note", GoalsScreenCopy.sections.note, goal.note),
    textSection(
      "reviewIssues",
      GoalsScreenCopy.sections.reviewIssues,
      goal.reviewIssues,
    ),
    listSection(
      "successCriteria",
      GoalsScreenCopy.sections.successCriteria,
      goal.criteria.map((criterion) => ({
        value: criterion,
        marker: "bullet",
      })),
    ),
    listSection(
      "currentProgress",
      GoalsScreenCopy.sections.currentProgress,
      goal.progress.map((progress) => ({ value: progress, marker: "bullet" })),
    ),
    listSection("scope", GoalsScreenCopy.sections.scope, [
      ...goal.scopeIn.map((scopeItem) => ({
        label: GoalsScreenCopy.details.scopeIn,
        value: scopeItem,
      })),
      ...goal.scopeOut.map((scopeItem) => ({
        label: GoalsScreenCopy.details.scopeOut,
        value: scopeItem,
      })),
      ...goal.prerequisiteGoals.map((goalId) => ({
        label: GoalsScreenCopy.details.prerequisites,
        value: goalId,
      })),
    ]),
    relatedSection(
      "relatedComponents",
      GoalsScreenCopy.sections.relatedComponents,
      context.components,
      formatComponent,
    ),
    relatedSection(
      "relatedDependencies",
      GoalsScreenCopy.sections.relatedDependencies,
      context.dependencies,
      formatDependency,
    ),
    decisionsSection(context.decisions),
    relatedSection(
      "relatedInvariants",
      GoalsScreenCopy.sections.relatedInvariants,
      context.invariants,
      formatInvariant,
    ),
    relatedSection(
      "relatedGuidelines",
      GoalsScreenCopy.sections.relatedGuidelines,
      context.guidelines,
      formatGuideline,
    ),
  ];
}

function textSection(key: string, title: string, value?: string): GoalSection {
  return {
    key,
    title,
    paginated: false,
    rows: value === undefined || value.trim().length === 0 ? [] : [{ value }],
  };
}

function listSection(
  key: string,
  title: string,
  rows: readonly GoalSectionRow[],
): GoalSection {
  return {
    key,
    title,
    rows,
    paginated: true,
  };
}

function relatedSection<TEntity>(
  key: string,
  title: string,
  relations: ReadonlyArray<RelatedContext<TEntity>>,
  formatEntity: (entity: TEntity) => RelatedEntityDisplay,
): GoalSection {
  return listSection(
    key,
    title,
    relations.map((relation) => {
      const display = formatEntity(relation.entity);
      return {
        name: display.name,
        value: truncateText(
          display.description,
          GOAL_RELATED_DESCRIPTION_MAX_LENGTH,
        ),
      };
    }),
  );
}

interface RelatedEntityDisplay {
  readonly name: string;
  readonly description: string;
}

function toGoalSectionPages(section: GoalSection): readonly GoalSectionPage[] {
  const pageSize = section.pageSize ?? GOAL_SECTION_PAGE_SIZE;
  const totalPages = section.paginated
    ? Math.max(1, Math.ceil(section.rows.length / pageSize))
    : 1;

  return Array.from({ length: totalPages }, (_, pageIndex) => ({
    section,
    pageIndex,
    totalPages,
    rows: getRenderedRows(section, pageIndex),
  }));
}

function formatComponent(component: ComponentView): RelatedEntityDisplay {
  return { name: component.name, description: component.description };
}

function formatDependency(dependency: DependencyView): RelatedEntityDisplay {
  const version = dependency.versionConstraint
    ? `@${dependency.versionConstraint}`
    : "";
  return {
    name: `${dependency.ecosystem}:${dependency.packageName}${version}`,
    description:
      dependency.contract || dependency.endpoint || "External dependency",
  };
}

function decisionsSection(
  decisions: ReadonlyArray<RelatedContext<DecisionView>>,
): GoalSection {
  return {
    key: "relatedDecisions",
    title: GoalsScreenCopy.sections.relatedDecisions,
    paginated: true,
    pageSize: GOAL_DECISION_PAGE_SIZE,
    rows: decisions.map((related) => ({
      name: related.entity.title,
      value: "",
      fields: [
        {
          label: GoalsScreenCopy.details.decisionContext,
          value: related.entity.context,
        },
        ...(related.entity.rationale !== null &&
        related.entity.rationale.length > 0
          ? [
              {
                label: GoalsScreenCopy.details.decisionRationale,
                value: related.entity.rationale,
              },
            ]
          : []),
      ],
    })),
  };
}

function formatInvariant(invariant: InvariantView): RelatedEntityDisplay {
  return { name: invariant.title, description: invariant.description };
}

function formatGuideline(guideline: GuidelineView): RelatedEntityDisplay {
  return {
    name: `[${guideline.category}] ${guideline.title}`,
    description: guideline.description,
  };
}

function formatFilterLabel(filter: string): string {
  if (filter === GOAL_STATUS_FILTER_ALL) {
    return "All";
  }

  return filter;
}

function getRenderedRows(
  section: GoalSection | undefined,
  pageIndex: number,
): readonly GoalSectionRow[] {
  if (section === undefined) {
    return [];
  }

  if (!section.paginated) {
    return section.rows;
  }

  const pageSize = section.pageSize ?? GOAL_SECTION_PAGE_SIZE;
  const start = pageIndex * pageSize;
  return section.rows.slice(start, start + pageSize);
}

function wrapIndex(index: number, itemCount: number): number {
  return (index + itemCount) % itemCount;
}

function truncateText(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 3)}...`;
}

function toGoalListEntry(goal: GoalView): GoalListEntry {
  return {
    id: goal.goalId,
    title: goal.title,
    status: goal.status,
    objective: goal.objective,
    criteria: goal.successCriteria,
    scopeIn: goal.scopeIn,
    scopeOut: goal.scopeOut,
    progress: goal.progress,
    prerequisiteGoals: goal.prerequisiteGoals ?? [],
    note: goal.note,
    reviewIssues: goal.reviewIssues,
    nextGoalId: goal.nextGoalId,
    branch: goal.branch,
    worktree: goal.worktree,
    claimedBy: goal.claimedBy,
    claimedAt: goal.claimedAt,
    claimExpiresAt: goal.claimExpiresAt,
    version: goal.version,
    createdAt: goal.createdAt,
    updatedAt: goal.updatedAt,
  };
}
