import React, { useState } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown"; // For formatting response
import "./App.css";

function App() {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false); // State for loading indicator

  const sendMessage = async () => {
    if (!message.trim()) return;

    const userMessage = { sender: "user", text: message };
    setChat([...chat, userMessage]);
    setMessage(""); // Clear input field
    setLoading(true); // Show "Typing..." indicator

    try {
      const response = await axios.post("http://localhost:5001/chat", { prompt: message });

      const botMessage = { sender: "bot", text: response.data.response };
      setChat([...chat, userMessage, botMessage]);
    } catch (error) {
      console.error("Error:", error);
      setChat([...chat, userMessage, { sender: "bot", text: "Error processing request." }]);
    }

    setLoading(false); // Hide "Typing..." indicator after response
  };

  return (
  <>
    <div className="chat-container">
      <h1>Legal Chatbot</h1>
      <div className="chat-box">
  {chat.length === 0 && !loading && (
    <div className="welcome-message">
       Welcome! Ask me a legal question to get started.
    </div>
  )}
  {chat.map((msg, index) => (
    <div key={index} className={`message ${msg.sender}`}>
      <ReactMarkdown>{msg.text}</ReactMarkdown>
    </div>
  ))}
  {loading && <div className="typing-indicator">Typing...</div>}
</div>

      <div className="input-box">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ask your legal question..."
        />
        <button onClick={sendMessage} disabled={loading}>
          {loading ? "Thinking..." : "Send"}
        </button>
      </div>
    </div>
  </>
  );
}

export default App;
