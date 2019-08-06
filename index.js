#!/usr/bin/env node
'use strict'
const express = require('express')

const main = require('./main')

const app = express()

const PORT = 1923

function httpserver(books) {
    app.get('/g', (req, res) => {
        getRequested(req.query.s, books, res)
    })

    app.get('/', (req, res) => {
        sendChapter(main.randomChapter(books), res)
    })

    app.listen(PORT, (err) => {
        if(err) console.error(err)
        else console.log(`Started on port ${PORT}...`)
    })

}

function getRequested(search, books, res) {
    let chap = main.loadChapter(books, search)
    if(chap) sendChapter(chap, res)
    else {
        let r = main.findResults(books, search)
        res.write(`<!doctype html>
<html>
<head>
    <meta charset="utf-8">
    <title>The Bible: Search Results</title>
</head>
<body>`)

        res.write(`<h2>Search Results for: '${search}'</h2>`)
        if(!r || !r.length) {
            res.write('(No Results found)')
        } else {
            res.write('<ul>')
            for(let i = 0;i < r.length;i++) {
                let book = r[i]
                res.write(`<li>${main.chapterId(book)} ${book.title}`)
                res.write(`<pre>`)
                for(let i = 0;i < book.result.length;i++) {
                    res.write('<p>')
                    res.write(book.result[i])
                    res.write('</p>')
                }
                res.write(`</pre></li>`)
                res.write(`</li>`)
            }
        }

        res.write(`<form method=get action=/g>
    <input name="s"></input><button type=submit value=submit>Submit</button>
</form>`)

        res.write(`</body>
</html>`)

        res.end()

    }
}

function sendChapter(book, res) {
    res.header('Content-Type', 'text/html')

    let testament = 'the old testament'
    if(book.testament == 'new') testament = 'the new testament'

    res.write(`<!doctype html>
<html>
<head>
    <meta charset="utf-8">
    <title>The Bible: ${book.title} Chap ${book.chapter.num}</title>
</head>
<body>`)

    res.write(`<b>From a book of ${testament}: ${book.title}</b>`)
    res.write(`<br/><pre>(${main.chapterId(book)})</pre>`)
    res.write('<hr/><pre>')
    for(let i = 0;i < book.chapter.txt.length;i++) {
        res.write('<p>')
        res.write(book.chapter.txt[i])
        res.write('</p>')
    }
    res.write('</pre>')

    res.write(`<form method=get action=/g>
    <input name="s"></input><button type=submit value=submit>Submit</button>
</form>`)

    res.write(`</body>
</html>`)

    res.end()
}

main.serve(httpserver)
