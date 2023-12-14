import 'dotenv/config'

import math from 'advanced-calculator'

import { openai } from './openai.js'
const QUESTION = process.argv[2] || 'hi'

const messages = [
  {
    role: 'user',
    content: QUESTION,
  },
]

const functions = {
  calculate: ({ expression }) => {
    // added this log
    console.log('hello')
    //
    return math.evaluate(expression)
  },
}

const getCompletion = async (messages) => {
  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo-0613',
    messages,
    // function_call: {name: "calculate"},
    functions: [
      {
        name: 'calculate',
        description: 'Run a math expression',
        parameters: {
          type: 'object',
          properties: {
            expression: {
              type: 'string',
              description:
                "The math expression to evaluate. Example of it is: '2  * 3 + (21 / 2) ^ 2'",
            },
          },
          required: ['expression'],
        },
      },
    ],
    temperature: 0,
  })

  return response
}

let response

while (true) {
  response = await getCompletion(messages)

  if (response.choices[0].finish_reason === 'stop') {
    console.log(response.choices[0].message.content)
    break
  } else if (response.choices[0].finish_reason == 'function_call') {
    const fnName = response.choices[0].message.function_call.name

    const args = response.choices[0].message.function_call.arguments

    const functionToCll = functions[fnName]

    const params = JSON.parse(args)

    const result = functionToCll(params)

    messages.push({
      role: 'assistant',
      content: null,
      function_call: {
        name: fnName,
        arguments: args,
      },
    })

    messages.push({
      role: 'function',
      name: fnName,
      content: JSON.stringify({ result: result }),
    })
  }
}
