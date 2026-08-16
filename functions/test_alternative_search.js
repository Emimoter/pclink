async function testSearchYahoo(query) {
    try {
        console.log(`Searching Yahoo for: ${query}`);
        const url = `https://search.yahoo.com/search?p=${encodeURIComponent(query)}`;
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
            }
        });
        console.log("Yahoo Status:", response.status);
        const html = await response.text();
        console.log("Yahoo HTML length:", html.length);
        
        // Yahoo snippets are usually in <div class="compText a"> or <p class="lh-16"> or similar
        // Let's see if we can find references to the query in the HTML
        const hasMatch = html.toLowerCase().includes("zeus") || html.toLowerCase().includes("cable");
        console.log("Yahoo contains matching terms:", hasMatch);
    } catch (e) {
        console.error("Yahoo error:", e);
    }
}

async function testSearchAsk(query) {
    try {
        console.log(`Searching Ask for: ${query}`);
        const url = `https://www.ask.com/web?q=${encodeURIComponent(query)}`;
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
            }
        });
        console.log("Ask Status:", response.status);
        const html = await response.text();
        console.log("Ask HTML length:", html.length);
        
        const hasMatch = html.toLowerCase().includes("zeus") || html.toLowerCase().includes("cable");
        console.log("Ask contains matching terms:", hasMatch);
    } catch (e) {
        console.error("Ask error:", e);
    }
}

async function run() {
    await testSearchYahoo("CABX0910316");
    console.log("-------------------------------------");
    await testSearchAsk("CABX0910316");
}

run();
