async function testLite() {
    try {
        const query = "CABX0910316";
        // Let's try GET first
        const getUrl = `https://lite.duckduckgo.com/lite/?q=${encodeURIComponent(query)}`;
        let response = await fetch(getUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
            }
        });
        console.log("GET Status:", response.status);
        let html = await response.text();
        console.log("GET HTML length:", html.length);
        
        // If GET doesn't work or returns standard page, try POST which is the official lite search method
        if (html.length < 5000 || html.includes("challenge") || response.status !== 200) {
            console.log("Trying POST method...");
            response = await fetch("https://lite.duckduckgo.com/lite/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
                },
                body: `q=${encodeURIComponent(query)}`
            });
            console.log("POST Status:", response.status);
            html = await response.text();
            console.log("POST HTML length:", html.length);
        }

        // Print sample to inspect search structure
        console.log("Sample:", html.substring(html.indexOf("result-snippet"), html.indexOf("result-snippet") + 500));
    } catch (e) {
        console.error(e);
    }
}

testLite();
