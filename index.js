#!/usr/bin/env node
'use strict'
const path = require('path')

const express = require('express')

const main = require('./main')

const app = express()

const PORT = 1923

function httpserver(err, books) {
    if(err) {
        console.error(err)
        return
    }

    const favs = path.join(__dirname, "favs")
    main.loadMetaFileLines(favs, (err, lines) => {
        if(err) console.error(err)
        else start_server_1(books, load_favs_1(lines))
    })


    function start_server_1(books, favs) {
        app.get('/g', (req, res) => {
            getRequested(req.query.s, books, favs, res)
        })

        app.get('/', (req, res) => {
            sendChapter(main.randomChapter(books), favs, res)
        })

        app.listen(PORT, (err) => {
            if(err) console.error(err)
            else console.log(`Started on port ${PORT}...`)
        })
    }

    function load_favs_1(lines) {
        return lines.map(l => {
            let chap = main.loadChapter(books, l)
            if(chap) {
                return {
                    id: l,
                    chap: {
                      title: chap.title,
                      num: chap.chapter.num,
                    }
                }
            } else {
                return {
                    id: l
                }
            }
        })
    }

}

function getRequested(search, books, favs, res) {
    let chap = main.loadChapter(books, search)
    if(chap) sendChapter(chap, favs, res)
    else {
        let r = main.findResults(books, search)
        if(r && r.length) sendResults(r, res, search)
        else {
            let bks = main.findMatchingBooks(books, search)
            if(bks && bks.length) sendMatchingBooks(bks, res, search)
            else sendNoResults(res, search)
        }
    }
}

function sendResults(r, res, search) {
    res.write(`<!doctype html>
<html>
<head>
    <meta charset="utf-8">
    <title>The Bible: Search Results</title>
</head>
<body>`)

    res.write(`<h2>Search Results for: '${search}'</h2>`)
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

    res.write(`<form method=get action=/g>
    <input name="s"></input><button type=submit value=submit>Submit</button>
</form>`)

    res.write(`</body>
</html>`)

    res.end()
}

function sendMatchingBooks(r, res, search) {
    res.write(`<!doctype html>
<html>
<head>
    <meta charset="utf-8">
    <title>The Bible: Search Results</title>
</head>
<body>`)

    res.write(`<h2>Multiple books match: '${search}'</h2>`)
    res.write(`<ul>`)
    for(let i = 0;i < r.length;i++) {
        res.write(`<li>${r[i].book.title}</li>`)
    }
    res.write(`</ul>`)

    res.write(`<form method=get action=/g>
    <input name="s"></input><button type=submit value=submit>Submit</button>
</form>`)

    res.write(`</body>
</html>`)

    res.end()
}

function sendNoResults(res, search) {
    res.write(`<!doctype html>
<html>
<head>
    <meta charset="utf-8">
    <title>The Bible: Search Results</title>
</head>
<body>`)

    res.write(`<h2>Search Results for: '${search}'</h2>`)
    res.write(`<p>(No results found)</p>`)

    res.write(`<form method=get action=/g>
    <input name="s"></input><button type=submit value=submit>Submit</button>
</form>`)

    res.write(`</body>
</html>`)

    res.end()
}

function sendChapter(book, favs, res) {
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

    res.write(`<hr/><p><b>Favorites</b><ul>`)
    for(let i = 0;i < favs.length;i++) {
        let fav = favs[i]
        if(fav.chap) {
            res.write(`<li><a href="g?s=${fav.id}">${fav.chap.title} (Chapter ${fav.chap.num})</a></li>`)
        } else {
            res.write(`<li><a href="g?s=${fav.id}">[${fav.id}]</a></li>`)
        }
    }
    res.write(`</ul></p><hr/>`)

    res.write(`</body>
</html>`)

    res.end()
}

main.serve(httpserver)
