import type {
  ProblemType,
  ProblemMode,
  Difficulty,
  ScoringType
} from "../../generated/prisma/enums.js";

export type testCaseInput = {
    input: string,
    expectedOutput: string,
    isSample: boolean,
    explanation?: string,
    weight?: number,
    order?: number
}

export type CreateProblemInput = {
    title: string,
    type: ProblemType,
    mode?: ProblemMode,
    difficulty: Difficulty,
    statement:string,
    inputFormat: string,
    outputFormat: string,
    constraints?: string,
    notes?: string,
    hints?: string[],
    scoringType?: ScoringType,
    points?: number,
    estimatedMinutes?: number,
    topicIds: string[];
    testCases: testCaseInput[];
}
