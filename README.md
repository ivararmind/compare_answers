# Compare Answers

A small static review tool for ranking four anonymized LLM answers to many questions.

## Use

Open `index.html` in a browser. The app stores your current work in local browser storage and can export results as JSON.

Questions and answers are imported as read-only review data. Ranking and reveal state are saved locally in the browser.

Expected import format:

```json
{
  "questions": [
    {
      "question": "Your question here",
      "answers": [
        {
          "model": "gpt-5",
          "text": "Answer text 1"
        },
        {
          "model": "claude",
          "text": "Answer text 2"
        },
        {
          "model": "gemini",
          "text": "Answer text 3"
        },
        {
          "model": "llama",
          "text": "Answer text 4"
        }
      ]
    }
  ]
}
```

Answers are shuffled on import so the model identity is hidden while ranking. Click **Reveal models** after ranking a question to show which model generated each answer.
