const STORAGE_KEY = "compare-answers-state-v1";

const sampleQuestions = [
  {
    id: crypto.randomUUID(),
    question: "What is the clearest way to explain why the sky is blue to a curious ten-year-old?",
    revealed: false,
    answers: [
      {
        id: crypto.randomUUID(),
        model: "Model A",
        text: "Sunlight looks white, but it is made from many colors. Blue light gets bounced around by tiny bits of air more than red or yellow light, so blue reaches your eyes from all over the sky.",
      },
      {
        id: crypto.randomUUID(),
        model: "Model B",
        text: "The sky is blue because air scatters short wavelengths of sunlight. Since blue light has a shorter wavelength, it is scattered across the atmosphere and becomes the color we see overhead.",
      },
      {
        id: crypto.randomUUID(),
        model: "Model C",
        text: "Think of sunlight as a box of colored pencils. The air shakes the blue pencil marks loose more easily, spreading blue everywhere above us while the other colors travel more straight ahead.",
      },
    ],
  },
];

const state = {
  questions: [],
  currentQuestionId: null,
};

const elements = {
  addAnswerButton: document.querySelector("#addAnswerButton"),
  addQuestionButton: document.querySelector("#addQuestionButton"),
  answerList: document.querySelector("#answerList"),
  emptyState: document.querySelector("#emptyState"),
  exportButton: document.querySelector("#exportButton"),
  exportDialog: document.querySelector("#exportDialog"),
  exportStatus: document.querySelector("#exportStatus"),
  exportText: document.querySelector("#exportText"),
  importInput: document.querySelector("#importInput"),
  loadSampleButton: document.querySelector("#loadSampleButton"),
  nextButton: document.querySelector("#nextButton"),
  previousButton: document.querySelector("#previousButton"),
  questionCounter: document.querySelector("#questionCounter"),
  questionList: document.querySelector("#questionList"),
  questionText: document.querySelector("#questionText"),
  resetRankingButton: document.querySelector("#resetRankingButton"),
  revealButton: document.querySelector("#revealButton"),
  revealStatus: document.querySelector("#revealStatus"),
  reviewPanel: document.querySelector("#reviewPanel"),
  copyExportButton: document.querySelector("#copyExportButton"),
};

const questionItemTemplate = document.querySelector("#questionItemTemplate");
const answerTemplate = document.querySelector("#answerTemplate");

function cloneQuestions(questions, { randomizeAnswers = false } = {}) {
  return questions.map((question) => ({
    id: question.id || crypto.randomUUID(),
    question: question.question || "",
    revealed: Boolean(question.revealed),
    answers: maybeShuffle(
      (question.answers || []).map((answer) => ({
        id: answer.id || crypto.randomUUID(),
        model: answer.model || "",
        text: answer.text || "",
      })),
      randomizeAnswers,
    ),
  }));
}

function maybeShuffle(items, shouldShuffle) {
  return shouldShuffle ? shuffle(items) : items;
}

