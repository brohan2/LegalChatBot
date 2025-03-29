require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const Fuse = require("fuse.js");

const app = express();
app.use(express.json());
app.use(cors());

const OLLAMA_URL = "http://127.0.0.1:11434/api/generate"; // Ollama API endpoint
const MODEL = "llama3"; // Model name

// 📂 Load knowledge base JSON files
const knowledgeBase = [];
const knowledgePath = path.join(__dirname, "knowledge_base");

// Ensure knowledge_base directory exists
if (fs.existsSync(knowledgePath)) {
    fs.readdirSync(knowledgePath).forEach((file) => {
        if (file.endsWith(".json")) {
            const filePath = path.join(knowledgePath, file);
            const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
            knowledgeBase.push(...data);
        }
    });
} else {
    console.warn("⚠️  Warning: knowledge_base directory not found.");
}

// 🔍 Fuzzy search setup
const fuse = new Fuse(knowledgeBase, {
    keys: ["question"],
    threshold: 0.4, // Adjust similarity threshold
});

app.post("/chat", async (req, res) => {
    try {
        const { prompt } = req.body;
        if (!prompt) {
            return res.status(400).json({ error: "Prompt is required" });
        }

        // 🎯 Handle greetings separately
        const greetings = ["hi", "hello", "hii", "hey"];
        if (greetings.includes(prompt.trim().toLowerCase())) {
            return res.json({ response: "Hello! How can I assist you with legal inquiries today?" });
        }

        // 🔍 Find relevant knowledge
        const bestMatch = fuse.search(prompt, { limit: 1 });
        let knowledgeText = "";

        if (bestMatch.length > 0) {
            knowledgeText = `Here is some relevant information:\n\n**${bestMatch[0].item.question}**\n${bestMatch[0].item.answer}\n\n`;
        }

        // 📝 Enhance the prompt
        const enhancedPrompt = `You are a legal advisory chatbot for the Indian Constitution. Answer in a professional and informative way. This is knowledge text and use it if required: \n\n${knowledgeText} \n\nUser's question: ${prompt}`;

        // 🧠 Get response from AI
        const response = await axios.post(OLLAMA_URL, {
            model: MODEL,
            prompt: enhancedPrompt,
            stream: false,
        });

        // ✨ Format response
        let formattedResponse = response.data.response
            .replace(/\n/g, "\n\n") // Add extra line spacing
            .replace(/\*\*(.*?)\*\*/g, "<b>$1</b>"); // Convert **bold** to HTML bold

        res.json({ response: formattedResponse });
    } catch (error) {
        console.error("Error:", error.message);
        res.status(500).json({ error: "Something went wrong. Please try again." });
    }
});

// Start server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
});
