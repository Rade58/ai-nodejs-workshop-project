import 'dotenv/config'

import OpenAI from 'openai'
const openai = new OpenAI()

const results = await openai.chat.completions.create({
  model: 'gpt-',
  messages: [
    {
      role: 'system',
      content:
        'You are an AI assistant, answer any questions to the best of your ability.',
    },
    {
      role: 'user',
      content: 'Hi!',
    },
  ],
})

console.log(JSON.stringify({ results }, null, 2))
