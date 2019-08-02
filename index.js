'use strict'
const fs = require('fs')

function main() {
    load('kjv.txt', (err, books) => {
        if(err) console.error(err)
        else serve(books)
    })
}

function serve(books) {
    consoleShow(serve_random_chapter_1(books))


    function serve_random_chapter_1(books) {
        let bk = books[Math.floor(Math.random()*books.length)]
        return {
            testament: bk.testament,
            title: bk.title,
            txt: bk.chapters[Math.floor(Math.random()*bk.chapters.length)],
        }
    }
}

function consoleShow(book) {
    console.log(`(from a book of ${book.testament.toLowerCase()} -`)
    console.log(`\t${book.title})`)
    console.log('===')
    console.log(book.txt.join('\n'))
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
                b.testament = 'The Old Testament'
                return b
            })
            nt = nt.map(b => {
                b.testament = 'The New Testament'
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
            let chapter = book.txt.slice(ndxs[i], ndxs[i+1])
            chapters.push(chapter)
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

main()
