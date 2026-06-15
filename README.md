# Compare Answers

A small static review tool for ranking anonymized LLM answers to many questions.

## Use

Open `index.html` in a browser. The app stores your current work in local browser storage and can export results as JSON.

Expected import format:

```json
{
  "questions": [
    {
      "question": "Your question here",
      "answers": [
        {
          "model": "gpt-5",
          "text": "Answer text"
        },
        {
          "model": "claude",
          "text": "Answer text"
        }
      ]
    }
  ]
}
```

Answers are shuffled on import so the model identity is hidden while ranking. Click **Reveal models** after ranking a question to show which model generated each answer.
