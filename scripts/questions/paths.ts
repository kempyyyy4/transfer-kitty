import path from "node:path";
import { DATA_DIR } from "../data/sources";

/** The generator's output, read by the load step. Not committed. */
export const QUESTIONS_PATH = path.join(DATA_DIR, "build", "questions.json");
export const REPORT_PATH = path.join(DATA_DIR, "build", "question-report.txt");