function shuffle(items) {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

function getCurrentQuestion() {
  return state.questions.find((question) => question.id === state.currentQuestionId) || null;
}

function getCurrentQuestionIndex() {
  return state.questions.findIndex((question) => question.id === state.currentQuestionId);
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function setExportStatus(message) {
  elements.exportStatus.textContent = message;
}

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return;

  try {
    const parsed = JSON.parse(saved);
    state.questions = cloneQuestions(parsed.questions || []);
    state.currentQuestionId = parsed.currentQuestionId || state.questions[0]?.id || null;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function setQuestions(questions) {
  state.questions = cloneQuestions(questions, { randomizeAnswers: true });
  state.currentQuestionId = state.questions[0]?.id || null;
  saveState();
  render();
}

function render() {
  renderQuestions();
  renderCurrentQuestion();
}

function renderQuestions() {
  elements.questionList.replaceChildren();

  state.questions.forEach((question, index) => {
    const item = questionItemTemplate.content.firstElementChild.cloneNode(true);
    const button = item.querySelector(".question-button");
    const preview = question.question.trim() || "Untitled question";

    button.textContent = `${index + 1}. ${preview}`;
    button.classList.toggle("active", question.id === state.currentQuestionId);
    button.addEventListener("click", () => {
      state.currentQuestionId = question.id;
      saveState();
      render();
    });

    elements.questionList.append(item);
  });
}

function renderCurrentQuestion() {
  const question = getCurrentQuestion();
  const currentIndex = getCurrentQuestionIndex();

  elements.emptyState.classList.toggle("hidden", Boolean(question));
  elements.reviewPanel.classList.toggle("hidden", !question);
  elements.exportButton.disabled = state.questions.length === 0;

  if (!question) return;

  elements.questionCounter.textContent = `Question ${currentIndex + 1} of ${state.questions.length}`;
  elements.revealStatus.textContent = question.revealed ? "Models revealed" : "Models hidden";
  elements.questionText.value = question.question;
  elements.previousButton.disabled = currentIndex <= 0;
  elements.nextButton.disabled = currentIndex >= state.questions.length - 1;
  elements.revealButton.textContent = question.revealed ? "Hide models" : "Reveal models";

  renderAnswers(question);
}

function renderAnswers(question) {
  elements.answerList.replaceChildren();

  question.answers.forEach((answer, index) => {
    const item = answerTemplate.content.firstElementChild.cloneNode(true);
    const rankNumber = item.querySelector(".rank-number");
    const answerLabel = item.querySelector(".answer-label");
    const modelName = item.querySelector(".model-name");
    const answerText = item.querySelector(".answer-text");
    const modelInput = item.querySelector(".model-input");
    const moveUp = item.querySelector(".move-up");
    const moveDown = item.querySelector(".move-down");
    const removeAnswer = item.querySelector(".remove-answer");

    rankNumber.textContent = index + 1;
    answerLabel.textContent = `Answer ${String.fromCharCode(65 + index)}`;
    modelName.textContent = answer.model || "Unknown model";
    modelName.classList.toggle("hidden", !question.revealed);
    modelInput.closest(".model-editor").classList.toggle("hidden", !question.revealed);
    answerText.value = answer.text;
    modelInput.value = answer.model;
    moveUp.disabled = index === 0;
    moveDown.disabled = index === question.answers.length - 1;

    answerText.addEventListener("input", () => {
      answer.text = answerText.value;
      saveState();
    });

    modelInput.addEventListener("input", () => {
      answer.model = modelInput.value;
      saveState();
      renderAnswers(question);
    });

    moveUp.addEventListener("click", () => {
      moveAnswer(question, index, index - 1);
    });

    moveDown.addEventListener("click", () => {
      moveAnswer(question, index, index + 1);
    });

    removeAnswer.addEventListener("click", () => {
      question.answers.splice(index, 1);
      saveState();
      render();
    });

    elements.answerList.append(item);
  });
}

function moveAnswer(question, fromIndex, toIndex) {
  const [answer] = question.answers.splice(fromIndex, 1);
  question.answers.splice(toIndex, 0, answer);
  saveState();
  render();
}

function addQuestion() {
  const question = {
    id: crypto.randomUUID(),
    question: "",
    revealed: false,
    answers: [
      { id: crypto.randomUUID(), model: "", text: "" },
      { id: crypto.randomUUID(), model: "", text: "" },
    ],
  };

  state.questions.push(question);
  state.currentQuestionId = question.id;
  saveState();
  render();
}

function addAnswer() {
  const question = getCurrentQuestion();
  if (!question) return;

  question.answers.push({
    id: crypto.randomUUID(),
    model: "",
    text: "",
  });
  saveState();
  render();
}

function resetRanking() {
  const question = getCurrentQuestion();
  if (!question) return;

  question.answers = shuffle(question.answers);
  question.revealed = false;
  saveState();
  render();
}

function toggleReveal() {
  const question = getCurrentQuestion();
  if (!question) return;

  question.revealed = !question.revealed;
  saveState();
  render();
}

function exportResults() {
  if (state.questions.length === 0) {
    setExportStatus("Load questions before exporting.");
    return;
  }

  const payload = JSON.stringify({ questions: state.questions }, null, 2);
  const blob = new Blob([payload], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `compare-answers-results-${new Date().toISOString().slice(0, 10)}.json`;
  link.style.display = "none";
  document.body.append(link);
  link.click();
  link.remove();
  setExportStatus(`Exported ${state.questions.length} question${state.questions.length === 1 ? "" : "s"}.`);
  elements.exportText.value = payload;
  elements.exportDialog.showModal();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function copyExportJson() {
  elements.exportText.select();
  try {
    await navigator.clipboard.writeText(elements.exportText.value);
    setExportStatus("Copied JSON.");
  } catch {
    document.execCommand("copy");
    setExportStatus("Copied JSON.");
  }
}

async function importQuestions(event) {
  const [file] = event.target.files;
  if (!file) return;

  try {
    const payload = JSON.parse(await file.text());
    const questions = Array.isArray(payload) ? payload : payload.questions;
    if (!Array.isArray(questions)) {
      throw new Error("Expected a JSON array or an object with a questions array.");
    }
    setQuestions(questions);
  } catch (error) {
    alert(`Could not import questions: ${error.message}`);
  } finally {
    event.target.value = "";
  }
}

function goToQuestion(offset) {
  const nextIndex = getCurrentQuestionIndex() + offset;
  const nextQuestion = state.questions[nextIndex];
  if (!nextQuestion) return;

  state.currentQuestionId = nextQuestion.id;
  saveState();
  render();
}

elements.addQuestionButton.addEventListener("click", addQuestion);
elements.addAnswerButton.addEventListener("click", addAnswer);
elements.copyExportButton.addEventListener("click", copyExportJson);
elements.exportButton.addEventListener("click", exportResults);
elements.importInput.addEventListener("change", importQuestions);
elements.loadSampleButton.addEventListener("click", () => setQuestions(sampleQuestions));
elements.nextButton.addEventListener("click", () => goToQuestion(1));
elements.previousButton.addEventListener("click", () => goToQuestion(-1));
elements.questionText.addEventListener("input", () => {
  const question = getCurrentQuestion();
  if (!question) return;

  question.question = elements.questionText.value;
  saveState();
  renderQuestions();
});
elements.resetRankingButton.addEventListener("click", resetRanking);
elements.revealButton.addEventListener("click", toggleReveal);

loadState();
render();
