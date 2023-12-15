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
    console.log('hello')
    return math.evaluate(expression)
  },

  // -----------------------------------------------
  // -----------------------------------------------
  // Here you go I added this function tht generates
  // the image
  create_image: async ({ prompt }) => {
    const result = await openai.images.generate({ prompt })

    // added this
    console.log({ prompt })

    console.log(JSON.stringify({ result }, null, 2))

    return ''
  },
  // ---------------------------------------------
  // ---------------------------------------------
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
      // -----------------------------------------------
      // -----------------------------------------------
      // I added this
      {
        name: 'create_image',
        description: 'Generate or create image based on description.',
        parameters: {
          type: 'object',
          properties: {
            prompt: {
              type: 'string',
              description:
                "Description of an image to be generated. Example: 'Image of a flying Bosnian train.'",
            },
          },
          required: ['propmpt'],
        },
      },
      // -----------------------------------------------
      // -----------------------------------------------
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
