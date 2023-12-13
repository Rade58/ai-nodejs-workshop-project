import { Document } from 'langchain/document'
import { MemoryVectorStore } from 'langchain/vectorstores/memory'
import { OpenAIEmbeddings } from 'langchain/embeddings/openai'

import { CharacterTextSplitter } from 'langchain/text_splitter'

import { PDFLoader } from 'langchain/document_loaders/fs/pdf'
import { YoutubeLoader } from 'langchain/document_loaders/web/youtube'

import { openai } from './openai.js'

const video =
  'https://www.youtube.com/watch?v=zR_iuq2evXo&list=PLum3CyP95edxwLIHenKw0nMHlfvr76ZSU&index=7'
const question = process.argv[2] || 'Zdravo!'

// console.log(`Your question: "${question}"\n`)

const createStore = (docs) =>
  MemoryVectorStore.fromDocuments(docs, new OpenAIEmbeddings())

const docsFromYTVideo = (video) => {
  const loader = YoutubeLoader.createFromUrl(video, {
    language: 'en',
    addVideoInfo: true,
  })

  return loader.loadAndSplit(
    new CharacterTextSplitter({
      separator: ' ',
      chunkSize: 2500,
      chunkOverlap: 100,
    })
  )
}

const docsFromPDF = () => {
  const loader = new PDFLoader('xbox.pdf')

  return loader.loadAndSplit(
    new CharacterTextSplitter({
      separator: '. ',
      chunkSize: 2500,
      chunkOverlap: 200,
    })
  )
}

const loadStore = async () => {
  const videoDocs = await docsFromYTVideo(video)
  const pdfDocs = await docsFromPDF()

  // I just want to see how document look like
  // want to know what data is one document so I print
  // one from each
  // console.log(videoDocs[0], pdfDocs[0])

  return createStore([...videoDocs, ...pdfDocs])
}

const query = async () => {
  const store = await loadStore()
  const results = await store.similaritySearch(question, 2)

  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo-0613',
    temperature: 0,
    messages: [
      {
        role: 'assistant',
        content:
          'You are a helpful Serbian AI assistnt. Answer questions to your best ability.',
      },
      {
        role: 'user',
        content: `Answer the following question using the provided context. If you
cnnot answer the questions with the context, don't lie and don't make up stuff.
Just say that you need more context.
              Question: ${question}

              Context: ${results.map((r) => r.pageContent).join('\n')}
        `,
      },
    ],
  })

  console.log(
    `Answer: ${response.choices[0].message.content}\n\nSources:${results
      .map((r) => r.metadata.source)
      .join(', ')}`
  )
}

query()
