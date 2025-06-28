// server.js

// Load environment variables from .env file (e.g., GEMINI_API_KEY)
require('dotenv').config();

const express = require('express');
const cors = require('cors'); // Enables Cross-Origin Resource Sharing
const { GoogleGenerativeAI } = require('@google/generative-ai'); // Google Gemini API SDK

const app = express();
// Define the port for the server to listen on.
// Uses the PORT environment variable if available, otherwise defaults to 3000.
const port = process.env.PORT || 3000;

// --- Middleware Setup ---
// Enable CORS for all routes. This is crucial for your HTML file (frontend)
// to be able to send requests to this Node.js server (backend) when they are
// served from different origins (e.g., file:// for HTML vs. http://localhost for Node).
app.use(cors());

// Enable Express to parse JSON formatted request bodies.
// This is necessary to read the `message` field sent from your frontend.
app.use(express.json());

// --- Google Gemini API Initialization ---
// Retrieve the Gemini API key from environment variables.
// It's critical to keep API keys secret and not hardcode them.
const geminiApiKey = process.env.GEMINI_API_KEY;

// Check if the API key is set. If not, log an error and exit the application.
// This prevents the server from starting with a missing critical credential.
if (!geminiApiKey) {
    console.error("Error: GEMINI_API_KEY is not set in your .env file.");
    console.error("Please create a .env file in the same directory as server.js and add: GEMINI_API_KEY='YOUR_API_KEY_HERE'");
    // It's good practice to exit here, as the server cannot function without the key.
    process.exit(1);
}

// Initialize the Google Generative AI client with your API key.
const genAI = new GoogleGenerativeAI(geminiApiKey);

// Specify the Gemini model to use.
// 'gemini-1.5-flash' is generally faster and good for conversational purposes.
// 'gemini-pro' is another option, often more capable but might be slower/more expensive.
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });


// --- Chatbot API Endpoint ---
// This defines a POST endpoint at '/chat' that your frontend will send requests to.
app.post('/chat', async (req, res) => {
    // Log the entire incoming request body for debugging purposes.
    // This helps verify if the frontend is sending data correctly.
    console.log("Received chat request:", req.body);

    // Extract the 'message' field from the request body.
    // The frontend sends data in the format { message: "user's text" }.
    const userMessage = req.body.message;

    // Validate that a message was actually sent.
    if (!userMessage) {
        console.warn("No message provided in the request body.");
        // Send a 400 Bad Request response if the message is missing.
        return res.status(400).json({ reply: "Please provide a message to the chatbot." });
    }

    try {
        // Construct the prompt for the Gemini AI.
        // This is where you "engineer" the AI's behavior and provide it context.
        // It's crucial to include details about your company for accurate responses.
        const prompt = `You are an AI assistant for SEDEN ASSOCIATES, a professional services firm in Kampala, Uganda, specializing in tax laws and accounting principles. 
        
        Here is key information about SEDEN ASSOCIATES that you should use when relevant:
        - **Company Name:** SEDEN ASSOCIATES
        - **Location/Address:** Kisakye Complex, 3rd Floor Office 305 & 307, Bugolobi Spring Road, Kampala, P.O. BOX 108927, Kampala, Uganda.
        - **Phone Numbers:** +256 704301130, +256 785848075
        - **Email:** sedenassociate@gmail.com
        - **Website:** While we don't have a specific public website for general inquiries yet, please refer users to our contact page for all contact details.
        - **Services:** We provide comprehensive tax and accounting services including income tax advisory, Value Added Tax (VAT) compliance, Withholding Tax management, financial reporting, auditing, business advisory, and professional CPA classes for aspiring accountants.
        - **Operating Hours:** Available during standard business hours.
        - **General Advice:** You can provide general information about Ugandan tax laws and accounting principles.

        **Instructions:**
        - Always remind the user that for personalized or specific advice, they should reach out to SEDEN ASSOCIATES directly via the provided contact information.
        - Be concise, professional, and helpful.
        - If the user asks for contact details, provide the specific contact details listed above.
        - If you don't know the answer based on the provided context or general knowledge, politely state that you cannot assist with that specific query and reiterate that direct contact is best for complex matters.

        User query: "${userMessage}"`;

        // Make the API call to the Gemini model to generate content.
        const result = await model.generateContent(prompt);
        // Get the response object.
        const response = await result.response;
        // Extract the plain text from the AI's response.
        const aiText = response.text();

        // Log the AI's response for debugging.
        console.log("AI Response from Gemini:", aiText);

        // Send the AI's generated text back to the frontend.
        res.json({ reply: aiText });

    } catch (error) {
        // Log any errors that occur during the Gemini API call.
        console.error("Error generating content from Gemini API:", error);

        // Send a user-friendly error message back to the frontend.
        // This prevents the chatbot from appearing broken to the user.
        res.status(500).json({ reply: "Apologies, I'm having trouble understanding your request right now. Please try again later. For personalized advice, please reach out to our team directly." });
    }
});

// --- Start the Server ---
// Make the Express app listen for incoming requests on the specified port.
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
    console.log(`To test, open your contact.html file in a web browser and interact with the chatbot.`);
    console.log(`Ensure your .env file exists and contains GEMINI_API_KEY.`);
});
