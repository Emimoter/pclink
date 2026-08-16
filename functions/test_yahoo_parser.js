function decodeHtmlEntities(str) {
    return str
        .replace(/&ndash;/g, '-')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&middot;/g, '·')
        .replace(/&bull;/g, '•')
        .replace(/&rdquo;/g, '"')
        .replace(/&ldquo;/g, '"')
        .replace(/&lsquo;/g, "'")
        .replace(/&rsquo;/g, "'")
        .replace(/&#x27;/g, "'")
        .replace(/&#x2F;/g, "/")
        .replace(/&#39;/g, "'")
        .replace(/&#34;/g, '"')
        .replace(/&deg;/g, '°')
        .replace(/&aacute;/g, 'á')
        .replace(/&eacute;/g, 'é')
        .replace(/&iacute;/g, 'í')
        .replace(/&oacute;/g, 'ó')
        .replace(/&uacute;/g, 'ú')
        .replace(/&ntilde;/g, 'ñ')
        .replace(/&Aacute;/g, 'Á')
        .replace(/&Eacute;/g, 'É')
        .replace(/&Iacute;/g, 'Í')
        .replace(/&Oacute;/g, 'Ó')
        .replace(/&Uacute;/g, 'Ú')
        .replace(/&Ntilde;/g, 'Ñ');
}

async function testYahooParser() {
    try {
        const query = "CABX0910316";
        const url = `https://search.yahoo.com/search?p=${encodeURIComponent(query)}`;
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
            }
        });
        const html = await response.text();
        
        const results = [];
        
        // Yahoo search result blocks are inside list items `<li>` with class containing `algo-sr`
        // Or simply we can look for `class="compText"` and parse backwards for the title
        // Let's search for `<div class="compText` blocks
        const compTextRegex = /<div[^>]*class="[^"]*compText[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
        let match;
        
        while ((match = compTextRegex.exec(html)) !== null) {
            const blockContent = match[1];
            // Extract paragraph text
            const pMatch = /<p[^>]*>([\s\S]*?)<\/p>/i.exec(blockContent);
            if (pMatch) {
                let snippet = pMatch[1]
                    .replace(/<[^>]*>/g, '') // remove HTML tags
                    .replace(/\s+/g, ' ')
                    .trim();
                snippet = decodeHtmlEntities(snippet);
                
                // Now let's find the title. The title is usually in an <a> tag before the compText div.
                // We can search backwards from the index of the compText match for the nearest `<h3>` or link containing `class="lh-24"` or similar
                const compTextIndex = match.index;
                const searchWindow = html.substring(Math.max(0, compTextIndex - 800), compTextIndex);
                
                // Let's find the text between `w-500">` and `</span></h3>` or similar title patterns in Yahoo
                // Yahoo titles: `<span style="..." class="... w-500">TITLE</span>`
                let title = "";
                const titleRegex = /class="[^"]*w-500[^"]*">([\s\S]*?)<\/span>/gi;
                let titleMatch;
                let lastTitleMatch = null;
                while ((titleMatch = titleRegex.exec(searchWindow)) !== null) {
                    lastTitleMatch = titleMatch;
                }
                
                if (lastTitleMatch) {
                    title = lastTitleMatch[1]
                        .replace(/<[^>]*>/g, '')
                        .replace(/\s+/g, ' ')
                        .trim();
                    title = decodeHtmlEntities(title);
                } else {
                    // Fallback to searching for a simple <h3> or link text
                    const linkMatch = /<h3[^>]*>([\s\S]*?)<\/h3>/gi.exec(searchWindow);
                    if (linkMatch) {
                        title = linkMatch[1]
                            .replace(/<[^>]*>/g, '')
                            .replace(/\s+/g, ' ')
                            .trim();
                        title = decodeHtmlEntities(title);
                    }
                }
                
                if (snippet) {
                    results.push({
                        title: title || "Sin título",
                        snippet: snippet
                    });
                }
            }
        }
        
        console.log(`Parsed ${results.length} results from Yahoo:`);
        results.slice(0, 5).forEach((r, i) => {
            console.log(`[${i + 1}] Title: "${r.title}"`);
            console.log(`    Snippet: "${r.snippet}"`);
        });
    } catch (e) {
        console.error(e);
    }
}

testYahooParser();
