import { ProjectLifecycleClassifier } from "../../../../../../src/application/context/project/query/ProjectLifecycleClassifier.js";

describe("ProjectLifecycleClassifier", () => {
  const classifier = new ProjectLifecycleClassifier();

  it("classifies an uninitialized project", () => {
    const result = classifier.classify({
      projectInitialized: false,
      solutionContextItemCount: 0,
      launchpadReadyGoalCount: 0,
    });

    expect(result).toBe("uninitialized");
  });

  it("classifies an initialized project without project knowledge as unprimed", () => {
    const result = classifier.classify({
      projectInitialized: true,
      solutionContextItemCount: 0,
      launchpadReadyGoalCount: 0,
    });

    expect(result).toBe("unprimed");
  });

  it("classifies an initialized project with project knowledge and empty actionable backlog as primed-empty", () => {
    const result = classifier.classify({
      projectInitialized: true,
      solutionContextItemCount: 1,
      launchpadReadyGoalCount: 0,
    });

    expect(result).toBe("primed-empty");
  });

  it("classifies an initialized project with launchpad-ready context as primed", () => {
    const result = classifier.classify({
      projectInitialized: true,
      solutionContextItemCount: 1,
      launchpadReadyGoalCount: 1,
    });

    expect(result).toBe("primed");
  });
});
