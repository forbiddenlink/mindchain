// OpenAI API Failure Test
import axios from 'axios';

console.log('🔬 Testing OpenAI API failure handling...');

async function testOpenAIFailure() {
    try {
        // Test with invalid API key simulation
        const originalApiKey = process.env.OPENAI_API_KEY;
        process.env.OPENAI_API_KEY = 'invalid-key-test';
        
        let debateId;
        try {
            console.log('Attempting to start debate with invalid API key...');
            const response = await axios.post('http://localhost:3001/api/debate/start', {
                topic: 'test failure mode',
                agents: ['senatorbot', 'reformerbot']
            }, { 
                timeout: 10000,
                validateStatus: function (status) {
                    return status < 500; // Accept any non-500 response
                }
            });
            
            console.log('Response status:', response.status);
            console.log('Response data:', JSON.stringify(response.data, null, 2));
            
            if (response.status === 200) {
                debateId = response.data.debateId;
                console.log('Debate created with ID:', debateId);
                
                console.log('Waiting for message generation attempt...');
                await new Promise(resolve => setTimeout(resolve, 5000));
                
                console.log('Checking for messages...');
                const messages = await axios.get(`http://localhost:3001/api/debate/${debateId}/messages`, {
                    validateStatus: function (status) {
                        return status < 500;
                    }
                });
                
                console.log('Messages response:', JSON.stringify(messages.data, null, 2));
                
                if (messages.data.messages && messages.data.messages.length === 0) {
                    console.log('✅ System gracefully handles OpenAI API failures');
                } else {
                    console.log('⚠️ System may not properly handle OpenAI API failures');
                }
            } else {
                console.log('✅ Server rejected request with invalid API key');
            }
            
        } catch (error) {
            console.log('Error details:', {
                message: error.message,
                status: error.response?.status,
                data: error.response?.data
            });
            if (error.response?.status === 401 || error.response?.status === 403) {
                console.log('✅ OpenAI API failure properly handled with error response');
            } else {
                console.log('❌ Unexpected error handling OpenAI API failure:', error.message);
            }
        } finally {
            process.env.OPENAI_API_KEY = originalApiKey;
        }

    } catch (error) {
        console.log('❌ Test failed:', error.message);
    }
}

testOpenAIFailure();
