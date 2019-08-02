'use strict'
const fs = require('fs')
const path = require('path')

function main() {
    load(path.join(__dirname,'kjv.txt'), (err, books) => {
        if(err) console.error(err)
        else serve(books)
    })
}

function serve(books) {
    let chap

    if(process.argv.length < 3) {
        chap = serve_random_chapter_1(books)
    } else {
        let num = process.argv[2]
        chap = loadChapter(books, num)
        if(!chap) {
            return console.error(`Did not understand: ${num}`)
        }
    }
    consoleShow(chap)
    recordShown(chap)

    function serve_random_chapter_1(books) {
        let bk = books[Math.floor(Math.random()*books.length)]
        return serveChapter(bk, bk.chapters[Math.floor(Math.random()*bk.chapters.length)])
    }
}

function serveChapter(book, chapter) {
    return {
        testament: book.testament,
        title: book.title,
        num: book.num,
        chapter: chapter
    }
}

function loadChapter(books, num) {
    let m = num.match(/([on])([0-9]+)[^0-9]([0-9]+)/)
    if(!m) return
    let t = m[1]
    let bknum = m[2]
    let chapnum = m[3]

    let testament = 'new'
    if(t == 'o') testament = 'old'

    for(let i = 0;i < books.length;i++) {
        let book = books[i]
        if(book.testament == testament && book.num == bknum) {
            for(let i = 0;i < book.chapters.length;i++) {
                let chapter = book.chapters[i]
                if(chapter.txt[0].startsWith(`${chapnum}:`)) {
                    return serveChapter(book, chapter)
                }
            }
        }
    }
}

function chapterId(book) {
    let testament = 'o'
    if(book.testament == 'new') testament = 'n'
    return `${testament}${book.num}|${book.chapter.num}`
}

const shown = path.join(__dirname, ".verses-shown")
function recordShown(book) {
    if(book.chapter.num == 'xxx') return
    let id = chapterId(book)
    fs.appendFile(shown, `${id}\n`, (err) => {
        if(err) console.error(err)
        else console.log(id)
    })
}

function consoleShow(book) {
    let testament = 'the old testament'
    if(book.testament == 'new') testament = 'the new testament'
    console.log(`(from a book of ${testament} -`)

    console.log(`\t${book.title})`)
    console.log('===')
    console.log(book.chapter.txt.join('\n'))
}

/*      problem/
 * Load the bible text from the given file and split it into it's
 * component books.
 *
 *      understand/
 * The bible text looks like this:
 *  +----------------------
 *  |
 *  |   preface
 *  |
 *  |   Genesis
 *  |
 *  |   1:1 xxxx
 *  |
 *  |   Second book of Moses
 *  |   also called ...
 *  |
 *  |   1:1 yyyyy
 *  |
 *
 *      way/
 * Read the entire text then split it by empty lines into block. Split
 * them into 'old testament' and 'new testament' then gather them into
 * books and return both of them
 */
function load(name, cb) {
    fs.readFile(name, 'utf8', (err, data) => {
        if(err) cb(err)
        else {
            let blocks = split_by_empty_lines_1(data)
            let testaments = split_into_testaments(blocks)
            let ot = split_into_books_1(testaments.oldtestament)
            let nt = split_into_books_1(testaments.newtestament)
            ot = ot.map(b => {
                b.testament = 'old'
                return b
            })
            nt = nt.map(b => {
                b.testament = 'new'
                return b
            })
            let books = ot.concat(nt)
            for(let i = 0;i < books.length;i++) split_into_chapters_1(books[i])
            cb(null, books)
        }
    })

    /*      outcome/
     * Take the text and find the indexes of each new chapter then split
     * by those indexes
     */
    function split_into_chapters_1(book) {
        let curr = "XXXXXX"
        let ndxs = []
        for(let i = 0;i < book.txt.length;i++) {
            let txt = book.txt[i]
            if(!txt.startsWith(curr)) {
                ndxs.push(i)
                curr = txt.split(':')[0]+':'
            }
        }
        let chapters = []
        for(let i = 0;i < ndxs.length;i++) {
            let txt = book.txt.slice(ndxs[i], ndxs[i+1])
            let m = txt[0].match(/^([0-9]+):/)
            let num = 'xxx'
            if(m) num = m[1]
            chapters.push({
                num: num,
                txt: txt
            })
        }
        book.chapters = chapters
    }

    /*      outcome/
     * All books have a starting chapter `1:1` so we look for the
     * matching block, take the previous block as the book title and
     * split like that.
     */
    function split_into_books_1(blocks) {
        let ndxs = []
        for(let i = 0;i < blocks.length;i++) {
            if(blocks[i].startsWith('1:1 ')) ndxs.push(i-1)
        }
        let books = []
        for(let i = 0;i < ndxs.length;i++) {
            let ndx = ndxs[i]
            books.push({
                num: books.length+1,
                title: blocks[ndx],
                txt: blocks.slice(ndx+1, ndxs[i+1]),
            })
        }
        return books
    }

    /*      outcome/
     * Remove the start and ending portions then find the 'old
     * testament' and 'new testament' matching blocks and split by that
     */
    function split_into_testaments(blocks) {
        let ndxs = {}
        for(let i = 0;i < blocks.length;i++) {
            let block = blocks[i]
            if(matches_start_1(block)) ndxs.start = i
            if(matches_old_testament(block)) ndxs.oldtestament = i
            if(matches_new_testament(block)) ndxs.newtestament = i
            if(matches_end_1(block)) ndxs.end = i
        }

        return {
            oldtestament: blocks.slice(ndxs.oldtestament+1, ndxs.newtestament),
            newtestament: blocks.slice(ndxs.newtestament+1, ndxs.end)
        }


        function matches_start_1(block) {
            return /start of this project gutenberg ebook/i.test(block)
        }
        function matches_old_testament(block) {
            return /^the old testament/i.test(block)
        }
        function matches_new_testament(block) {
            return /^the new testament/i.test(block)
        }
        function matches_end_1(block) {
            return /end of this project gutenberg ebook/i.test(block)
        }
    }

    /*      outcome/
     * Normalize the data (by joining \r\n as single \n) and then split
     * by multiple newlines.
     */
    function split_by_empty_lines_1(data) {
        data = data.replace(/\r\n/g, '\n')
        return data.split(/\n\n+/)
    }
}

module.exports = main
