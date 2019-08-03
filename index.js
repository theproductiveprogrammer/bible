#!/usr/bin/env node
'use strict'
const express = require('express')

const main = require('./main')

const app = express()

const PORT = 1923

function httpserver(books) {
    app.get('/', (req, res) => {
        sendChapter(main.randomChapter(books), res)
    })

    app.listen(PORT, (err) => {
        if(err) console.error(err)
        else console.log(`Started on port ${PORT}...`)
    })

}

function sendChapter(book, res) {
    res.header('Content-Type', 'text/html')

    let testament = 'the old testament'
    if(book.testament == 'new') testament = 'the new testament'
    res.write(`<b>From a book of ${testament}: ${book.title}</b>`)
    res.write(`<br/><pre>(${main.chapterId(book)})</pre>`)
    res.write('<hr/><pre>')
    for(let i = 0;i < book.chapter.txt.length;i++) {
        res.write('<p>')
        res.write(book.chapter.txt[i])
        res.write('</p>')
    }
    res.write('</pre>')

    res.end()
}

main.serve(httpserver)
