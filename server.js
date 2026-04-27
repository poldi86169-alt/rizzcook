const express = require('express');
const multer = require('multer');
const axios = require('axios');
require('dotenv').config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(express.static('.'));

// OpenRouter models for Rizz generation
const MODELS = [
    "google/gemma-3-4b-it:free",    // Fast & often available
    "google/gemma-3-12b-it:free",   // Good balance
    "google/gemma-3n-e4b-it:free",  // Efficient 'n' version
    "google/gemma-3-27b-it:free",   // Strongest (but often busy)
    "google/gemma-3n-e2b-it:free"   // Backup small
];

app.post('/api/rizz', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).send('No image uploaded.');
        const base64Image = req.file.buffer.toString('base64');

        let success = false;
        let rizzResponse = "";

        // Try models in order
        for (const model of MODELS) {
            console.log(`Trying model: ${model}...`);
            try {
                const response = await axios.post("https://openrouter.ai/api/v1/chat/completions", {
                    model: model,
                    messages: [
                        {
                            role: "user",
                            content: [
                                { 
                                    type: "text", 
                                    text: "You are a Rizz expert. Analyze this chat screenshot. Messages on the RIGHT side are from the user (me). Messages on the LEFT side are from the person they want to flirt with. Suggest ONE short, charming, witty, and FLIRTY Rizz response that will make them interested in you - be playful, confident, charming, and slightly suggestive. Use playful teasing, innuendos, or witty comebacks that show interest while making them want more. Match their writing style and the conversation vibe. Examples: 'Maybe it could get better if we do something together', 'sounds like you need some company', 'I could fix that for you'. Make it impressive and engaging - NOT boring or cold. Only output the text, no quotation marks, no explanation." 
                                },
                                { 
                                    type: "image_url", 
                                    image_url: { url: `data:${req.file.mimetype};base64,${base64Image}` } 
                                }
                            ]
                        }
                    ]
                }, {
                    headers: {
                        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                        "Content-Type": "application/json",
                        "HTTP-Referer": "http://localhost:3000",
                        "X-Title": "RizzCook"
                    },
                    timeout: 20000 // 20 Sekunden Zeit geben
                });

                if (response.data.choices && response.data.choices[0]) {
                    rizzResponse = response.data.choices[0].message.content;
                    console.log(`Success with ${model}!`);
                    success = true;
                    break; 
                }
            } catch (err) {
                const errorMsg = err.response ? err.response.data.error.message : err.message;
                console.log(`${model} Error: ${errorMsg}`);
                // If more models are available, continue trying
                continue;
            }
        }

        if (success) {
            res.json({ rizz: rizzResponse, error: false });
        } else {
            throw new Error("All models are currently overloaded.");
        }

    } catch (error) {
        console.error("COMPLETE FAILURE:", error.message);
        res.status(500).json({ rizz: "The kitchen is temporarily closed due to overload. Try again in 30 seconds!", error: true });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Rizz server running with Gemma-3-IT models on port ${PORT}`));