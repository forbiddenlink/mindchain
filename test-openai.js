import 'dotenv/config';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function testOpenAI() {
    try {
        console.log('Testing OpenAI API connection...');
        
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini', // Using the cheaper model for testing
            messages: [{ role: 'user', content: 'Hello, test message.' }],
            max_tokens: 10
        });
        
        console.log('✅ OpenAI API working!');
        console.log('Response:', response.choices[0].message.content);
        
    } catch (error) {
        console.error('❌ OpenAI API Error:', error.message);
        console.error('Status:', error.status);
        console.error('Type:', error.type);
    }
}

testOpenAI();
